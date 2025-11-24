import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { ChatSidebar } from './ChatSidebar';
import { ChatContainer } from './ChatContainer';
import { GroupChat } from './GroupChat';
import { ReportsView } from './ReportsView';
import { ChatModeToggle } from './ChatModeToggle';
import { SavedVisualizationsList } from './SavedVisualizationsList';
import { UserSettingsModal } from './UserSettingsModal';
import { WelcomeModal } from './WelcomeModal';
import { InteractiveTour } from './InteractiveTour';
import { HelpCenter, HelpCenterTab } from './HelpCenter';
import { AstraGuidedSetup } from './AstraGuidedSetup';
import { ExpiredTokenBanner } from './ExpiredTokenBanner';
import { ChatMode } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useSavedVisualizations } from '../hooks/useSavedVisualizations';
import { getTourStepsForRole } from '../data/tourSteps';
import { supabase } from '../lib/supabase';

export const MainContainer: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('reports');
  const [conversationToLoad, setConversationToLoad] = useState<string | null>(null);
  const [shouldStartNewChat, setShouldStartNewChat] = useState(false);
  const [showTeamMenu, setShowTeamMenu] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showSavedVisualizations, setShowSavedVisualizations] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [helpCenterTab, setHelpCenterTab] = useState<HelpCenterTab>('quick-start');
  const [teamName, setTeamName] = useState<string>('');
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [hasExpiredToken, setHasExpiredToken] = useState(false);
  const [tokenBannerDismissed, setTokenBannerDismissed] = useState(false);

  const isAdmin = user?.user_metadata?.role === 'admin';
  const tourSteps = getTourStepsForRole(isAdmin);

  const {
    savedVisualizations,
    loading: savedVisualizationsLoading,
    deleteVisualization
  } = useSavedVisualizations(user?.id);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      console.log('🔍 [MainContainer] Starting onboarding check for user:', user.id);

      // CRITICAL FIX: Get team_id from database, not metadata (metadata may not be fresh)
      const { data: userData } = await supabase
        .from('users')
        .select('team_id, role')
        .eq('id', user.id)
        .maybeSingle();

      const teamId = userData?.team_id;
      let isTeamCreator = false;

      console.log('📊 [MainContainer] User data from DB:', { teamId, role: userData?.role });

      if (teamId) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('name, created_by')
          .eq('id', teamId)
          .maybeSingle();

        if (teamData) {
          setTeamName(teamData.name);
          isTeamCreator = teamData.created_by === user.id;
          console.log('👥 [MainContainer] Team data:', {
            teamName: teamData.name,
            created_by: teamData.created_by,
            user_id: user.id,
            isTeamCreator
          });
        }
      }

      // Check if we should open Guided Setup from URL parameter
      // ONLY for team creators
      const urlParams = new URLSearchParams(window.location.search);
      const hasGuidedSetupParam = urlParams.get('openGuidedSetup') === 'true';

      console.log('🔗 [MainContainer] URL check:', { hasGuidedSetupParam, isTeamCreator });

      if (hasGuidedSetupParam && isTeamCreator) {
        console.log('✅ [MainContainer] Opening Guided Setup for team creator');
        setShowSetupGuide(true);
        setShowWelcomeModal(false); // CRITICAL: Prevent Welcome Modal from showing
        // Clean up the URL parameter
        window.history.replaceState({}, '', '/');
        return; // Exit early - we're showing the guide
      }

      if (hasGuidedSetupParam && !isTeamCreator) {
        console.log('⚠️ [MainContainer] URL has openGuidedSetup but user is NOT team creator - ignoring');
      }

      // Check if user has incomplete guided setup progress
      // ONLY for team creators
      if (isTeamCreator) {
        const { data: setupProgress } = await supabase
          .from('setup_guide_progress')
          .select('is_completed, current_step')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('📋 [MainContainer] Setup progress:', setupProgress);

        // If user has setup progress but hasn't completed it, show the guide
        if (setupProgress && !setupProgress.is_completed) {
          console.log('✅ [MainContainer] Resuming incomplete Guided Setup');
          setShowSetupGuide(true);
          setShowWelcomeModal(false); // CRITICAL: Prevent Welcome Modal from showing
          return; // Exit early - we're showing the guide
        }
      }

      // Only show welcome modal if no guided setup is needed
      const onboardingCompleted = user.user_metadata?.onboarding_completed;
      const onboardingDismissed = user.user_metadata?.onboarding_dismissed;

      console.log('👋 [MainContainer] Welcome modal check:', { onboardingCompleted, onboardingDismissed, willShow: !onboardingCompleted && !onboardingDismissed });

      if (!onboardingCompleted && !onboardingDismissed) {
        console.log('✅ [MainContainer] Showing Welcome Modal');
        setShowWelcomeModal(true);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  useEffect(() => {
    const checkGoogleDriveConnection = async () => {
      if (!user) return;

      try {
        const { data: connection } = await supabase
          .from('user_drive_connections')
          .select('is_active, connection_status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (connection && (!connection.is_active || connection.connection_status === 'token_expired')) {
          setHasExpiredToken(true);
        } else {
          setHasExpiredToken(false);
        }
      } catch (error) {
        console.error('Error checking Google Drive connection:', error);
      }
    };

    checkGoogleDriveConnection();
  }, [user]);

  // Close sidebar when switching away from private chat mode
  React.useEffect(() => {
    if (chatMode === 'private') {
      setSidebarOpen(false);
    }
  }, [chatMode]);

  const handleLoadConversation = (conversationId: string) => {
    console.log('MainContainer: handleLoadConversation called with:', conversationId);

    // Check if this is a summary request (special conversation ID format)
    if (conversationId.startsWith('summary-')) {
      // Start a new conversation and set a flag to send the summary prompt
      setShouldStartNewChat(true);
      // Store the summary type for the private chat to pick up
      const summaryType = conversationId.split('-')[1];
      localStorage.setItem('pendingSummaryRequest', summaryType);
    } else {
      setConversationToLoad(conversationId);
    }
    setSidebarOpen(false);
  };

  const handleStartNewConversation = () => {
    setShouldStartNewChat(true);
    setSidebarOpen(false);
  };

  const handleSwitchToPrivateChat = (conversationId: string) => {
    setChatMode('private');
    
    // Check if this is a summary request (special conversation ID format)
    if (conversationId.startsWith('summary-')) {
      // Start a new conversation and set a flag to send the summary prompt
      setShouldStartNewChat(true);
      // Store the summary type for the private chat to pick up
      const summaryType = conversationId.split('-')[1];
      localStorage.setItem('pendingSummaryRequest', summaryType);
    } else {
      setConversationToLoad(conversationId);
    }
  };

  const handleToggleTeamMenu = () => {
    setShowTeamMenu(!showTeamMenu);
  };

  const handleOpenSavedVisualizations = () => {
    setShowSavedVisualizations(true);
  };

  const handleOpenUserSettings = () => {
    setShowUserSettings(true);
  };

  const handleDeleteVisualization = async (id: string) => {
    const result = await deleteVisualization(id);
    if (!result.success) {
      console.error('Failed to delete visualization:', result.error);
    }
  };

  const handleStartTour = () => {
    setShowWelcomeModal(false);
    // Small delay to ensure modal closes before tour starts
    setTimeout(() => {
      setTourStep(0);
      setShowTour(true);
    }, 100);
  };

  const handleDismissWelcome = async () => {
    setShowWelcomeModal(false);
    if (user) {
      await supabase.auth.updateUser({
        data: { onboarding_dismissed: true }
      });
    }
  };

  const handleTourComplete = async () => {
    setShowTour(false);
    if (user) {
      await supabase.auth.updateUser({
        data: { onboarding_completed: true }
      });
    }
  };

  const handleTourSkip = async () => {
    setShowTour(false);
    if (user) {
      await supabase.auth.updateUser({
        data: { onboarding_dismissed: true }
      });
    }
  };

  const handleRestartTour = () => {
    setTourStep(0);
    setShowTour(true);
  };

  const handleTourNavigate = (navigation: { mode?: ChatMode; openUserSettings?: boolean; closeUserSettings?: boolean }) => {
    if (navigation.mode) {
      setChatMode(navigation.mode);
    }
    if (navigation.openUserSettings) {
      setShowUserSettings(true);
    }
    if (navigation.closeUserSettings) {
      setShowUserSettings(false);
    }
  };

  if (showSavedVisualizations) {
    return (
      <SavedVisualizationsList
        savedVisualizations={savedVisualizations}
        onBack={() => setShowSavedVisualizations(false)}
        onDelete={handleDeleteVisualization}
        loading={savedVisualizationsLoading}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Sidebar - only show for private chat mode */}
      {chatMode === 'private' && (
        <ChatSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLoadConversation={handleLoadConversation}
          onStartNewConversation={handleStartNewConversation}
          activeConversationId={activeConversationId}
          onOpenSavedVisualizations={handleOpenSavedVisualizations}
          onOpenUserSettings={handleOpenUserSettings}
        />
      )}

      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={showUserSettings}
        onClose={() => setShowUserSettings(false)}
        onStartTour={handleRestartTour}
        onOpenHelpCenter={(tab) => {
          setShowUserSettings(false);
          setHelpCenterTab(tab || 'quick-start');
          setShowHelpCenter(true);
        }}
      />
      
      <div className="flex flex-col h-screen overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          showSidebarToggle={chatMode === 'private'}
          chatMode={chatMode}
          onToggleTeamMenu={handleToggleTeamMenu}
          onOpenHelpCenter={(tab) => {
            setHelpCenterTab(tab || 'quick-start');
            setShowHelpCenter(true);
          }}
          onStartTour={handleRestartTour}
          onOpenSetupGuide={() => setShowSetupGuide(true)}
        />

        {/* Chat Mode Toggle - Fixed below header */}
        <div className="pt-16 flex-shrink-0" data-tour="mode-toggle">
          <ChatModeToggle mode={chatMode} onModeChange={setChatMode} />
        </div>

        {/* Expired Token Banner */}
        {hasExpiredToken && !tokenBannerDismissed && (
          <ExpiredTokenBanner onDismiss={() => setTokenBannerDismissed(true)} />
        )}

        {/* Chat Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto">
          {chatMode === 'reports' ? (
            <ReportsView />
          ) : chatMode === 'private' ? (
            <ChatContainer
              sidebarOpen={sidebarOpen}
              onCloseSidebar={() => setSidebarOpen(false)}
              conversationToLoad={conversationToLoad}
              shouldStartNewChat={shouldStartNewChat}
              onConversationLoaded={() => setConversationToLoad(null)}
              onNewChatStarted={() => setShouldStartNewChat(false)}
              onConversationChange={setActiveConversationId}
            />
          ) : (
            <GroupChat
              showTeamMenu={showTeamMenu}
              onCloseTeamMenu={() => setShowTeamMenu(false)}
              onSwitchToPrivateChat={handleSwitchToPrivateChat}
            />
          )}
        </div>
      </div>

      {/* Onboarding Modals - CRITICAL: Guided Setup takes precedence over Welcome Modal */}
      {showWelcomeModal && !showSetupGuide && (
        <WelcomeModal
          userName={user?.user_metadata?.full_name || 'there'}
          teamName={teamName}
          onStartTour={handleStartTour}
          onDismiss={handleDismissWelcome}
        />
      )}

      {showTour && !showSetupGuide && (
        <InteractiveTour
          steps={tourSteps}
          currentStep={tourStep}
          onNext={() => setTourStep(prev => prev + 1)}
          onPrevious={() => setTourStep(prev => prev - 1)}
          onSkip={handleTourSkip}
          onComplete={handleTourComplete}
          onNavigate={handleTourNavigate}
        />
      )}

      {/* Help Center */}
      <HelpCenter
        isOpen={showHelpCenter}
        onClose={() => setShowHelpCenter(false)}
        onStartTour={handleRestartTour}
        isAdmin={isAdmin}
        initialTab={helpCenterTab}
      />

      {/* Astra Guided Setup - Always takes precedence over other onboarding flows */}
      <AstraGuidedSetup
        isOpen={showSetupGuide}
        onClose={() => setShowSetupGuide(false)}
      />
    </div>
  );
};