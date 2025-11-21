import React from 'react';
import { FolderPlus } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';

interface ChooseFolderStepProps {
  onComplete: (folderData: any) => void;
  progress: SetupGuideProgress | null;
}

export const ChooseFolderStep: React.FC<ChooseFolderStepProps> = ({ onComplete }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-4">
          <FolderPlus className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Choose Your Folder</h2>
        <p className="text-gray-300">Step 3 - Folder selection implementation in progress</p>
      </div>
      <button
        onClick={() => onComplete({ selected_folder_path: 'test' })}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium min-h-[44px]"
      >
        Continue (Temp)
      </button>
    </div>
  );
};
