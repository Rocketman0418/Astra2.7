import React, { useState, useEffect } from 'react';
import { X, Zap, CheckCircle, ArrowRight, MessageCircle, BarChart, FileBarChart, CalendarClock, Bot, Sparkles, Info } from 'lucide-react';
import { StageProgress } from '../../hooks/useLaunchPreparation';
import { useLaunchPreparation } from '../../hooks/useLaunchPreparation';
import { BOOSTERS_LEVELS, formatPoints } from '../../lib/launch-preparation-utils';
import { AstraGuidedChatModal } from '../AstraGuidedChatModal';
import { StageProgressBar } from './StageProgressBar';

interface BoostersStageProps {
  progress: StageProgress | null;
  fuelProgress: StageProgress | null;
  boostersProgress: StageProgress | null;
  guidanceProgress: StageProgress | null;
  onBack: () => void;
  onComplete: () => void;
}

export const BoostersStage: React.FC<BoostersStageProps> = ({ progress, fuelProgress, boostersProgress, guidanceProgress, onBack, onComplete }) => {
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

  const handleStageNavigation = (stage: 'fuel' | 'boosters' | 'guidance') => {
    if (stage === 'boosters') return; // Already here
    onBack(); // Go back to stage selector
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Compact Progress Bar at Top */}
      <StageProgressBar
        fuelProgress={fuelProgress}
        boostersProgress={boostersProgress}
        guidanceProgress={guidanceProgress}
        currentStage="boosters"
        onStageClick={handleStageNavigation}
      />

      <div className="p-4 max-w-5xl mx-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Boosters Stage</h1>
              <p className="text-sm text-gray-400">Power up with AI features</p>
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
              <LevelIcon className="w-5 h-5 mr-2 text-cyan-400" />
              {currentLevel === 0 ? 'Get Started' : `Level ${currentLevel}: ${currentLevelInfo.name}`}
            </h2>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Info className="w-5 h-5" />
            </button>
          </div>

          {currentLevel === 0 ? (
            <p className="text-sm text-gray-300 mb-3">
              <strong>Try Astra Guided Chat</strong> or send 5 prompts to reach Level 1.
            </p>
          ) : (
            <p className="text-sm text-gray-300 mb-3">
              {currentLevelInfo.description}
            </p>
          )}

          {/* Next Level */}
          {currentLevel < 5 && targetLevelInfo && (
            <div className="border-t border-gray-700 pt-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">
                  Next: Level {targetLevel} - {targetLevelInfo.name}
                </h3>
                <span className="text-xs text-yellow-400 font-medium">
                  +{formatPoints(targetLevelInfo.points)}
                </span>
              </div>

              <ul className="space-y-1.5">
                {targetLevelInfo.requirements.map((req, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm">
                    <div className="w-4 h-4 border-2 border-gray-600 rounded-full flex-shrink-0" />
                    <span className="text-gray-400">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentLevel === 5 && (
            <div className="mt-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg p-3 flex items-center gap-3">
              <Bot className="w-6 h-6 text-cyan-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">Maximum Power!</p>
                <p className="text-xs text-gray-300">Ready for Guidance stage</p>
              </div>
            </div>
          )}
        </div>

        {/* Compact Feature Cards */}
        <div className="space-y-3 mb-4">
          <h3 className="text-sm font-semibold text-white">Available Features</h3>
          {featureCards.map((feature) => {
            const FeatureIcon = feature.icon;
            const isLocked = feature.level > currentLevel + 1;
            const isDisabled = feature.disabled;

            return (
              <div
                key={feature.id}
                className={`
                  bg-gray-800/50 border rounded-lg p-3 flex items-center justify-between
                  ${isLocked || isDisabled ? 'border-gray-700 opacity-60' : 'border-gray-700'}
                `}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0">
                    {feature.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : isLocked || isDisabled ? (
                      <FeatureIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <FeatureIcon className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate">{feature.name}</h4>
                      {feature.completed && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded flex-shrink-0">
                          Done
                        </span>
                      )}
                      {isDisabled && (
                        <span className="text-xs bg-gray-600 text-gray-400 px-1.5 py-0.5 rounded flex-shrink-0">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{feature.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-500">Lvl {feature.level}</span>
                  {!isLocked && !isDisabled && !feature.completed && (
                    <button
                      onClick={feature.action}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
                    >
                      Try
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        {currentLevel >= 1 && (
          <button
            onClick={onComplete}
            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg"
          >
            <span>Continue to Guidance</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}

        {currentLevel < 1 && (
          <p className="text-center text-gray-400 text-xs">
            Complete Level 1 to unlock Guidance
          </p>
        )}
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
