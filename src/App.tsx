import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ReportsProvider } from './contexts/ReportsContext';
import { AuthScreen } from './components/AuthScreen';
import { MainContainer } from './components/MainContainer';
import { GmailCallback } from './components/GmailCallback';
import { GoogleDriveCallback } from './components/GoogleDriveCallback';
import { OnboardingScreen } from './components/OnboardingScreen';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { FeedbackModal } from './components/FeedbackModal';
import { VersionChecker } from './components/VersionChecker';
import { AdminDashboard } from './components/AdminDashboard';
import { useGmailTokenRefresh } from './hooks/useGmailTokenRefresh';
import { useFeedbackPrompt } from './hooks/useFeedbackPrompt';
import { supabase } from './lib/supabase';
import { FEATURES } from './config/features';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const { shouldShowFeedback, questions, submitFeedback } = useFeedbackPrompt();

  // Automatically refresh Gmail tokens in the background (only if Gmail is enabled)
  useGmailTokenRefresh(FEATURES.GMAIL_ENABLED);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setCheckingOnboarding(false);
        return;
      }

      const teamId = user.user_metadata?.team_id;

      // Only check for team_id - if user has a team, they're onboarded
      if (!teamId) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
      }

      setCheckingOnboarding(false);
    };

    checkOnboardingStatus();
  }, [user]);

  const handleOnboardingComplete = async () => {
    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    if (refreshedUser) {
      setNeedsOnboarding(false);
    }
  };

  // Gmail OAuth callback handling (only if Gmail is enabled)
  if (FEATURES.GMAIL_ENABLED) {
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
  }

  // Google Drive OAuth callback handling (only if Google Drive is enabled)
  if (FEATURES.GOOGLE_DRIVE_SYNC_ENABLED) {
    console.log('🔍 [App] Checking Google Drive callback...');
    console.log('🔍 [App] Current pathname:', window.location.pathname);

    if (window.location.pathname === '/auth/google-drive/callback') {
      console.log('✅ [App] Rendering GoogleDriveCallback component');
      return <GoogleDriveCallback />;
    }
  }

  // Admin Dashboard route (super admin only)
  if (window.location.pathname === '/admin-dashboard') {
    if (!user) {
      return <AuthScreen />;
    }
    const isSuperAdmin = user?.email === 'clay@rockethub.ai';
    if (!isSuperAdmin) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-400 mb-6">You don't have permission to access this page.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }
    return <AdminDashboard />;
  }

  if (loading || checkingOnboarding) {
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

  if (needsOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <VersionChecker />
      <MainContainer />
      <PWAInstallPrompt />
      {shouldShowFeedback && questions.length > 0 && (
        <FeedbackModal questions={questions} onSubmit={submitFeedback} />
      )}
    </>
  );
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