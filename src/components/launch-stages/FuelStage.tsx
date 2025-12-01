import React, { useState, useEffect } from 'react';
import { ArrowLeft, Fuel, CheckCircle, ArrowRight, Loader, FileText, Folder, Database, HardDrive, Rocket } from 'lucide-react';
import { StageProgress } from '../../hooks/useLaunchPreparation';
import { useLaunchPreparation } from '../../hooks/useLaunchPreparation';
import { useDocumentCounts } from '../../hooks/useDocumentCounts';
import { FUEL_LEVELS, formatPoints } from '../../lib/launch-preparation-utils';
import { getGoogleDriveConnection } from '../../lib/google-drive-oauth';
import { useAuth } from '../../contexts/AuthContext';
import { ConnectDriveStep } from '../setup-steps/ConnectDriveStep';
import { ChooseFolderStep } from '../setup-steps/ChooseFolderStep';
import { LaunchPreparationHeader } from './LaunchPreparationHeader';

interface FuelStageProps {
  progress: StageProgress | null;
  fuelProgress: StageProgress | null;
  boostersProgress: StageProgress | null;
  guidanceProgress: StageProgress | null;
  onBack: () => void;
  onComplete: () => void;
}

export const FuelStage: React.FC<FuelStageProps> = ({ progress, fuelProgress, boostersProgress, guidanceProgress, onBack, onComplete }) => {
  const { user } = useAuth();
  const { updateStageLevel, completeAchievement, awardPoints } = useLaunchPreparation();
  const { counts, loading: countsLoading, calculateFuelLevel, meetsLevelRequirements, refresh: refreshCounts } = useDocumentCounts();
  const [showDriveFlow, setShowDriveFlow] = useState(false);
  const [driveFlowStep, setDriveFlowStep] = useState<'connect' | 'choose-folder'>('connect');
  const [checkingLevel, setCheckingLevel] = useState(false);
  const [hasGoogleDrive, setHasGoogleDrive] = useState(false);
  const [checkingDrive, setCheckingDrive] = useState(true);
  const [userClosedModal, setUserClosedModal] = useState(false);

  const currentLevel = progress?.level || 0;
  const targetLevel = currentLevel + 1;
  const currentLevelInfo = FUEL_LEVELS[currentLevel] || FUEL_LEVELS[0];
  const targetLevelInfo = FUEL_LEVELS[targetLevel - 1];

  // Check if user has Google Drive connected
  useEffect(() => {
    const checkDriveConnection = async () => {
      try {
        const connection = await getGoogleDriveConnection();
        setHasGoogleDrive(!!connection && connection.is_active);
        setCheckingDrive(false);

        // Check if returning from OAuth (session storage flag)
        const shouldReopenFuel = sessionStorage.getItem('reopen_fuel_stage');
        if (shouldReopenFuel === 'true') {
          sessionStorage.removeItem('reopen_fuel_stage');
          console.log('🚀 [FuelStage] Reopening modal after OAuth return');
          // Open modal and go to folder selection step
          setDriveFlowStep('choose-folder');
          setShowDriveFlow(true);
          return;
        }

        // Auto-open folder selection if they connected but no folders configured
        // BUT respect if user manually closed the modal
        if (connection && connection.is_active && !showDriveFlow && !userClosedModal) {
          const hasAnyFolder = connection.strategy_folder_id || connection.meetings_folder_id || connection.financial_folder_id;
          if (!hasAnyFolder) {
            setDriveFlowStep('choose-folder');
            setShowDriveFlow(true);
          }
        }
      } catch (error) {
        console.error('Error checking drive connection:', error);
        setCheckingDrive(false);
      }
    };

    if (user) {
      checkDriveConnection();
    }
  }, [user]);

  // Check if user meets requirements for next level
  useEffect(() => {
    const checkAndUpdateLevel = async () => {
      if (countsLoading || checkingLevel) return;

      const actualLevel = calculateFuelLevel();

      // If actual level is higher than recorded level, update it
      if (actualLevel > currentLevel) {
        setCheckingLevel(true);

        // Complete achievements for all levels up to actual level
        for (let level = currentLevel + 1; level <= actualLevel; level++) {
          const achievementKey = `fuel_level_${level}`;
          await completeAchievement(achievementKey, 'fuel');
          await updateStageLevel('fuel', level);
        }

        setCheckingLevel(false);

        // Refresh counts to show updated data
        await refreshCounts();
      }
    };

    checkAndUpdateLevel();
  }, [counts, currentLevel, calculateFuelLevel, countsLoading, checkingLevel, completeAchievement, updateStageLevel, onComplete]);

  const levelIcons = [FileText, Folder, Database, HardDrive, Rocket];
  const LevelIcon = levelIcons[currentLevel] || FileText;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <LaunchPreparationHeader
        onClose={onBack}
        fuelProgress={fuelProgress}
        boostersProgress={boostersProgress}
        guidanceProgress={guidanceProgress}
      />

      <div className="pt-16 p-4 md:p-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Stages</span>
          </button>

        {/* Stage Title */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Fuel className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  Fuel Stage
                </h1>
                <p className="text-gray-300">
                  Fuel your AI Rocket with data
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Current Level</p>
              <p className="text-3xl font-bold text-blue-400">{currentLevel}/5</p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Strategy Docs</p>
            <p className="text-2xl font-bold text-white">{counts.strategy}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Meeting Notes</p>
            <p className="text-2xl font-bold text-white">{counts.meetings}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Financial Records</p>
            <p className="text-2xl font-bold text-white">{counts.financial}</p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <LevelIcon className="w-6 h-6 mr-2 text-blue-400" />
            {currentLevel === 0 ? 'Get Started' : `Level ${currentLevel}: ${currentLevelInfo.name}`}
          </h2>

          {currentLevel === 0 ? (
            <div className="space-y-4">
              <p className="text-gray-300">
                Welcome to the Fuel Stage! Let's get your AI Rocket fueled up with data.
              </p>
              <p className="text-gray-300">
                Your first step is simple: <strong>add at least 1 document</strong> to your Google Drive folders.
              </p>
            </div>
          ) : (
            <p className="text-gray-300 mb-4">
              {currentLevelInfo.description}
            </p>
          )}

          {/* Next Level Requirements */}
          {currentLevel < 5 && targetLevelInfo && (
            <div className="mt-6 border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Next: Level {targetLevel} - {targetLevelInfo.name}
              </h3>
              <p className="text-gray-400 mb-4">{targetLevelInfo.description}</p>

              <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-400 mb-2">Requirements:</p>
                <ul className="space-y-2">
                  {targetLevelInfo.requirements.map((req, index) => {
                    let isMet = false;

                    // Check if requirement is met
                    if (req.includes('1 document')) {
                      isMet = counts.total >= 1;
                    } else if (req.includes('1 strategy') && req.includes('1 meeting') && req.includes('1 financial')) {
                      isMet = counts.strategy >= 1 && counts.meetings >= 1 && counts.financial >= 1;
                    } else if (req.includes('3 strategy')) {
                      isMet = counts.strategy >= 3 && counts.meetings >= 10 && counts.financial >= 3;
                    } else if (req.includes('10 strategy') && req.includes('50 meetings')) {
                      isMet = counts.strategy >= 10 && counts.meetings >= 50 && counts.financial >= 10;
                    } else if (req.includes('100 meetings')) {
                      isMet = counts.strategy >= 10 && counts.meetings >= 100 && counts.financial >= 10 && counts.projects > 0;
                    }

                    return (
                      <li key={index} className="flex items-center space-x-2">
                        {isMet ? (
                          <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-600 rounded-full flex-shrink-0" />
                        )}
                        <span className={isMet ? 'text-purple-400' : 'text-gray-300'}>
                          {req}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Reward: <span className="text-yellow-400 font-semibold">{formatPoints(targetLevelInfo.points)} points</span>
                </p>
                {meetsLevelRequirements(targetLevel) && !checkingLevel && (
                  <span className="text-purple-400 text-sm font-medium flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Requirements met! Updating...
                  </span>
                )}
              </div>
            </div>
          )}

          {currentLevel === 5 && (
            <div className="mt-6 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Rocket className="w-8 h-8 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Maximum Fuel Achieved!</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Incredible! You've reached the highest fuel level. Your AI Rocket is fully fueled and ready for maximum performance!
              </p>
              <p className="text-gray-400 text-sm">
                Continue to the next stage to power up your Boosters!
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => {
              setDriveFlowStep(hasGoogleDrive ? 'choose-folder' : 'connect');
              setShowDriveFlow(true);
            }}
            disabled={checkingDrive}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingDrive ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Checking connection...</span>
              </>
            ) : hasGoogleDrive ? (
              <>
                <Folder className="w-5 h-5" />
                <span>Manage Folders & Add Documents</span>
              </>
            ) : (
              <>
                <Folder className="w-5 h-5" />
                <span>Connect Google Drive & Add Documents</span>
              </>
            )}
          </button>

          {currentLevel >= 1 && (
            <button
              onClick={onComplete}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>Continue to Boosters Stage</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {currentLevel < 1 && (
            <p className="text-center text-gray-400 text-sm">
              Complete Level 1 to unlock the next stage
            </p>
          )}
        </div>

        {/* Why This Matters */}
        <div className="mt-8 bg-gray-800/30 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Why Data Matters</h3>
          <div className="space-y-3 text-gray-300 text-sm">
            <p>
              <strong>Strategy Documents:</strong> Your business plans, goals, and strategic initiatives give Astra context about your direction and priorities.
            </p>
            <p>
              <strong>Meeting Notes:</strong> Conversations, decisions, and action items help Astra understand what's happening day-to-day in your business.
            </p>
            <p>
              <strong>Financial Records:</strong> Budgets, P&L statements, and financial data enable Astra to provide insights about business performance.
            </p>
            <p className="text-blue-400">
              More data = More accurate insights = Better decisions!
            </p>
          </div>
        </div>
      </div>

      {/* Google Drive Setup Flow Modal */}
      {showDriveFlow && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={(e) => {
            // Allow closing by clicking backdrop
            if (e.target === e.currentTarget) {
              setShowDriveFlow(false);
              setUserClosedModal(true);
            }
          }}
        >
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {driveFlowStep === 'connect' ? 'Connect Google Drive' : 'Choose Your Folder'}
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDriveFlow(false);
                  setUserClosedModal(true);
                }}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <span className="text-2xl leading-none">×</span>
              </button>
            </div>
            <div className="p-6">
              {driveFlowStep === 'connect' ? (
                <ConnectDriveStep
                  onComplete={() => {
                    setDriveFlowStep('choose-folder');
                    setHasGoogleDrive(true);
                  }}
                  progress={null}
                  fromLaunchPrep={true}
                />
              ) : (
                <ChooseFolderStep
                  onComplete={async (folderData) => {
                    console.log('Folder selected:', folderData);
                    // Don't close modal - let ChooseFolderStep show success screen
                    // Just refresh the counts in background
                    await refreshCounts();
                  }}
                  onProceed={() => {
                    // User clicked "Next: Place Your Files" button
                    setShowDriveFlow(false);
                  }}
                  progress={null}
                />
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
