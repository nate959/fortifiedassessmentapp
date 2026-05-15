import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, Trash2, Building, Phone, Mail, MapPin } from 'lucide-react';
import { getCompanyProfile, saveCompanyProfile } from '../db';

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    companyName: '',
    phone: '',
    email: '',
    address: '',
    logoUrl: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const data = await getCompanyProfile();
    if (data && Object.keys(data).length > 0) {
      setProfile({
        companyName: data.companyName || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        logoUrl: data.logoUrl || ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        // Compress the logo
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // constrain width to max 400px
          let width = img.width;
          let height = img.height;
          if (width > 400) {
            height = Math.round((height * 400) / width);
            width = 400;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          setProfile(prev => ({ ...prev, logoUrl: canvas.toDataURL('image/png') }));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await saveCompanyProfile(profile);
    setSaving(false);
    if (success) {
      setMessage('Profile saved successfully! This logo and info will appear on all new PDFs.');
      setTimeout(() => setMessage(''), 5000);
    } else {
      setMessage('Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-4">Company Profile</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Because this app stores everything securely on your device, you can set up your own company branding here. The logo and contact info will automatically appear at the top of every PDF you generate!
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
            <div className="flex items-center space-x-4">
              {profile.logoUrl ? (
                <div className="relative border p-2 rounded-lg bg-gray-50 inline-block">
                  <img src={profile.logoUrl} alt="Logo preview" className="h-20 object-contain" />
                  <button 
                    onClick={() => setProfile(p => ({ ...p, logoUrl: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 w-full cursor-pointer hover:bg-gray-100 transition" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500 font-medium">Click to upload logo</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleLogoUpload} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Building size={16} className="mr-2 text-gray-400" /> Company Name
            </label>
            <input 
              type="text" 
              name="companyName" 
              value={profile.companyName} 
              onChange={handleInputChange} 
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              placeholder="e.g. Knockout Inspections" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Phone size={16} className="mr-2 text-gray-400" /> Phone Number
              </label>
              <input 
                type="text" 
                name="phone" 
                value={profile.phone} 
                onChange={handleInputChange} 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                placeholder="(251) 555-1234" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Mail size={16} className="mr-2 text-gray-400" /> Email Address
              </label>
              <input 
                type="email" 
                name="email" 
                value={profile.email} 
                onChange={handleInputChange} 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                placeholder="office@company.com" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <MapPin size={16} className="mr-2 text-gray-400" /> Address
            </label>
            <input 
              type="text" 
              name="address" 
              value={profile.address} 
              onChange={handleInputChange} 
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              placeholder="123 Main St, City, ST 12345" 
            />
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <button 
          onClick={handleSave} 
          disabled={saving}
          className="mt-6 w-full flex items-center justify-center bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Save size={20} className="mr-2" /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
