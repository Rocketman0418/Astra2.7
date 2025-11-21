import React from 'react';
import { SetupGuideProgress, SyncedDataContext } from '../../lib/setup-guide-utils';

interface SyncDataStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
  onSkip?: () => void;
  dataContext?: SyncedDataContext | null;
}

export const SyncDataStep: React.FC<SyncDataStepProps> = ({ onComplete, onSkip }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-3">SyncDataStep</h2>
        <p className="text-gray-300">Step implementation in progress</p>
      </div>
      <div className="flex gap-4 justify-center">
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium min-h-[44px]"
        >
          Continue (Temp)
        </button>
        {onSkip && (
          <button
            onClick={onSkip}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium min-h-[44px]"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
};
