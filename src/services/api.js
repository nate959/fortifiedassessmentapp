const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const syncAssessmentWithCloud = async (assessment, token) => {
  if (!token) return assessment;

  try {
    const res = await fetch(`${API_URL}/api/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: assessment.id,
        clientName: assessment.clientName || 'Unknown Client',
        address: assessment.propertyAddress || 'Unknown Address',
        formData: assessment,
        isCompleted: assessment.isCompleted || false
      })
    });
    
    if (!res.ok) throw new Error('Failed to sync with cloud');
    return await res.json();
  } catch (error) {
    console.error('Cloud sync error:', error);
    // If it fails, it's fine, localforage has it safely offline
    throw error;
  }
};

export const fetchCloudAssessments = async (token) => {
  if (!token) return [];

  try {
    const res = await fetch(`${API_URL}/api/assessments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) throw new Error('Failed to fetch from cloud');
    const data = await res.json();
    return data.assessments;
  } catch (error) {
    console.error('Cloud fetch error:', error);
    throw error;
  }
};
