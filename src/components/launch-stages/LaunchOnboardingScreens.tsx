import React, { useState } from 'react';
import { ChevronRight, Rocket, MessageSquare, BarChart3, Calendar, FileText, Users, Sparkles } from 'lucide-react';
import { LaunchPreparationHeader } from './LaunchPreparationHeader';

interface LaunchOnboardingScreensProps {
  onComplete: () => void;
  onClose: () => void;
  userName?: string;
}

const onboardingScreens = [
  {
    id: 'welcome',
    title: 'Welcome to AI Rocket + Astra Intelligence!',
    subtitle: 'Your AI-powered command center for business intelligence',
    icon: Rocket,
    content: (
      <div className="space-y-4 text-center">
        <div className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500/20 via-green-500/20 to-blue-500/20 rounded-lg border border-orange-500/30">
          <p className="text-lg text-white">
            <span className="font-bold text-emerald-400">Astra</span> is here to help you unlock the full potential of your data
          </p>
        </div>
        <p className="text-gray-300 text-base max-w-2xl mx-auto">
          Let's take a quick tour of what you can do once you launch your AI Rocket
        </p>
      </div>
    )
  },
  {
    id: 'features-1',
    title: 'Intelligent Conversations & Analytics',
    subtitle: 'Ask questions, get insights',
    icon: MessageSquare,
    content: (
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">AI Chat</h3>
          </div>
          <p className="text-gray-300">
            Chat with Astra to analyze your data, get insights, and make informed decisions - all in natural language
          </p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Visual Reports</h3>
          </div>
          <p className="text-gray-300">
            Generate beautiful visualizations and reports from your data automatically with AI
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'features-2',
    title: 'Collaboration & Automation',
    subtitle: 'Work smarter together',
    icon: Users,
    content: (
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Team Collaboration</h3>
          </div>
          <p className="text-gray-300">
            Work with your team, share insights, and collaborate on decisions with AI assistance
          </p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Scheduled Reports</h3>
          </div>
          <p className="text-gray-300">
            Set up automated reports delivered to your inbox on your schedule
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'launch-prep',
    title: 'Ready to Launch?',
    subtitle: 'Let\'s prepare your AI Rocket for takeoff',
    icon: Sparkles,
    content: (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-orange-500/10 via-green-500/10 to-blue-500/10 border border-orange-500/30 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-white mb-4 text-center">
            Launch Preparation System
          </h3>
          <p className="text-gray-300 text-center mb-6">
            Before you can unlock all these powerful features, we need to set up three key systems:
          </p>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <FileText className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Fuel - Connect Your Data</h4>
                <p className="text-gray-400 text-sm">
                  Link your Google Drive folders so Astra can access your documents and emails
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Boosters - Enable Features</h4>
                <p className="text-gray-400 text-sm">
                  Set up reports, team settings, and other features to power your workflow
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Rocket className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Guidance - Set Mission Parameters</h4>
                <p className="text-gray-400 text-sm">
                  Configure your preferences and customize how Astra works for you
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-sm text-center">
          Don't worry - you can complete these at your own pace. Each step earns you Launch Points!
        </p>
      </div>
    ),
    ctaText: 'Initiate Launch Preparation',
    ctaAction: true
  }
];

export const LaunchOnboardingScreens: React.FC<LaunchOnboardingScreensProps> = ({
  onComplete,
  onClose,
  userName
}) => {
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleNext = () => {
    if (currentScreen < onboardingScreens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const screen = onboardingScreens[currentScreen];
  const ScreenIcon = screen.icon;
  const isLastScreen = currentScreen === onboardingScreens.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <LaunchPreparationHeader onClose={onClose} />

      <div className="pt-16 px-4 pb-4 h-screen overflow-y-auto flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full py-8">
          {/* Page Title - Only on first screen */}
          {currentScreen === 0 && (
            <div className="text-center mb-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">
                Mission Control
              </h2>
              <p className="text-gray-400 text-base md:text-lg">
                Welcome aboard!
              </p>
            </div>
          )}

          {/* Screen Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 via-green-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
              <ScreenIcon className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Screen Title */}
          <div className="text-center mb-8 max-w-3xl">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {screen.title}
            </h1>
            <p className="text-gray-400 text-base md:text-lg">
              {screen.subtitle}
            </p>
          </div>

          {/* Screen Content */}
          <div className="w-full mb-8">
            {screen.content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between w-full max-w-2xl mt-8">
            {/* Progress Dots */}
            <div className="flex items-center space-x-2">
              {onboardingScreens.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentScreen(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentScreen
                      ? 'w-8 bg-gradient-to-r from-orange-500 via-green-500 to-blue-500'
                      : 'w-2 bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {!isLastScreen && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Skip Tour
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 via-green-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <span>{screen.ctaText || 'Continue'}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
