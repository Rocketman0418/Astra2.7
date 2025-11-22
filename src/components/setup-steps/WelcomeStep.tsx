import React from 'react';
import { Rocket, CheckCircle } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';

interface WelcomeStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onComplete }) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
          <Rocket className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Welcome to Astra Intelligence
        </h2>
        <p className="text-base text-gray-300">
          Your AI-powered business intelligence platform
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-base font-semibold text-white mb-3">
          What You'll Accomplish:
        </h3>

        <div className="space-y-2">
          {[
            'Connect your Google Drive to unlock AI insights',
            'Set up your first data folder with files',
            'Configure your team settings',
            'Experience Astra\'s intelligent responses',
            'Create your first AI-powered visualization',
            'Set up automated reports',
            'Invite your team members (optional)'
          ].map((item, index) => (
            <div key={index} className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          <span className="font-medium">⏱ Estimated time:</span> 15-20 minutes
        </p>
        <p className="text-xs text-blue-300 mt-1">
          <span className="font-medium">💾 Your progress is saved:</span> You can pause and return anytime
        </p>
      </div>

      <div className="flex justify-center pt-2">
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium text-base transition-all transform hover:scale-105 min-h-[44px]"
        >
          Let's Get Started →
        </button>
      </div>
    </div>
  );
};
