import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ReportsProvider } from './contexts/ReportsContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { MainContainer } from './components/MainContainer';
import { GmailCallback } from './components/GmailCallback';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('🔍 [App] Current pathname:', window.location.pathname);
  console.log('🔍 [App] Full URL:', window.location.href);

  if (window.location.pathname === '/auth/gmail/callback') {
    console.log('✅ [App] Rendering GmailCallback component');
    return <GmailCallback />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚀</div>
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading Astra Intelligence...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <MainContainer />;
};

function App() {
  return (
    <AuthProvider>
      <ReportsProvider>
        <AppContent />
      </ReportsProvider>
    </AuthProvider>
  );
}

export default App;