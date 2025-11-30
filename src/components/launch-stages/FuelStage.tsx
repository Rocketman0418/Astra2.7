import React, { useState, useEffect } from 'react';
import { ArrowLeft, Fuel, CheckCircle, ArrowRight, Loader, FileText, Folder, Database, HardDrive, Rocket } from 'lucide-react';
import { StageProgress } from '../../hooks/useLaunchPreparation';
import { useLaunchPreparation } from '../../hooks/useLaunchPreparation';
import { useDocumentCounts } from '../../hooks/useDocumentCounts';
import { FUEL_LEVELS, formatPoints } from '../../lib/launch-preparation-utils';
import { GoogleDriveSettings } from '../GoogleDriveSettings';

interface FuelStageProps {
  progress: StageProgress | null;
  onBack: () => void;
  onComplete: () => void;
}

export const FuelStage: React.FC<FuelStageProps> = ({ progress, onBack, onComplete }) => {
  const { updateStageLevel, completeAchievement, awardPoints } = useLaunchPreparation();
  const { counts, loading: countsLoading, calculateFuelLevel, meetsLevelRequirements } = useDocumentCounts();
  const [showDriveSettings, setShowDriveSettings] = useState(false);
  const [checkingLevel, setCheckingLevel] = useState(false);

  const currentLevel = progress?.level || 0;
  const targetLevel = currentLevel + 1;
  const currentLevelInfo = FUEL_LEVELS[currentLevel] || FUEL_LEVELS[0];
  const targetLevelInfo = FUEL_LEVELS[targetLevel - 1];

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

        // Show completion if reached level 1
        if (actualLevel >= 1 && currentLevel < 1) {
          setTimeout(() => {
            if (confirm('Congratulations! You\'ve completed Fuel Level 1!\n\nReady to move to the Boosters stage?')) {
              onComplete();
            }
          }, 1000);
        }
      }
    };

    checkAndUpdateLevel();
  }, [counts, currentLevel, calculateFuelLevel, countsLoading, checkingLevel, completeAchievement, updateStageLevel, onComplete]);

  const levelIcons = [FileText, Folder, Database, HardDrive, Rocket];
  const LevelIcon = levelIcons[currentLevel] || FileText;

  return (
    <div className="min-h-screen p-4 md:p-8">
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
        <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Fuel className="w-8 h-8 text-orange-400" />
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
              <p className="text-3xl font-bold text-orange-400">{currentLevel}/5</p>
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
            <LevelIcon className="w-6 h-6 mr-2 text-orange-400" />
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
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-600 rounded-full flex-shrink-0" />
                        )}
                        <span className={isMet ? 'text-green-400' : 'text-gray-300'}>
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
                  <span className="text-green-400 text-sm font-medium flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Requirements met! Updating...
                  </span>
                )}
              </div>
            </div>
          )}

          {currentLevel === 5 && (
            <div className="mt-6 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Rocket className="w-8 h-8 text-orange-400" />
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
            onClick={() => setShowDriveSettings(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Folder className="w-5 h-5" />
            <span>Connect Google Drive & Add Documents</span>
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
            <p className="text-orange-400">
              More data = More accurate insights = Better decisions!
            </p>
          </div>
        </div>
      </div>

      {/* Google Drive Settings Modal */}
      {showDriveSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Connect Google Drive</h2>
              <button
                onClick={() => setShowDriveSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <GoogleDriveSettings />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
