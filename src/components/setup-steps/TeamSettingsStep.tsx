import React from 'react';
import { Settings, CheckCircle } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';

interface TeamSettingsStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
}

export const TeamSettingsStep: React.FC<TeamSettingsStepProps> = ({ onComplete, progress }) => {
  const hasConfiguredSettings = progress?.step_6_team_settings_configured || false;

  if (hasConfiguredSettings) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/20 mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Team Settings Configured!</h2>
          <p className="text-gray-300">Your team settings are set up and ready to go.</p>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <p className="text-sm text-green-300">
            <span className="font-medium">✅ All set!</span> You can update team settings anytime from the menu.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <button onClick={onComplete} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]">
            Next: Ask Your First Question →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/20 mb-4">
          <Settings className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Configure Team Settings</h2>
        <p className="text-gray-300">Set up your team name and preferences</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Team Settings Include:</h3>
        <div className="space-y-3">
          {['Team name and display settings', 'Default folder preferences', 'AI model selection', 'Notification preferences'].map((item, idx) => (
            <div key={idx} className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <span className="font-medium">💡 Tip:</span> Access team settings from the user menu in the top right.
        </p>
      </div>

      <div className="flex justify-center pt-4">
        <button onClick={onComplete} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]">
          Continue →
        </button>
      </div>
    </div>
  );
};
