import localforage from 'localforage';
import { syncAssessmentWithCloud } from './api';

// Configure localForage
localforage.config({
  name: 'FortifiedApp',
  version: 1.0,
  storeName: 'assessments',
  description: 'Local storage for SAH assessments'
});

export const saveAssessment = async (id, data) => {
  try {
    const existing = await localforage.getItem('assessments') || {};
    existing[id] = { ...data, id, updatedAt: new Date().toISOString() };
    await localforage.setItem('assessments', existing);
    
    // Attempt to sync to cloud if logged in
    const token = localStorage.getItem('token');
    if (token) {
      syncAssessmentWithCloud(existing[id], token).catch(e => console.warn('Offline: Sync deferred', e));
    }
    
    return true;
  } catch (err) {
    console.error('Error saving assessment:', err);
    return false;
  }
};

export const getAssessments = async () => {
  try {
    const data = await localforage.getItem('assessments');
    return data || {};
  } catch (err) {
    console.error('Error getting assessments:', err);
    return {};
  }
};

export const getAssessment = async (id) => {
  try {
    const data = await localforage.getItem('assessments');
    return data ? data[id] : null;
  } catch (err) {
    console.error('Error getting assessment:', err);
    return null;
  }
};

export const deleteAssessment = async (id) => {
  try {
    const data = await localforage.getItem('assessments');
    if (data) {
      delete data[id];
      await localforage.setItem('assessments', data);
    }
    return true;
  } catch (err) {
    console.error('Error deleting assessment:', err);
    return false;
  }
};

export const getCompanyProfile = async () => {
  try {
    return await localforage.getItem('companyProfile') || {};
  } catch (err) {
    console.error('Error getting company profile:', err);
    return {};
  }
};

export const saveCompanyProfile = async (profileData) => {
  try {
    await localforage.setItem('companyProfile', profileData);
    return true;
  } catch (err) {
    console.error('Error saving company profile:', err);
    return false;
  }
};
