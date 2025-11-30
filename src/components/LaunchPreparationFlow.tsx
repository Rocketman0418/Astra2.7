import React, { useState, useEffect } from 'react';
import { useLaunchPreparation } from '../hooks/useLaunchPreparation';
import { useLaunchActivity } from '../hooks/useLaunchActivity';
import { useAuth } from '../contexts/AuthContext';
import { Loader, Rocket } from 'lucide-react';
import { FuelStage } from './launch-stages/FuelStage';
import { BoostersStage } from './launch-stages/BoostersStage';
import { GuidanceStage } from './launch-stages/GuidanceStage';
import { ReadyToLaunchPanel } from './launch-stages/ReadyToLaunchPanel';
import { StageSelector } from './launch-stages/StageSelector';
import { LaunchToast, useLaunchToast } from './LaunchToast';
import { isReadyToLaunch } from '../lib/launch-preparation-utils';

interface LaunchPreparationFlowProps {
  onLaunch: () => void;
}

export const LaunchPreparationFlow: React.FC<LaunchPreparationFlowProps> = ({ onLaunch }) => {
  const { user } = useAuth();
  const {
    launchStatus,
    stageProgress,
    loading,
    error,
    initializeLaunchStatus,
    updateCurrentStage
  } = useLaunchPreparation();

  const [showStageSelector, setShowStageSelector] = useState(true);
  const { notifications, dismissToast, showLaunch } = useLaunchToast();

  // Enable background activity tracking
  useLaunchActivity();

  // Initialize launch status on mount
  useEffect(() => {
    if (user && !launchStatus && !loading) {
      initializeLaunchStatus();
    }
  }, [user, launchStatus, loading, initializeLaunchStatus]);

  // Get progress for each stage
  const fuelProgress = stageProgress.find(p => p.stage === 'fuel') || null;
  const boostersProgress = stageProgress.find(p => p.stage === 'boosters') || null;
  const guidanceProgress = stageProgress.find(p => p.stage === 'guidance') || null;

  // Check if user is ready to launch
  const readyToLaunch = isReadyToLaunch(fuelProgress, boostersProgress, guidanceProgress);

  // Handle stage navigation
  const navigateToStage = async (stage: 'fuel' | 'boosters' | 'guidance' | 'ready') => {
    setShowStageSelector(false);
    await updateCurrentStage(stage);
  };

  // Handle back to stage selector
  const backToStageSelector = () => {
    setShowStageSelector(true);
  };

  // Handle launch button click
  const handleLaunch = async () => {
    showLaunch();
    await updateCurrentStage('launched');
    setTimeout(() => {
      onLaunch();
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Preparing your Launch Sequence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!launchStatus) {
    return null;
  }

  // Show stage selector or current stage
  if (showStageSelector || launchStatus.current_stage === 'ready') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {launchStatus.current_stage === 'ready' || readyToLaunch ? (
          <ReadyToLaunchPanel
            fuelProgress={fuelProgress}
            boostersProgress={boostersProgress}
            guidanceProgress={guidanceProgress}
            totalPoints={launchStatus.total_points}
            onNavigateToStage={navigateToStage}
            onLaunch={handleLaunch}
            onExit={onLaunch}
          />
        ) : (
          <StageSelector
            currentStage={launchStatus.current_stage}
            fuelProgress={fuelProgress}
            boostersProgress={boostersProgress}
            guidanceProgress={guidanceProgress}
            totalPoints={launchStatus.total_points}
            onNavigateToStage={navigateToStage}
            onExit={onLaunch}
          />
        )}
      </div>
    );
  }

  // Show current stage
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <LaunchToast notifications={notifications} onDismiss={dismissToast} />

      {launchStatus.current_stage === 'fuel' && (
        <FuelStage
          progress={fuelProgress}
          onBack={backToStageSelector}
          onComplete={() => {
            if (boostersProgress && boostersProgress.level > 0) {
              backToStageSelector();
            } else {
              navigateToStage('boosters');
            }
          }}
        />
      )}

      {launchStatus.current_stage === 'boosters' && (
        <BoostersStage
          progress={boostersProgress}
          onBack={backToStageSelector}
          onComplete={() => {
            if (guidanceProgress && guidanceProgress.level > 0) {
              backToStageSelector();
            } else {
              navigateToStage('guidance');
            }
          }}
        />
      )}

      {launchStatus.current_stage === 'guidance' && (
        <GuidanceStage
          progress={guidanceProgress}
          onBack={backToStageSelector}
          onComplete={() => {
            if (readyToLaunch) {
              navigateToStage('ready');
            } else {
              backToStageSelector();
            }
          }}
        />
      )}
    </div>
  );
};
