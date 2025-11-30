import React, { useState } from 'react';
import { X, Rocket, Fuel, Zap, Compass, Trophy, Flame, TrendingUp, Award, ChevronRight } from 'lucide-react';
import { useLaunchPreparation } from '../hooks/useLaunchPreparation';
import { calculateStageProgress, formatPoints, FUEL_LEVELS, BOOSTERS_LEVELS, GUIDANCE_LEVELS } from '../lib/launch-preparation-utils';

interface MissionControlProps {
  onClose: () => void;
  onNavigateToStage?: (stage: 'fuel' | 'boosters' | 'guidance') => void;
}

export const MissionControl: React.FC<MissionControlProps> = ({ onClose, onNavigateToStage }) => {
  const { launchStatus, stageProgress, recentPoints, achievements, loading } = useLaunchPreparation();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'achievements'>('overview');

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-8">
          <p className="text-white">Loading Mission Control...</p>
        </div>
      </div>
    );
  }

  const fuelProgress = stageProgress.find(p => p.stage === 'fuel') || null;
  const boostersProgress = stageProgress.find(p => p.stage === 'boosters') || null;
  const guidanceProgress = stageProgress.find(p => p.stage === 'guidance') || null;

  const stages = [
    {
      id: 'fuel' as const,
      name: 'Fuel',
      icon: Fuel,
      color: 'orange',
      progress: fuelProgress,
      levels: FUEL_LEVELS
    },
    {
      id: 'boosters' as const,
      name: 'Boosters',
      icon: Zap,
      color: 'cyan',
      progress: boostersProgress,
      levels: BOOSTERS_LEVELS
    },
    {
      id: 'guidance' as const,
      name: 'Guidance',
      icon: Compass,
      color: 'green',
      progress: guidanceProgress,
      levels: GUIDANCE_LEVELS
    }
  ];

  const earnedAchievements = achievements.filter(a =>
    fuelProgress?.achievements.includes(a.achievement_key) ||
    boostersProgress?.achievements.includes(a.achievement_key) ||
    guidanceProgress?.achievements.includes(a.achievement_key)
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500/20 via-green-500/20 to-blue-500/20 border-b border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Mission Control</h2>
                <p className="text-gray-400 text-sm">Track your progress and level up</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Points and Streak */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <p className="text-gray-400 text-sm">Total Points</p>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{formatPoints(launchStatus?.total_points || 0)}</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                <Flame className="w-5 h-5 text-orange-400" />
                <p className="text-gray-400 text-sm">Daily Streak</p>
              </div>
              <p className="text-2xl font-bold text-orange-400">{launchStatus?.daily_streak || 0} days</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-1">
                <Award className="w-5 h-5 text-purple-400" />
                <p className="text-gray-400 text-sm">Achievements</p>
              </div>
              <p className="text-2xl font-bold text-purple-400">{earnedAchievements.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 px-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${selectedTab === 'overview'
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
                }
              `}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab('achievements')}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${selectedTab === 'achievements'
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
                }
              `}
            >
              Achievements
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Stage Progress */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-gray-400" />
                  Stage Progress
                </h3>
                <div className="space-y-4">
                  {stages.map((stage) => {
                    const Icon = stage.icon;
                    const level = stage.progress?.level || 0;
                    const percent = calculateStageProgress(stage.progress);
                    const nextLevel = stage.levels[level];

                    return (
                      <div
                        key={stage.id}
                        className={`
                          bg-gray-900/50 border border-${stage.color}-500/30 rounded-lg p-4
                          hover:border-${stage.color}-500/50 transition-all
                        `}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 bg-${stage.color}-500/20 rounded-lg flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 text-${stage.color}-400`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-white">{stage.name}</h4>
                              <p className="text-sm text-gray-400">Level {level}/5</p>
                            </div>
                          </div>
                          {onNavigateToStage && level < 5 && (
                            <button
                              onClick={() => onNavigateToStage(stage.id)}
                              className={`
                                text-sm font-medium px-3 py-1 rounded
                                bg-${stage.color}-500/20 text-${stage.color}-400
                                hover:bg-${stage.color}-500/30
                                flex items-center space-x-1
                              `}
                            >
                              <span>Level Up</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                          {level === 5 && (
                            <span className={`text-sm font-medium px-3 py-1 rounded bg-${stage.color}-500/20 text-${stage.color}-400`}>
                              Maxed
                            </span>
                          )}
                        </div>

                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r from-${stage.color}-500 to-${stage.color}-400 transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        {nextLevel && level < 5 && (
                          <p className="text-xs text-gray-400 mt-2">
                            Next: {nextLevel.name} ({formatPoints(nextLevel.points)} points)
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Points */}
              {recentPoints.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-2">
                    {recentPoints.slice(0, 5).map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-gray-900/50 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white text-sm">{entry.reason_display}</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`
                          font-semibold text-sm
                          ${entry.points > 0 ? 'text-green-400' : 'text-red-400'}
                        `}>
                          {entry.points > 0 ? '+' : ''}{entry.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'achievements' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Your Achievements</h3>
                {earnedAchievements.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No achievements yet</p>
                    <p className="text-gray-500 text-sm mt-1">Start using features to earn achievements!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {earnedAchievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="bg-gray-900/50 border border-purple-500/30 rounded-lg p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Award className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-sm">{achievement.name}</h4>
                            <p className="text-xs text-gray-400 mt-1">{achievement.description}</p>
                            <p className="text-xs text-yellow-400 mt-2">
                              +{achievement.points_value} points
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 bg-gray-900/50">
          <p className="text-center text-gray-400 text-sm">
            Keep leveling up to unlock more insights and capabilities! 🚀
          </p>
        </div>
      </div>
    </div>
  );
};
