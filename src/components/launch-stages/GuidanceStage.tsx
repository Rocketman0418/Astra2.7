import React, { useState, useEffect } from 'react';
import { ArrowLeft, Compass, CheckCircle, ArrowRight, Settings, Newspaper, UserPlus, Briefcase, BookOpen } from 'lucide-react';
import { StageProgress } from '../../hooks/useLaunchPreparation';
import { useLaunchPreparation } from '../../hooks/useLaunchPreparation';
import { GUIDANCE_LEVELS, formatPoints } from '../../lib/launch-preparation-utils';
import { TeamSettingsModal } from '../TeamSettingsModal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LaunchPreparationHeader } from './LaunchPreparationHeader';

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
  const { updateStageLevel, completeAchievement } = useLaunchPreparation();
  const [showTeamSettings, setShowTeamSettings] = useState(false);
  const [teamConfigured, setTeamConfigured] = useState(false);
  const [newsEnabled, setNewsEnabled] = useState(false);
  const [memberInvited, setMemberInvited] = useState(false);

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

  // Check team configuration status
  useEffect(() => {
    const checkTeamStatus = async () => {
      if (!user) return;

      try {
        // Check if team settings are configured
        const { data: userData } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', user.id)
          .single();

        if (userData?.team_id) {
          const { data: teamSettings } = await supabase
            .from('team_settings')
            .select('*')
            .eq('team_id', userData.team_id)
            .maybeSingle();

          setTeamConfigured(!!teamSettings);
          setNewsEnabled(teamSettings?.news_enabled || false);

          // Check if user has invited anyone
          const { data: teamMembers } = await supabase
            .from('users')
            .select('id')
            .eq('team_id', userData.team_id)
            .neq('id', user.id);

          setMemberInvited((teamMembers?.length || 0) > 0);
        }
      } catch (err) {
        console.error('Error checking team status:', err);
      }
    };

    checkTeamStatus();
  }, [user]);

  // Auto-complete levels based on status
  useEffect(() => {
    const autoCompleteLevel = async () => {
      if (teamConfigured && currentLevel < 1) {
        await completeAchievement('guidance_team_settings', 'guidance');
        await updateStageLevel('guidance', 1);
      }

      if (newsEnabled && currentLevel < 2) {
        await completeAchievement('guidance_news_enabled', 'guidance');
        await updateStageLevel('guidance', 2);
      }

      if (memberInvited && currentLevel < 3) {
        await completeAchievement('guidance_member_invited', 'guidance');
        await updateStageLevel('guidance', 3);
      }
    };

    autoCompleteLevel();
  }, [teamConfigured, newsEnabled, memberInvited, currentLevel, completeAchievement, updateStageLevel]);

  const handleTeamSettingsSaved = async () => {
    setShowTeamSettings(false);
    setTeamConfigured(true);
  };

  const featureCards = [
    {
      id: 'team_settings',
      name: 'Team Configuration',
      description: 'Set up your team name and preferences',
      icon: Settings,
      color: 'green',
      level: 1,
      action: () => setShowTeamSettings(true),
      actionText: 'Configure Team',
      completed: hasCompletedAchievement('guidance_team_settings') || teamConfigured
    },
    {
      id: 'news',
      name: 'News Preferences',
      description: 'Stay informed with industry news',
      icon: Newspaper,
      color: 'blue',
      level: 2,
      action: () => setShowTeamSettings(true),
      actionText: 'Enable News',
      completed: hasCompletedAchievement('guidance_news_enabled') || newsEnabled
    },
    {
      id: 'invite_member',
      name: 'Invite Team Members',
      description: 'Build your team and collaborate',
      icon: UserPlus,
      color: 'purple',
      level: 3,
      action: () => setShowTeamSettings(true),
      actionText: 'Invite Members',
      completed: hasCompletedAchievement('guidance_member_invited') || memberInvited
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <LaunchPreparationHeader
        onClose={onBack}
        fuelProgress={fuelProgress}
        boostersProgress={boostersProgress}
        guidanceProgress={guidanceProgress}
      />

      <div className="pt-16 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Stages</span>
          </button>

        {/* Stage Title */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Compass className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  Guidance Stage
                </h1>
                <p className="text-gray-300">
                  Set your mission parameters
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Current Level</p>
              <p className="text-3xl font-bold text-purple-400">{currentLevel}/5</p>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <LevelIcon className="w-6 h-6 mr-2 text-purple-400" />
            {currentLevel === 0 ? 'Get Started' : `Level ${currentLevel}: ${currentLevelInfo.name}`}
          </h2>

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
                Next: Level {targetLevel} - {targetLevelInfo.name}
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

      {/* Team Settings Modal */}
      {showTeamSettings && (
        <TeamSettingsModal
          onClose={() => setShowTeamSettings(false)}
          onSaved={handleTeamSettingsSaved}
        />
      )}
      </div>
    </div>
  );
};
