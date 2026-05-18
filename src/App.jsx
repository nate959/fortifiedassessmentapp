import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Home, FileText, Settings } from 'lucide-react';
import HomePage from './pages/HomePage';
import AssessmentPage from './pages/AssessmentPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
        {/* Header */}
        <header className="bg-blue-700 text-white p-4 shadow-md sticky top-0 z-10">
          <h1 className="text-xl font-bold text-center">State Fortified Program</h1>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 pb-24">
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/assessment/:id" element={<AssessmentPage />} />
              <Route path="/new" element={<AssessmentPage isNew={true} />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AuthProvider>
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full flex justify-around p-3 pb-safe z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Link to="/" className="flex flex-col items-center text-gray-500 hover:text-blue-600 focus:text-blue-600 transition-colors">
            <Home size={24} />
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>
          <Link to="/new" className="flex flex-col items-center text-gray-500 hover:text-blue-600 focus:text-blue-600 transition-colors">
            <div className="bg-blue-600 text-white rounded-full p-2 -mt-6 shadow-lg border-4 border-gray-50">
              <FileText size={24} />
            </div>
            <span className="text-xs mt-1 font-medium text-blue-600">New Assessment</span>
          </Link>
          <Link to="/settings" className="flex flex-col items-center text-gray-500 hover:text-blue-600 focus:text-blue-600 transition-colors">
            <Settings size={24} />
            <span className="text-xs mt-1 font-medium">Settings</span>
          </Link>
        </nav>
      </div>
    </BrowserRouter>
  );
}

export default App;
