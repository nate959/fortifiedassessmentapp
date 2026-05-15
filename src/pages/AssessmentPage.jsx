import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Save, Download, ArrowLeft, Trash2, MapPin } from 'lucide-react';
import { getAssessment, saveAssessment, deleteAssessment, getCompanyProfile } from '../db';
import { generatePDF } from '../pdfUtils';

const DEFAULT_QUESTIONS = [
  { id: 'foundation_type', text: 'What is the foundation type?', type: 'radio', options: ['Slab-on-grade', 'Pilings', 'Block'] },
  { id: 'foundation_mortar', text: 'If the foundation is block, is there mortar present to show positive anchorage?', type: 'radio', options: ['Yes', 'No', 'N/A'] },
  { id: 'bay_windows', text: 'Are there any bay windows?', type: 'radio', options: ['Yes', 'No', 'N/A'] },
  { id: 'qualifying_roof_deck', text: 'Does structure have a qualifying roof deck?', type: 'radio', options: ['Yes', 'No', 'N/A'] },
  { id: 'living_space', text: 'Would the space beneath the structure be considered living space? (heated and cooled)', type: 'radio', options: ['Yes', 'No', 'N/A'] },
  { id: 'tie_into_roof', text: 'Does structure tie into the roof?', type: 'radio', options: ['Yes', 'No', 'N/A'] },
  { id: 'multiple_covers', text: 'Are there multiple roof covers?', type: 'radio', options: ['Yes', 'No', 'N/A'] },
  { id: 'deck_thickness', text: 'What is the deck thickness?', type: 'radio', options: ['7/16', '15/32', '3/8', '1x plank'] },
  { id: 'deck_type', text: 'What is the deck type?', type: 'radio', options: ['OSB', 'Plywood', 'Tongue and groove', '1x planks'] },
  { id: 'rafter_spacing', text: 'What is the rafter spacing?', type: 'radio', options: ['16" on center', '24" on center', 'Greater than 24"'] },
  { id: 'multiple_slopes', text: 'Are there multiple roof slopes?', type: 'radio', options: ['Yes', 'No', 'N/A'] },
  { id: 'different_slopes', text: 'If yes, what are the different slopes?', type: 'text' },
  { id: 'payment', text: 'Did you collect payment?', type: 'radio', options: ['Yes', 'No', 'N/A'] },
  { id: 'gables_vented', text: 'Are the gables vented?', type: 'radio', options: ['Yes', 'No', 'N/A'] },
  { id: 'gable_walls', text: 'Are there gable walls?', type: 'radio', options: ['Yes', 'No', 'N/A'] },
  { id: 'foam_quote', text: 'Is homeowner seeking quote for closed cell foam only?', type: 'radio', options: ['Yes', 'No', 'N/A'] },
  { id: 'agreement_signed', text: 'Did you get agreement signed?', type: 'radio', options: ['Yes', 'No', 'N/A'] },
  { id: 'notes', text: 'Comments, questions, concerns (Notes)', type: 'textarea' },
];

