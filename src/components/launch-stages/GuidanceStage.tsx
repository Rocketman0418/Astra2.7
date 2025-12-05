import React, { useState, useEffect } from 'react';
import { X, Compass, CheckCircle, ArrowRight, Settings, Newspaper, UserPlus, Briefcase, BookOpen, Info, Sparkles } from 'lucide-react';
import { StageProgress } from '../../hooks/useLaunchPreparation';
import { useLaunchPreparation } from '../../hooks/useLaunchPreparation';
import { GUIDANCE_LEVELS, formatPoints } from '../../lib/launch-preparation-utils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { StageProgressBar } from './StageProgressBar';
import { GuidanceTeamConfigModal } from './GuidanceTeamConfigModal';
import { GuidanceNewsModal } from './GuidanceNewsModal';
import { GuidanceInviteMemberModal } from './GuidanceInviteMemberModal';

interface GuidanceStageProps {
  progress: StageProgress | null;
  fuelProgress: StageProgress | null;
  boostersProgress: StageProgress | null;
  guidanceProgress: StageProgress | null;
  onBack: () => void;
  onComplete: () => void;
}

export const GuidanceStage: React.FC<GuidanceStageProps> = ({ progress, fuelProgress, boostersProgress, guidanceProgress, onBack, onComplete }) => {
  const { user } = useAuth();
  const { updateStageLevel, completeAchievement, fetchStageProgress } = useLaunchPreparation();
  const [showTeamConfigModal, setShowTeamConfigModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLevelInfo, setShowLevelInfo] = useState(false);

  const currentLevel = progress?.level || 0;
  const targetLevel = currentLevel + 1;
  const currentLevelInfo = GUIDANCE_LEVELS[currentLevel] || GUIDANCE_LEVELS[0];
  const targetLevelInfo = GUIDANCE_LEVELS[targetLevel - 1];

  const levelIcons = [Settings, Newspaper, UserPlus, Briefcase, BookOpen];
  const LevelIcon = levelIcons[currentLevel] || Compass;

  // Check achievements
  const hasCompletedAchievement = (key: string): boolean => {
    return progress?.achievements?.includes(key) || false;
  };

  // Handle modal proceeds with achievements
  const handleTeamConfigProceed = async () => {
    setShowTeamConfigModal(false);
    // Award task achievement
    await completeAchievement('guidance_team_settings', 'guidance');
    // Award level achievement
    await completeAchievement('guidance_level_1', 'guidance');
    // Update level
    await updateStageLevel('guidance', 1);
    // Refresh progress
    await fetchStageProgress();
  };

  const handleNewsProceed = async () => {
    setShowNewsModal(false);
    // Award task achievement
    await completeAchievement('guidance_news_enabled', 'guidance');
    // Award level achievement
    await completeAchievement('guidance_level_2', 'guidance');
    // Update level
    await updateStageLevel('guidance', 2);
    // Refresh progress
    await fetchStageProgress();
  };

  const handleInviteProceed = async () => {
    setShowInviteModal(false);
    // Award task achievement
    await completeAchievement('guidance_member_invited', 'guidance');
    // Award level achievement
    await completeAchievement('guidance_level_3', 'guidance');
    // Update level
    await updateStageLevel('guidance', 3);
    // Refresh progress
    await fetchStageProgress();
  };

  const featureCards = [
    {
      id: 'team_settings',
      name: 'Team Configuration',
      description: 'Set up your team name and preferences',
      icon: Settings,
      color: 'green',
      level: 1,
      action: () => setShowTeamConfigModal(true),
      actionText: 'Configure Team',
      completed: hasCompletedAchievement('guidance_team_settings')
    },
    {
      id: 'news',
      name: 'News Preferences',
      description: 'Stay informed with industry news',
      icon: Newspaper,
      color: 'blue',
      level: 2,
      action: () => setShowNewsModal(true),
      actionText: 'Enable News',
      completed: hasCompletedAchievement('guidance_news_enabled')
    },
    {
      id: 'invite_member',
      name: 'Invite Team Members',
      description: 'Build your team and collaborate',
      icon: UserPlus,
      color: 'purple',
      level: 3,
      action: () => setShowInviteModal(true),
      actionText: 'Invite Members',
      completed: hasCompletedAchievement('guidance_member_invited')
    },
    {
      id: 'ai_job',
      name: 'AI Jobs',
      description: 'Create automated workflows (Coming Soon)',
      icon: Briefcase,
      color: 'yellow',
      level: 4,
      action: () => {
        alert('AI Jobs feature coming soon!');
      },
      actionText: 'Create Job (Soon)',
      completed: false,
      disabled: true
    },
    {
      id: 'guidance_doc',
      name: 'Guidance Documents',
      description: 'Document your processes (Coming Soon)',
      icon: BookOpen,
      color: 'cyan',
      level: 5,
      action: () => {
        alert('Guidance Documents feature coming soon!');
      },
      actionText: 'Create Document (Soon)',
      completed: false,
      disabled: true
    }
  ];

  const handleStageNavigation = (stage: 'fuel' | 'boosters' | 'guidance') => {
    if (stage === 'guidance') return; // Already here
    onBack(); // Go back to stage selector
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Compact Progress Bar at Top */}
      <StageProgressBar
        fuelProgress={fuelProgress}
        boostersProgress={boostersProgress}
        guidanceProgress={guidanceProgress}
        currentStage="guidance"
        onStageClick={handleStageNavigation}
      />

      <div className="p-4 max-w-5xl mx-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Compass className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Guidance Stage</h1>
              <p className="text-sm text-gray-400">Set your mission parameters</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Back to Mission Control"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Compact Level Progress */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center">
              <LevelIcon className="w-5 h-5 mr-2 text-green-400" />
              {currentLevel === 0 ? 'Get Started' : `Level ${currentLevel}: ${currentLevelInfo.name}`}
            </h2>
            <button
              onClick={() => setShowLevelInfo(true)}
              className="text-gray-400 hover:text-white transition-colors"
              title="View all levels"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>

          {currentLevel === 0 ? (
            <div className="space-y-4">
              <p className="text-gray-300">
                Welcome to the Guidance Stage! Now let's configure your team and set up your mission parameters.
              </p>
              <p className="text-gray-300">
                Your first step: <strong>Configure your team settings</strong> to reach Level 1.
              </p>
            </div>
          ) : (
            <p className="text-gray-300 mb-4">
              {currentLevelInfo.description}
            </p>
          )}

          {/* Next Level */}
          {currentLevel < 5 && targetLevelInfo && (
            <div className="mt-6 border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Next: Level {targetLevel}
              </h3>
              <p className="text-gray-400 mb-4">{targetLevelInfo.description}</p>

              <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-400 mb-2">Requirements:</p>
                <ul className="space-y-2">
                  {targetLevelInfo.requirements.map((req, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-gray-600 rounded-full flex-shrink-0" />
                      <span className="text-gray-300">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-400">
                  Reward: <span className="text-yellow-400 font-semibold">{formatPoints(targetLevelInfo.points)} points</span>
                </p>
              </div>
            </div>
          )}

          {currentLevel === 5 && (
            <div className="mt-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <BookOpen className="w-8 h-8 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Guidance Complete!</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Perfect! You've set all guidance parameters. Your AI Rocket is fully configured and ready to launch!
              </p>
              <p className="text-gray-400 text-sm">
                You're ready to launch your AI Rocket!
              </p>
            </div>
          )}
        </div>

        {/* Next Action - Prominent */}
        {currentLevel < 5 && targetLevelInfo && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-bold text-white">Next: {targetLevelInfo.name}</h3>
                </div>
                <p className="text-gray-300 text-sm mb-4">{targetLevelInfo.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-yellow-400 font-semibold">
                      {formatPoints(targetLevelInfo.points)} points
                    </span>
                  </div>
                  {targetLevel === 1 && !featureCards[0].completed && (
                    <button
                      onClick={() => setShowTeamConfigModal(true)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <span>Configure Team</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {targetLevel === 2 && !featureCards[1].completed && (
                    <button
                      onClick={() => setShowNewsModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <span>Enable News</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {targetLevel === 3 && !featureCards[2].completed && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <span>Invite Members</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Configuration Tasks</h3>
          {featureCards.map((feature) => {
            const FeatureIcon = feature.icon;
            const isLocked = feature.level > currentLevel + 1;
            const isDisabled = feature.disabled;

            return (
              <div
                key={feature.id}
                className={`
                  bg-gray-800/50 border rounded-xl p-6
                  ${isLocked || isDisabled
                    ? 'border-gray-700 opacity-50'
                    : `border-${feature.color}-500/30`
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`
                      flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center
                      ${isLocked || isDisabled
                        ? 'bg-gray-700'
                        : `bg-${feature.color}-500/20`
                      }
                    `}>
                      {feature.completed ? (
                        <CheckCircle className={`w-6 h-6 text-${feature.color}-400`} />
                      ) : (
                        <FeatureIcon className={`w-6 h-6 ${isLocked || isDisabled ? 'text-gray-500' : `text-${feature.color}-400`}`} />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-lg font-semibold text-white">{feature.name}</h4>
                        {feature.completed && (
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                            Completed
                          </span>
                        )}
                        {isDisabled && (
                          <span className="text-xs bg-gray-600 text-gray-400 px-2 py-0.5 rounded">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{feature.description}</p>

                      {!isLocked && !isDisabled && !feature.completed && (
                        <button
                          onClick={feature.action}
                          className={`
                            bg-${feature.color}-500 hover:bg-${feature.color}-600
                            text-white text-sm font-medium px-4 py-2 rounded-lg
                            transition-colors
                          `}
                        >
                          {feature.actionText}
                        </button>
                      )}

                      {isLocked && (
                        <p className="text-gray-500 text-sm">
                          Complete Level {feature.level - 1} to unlock
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <span className={`
                      text-xs font-medium px-2 py-1 rounded
                      ${isLocked || isDisabled
                        ? 'bg-gray-700 text-gray-400'
                        : `bg-${feature.color}-500/20 text-${feature.color}-400`
                      }
                    `}>
                      Level {feature.level}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {currentLevel >= 1 && (
            <button
              onClick={onComplete}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>Ready to Launch!</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {currentLevel < 1 && (
            <p className="text-center text-gray-400 text-sm">
              Complete Level 1 to proceed to Ready to Launch
            </p>
          )}
        </div>

        {/* Why This Matters */}
        <div className="mt-8 bg-gray-800/30 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Why Guidance Matters</h3>
          <div className="space-y-3 text-gray-300 text-sm">
            <p>
              <strong>Team Settings:</strong> Configure your team name, preferences, and collaboration settings.
            </p>
            <p>
              <strong>News Preferences:</strong> Stay informed about your industry and relevant topics.
            </p>
            <p>
              <strong>Team Members:</strong> Collaborate with your team for better insights and shared knowledge.
            </p>
            <p className="text-purple-400">
              A well-configured team gets the most value from Astra!
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTeamConfigModal && (
        <GuidanceTeamConfigModal
          onClose={() => setShowTeamConfigModal(false)}
          onProceed={handleTeamConfigProceed}
        />
      )}

      {showNewsModal && (
        <GuidanceNewsModal
          onClose={() => setShowNewsModal(false)}
          onProceed={handleNewsProceed}
        />
      )}

      {showInviteModal && (
        <GuidanceInviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onProceed={handleInviteProceed}
        />
      )}

      {/* Level Info Modal */}
      {showLevelInfo && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700">
            <div className="sticky top-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-b border-green-500/30 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Compass className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold text-white">Guidance Stage Levels</h2>
              </div>
              <button
                onClick={() => setShowLevelInfo(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {GUIDANCE_LEVELS.map((level, index) => {
                  const LevelIconComp = levelIcons[index];
                  const isCompleted = currentLevel > index;
                  const isCurrent = currentLevel === index;

                  return (
                    <div
                      key={index}
                      className={`
                        border rounded-lg p-4
                        ${isCompleted ? 'bg-green-500/10 border-green-500/30' :
                          isCurrent ? 'bg-blue-500/10 border-blue-500/30' :
                          'bg-gray-700/30 border-gray-600'}
                      `}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`
                          w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                          ${isCompleted ? 'bg-green-500/20' :
                            isCurrent ? 'bg-blue-500/20' :
                            'bg-gray-700'}
                        `}>
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          ) : (
                            <LevelIconComp className={`w-6 h-6 ${isCurrent ? 'text-blue-400' : 'text-gray-500'}`} />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              Level {index + 1}: {level.name}
                            </h3>
                            {isCompleted && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                Completed
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                Current
                              </span>
                            )}
                          </div>

                          <p className="text-gray-300 text-sm mb-3">{level.description}</p>

                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-400">Requirements:</p>
                            <ul className="space-y-1">
                              {level.requirements.map((req, reqIndex) => (
                                <li key={reqIndex} className="flex items-center space-x-2 text-sm text-gray-300">
                                  <div className={`
                                    w-1.5 h-1.5 rounded-full
                                    ${isCompleted ? 'bg-green-400' :
                                      isCurrent ? 'bg-blue-400' :
                                      'bg-gray-500'}
                                  `} />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="mt-3 flex items-center space-x-4">
                            <span className={`
                              text-xs font-semibold
                              ${isCompleted ? 'text-green-400' :
                                isCurrent ? 'text-yellow-400' :
                                'text-gray-500'}
                            `}>
                              {formatPoints(level.points)} points
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4">
              <button
                onClick={() => setShowLevelInfo(false)}
                className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
