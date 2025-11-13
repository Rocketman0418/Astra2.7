import React, { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getGoogleDriveConnection } from '../lib/google-drive-oauth';

interface NoFoldersSelectedModalProps {
  onOpenSettings: () => void;
}

export const NoFoldersSelectedModal: React.FC<NoFoldersSelectedModalProps> = ({ onOpenSettings }) => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        // Don't show if already dismissed in this session
        if (dismissed) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user has Google Drive connected
        const connection = await getGoogleDriveConnection();
        if (!connection || !connection.is_active) return;

        // Check if any folders are selected
        const hasFolders =
          connection.meetings_folder_id ||
          connection.strategy_folder_id ||
          connection.financial_folder_id;

        // Show modal if connected but no folders selected
        if (!hasFolders) {
          setShow(true);
        } else {
          // Hide modal if folders have been selected
          setShow(false);
        }
      } catch (error) {
        console.error('Error checking Google Drive connection:', error);
      }
    };

    // Check immediately on mount
    checkConnectionStatus();

    // Listen for changes to user_drive_connections table
    const channel = supabase
      .channel('drive-connection-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_drive_connections'
        },
        () => {
          checkConnectionStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dismissed]);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
  };

  const handleTakeMeThere = () => {
    setShow(false);
    setDismissed(true);
    onOpenSettings();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-yellow-500/30">
        <div className="p-6">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Select Folders to Start Syncing
              </h3>
              <p className="text-sm text-gray-300 mb-3">
                Your Google Drive is connected successfully! 🎉
              </p>
              <p className="text-sm text-gray-300">
                Your data will start to sync when you connect folders in your User Settings. Select at least one folder (Strategy, Meetings, or Financial) to begin syncing documents.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleTakeMeThere}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-blue-500 hover:opacity-90 text-white rounded-lg transition-opacity font-medium"
            >
              Take Me There
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
