import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ReportsProvider } from './contexts/ReportsContext';
import { AuthScreen } from './components/AuthScreen';
import { MainContainer } from './components/MainContainer';
import { GmailCallback } from './components/GmailCallback';
import { useGmailTokenRefresh } from './hooks/useGmailTokenRefresh';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  // Automatically refresh Gmail tokens in the background
  useGmailTokenRefresh();

  console.log('🔍 [App] Current pathname:', window.location.pathname);
  console.log('🔍 [App] Full URL:', window.location.href);
  console.log('🔍 [App] Search params:', window.location.search);
  console.log('🔍 [App] Has code param:', new URLSearchParams(window.location.search).has('code'));
  console.log('🔍 [App] Has state param:', new URLSearchParams(window.location.search).has('state'));

  if (window.location.pathname === '/auth/gmail/callback') {
    console.log('✅ [App] Rendering GmailCallback component');
    return <GmailCallback />;
  }

  // Also check if we have OAuth params on root path (fallback)
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.has('code') && searchParams.has('state') && window.location.pathname === '/') {
    console.log('⚠️ [App] Found OAuth params on root path - rendering GmailCallback');
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