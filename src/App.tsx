import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminDashboardPage from './components/AdminDashboardPage';
import { BuildAgentsPage } from './components/BuildAgentsPage';
import { MarketingPage } from './components/MarketingPage';
import { MarketingLogo } from './components/MarketingLogo';
import { UserMetricsDashboard } from './components/UserMetricsDashboard';
import { ProtectedMetricsRoute } from './components/ProtectedMetricsRoute';
import { useGmailTokenRefresh } from './hooks/useGmailTokenRefresh';
import { useFeedbackPrompt } from './hooks/useFeedbackPrompt';
import { useActivityTracking } from './hooks/useActivityTracking';
import { supabase } from './lib/supabase';
import { FEATURES } from './config/features';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const { shouldShowFeedback, questions, submitFeedback, skipFeedback } = useFeedbackPrompt();

  // Automatically refresh Gmail tokens in the background (only if Gmail is enabled)
  useGmailTokenRefresh(FEATURES.GMAIL_ENABLED);

  // Track user activity for accurate "Last Active" metrics
  useActivityTracking();

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

  return (
    <Routes>
      {/* OAuth Callbacks */}
      {FEATURES.GMAIL_ENABLED && (
        <Route path="/auth/gmail/callback" element={<GmailCallback />} />
      )}
      {FEATURES.GOOGLE_DRIVE_SYNC_ENABLED && (
        <Route path="/auth/google-drive/callback" element={<GoogleDriveCallback />} />
      )}

      {/* Admin Dashboard - Protected Route */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminDashboardPage />
          </ProtectedAdminRoute>
        }
      />

      {/* User Metrics Dashboard - Super Admin Only */}
      <Route
        path="/user-metrics"
        element={
          <ProtectedMetricsRoute>
            <UserMetricsDashboard />
          </ProtectedMetricsRoute>
        }
      />

      {/* Build Agents - Protected Route */}
      <Route
        path="/build-agents"
        element={
          user ? (
            <BuildAgentsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Marketing Page - Public Route */}
      <Route path="/marketing" element={<MarketingPage />} />

      {/* Marketing Logo Page - Public Route */}
      <Route path="/marketing-logo" element={<MarketingLogo />} />

      {/* Main App Routes */}
      <Route
        path="/"
        element={
          !user ? (
            <AuthScreen />
          ) : needsOnboarding ? (
            <OnboardingScreen onComplete={handleOnboardingComplete} />
          ) : (
            <>
              <VersionChecker />
              <MainContainer />
              <PWAInstallPrompt />
              {shouldShowFeedback && questions.length > 0 && (
                <FeedbackModal questions={questions} onSubmit={submitFeedback} onSkip={skipFeedback} />
              )}
            </>
          )
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ReportsProvider>
          <AppContent />
        </ReportsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;