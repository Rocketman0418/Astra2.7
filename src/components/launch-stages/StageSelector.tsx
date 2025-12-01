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
      color: 'blue',
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
      color: 'purple',
      progress: guidancePercent,
      level: guidanceLevel,
      unlocked: guidanceUnlocked,
      completed: guidanceLevel >= 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <LaunchPreparationHeader
        onClose={handleExit}
        fuelProgress={fuelProgress}
        boostersProgress={boostersProgress}
        guidanceProgress={guidanceProgress}
      />

      <div className="pt-16 px-4 pb-4 h-screen overflow-y-auto flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full py-4">
          {/* Page Title */}
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">
              Mission Control
            </h2>
            <p className="text-gray-400 text-base md:text-lg">
              Launch Preparation
            </p>
          </div>

          {/* Points Display */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-6 py-2 mb-6 relative">
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

          {/* Stage Cards with Circular Progress */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isLocked = !stage.unlocked;
              const radius = 45;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (stage.progress / 100) * circumference;

              return (
                <button
                  key={stage.id}
                  onClick={() => !isLocked && onNavigateToStage(stage.id)}
                  disabled={isLocked}
                  className={`
                    relative bg-gray-800/50 border-2 rounded-2xl p-6 text-center transition-all
                    ${isLocked
                      ? 'border-gray-700 opacity-50 cursor-not-allowed'
                      : stage.color === 'blue'
                        ? 'border-orange-500/30 hover:border-orange-500 hover:bg-gray-800/70 cursor-pointer hover:scale-105'
                        : stage.color === 'cyan'
                          ? 'border-cyan-500/30 hover:border-cyan-500 hover:bg-gray-800/70 cursor-pointer hover:scale-105'
                          : 'border-green-500/30 hover:border-green-500 hover:bg-gray-800/70 cursor-pointer hover:scale-105'
                    }
                  `}
                >
                  {/* Circular Progress */}
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-32 h-32 transform -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-700"
                      />
                      {/* Progress circle */}
                      {!isLocked && (
                        <circle
                          cx="64"
                          cy="64"
                          r={radius}
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          className={
                            stage.color === 'blue'
                              ? 'text-orange-500'
                              : stage.color === 'cyan'
                                ? 'text-cyan-500'
                                : 'text-green-500'
                          }
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      )}
                    </svg>

                    {/* Icon in center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isLocked ? (
                        <Lock className="w-12 h-12 text-gray-500" />
                      ) : stage.completed ? (
                        <CheckCircle className={
                          stage.color === 'blue'
                            ? 'w-12 h-12 text-orange-400'
                            : stage.color === 'cyan'
                              ? 'w-12 h-12 text-cyan-400'
                              : 'w-12 h-12 text-green-400'
                        } />
                      ) : (
                        <Icon className={
                          stage.color === 'blue'
                            ? 'w-12 h-12 text-orange-400'
                            : stage.color === 'cyan'
                              ? 'w-12 h-12 text-cyan-400'
                              : 'w-12 h-12 text-green-400'
                        } />
                      )}
                    </div>
                  </div>

                  {/* Stage Info */}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {stage.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">{stage.description}</p>

                  {/* Level Badge */}
                  <div className={`
                    inline-flex items-center space-x-1 text-sm font-medium px-3 py-1.5 rounded-full
                    ${isLocked
                      ? 'bg-gray-700 text-gray-400'
                      : stage.color === 'blue'
                        ? 'bg-orange-500/20 text-orange-400'
                        : stage.color === 'cyan'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-green-500/20 text-green-400'
                    }
                  `}>
                    <span>Level {stage.level}/5</span>
                    {!isLocked && (
                      <span className="text-xs opacity-75">• {Math.round(stage.progress)}%</span>
                    )}
                  </div>

                  {isLocked && (
                    <p className="text-gray-500 text-xs mt-3">
                      Complete previous stage Level 1 to unlock
                    </p>
                  )}

                  {!isLocked && (
                    <div className="mt-3 text-xs text-gray-400 flex items-center justify-center gap-1">
                      <span>Tap to enter</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
