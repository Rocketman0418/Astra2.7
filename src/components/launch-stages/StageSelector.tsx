import React from 'react';
import { Fuel, Zap, Compass, ArrowRight, Lock, CheckCircle } from 'lucide-react';
import { StageProgress } from '../../hooks/useLaunchPreparation';
import { calculateStageProgress, formatPoints, getStageDisplayName } from '../../lib/launch-preparation-utils';

interface StageSelectorProps {
  currentStage: 'fuel' | 'boosters' | 'guidance' | 'ready' | 'launched';
  fuelProgress: StageProgress | null;
  boostersProgress: StageProgress | null;
  guidanceProgress: StageProgress | null;
  totalPoints: number;
  onNavigateToStage: (stage: 'fuel' | 'boosters' | 'guidance') => void;
}

export const StageSelector: React.FC<StageSelectorProps> = ({
  currentStage,
  fuelProgress,
  boostersProgress,
  guidanceProgress,
  totalPoints,
  onNavigateToStage
}) => {
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
      icon: Compass,
      color: 'green',
      progress: guidancePercent,
      level: guidanceLevel,
      unlocked: guidanceUnlocked,
      completed: guidanceLevel >= 5
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 via-green-500 to-blue-500 rounded-full mb-4 animate-pulse">
          <Fuel className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Prepare for Launch
        </h1>
        <p className="text-gray-400 text-lg">
          Complete these stages to launch your AI Rocket
        </p>
      </div>

      {/* Points Display */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-6 py-3 mb-8">
        <p className="text-gray-400 text-sm">Launch Points</p>
        <p className="text-2xl font-bold text-yellow-400">{formatPoints(totalPoints)}</p>
      </div>

      {/* Stage Cards */}
      <div className="w-full max-w-4xl space-y-4 mb-8">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isLocked = !stage.unlocked;

          return (
            <button
              key={stage.id}
              onClick={() => !isLocked && onNavigateToStage(stage.id)}
              disabled={isLocked}
              className={`
                w-full bg-gray-800/50 border-2 rounded-xl p-6 text-left transition-all
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
                    flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center
                    ${isLocked
                      ? 'bg-gray-700'
                      : `bg-${stage.color}-500/20`
                    }
                  `}>
                    {isLocked ? (
                      <Lock className="w-8 h-8 text-gray-500" />
                    ) : stage.completed ? (
                      <CheckCircle className={`w-8 h-8 text-${stage.color}-400`} />
                    ) : (
                      <Icon className={`w-8 h-8 text-${stage.color}-400`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-xl font-bold text-white">
                        {stage.name}
                      </h3>
                      <span className={`
                        text-sm font-medium px-2 py-0.5 rounded
                        ${isLocked
                          ? 'bg-gray-700 text-gray-400'
                          : `bg-${stage.color}-500/20 text-${stage.color}-400`
                        }
                      `}>
                        Level {stage.level}/5
                      </span>
                    </div>
                    <p className="text-gray-400 mb-3">{stage.description}</p>

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
                      <p className="text-gray-500 text-sm">
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

      {/* Info Text */}
      <div className="text-center text-gray-400 text-sm max-w-2xl">
        <p>
          Complete at least Level 1 in each stage to reach Ready to Launch status.
          Higher levels unlock more insights and capabilities!
        </p>
      </div>
    </div>
  );
};