export default function AssessmentPage({ isNew = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessmentId, setAssessmentId] = useState(id || Date.now().toString());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [photoTarget, setPhotoTarget] = useState('general'); // tracks which question the photo belongs to
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    clientName: '',
    address: '',
    evaluator: '',
    date: new Date().toISOString().split('T')[0],
    sahId: '',
    status: 'DRAFT',
    questions: {},
    photos: []
  });

  useEffect(() => {
    if (!isNew && id) {
      loadData(id);
    } else {
      setLoading(false);
    }
  }, [id, isNew]);

  const loadData = async (loadId) => {
    const data = await getAssessment(loadId);
    if (data) {
      setFormData(data);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuestionChange = (qId, val) => {
    setFormData(prev => ({
      ...prev,
      questions: { ...prev.questions, [qId]: val }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Auto calculate PASS/FAIL logic.
    const criticalFails = [
      formData.questions['foundation_mortar'] === 'No',
      formData.questions['qualifying_roof_deck'] === 'No',
      formData.questions['deck_thickness'] === '3/8',
      formData.questions['rafter_spacing'] === 'Greater than 24"'
    ];
    
    let newStatus = 'DRAFT';
    if (Object.keys(formData.questions).length > 5) {
      newStatus = criticalFails.some(f => f) ? 'FAIL' : 'PASS';
    }
    
    const updatedData = { ...formData, status: newStatus };
    setFormData(updatedData);
    
    await saveAssessment(assessmentId, updatedData);
    setSaving(false);
    
    if (isNew) {
      navigate(`/assessment/${assessmentId}`, { replace: true });
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this assessment?")) {
      await deleteAssessment(assessmentId);
      navigate('/');
    }
  };

  const handleGeneratePDF = async () => {
    await handleSave(); // save first
    const profile = await getCompanyProfile();
    await generatePDF(formData, DEFAULT_QUESTIONS, profile);
  };

  const triggerPhotoCapture = (target) => {
    setPhotoTarget(target);
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // reset input to allow capturing same file again if needed
      fileInputRef.current.click();
    }
  };

  const handlePhotoCapture = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Capture the target so the async callback uses the right one
    const currentTarget = photoTarget;

    setLocationStatus('Getting GPS...');
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationStatus('');
          processImages(files, position.coords, currentTarget);
        }, 
        (err) => {
          console.warn("Geolocation denied or failed", err);
          setLocationStatus('GPS Failed');
          processImages(files, null, currentTarget);
        }, 
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLocationStatus('GPS Unavailable');
      processImages(files, null, currentTarget);
    }
  };

  const processImages = (files, coords, targetId) => {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          if (coords) {
            // Draw Geotag Banner at the bottom
            const bannerHeight = Math.max(60, img.height * 0.08);
            const fontSize = Math.max(16, img.height * 0.03);
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(0, img.height - bannerHeight, img.width, bannerHeight);
            
            ctx.fillStyle = "white";
            ctx.font = `${fontSize}px sans-serif`;
            const dateStr = new Date().toLocaleString();
            const geoText = `Lat: ${coords.latitude.toFixed(6)}, Long: ${coords.longitude.toFixed(6)} | ${dateStr}`;
            
            // Add padding
            ctx.fillText(geoText, 20, img.height - (bannerHeight / 2) + (fontSize / 3));
          }
          
          // Compress heavily for PDF (80% quality JPEG)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, { id: Date.now() + Math.random(), questionId: targetId, dataUrl, label: targetId === 'general' ? 'Elevation Photo' : 'Question Context' }]
          }));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (photoId) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.id !== photoId)
    }));
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Assessment...</div>;

  const generalPhotos = formData.photos.filter(p => p.questionId === 'general');

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        multiple 
        ref={fileInputRef}
        className="hidden" 
        onChange={handlePhotoCapture} 
      />

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-blue-600 flex items-center">
          <ArrowLeft size={20} className="mr-1" /> Back
        </button>
        <div className="space-x-2">
          {!isNew && (
            <button onClick={handleDelete} className="p-2 text-red-500 bg-red-50 rounded-full hover:bg-red-100 transition">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Assessment Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SAH Application Number</label>
            <input type="text" name="sahId" value={formData.sahId || ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. 29410" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <input type="text" name="clientName" value={formData.clientName} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="123 Main St, City, ST" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evaluator Name</label>
              <input type="text" name="evaluator" value={formData.evaluator} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Inspection Checklist</h2>
        
        {DEFAULT_QUESTIONS.map((q, index) => {
          const qPhotos = formData.photos.filter(p => p.questionId === q.id);
          
          return (
            <div key={q.id} className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex justify-between items-start gap-4">
                <p className="text-gray-800 font-medium">
                  <span className="text-blue-600 mr-2">{index + 1}.</span>{q.text}
                </p>
                <button 
                  onClick={() => triggerPhotoCapture(q.id)}
                  className="flex-shrink-0 flex items-center justify-center bg-white border border-gray-300 text-gray-600 w-8 h-8 rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition"
                  title="Add photo for this question"
                >
                  <Camera size={16} />
                </button>
              </div>
              
              <div className="pt-1">
                {q.type === 'radio' && (
                  <div className="flex flex-wrap gap-4 pl-6">
                    {q.options.map(opt => (
                      <label key={opt} className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm hover:border-blue-300">
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={formData.questions[q.id] === opt}
                          onChange={(e) => handleQuestionChange(q.id, e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-gray-700 text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {q.type === 'text' && (
                  <input 
                    type="text" 
                    value={formData.questions[q.id] || ''} 
                    onChange={(e) => handleQuestionChange(q.id, e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" 
                    placeholder="Enter details..." 
                  />
                )}
                {q.type === 'textarea' && (
                  <textarea 
                    rows="3"
                    value={formData.questions[q.id] || ''} 
                    onChange={(e) => handleQuestionChange(q.id, e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" 
                    placeholder="Enter comments here..." 
                  />
                )}
              </div>

              {/* Photos for this specific question */}
              {qPhotos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto py-2 pl-6">
                  {qPhotos.map((photo) => (
                    <div key={photo.id} className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden border border-gray-200 shadow-sm group">
                      <img src={photo.dataUrl} alt={photo.label} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 opacity-90 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-800">General Elevation Photos</h2>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <MapPin size={12} className="mr-1" /> GPS Geotags enabled
            </p>
          </div>
          <div className="flex flex-col items-end">
            <button 
              onClick={() => triggerPhotoCapture('general')}
              className="flex items-center text-sm bg-blue-600 text-white px-4 py-2 rounded-full font-medium hover:bg-blue-700 shadow-sm transition"
            >
              <Camera size={16} className="mr-2" /> Add Photo
            </button>
            {locationStatus && <span className="text-xs text-blue-500 mt-1 font-medium">{locationStatus}</span>}
          </div>
        </div>
        
        {generalPhotos.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <Camera className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-500 text-sm">No general photos added.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {generalPhotos.map((photo) => (
              <div key={photo.id} className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm group">
                <img src={photo.dataUrl} alt={photo.label} className="w-full h-40 object-cover" />
                <button 
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow hover:bg-red-600 opacity-90 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex space-x-4 pt-4 sticky bottom-20 z-10">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="flex-1 flex items-center justify-center bg-gray-800 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-gray-900 transition disabled:opacity-50"
        >
          <Save size={20} className="mr-2" /> {saving ? 'Saving...' : 'Save Draft'}
        </button>
        <button 
          onClick={handleGeneratePDF}
          className="flex-1 flex items-center justify-center bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition"
        >
          <Download size={20} className="mr-2" /> Export PDF
        </button>
      </div>
    </div>
  );
}
