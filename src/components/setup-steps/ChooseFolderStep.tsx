import React, { useState, useEffect } from 'react';
import { FolderPlus, CheckCircle, Folder } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';
import { getGoogleDriveConnection } from '../../lib/google-drive-oauth';

interface ChooseFolderStepProps {
  onComplete: (folderData: any) => void;
  progress: SetupGuideProgress | null;
}

interface ConnectedFolder {
  type: 'meetings' | 'strategy' | 'financial';
  ids: string[];
  count: number;
}

export const ChooseFolderStep: React.FC<ChooseFolderStepProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [connectedFolders, setConnectedFolders] = useState<ConnectedFolder[]>([]);
  const [hasAnyFolders, setHasAnyFolders] = useState(false);

  useEffect(() => {
    checkConnectedFolders();
  }, []);

  const checkConnectedFolders = async () => {
    setLoading(true);
    try {
      const connection = await getGoogleDriveConnection();

      if (!connection) {
        setLoading(false);
        return;
      }

      const folders: ConnectedFolder[] = [];

      // Check meetings folders
      const meetingIds = connection.selected_meetings_folder_ids || [];
      if (Array.isArray(meetingIds) && meetingIds.length > 0) {
        folders.push({
          type: 'meetings',
          ids: meetingIds,
          count: meetingIds.length
        });
      }

      // Check strategy folders
      const strategyIds = connection.selected_strategy_folder_ids || [];
      if (Array.isArray(strategyIds) && strategyIds.length > 0) {
        folders.push({
          type: 'strategy',
          ids: strategyIds,
          count: strategyIds.length
        });
      }

      // Check financial folders
      const financialIds = connection.selected_financial_folder_ids || [];
      if (Array.isArray(financialIds) && financialIds.length > 0) {
        folders.push({
          type: 'financial',
          ids: financialIds,
          count: financialIds.length
        });
      }

      setConnectedFolders(folders);
      setHasAnyFolders(folders.length > 0);
    } catch (error) {
      console.error('Error checking connected folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFolderTypeDisplay = (type: string): string => {
    const displays: Record<string, string> = {
      meetings: 'Meetings',
      strategy: 'Strategy',
      financial: 'Financial'
    };
    return displays[type] || type;
  };

  const getFolderTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      meetings: '📊',
      strategy: '🎯',
      financial: '💰'
    };
    return icons[type] || '📁';
  };

  const getFolderTypeDescription = (type: string): string => {
    const descriptions: Record<string, string> = {
      meetings: 'Meeting notes, transcripts, and agendas',
      strategy: 'Strategic plans, goals, and objectives',
      financial: 'Financial statements and reports'
    };
    return descriptions[type] || 'Documents and files';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-4">
            <FolderPlus className="w-8 h-8 text-purple-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Choose Your Folder</h2>
          <p className="text-gray-300">Checking your connected folders...</p>
        </div>
      </div>
    );
  }

  if (hasAnyFolders) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-4">
            <CheckCircle className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Folders Connected Successfully!</h2>
          <p className="text-gray-300">
            You have already connected folders to Astra. Here's what's connected:
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Folder className="w-5 h-5 text-purple-400" />
            Connected Folders
          </h3>
          <div className="space-y-4">
            {connectedFolders.map((folder) => (
              <div
                key={folder.type}
                className="bg-gray-900/50 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getFolderTypeIcon(folder.type)}</div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">
                      {getFolderTypeDisplay(folder.type)} Folder{folder.count > 1 ? 's' : ''}
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">
                      {getFolderTypeDescription(folder.type)}
                    </p>
                    <p className="text-xs text-purple-400 mt-2">
                      {folder.count} folder{folder.count > 1 ? 's' : ''} connected
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <span className="font-medium">💡 Tip:</span> You can manage your folder connections anytime from the Google Drive settings in your user menu.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => onComplete({ selected_folder_path: 'existing', folders: connectedFolders })}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]"
          >
            Next: Place Your Files →
          </button>
        </div>
      </div>
    );
  }

  // No folders connected yet - show selection UI
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-4">
          <FolderPlus className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Choose Your Folder</h2>
        <p className="text-gray-300">
          Select or create a folder where Astra will read your documents
        </p>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <p className="text-sm text-yellow-300">
          <span className="font-medium">⚠️ No folders connected yet:</span> You'll need to connect at least one folder to continue. You can do this from your Google Drive settings.
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Available Folder Types:
        </h3>
        <div className="space-y-3">
          {[
            { icon: '📊', name: 'Meetings', desc: 'For meeting notes and transcripts' },
            { icon: '🎯', name: 'Strategy', desc: 'For strategic plans and objectives' },
            { icon: '💰', name: 'Financial', desc: 'For financial statements and reports' }
          ].map((item, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-900/50 rounded-lg">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-white font-medium">{item.name}</p>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={() => {
            // For now, allow continuing to see the full flow
            // In production, this would open folder selection
            onComplete({ selected_folder_path: 'created' });
          }}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all min-h-[44px]"
        >
          Continue (Setup folders from settings) →
        </button>
      </div>
    </div>
  );
};
