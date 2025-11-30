import React, { useState, useEffect } from 'react';
import { ArrowLeft, Zap, CheckCircle, ArrowRight, MessageCircle, BarChart, FileBarChart, CalendarClock, Bot, Sparkles } from 'lucide-react';
import { StageProgress } from '../../hooks/useLaunchPreparation';
import { useLaunchPreparation } from '../../hooks/useLaunchPreparation';
import { BOOSTERS_LEVELS, formatPoints } from '../../lib/launch-preparation-utils';
import { AstraGuidedChatModal } from '../AstraGuidedChatModal';

interface BoostersStageProps {
  progress: StageProgress | null;
  onBack: () => void;
  onComplete: () => void;
}

export const BoostersStage: React.FC<BoostersStageProps> = ({ progress, onBack, onComplete }) => {
  const { updateStageLevel, completeAchievement } = useLaunchPreparation();
  const [showGuidedChat, setShowGuidedChat] = useState(false);
  const [checkingLevel, setCheckingLevel] = useState(false);

  const currentLevel = progress?.level || 0;
  const targetLevel = currentLevel + 1;
  const currentLevelInfo = BOOSTERS_LEVELS[currentLevel] || BOOSTERS_LEVELS[0];
  const targetLevelInfo = BOOSTERS_LEVELS[targetLevel - 1];

  const levelIcons = [MessageCircle, BarChart, FileBarChart, CalendarClock, Bot];
  const LevelIcon = levelIcons[currentLevel] || Zap;

  // Check achievements in progress
  const hasCompletedAchievement = (key: string): boolean => {
    return progress?.achievements?.includes(key) || false;
  };

  const handleGuidedChatComplete = async () => {
    if (!hasCompletedAchievement('boosters_first_prompt')) {
      await completeAchievement('boosters_guided_chat_used', 'boosters');
      await completeAchievement('boosters_first_prompt', 'boosters');
      await updateStageLevel('boosters', 1);

      setTimeout(() => {
        if (confirm('Congratulations! You\'ve completed Boosters Level 1!\n\nReady to continue to Level 2?')) {
          // User can continue in this stage
        }
      }, 1000);
    }
    setShowGuidedChat(false);
  };

  const featureCards = [
    {
      id: 'guided_chat',
      name: 'Astra Guided Chat',
      description: 'Get personalized prompt suggestions based on your data',
      icon: Sparkles,
      color: 'purple',
      level: 1,
      action: () => setShowGuidedChat(true),
      actionText: 'Try Guided Chat',
      completed: hasCompletedAchievement('boosters_first_prompt')
    },
    {
      id: 'visualization',
      name: 'Data Visualizations',
      description: 'Turn your data into visual insights',
      icon: BarChart,
      color: 'blue',
      level: 2,
      action: () => {
        // Navigate to main app with visualization prompt
        alert('This will open the main chat where you can ask Astra to create a visualization');
      },
      actionText: 'Create Visualization',
      completed: hasCompletedAchievement('boosters_first_visualization')
    },
    {
      id: 'manual_report',
      name: 'Manual Reports',
      description: 'Generate on-demand insights',
      icon: FileBarChart,
      color: 'green',
      level: 3,
      action: () => {
        alert('This will open the Reports section where you can generate a manual report');
      },
      actionText: 'Generate Report',
      completed: hasCompletedAchievement('boosters_manual_report')
    },
    {
      id: 'scheduled_report',
      name: 'Scheduled Reports',
      description: 'Automate recurring insights',
      icon: CalendarClock,
      color: 'yellow',
      level: 4,
      action: () => {
        alert('This will open the Reports section where you can schedule a recurring report');
      },
      actionText: 'Schedule Report',
      completed: hasCompletedAchievement('boosters_scheduled_report')
    },
    {
      id: 'ai_agent',
      name: 'AI Agents',
      description: 'Build custom AI workflows (Coming Soon)',
      icon: Bot,
      color: 'cyan',
      level: 5,
      action: () => {
        alert('AI Agent Builder coming soon!');
      },
      actionText: 'Build Agent (Soon)',
      completed: false,
      disabled: true
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Stages</span>
        </button>

        {/* Stage Title */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  Boosters Stage
                </h1>
                <p className="text-gray-300">
                  Power up with features
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Current Level</p>
              <p className="text-3xl font-bold text-cyan-400">{currentLevel}/5</p>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <LevelIcon className="w-6 h-6 mr-2 text-cyan-400" />
            {currentLevel === 0 ? 'Get Started' : `Level ${currentLevel}: ${currentLevelInfo.name}`}
          </h2>

          {currentLevel === 0 ? (
            <div className="space-y-4">
              <p className="text-gray-300">
                Welcome to the Boosters Stage! Now that you have data, let's learn how to use Astra's powerful features.
              </p>
              <p className="text-gray-300">
                Your first step: <strong>Try Astra Guided Chat</strong> or send 5 prompts to Astra to reach Level 1.
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
            <div className="mt-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Bot className="w-8 h-8 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Maximum Power!</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Amazing! You've mastered all the Booster features. Your AI Rocket is fully powered!
              </p>
              <p className="text-gray-400 text-sm">
                Continue to the Guidance stage to complete your preparation!
              </p>
            </div>
          )}
        </div>

        {/* Feature Cards */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Available Features</h3>
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
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
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
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>Continue to Guidance Stage</span>
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
          <h3 className="text-lg font-semibold text-white mb-3">Why Features Matter</h3>
          <div className="space-y-3 text-gray-300 text-sm">
            <p>
              <strong>Guided Chat:</strong> Get AI-powered prompt suggestions tailored to your specific data.
            </p>
            <p>
              <strong>Visualizations:</strong> See patterns and trends in your data that aren't obvious in text.
            </p>
            <p>
              <strong>Reports:</strong> Get regular insights delivered automatically or generate them on demand.
            </p>
            <p className="text-cyan-400">
              The more features you use, the more value you get from Astra!
            </p>
          </div>
        </div>
      </div>

      {/* Guided Chat Modal */}
      {showGuidedChat && (
        <AstraGuidedChatModal
          onClose={() => setShowGuidedChat(false)}
          onPromptSelected={handleGuidedChatComplete}
        />
      )}
    </div>
  );
};
