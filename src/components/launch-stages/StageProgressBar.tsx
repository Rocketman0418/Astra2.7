import React from 'react';
import { Fuel, Zap, Compass, Lock, CheckCircle } from 'lucide-react';
import { StageProgress } from '../../hooks/useLaunchPreparation';

interface StageProgressBarProps {
  fuelProgress: StageProgress | null;
  boostersProgress: StageProgress | null;
  guidanceProgress: StageProgress | null;
  currentStage: 'fuel' | 'boosters' | 'guidance';
  onStageClick: (stage: 'fuel' | 'boosters' | 'guidance') => void;
}

export const StageProgressBar: React.FC<StageProgressBarProps> = ({
  fuelProgress,
  boostersProgress,
  guidanceProgress,
  currentStage,
  onStageClick
}) => {
  const stages = [
    {
      id: 'fuel' as const,
      name: 'Fuel',
      icon: Fuel,
      progress: fuelProgress,
      color: 'orange',
      unlocked: true
    },
    {
      id: 'boosters' as const,
      name: 'Boosters',
      icon: Zap,
      progress: boostersProgress,
      color: 'cyan',
      unlocked: (fuelProgress?.level ?? 0) >= 1
    },
    {
      id: 'guidance' as const,
      name: 'Guidance',
      icon: Compass,
      progress: guidanceProgress,
      color: 'green',
      unlocked: (fuelProgress?.level ?? 0) >= 1 && (boostersProgress?.level ?? 0) >= 1
    }
  ];

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = currentStage === stage.id;
            const level = stage.progress?.level ?? 0;
            const maxLevel = 5;
            const progressPercent = (level / maxLevel) * 100;

            return (
              <React.Fragment key={stage.id}>
                <button
                  onClick={() => stage.unlocked && onStageClick(stage.id)}
                  disabled={!stage.unlocked}
                  className={`
                    flex items-center gap-3 px-4 py-2 rounded-lg transition-all flex-1
                    ${isActive
                      ? stage.color === 'orange'
                        ? 'bg-orange-500/20 border-2 border-orange-500'
                        : stage.color === 'cyan'
                          ? 'bg-cyan-500/20 border-2 border-cyan-500'
                          : 'bg-green-500/20 border-2 border-green-500'
                      : stage.unlocked
                        ? 'bg-gray-700/50 border-2 border-gray-600 hover:border-gray-500'
                        : 'bg-gray-800/30 border-2 border-gray-700/50 opacity-50'
                    }
                    ${stage.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}
                  `}
                >
                  {/* Icon with progress ring */}
                  <div className="relative flex-shrink-0">
                    <svg className="w-12 h-12 transform -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-gray-600"
                      />
                      {/* Progress circle */}
                      {stage.unlocked && (
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 20}
                          strokeDashoffset={2 * Math.PI * 20 * (1 - progressPercent / 100)}
                          className={
                            stage.color === 'orange'
                              ? 'text-orange-500'
                              : stage.color === 'cyan'
                                ? 'text-cyan-500'
                                : 'text-green-500'
                          }
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {!stage.unlocked ? (
                        <Lock className="w-5 h-5 text-gray-500" />
                      ) : level === maxLevel ? (
                        <CheckCircle className={
                          stage.color === 'orange'
                            ? 'w-5 h-5 text-orange-400'
                            : stage.color === 'cyan'
                              ? 'w-5 h-5 text-cyan-400'
                              : 'w-5 h-5 text-green-400'
                        } />
                      ) : (
                        <Icon className={
                          stage.color === 'orange'
                            ? 'w-5 h-5 text-orange-400'
                            : stage.color === 'cyan'
                              ? 'w-5 h-5 text-cyan-400'
                              : 'w-5 h-5 text-green-400'
                        } />
                      )}
                    </div>
                  </div>

                  {/* Stage info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-white text-sm">{stage.name}</div>
                    <div className={`text-xs ${stage.unlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stage.unlocked ? `Level ${level}/${maxLevel}` : 'Locked'}
                    </div>
                  </div>
                </button>

                {/* Connector arrow */}
                {index < stages.length - 1 && (
                  <div className="text-gray-600 flex-shrink-0 hidden md:block">
                    →
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
