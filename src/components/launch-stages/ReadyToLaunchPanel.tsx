import React, { useState } from 'react';
import { Rocket, Fuel, Zap, Compass, ArrowRight, Trophy, Star } from 'lucide-react';
import { StageProgress } from '../../hooks/useLaunchPreparation';
import { calculateStageProgress, formatPoints, getMinimumPointsToLaunch, getRecommendedPointsToLaunch } from '../../lib/launch-preparation-utils';
import { LaunchPreparationHeader } from './LaunchPreparationHeader';

interface ReadyToLaunchPanelProps {
  fuelProgress: StageProgress | null;
  boostersProgress: StageProgress | null;
  guidanceProgress: StageProgress | null;
  totalPoints: number;
  onNavigateToStage: (stage: 'fuel' | 'boosters' | 'guidance') => void;
  onLaunch: () => void;
  onExit?: () => void;
}

export const ReadyToLaunchPanel: React.FC<ReadyToLaunchPanelProps> = ({
  fuelProgress,
  boostersProgress,
  guidanceProgress,
  totalPoints,
  onNavigateToStage,
  onLaunch,
  onExit
}) => {
  const [launching, setLaunching] = useState(false);

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

  const overallProgress = Math.round((fuelPercent + boostersPercent + guidancePercent) / 3);

  const minPoints = getMinimumPointsToLaunch();
  const recommendedPoints = getRecommendedPointsToLaunch();

  const canLaunch = fuelLevel >= 1 && boostersLevel >= 1 && guidanceLevel >= 1;
  const hasRecommendedLevel = fuelLevel >= 2 && boostersLevel >= 2 && guidanceLevel >= 2;

  const handleLaunch = () => {
    if (!canLaunch) {
      alert('You need to complete at least Level 1 in all stages before launching!');
      return;
    }

    if (confirm('🚀 Are you ready to launch your AI Rocket?\n\nYou\'ll enter the main application and can continue leveling up through Mission Control.')) {
      setLaunching(true);
      setTimeout(() => {
        onLaunch();
      }, 2000);
    }
  };

  const stages = [
    {
      id: 'fuel' as const,
      name: 'Fuel',
      icon: Fuel,
      color: 'orange',
      level: fuelLevel,
      progress: fuelPercent,
      points: fuelProgress?.points_earned || 0
    },
    {
      id: 'boosters' as const,
      name: 'Boosters',
      icon: Zap,
      color: 'cyan',
      level: boostersLevel,
      progress: boostersPercent,
      points: boostersProgress?.points_earned || 0
    },
    {
      id: 'guidance' as const,
      name: 'Guidance',
      icon: Compass,
      color: 'green',
      level: guidanceLevel,
      progress: guidancePercent,
      points: guidanceProgress?.points_earned || 0
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <LaunchPreparationHeader onClose={handleExit} />

      <div className="pt-16 px-4 pb-4 h-screen overflow-y-auto flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full py-4">
          {/* Page Title */}
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">
              Mission Control
            </h2>
            <p className="text-gray-400 text-base md:text-lg mb-4">
              Launch Preparation
            </p>

            {/* Rocket Animation */}
            <div className="relative inline-block mb-4">
              <div className={`
                w-20 h-20 bg-gradient-to-br from-orange-500 via-green-500 to-blue-500 rounded-full
                flex items-center justify-center
                ${launching ? 'animate-bounce' : 'animate-pulse'}
              `}>
                <Rocket className="w-10 h-10 text-white" />
              </div>
              {launching && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="text-2xl animate-bounce">🔥</div>
                </div>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {canLaunch ? 'Ready to Launch!' : 'Almost Ready!'}
            </h1>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">
              {canLaunch
                ? 'Launch now or continue leveling up for better results!'
                : 'Complete Level 1 in all stages to unlock launch.'
              }
            </p>
          </div>

          {/* Overall Progress */}
          <div className="w-full max-w-2xl mb-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">Overall Progress</h2>
                <span className="text-2xl font-bold text-yellow-400">{overallProgress}%</span>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 via-cyan-500 to-green-500 transition-all duration-1000"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Total Points</p>
                  <p className="text-lg font-bold text-yellow-400">{formatPoints(totalPoints)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Minimum</p>
                  <p className="text-sm text-gray-300">{formatPoints(minPoints)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Recommended</p>
                  <p className="text-sm text-gray-300">{formatPoints(recommendedPoints)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stage Progress Cards */}
          <div className="w-full max-w-4xl space-y-3 mb-4">
            <h2 className="text-lg font-bold text-white mb-2">Stage Status</h2>
        {stages.map((stage) => {
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={`
                bg-gray-800/50 border-2 rounded-xl p-4
                transition-all
                border-${stage.color}-500/30
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`
                    flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center
                    bg-${stage.color}-500/20
                  `}>
                    <Icon className={`w-8 h-8 text-${stage.color}-400`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-bold text-white">{stage.name}</h3>
                      <span className={`
                        text-sm font-medium px-2 py-0.5 rounded
                        bg-${stage.color}-500/20 text-${stage.color}-400
                      `}>
                        Level {stage.level}/5
                      </span>
                      {stage.level >= 3 && (
                        <Star className={`w-5 h-5 text-${stage.color}-400`} />
                      )}
                    </div>

                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden mb-2">
                      <div
                        className={`h-full bg-gradient-to-r from-${stage.color}-500 to-${stage.color}-400 transition-all duration-500`}
                        style={{ width: `${stage.progress}%` }}
                      />
                    </div>

                    <p className="text-sm text-gray-400">
                      {formatPoints(stage.points)} points earned
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToStage(stage.id)}
                  className={`
                    ml-4 px-4 py-2 rounded-lg font-medium text-sm
                    bg-${stage.color}-500/20 text-${stage.color}-400
                    hover:bg-${stage.color}-500/30
                    transition-colors
                  `}
                >
                  {stage.level >= 5 ? 'Maxed' : 'Level Up'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

          {/* Launch Button */}
          <div className="w-full max-w-2xl space-y-3">
            {canLaunch ? (
              <>
                <button
                  onClick={handleLaunch}
                  disabled={launching}
                  className={`
                    w-full text-white font-bold py-4 px-6 rounded-xl text-lg
                    transition-all transform
                    ${launching
                      ? 'bg-gradient-to-r from-orange-600 to-orange-500 cursor-wait scale-95'
                      : 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:scale-105 hover:shadow-2xl'
                    }
                    flex items-center justify-center space-x-3
                  `}
                >
                  <Rocket className={`w-6 h-6 ${launching ? 'animate-bounce' : ''}`} />
                  <span>{launching ? 'Launching...' : '🚀 LAUNCH AI ROCKET'}</span>
                </button>

            {!hasRecommendedLevel && (
              <p className="text-center text-gray-400 text-sm">
                💡 Tip: Reach Level 2 in all stages for recommended preparation
              </p>
            )}

            {hasRecommendedLevel && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
                <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-semibold">
                  Excellent Preparation! You're ready for optimal performance! 🎉
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-6 text-center">
            <p className="text-yellow-400 mb-3">
              Complete Level 1 in all stages to unlock launch capability
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {fuelLevel < 1 && (
                <button
                  onClick={() => onNavigateToStage('fuel')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Complete Fuel Stage
                </button>
              )}
              {boostersLevel < 1 && (
                <button
                  onClick={() => onNavigateToStage('boosters')}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Complete Boosters Stage
                </button>
              )}
              {guidanceLevel < 1 && (
                <button
                  onClick={() => onNavigateToStage('guidance')}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Complete Guidance Stage
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Benefits Reminder */}
      {canLaunch && (
        <div className="mt-8 w-full max-w-2xl bg-gray-800/30 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-400" />
            What's Next After Launch
          </h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start">
              <ArrowRight className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
              <span>Access the full Astra AI platform with all your data</span>
            </li>
            <li className="flex items-start">
              <ArrowRight className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
              <span>Continue earning Launch Points through Mission Control</span>
            </li>
            <li className="flex items-start">
              <ArrowRight className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
              <span>Unlock achievements and build daily streaks</span>
            </li>
            <li className="flex items-start">
              <ArrowRight className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
              <span>Level up stages even further for maximum insights</span>
            </li>
          </ul>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
