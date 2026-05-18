import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle, XCircle, LogOut, Cloud } from 'lucide-react';
import { getAssessments, saveAssessment } from '../services/db';
import { fetchCloudAssessments } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const [assessments, setAssessments] = useState({});
  const [loading, setLoading] = useState(true);
  const { token, logout, user } = useAuth();

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    // 1. Get local assessments
    const localData = await getAssessments();
    setAssessments(localData);

    // 2. Fetch cloud assessments and merge
    try {
      if (token) {
        const cloudData = await fetchCloudAssessments(token);
        const merged = { ...localData };
        let hasUpdates = false;

        for (const cloudItem of cloudData) {
          const localItem = merged[cloudItem.id];
          // If cloud item is newer or doesn't exist locally, update local
          if (!localItem || new Date(cloudItem.updatedAt) > new Date(localItem.updatedAt)) {
            merged[cloudItem.id] = cloudItem.formData;
            await saveAssessment(cloudItem.id, cloudItem.formData); // sync down to local
            hasUpdates = true;
          }
        }
        
        if (hasUpdates) setAssessments(merged);
      }
    } catch (err) {
      console.warn("Could not sync with cloud, using offline data.");
    }
    
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS': return <CheckCircle className="text-green-500" size={20} />;
      case 'FAIL': return <XCircle className="text-red-500" size={20} />;
      default: return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const assessmentList = Object.entries(assessments).sort((a, b) => {
    return new Date(b[1].updatedAt) - new Date(a[1].updatedAt);
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-1">You have {assessmentList.length} assessments synced <Cloud className="inline w-4 h-4 text-blue-500" /></p>
        </div>
        <button 
          onClick={logout}
          className="text-gray-400 hover:text-red-500 transition-colors p-2"
          title="Sign Out"
        >
          <LogOut size={24} />
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4 px-1">Recent Assessments</h3>
        
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : assessmentList.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-300">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle size={32} className="text-blue-500" />
            </div>
            <h4 className="text-gray-800 font-medium mb-2">No Assessments Yet</h4>
            <p className="text-gray-500 text-sm mb-6">Start a new assessment to log an inspection.</p>
            <Link to="/new" className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium shadow-md hover:bg-blue-700 transition">
              Start Assessment
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {assessmentList.map(([id, data]) => (
              <Link to={`/assessment/${id}`} key={id} className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 transition-colors flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{data.clientName || 'Unnamed Client'}</h4>
                  <p className="text-sm text-gray-500">{data.address || 'No Address Provided'}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(data.updatedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end">
                  {getStatusIcon(data.status)}
                  <span className="text-xs font-medium mt-1 text-gray-600">{data.status || 'DRAFT'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
