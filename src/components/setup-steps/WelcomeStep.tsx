import React from 'react';
import { Rocket, CheckCircle } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';

interface WelcomeStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onComplete }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
          <Rocket className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">
          Welcome to Astra Intelligence
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Your AI-powered business intelligence platform
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">
          What You'll Accomplish:
        </h3>

        <div className="space-y-3">
          {[
            'Connect your Google Drive to unlock AI insights',
            'Set up your first data folder with files',
            'Configure your team settings',
            'Experience Astra\'s intelligent responses',
            'Create your first AI-powered visualization',
            'Set up automated reports',
            'Invite your team members (optional)'
          ].map((item, index) => (
            <div key={index} className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <span className="font-medium">⏱ Estimated time:</span> 15-20 minutes
        </p>
        <p className="text-sm text-blue-300 mt-2">
          <span className="font-medium">💾 Your progress is saved:</span> You can pause and return anytime
        </p>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium text-lg transition-all transform hover:scale-105 min-h-[44px]"
        >
          Let's Get Started →
        </button>
      </div>
    </div>
  );
};
