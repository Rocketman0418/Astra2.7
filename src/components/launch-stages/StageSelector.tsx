import React, { useState } from 'react';
import { Fuel, Zap, Compass, ArrowRight, Lock, CheckCircle, Info } from 'lucide-react';
import { StageProgress } from '../../hooks/useLaunchPreparation';
import { calculateStageProgress, formatPoints, getStageDisplayName } from '../../lib/launch-preparation-utils';
import { LaunchPreparationHeader } from './LaunchPreparationHeader';

interface StageSelectorProps {
  currentStage: 'fuel' | 'boosters' | 'guidance' | 'ready' | 'launched';
  fuelProgress: StageProgress | null;
  boostersProgress: StageProgress | null;
  guidanceProgress: StageProgress | null;
  totalPoints: number;
  onNavigateToStage: (stage: 'fuel' | 'boosters' | 'guidance') => void;
  onExit?: () => void;
}

export const StageSelector: React.FC<StageSelectorProps> = ({
  currentStage,
  fuelProgress,
  boostersProgress,
  guidanceProgress,
  totalPoints,
  onNavigateToStage,
  onExit
}) => {
  const [showInfoTooltip, setShowInfoTooltip] = useState<string | null>(null);

  const handleExit = () => {
    if (onExit) {
      onExit();
    }
  };

  const fuelLevel = fuelProgress?.level || 0;
  const boostersLevel = boostersProgress?.level || 0;
  const guidanceLevel = guidanceProgress?.level || 0;

  const fuelPercent = calculateStageProgress(fuelProgress);
  const boostersPercent = calculateStageProgress(boostersProgress);
  const guidancePercent = calculateStageProgress(guidanceProgress);

  // Check if stages are unlocked
  const fuelUnlocked = true; // Always unlocked
  const boostersUnlocked = fuelLevel >= 1;
  const guidanceUnlocked = fuelLevel >= 1 && boostersLevel >= 1;

  const stages = [
    {
      id: 'fuel' as const,
      name: 'Fuel',
      description: 'Fuel your rocket with data',
      helpText: 'Connect your data sources like Google Drive and Gmail to power your AI with relevant context.',
      icon: Fuel,
      color: 'orange',
      progress: fuelPercent,
      level: fuelLevel,
      unlocked: fuelUnlocked,
      completed: fuelLevel >= 5
    },
    {
      id: 'boosters' as const,
      name: 'Boosters',
      description: 'Power up with features',
      helpText: 'Activate AI features and integrations to enhance your capabilities.',
      icon: Zap,
      color: 'cyan',
      progress: boostersPercent,
      level: boostersLevel,
      unlocked: boostersUnlocked,
      completed: boostersLevel >= 5
    },
    {
      id: 'guidance' as const,
      name: 'Guidance',
      description: 'Set your mission parameters',
      helpText: 'Configure your AI preferences and establish regular engagement patterns.',
      icon: Compass,
      color: 'green',
      progress: guidancePercent,
      level: guidanceLevel,
      unlocked: guidanceUnlocked,
      completed: guidanceLevel >= 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <LaunchPreparationHeader onClose={handleExit} />

      <div className="pt-20 px-4 pb-6 max-h-screen overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
          {/* Points Display */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-6 py-2 mb-4 relative">
            <div className="flex items-center space-x-2">
              <div>
                <p className="text-gray-400 text-xs">Launch Points</p>
                <p className="text-xl font-bold text-yellow-400">{formatPoints(totalPoints)}</p>
              </div>
              <button
                onMouseEnter={() => setShowInfoTooltip('points')}
                onMouseLeave={() => setShowInfoTooltip(null)}
                className="text-gray-500 hover:text-gray-400 transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            {showInfoTooltip === 'points' && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-gray-300 w-64 z-10 shadow-lg">
                Earn points by completing achievements in each stage. Higher levels unlock more AI capabilities!
              </div>
            )}
          </div>

          {/* Stage Cards */}
          <div className="w-full space-y-3 mb-4">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isLocked = !stage.unlocked;

              return (
                <button
                  key={stage.id}
                  onClick={() => !isLocked && onNavigateToStage(stage.id)}
                  disabled={isLocked}
                  className={`
                    w-full bg-gray-800/50 border-2 rounded-xl p-4 text-left transition-all
                    ${isLocked
                      ? 'border-gray-700 opacity-50 cursor-not-allowed'
                      : `border-${stage.color}-500/30 hover:border-${stage.color}-500 hover:bg-gray-800/70 cursor-pointer`
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Icon */}
                      <div className={`
                        flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center
                        ${isLocked
                          ? 'bg-gray-700'
                          : `bg-${stage.color}-500/20`
                        }
                      `}>
                        {isLocked ? (
                          <Lock className="w-6 h-6 text-gray-500" />
                        ) : stage.completed ? (
                          <CheckCircle className={`w-6 h-6 text-${stage.color}-400`} />
                        ) : (
                          <Icon className={`w-6 h-6 text-${stage.color}-400`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-bold text-white">
                            {stage.name}
                          </h3>
                          <span className={`
                            text-xs font-medium px-2 py-0.5 rounded
                            ${isLocked
                              ? 'bg-gray-700 text-gray-400'
                              : `bg-${stage.color}-500/20 text-${stage.color}-400`
                            }
                          `}>
                            Level {stage.level}/5
                          </span>
                          {!isLocked && (
                            <div className="relative">
                              <button
                                onMouseEnter={() => setShowInfoTooltip(stage.id)}
                                onMouseLeave={() => setShowInfoTooltip(null)}
                                onClick={(e) => e.stopPropagation()}
                                className="text-gray-500 hover:text-gray-400 transition-colors"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                              {showInfoTooltip === stage.id && (
                                <div className="absolute left-0 top-full mt-2 bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-gray-300 w-64 z-20 shadow-lg">
                                  {stage.helpText}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{stage.description}</p>

                        {/* Progress Bar */}
                        {!isLocked && (
                          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r from-${stage.color}-500 to-${stage.color}-400 transition-all duration-500`}
                              style={{ width: `${stage.progress}%` }}
                            />
                          </div>
                        )}

                        {isLocked && (
                          <p className="text-gray-500 text-xs">
                            Complete previous stage to unlock
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    {!isLocked && (
                      <ArrowRight className={`w-6 h-6 text-${stage.color}-400 flex-shrink-0 ml-4`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
