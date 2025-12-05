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

  // Updated launch requirements: Fuel 1, Boosters 4, Guidance 2
  const canLaunch = fuelLevel >= 1 && boostersLevel >= 4 && guidanceLevel >= 2;
  const hasRecommendedLevel = fuelLevel >= 5 && boostersLevel >= 5 && guidanceLevel >= 5;

  const handleLaunch = () => {
    if (!canLaunch) {
      alert('Complete the minimum requirements before launching:\n• Fuel: Level 1\n• Boosters: Level 4\n• Guidance: Level 2');
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

          {/* Overall Progress */}
          <div className="w-full max-w-2xl mb-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">Overall Progress</h2>
                <span className="text-2xl font-bold text-yellow-400">{overallProgress}%</span>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-1000"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Total Points</p>
                  <p className="text-lg font-bold text-yellow-400">{formatPoints(totalPoints)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Maximum</p>
                  <p className="text-sm text-gray-300">{formatPoints(recommendedPoints)}</p>
                </div>
              </div>

              {/* Launch Requirements */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs font-medium text-gray-400 mb-2">Minimum Requirements to Launch:</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className={`text-center p-2 rounded ${fuelLevel >= 1 ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-400'}`}>
                    <p className="font-medium">Fuel</p>
                    <p>Level 1</p>
                  </div>
                  <div className={`text-center p-2 rounded ${boostersLevel >= 4 ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-400'}`}>
                    <p className="font-medium">Boosters</p>
                    <p>Level 4</p>
                  </div>
                  <div className={`text-center p-2 rounded ${guidanceLevel >= 2 ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-400'}`}>
                    <p className="font-medium">Guidance</p>
                    <p>Level 2</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Launch Button - Moved here from bottom */}
          <div className="w-full max-w-2xl space-y-3 mb-6">
            {canLaunch ? (
              <>
                <button
                  onClick={handleLaunch}
                  disabled={launching}
                  className={`
                    w-full text-white font-bold py-4 px-6 rounded-xl text-lg
                    transition-all transform
                    ${launching
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 cursor-wait scale-95'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105 hover:shadow-2xl'
                    }
                    flex items-center justify-center space-x-3
                  `}
                >
                  <span>{launching ? 'Launching...' : '🚀 Launch AI Rocket'}</span>
                </button>

                {hasRecommendedLevel && (
                  <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
                    <Trophy className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-purple-400 font-semibold">
                      Excellent Preparation! You're ready for optimal performance! 🎉
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-6 text-center">
                <p className="text-yellow-400 mb-3">
                  Complete minimum requirements to unlock launch capability
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {fuelLevel < 1 && (
                    <button
                      onClick={() => onNavigateToStage('fuel')}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Fuel: Level 1 Required
                    </button>
                  )}
                  {boostersLevel < 4 && (
                    <button
                      onClick={() => onNavigateToStage('boosters')}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Boosters: Level 4 Required
                    </button>
                  )}
                  {guidanceLevel < 2 && (
                    <button
                      onClick={() => onNavigateToStage('guidance')}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Guidance: Level 2 Required
                    </button>
                  )}
                </div>
              </div>
            )}
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
