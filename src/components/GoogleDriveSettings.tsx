import React, { useState, useEffect } from 'react';
import { HardDrive, CheckCircle, XCircle, Trash2, FolderOpen, RefreshCw } from 'lucide-react';
import {
  initiateGoogleDriveOAuth,
  disconnectGoogleDrive as disconnectDrive,
  getGoogleDriveConnection,
  updateFolderConfiguration,
  listGoogleDriveFolders,
  GoogleDriveConnection,
  FolderInfo
} from '../lib/google-drive-oauth';
import { supabase } from '../lib/supabase';

export const GoogleDriveSettings: React.FC = () => {
  const [connection, setConnection] = useState<GoogleDriveConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [savingFolders, setSavingFolders] = useState(false);

  // Temporary state for folder selection
  const [selectedMeetingsFolder, setSelectedMeetingsFolder] = useState<FolderInfo | null>(null);
  const [selectedStrategyFolder, setSelectedStrategyFolder] = useState<FolderInfo | null>(null);

  const loadConnection = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const conn = await getGoogleDriveConnection();
      setConnection(conn);

      // Set selected folders from existing connection
      if (conn) {
        if (conn.meetings_folder_id && conn.meetings_folder_name) {
          setSelectedMeetingsFolder({
            id: conn.meetings_folder_id,
            name: conn.meetings_folder_name
          });
        }
        if (conn.strategy_folder_id && conn.strategy_folder_name) {
          setSelectedStrategyFolder({
            id: conn.strategy_folder_id,
            name: conn.strategy_folder_name
          });
        }
      }

      setError('');
    } catch (err: any) {
      console.error('Failed to load Google Drive connection:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnection();

    // Set up real-time subscription to user_drive_connections table
    const channel = supabase
      .channel('drive-connection-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_drive_connections'
        },
        (payload) => {
          console.log('[GoogleDriveSettings] Connection changed, reloading...');
          loadConnection();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleConnect = () => {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setError('Google Drive integration is not configured. Please contact support.');
        return;
      }
      initiateGoogleDriveOAuth();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Drive? Your data sync will stop.')) {
      return;
    }

    try {
      setLoading(true);
      await disconnectDrive();
      setConnection(null);
      setSelectedMeetingsFolder(null);
      setSelectedStrategyFolder(null);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFolders = async () => {
    try {
      setLoadingFolders(true);
      setError('');
      const folderList = await listGoogleDriveFolders();
      setFolders(folderList);
      setShowFolderPicker(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load folders');
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleSaveFolders = async () => {
    if (!selectedMeetingsFolder && !selectedStrategyFolder) {
      setError('Please select at least one folder');
      return;
    }

    try {
      setSavingFolders(true);
      setError('');

      await updateFolderConfiguration({
        meetings_folder_id: selectedMeetingsFolder?.id || null,
        meetings_folder_name: selectedMeetingsFolder?.name || null,
        strategy_folder_id: selectedStrategyFolder?.id || null,
        strategy_folder_name: selectedStrategyFolder?.name || null
      });

      await loadConnection();
      setShowFolderPicker(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save folder configuration');
    } finally {
      setSavingFolders(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-gray-400">Loading Google Drive settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <HardDrive className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Google Drive Sync</h3>
          {connection && connection.is_active && (
            <span className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
              <CheckCircle className="w-3 h-3" />
              <span>Connected</span>
            </span>
          )}
          {connection && !connection.is_active && (
            <span className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full border border-red-500/30">
              <XCircle className="w-3 h-3" />
              <span>Disconnected</span>
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {!connection ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Connect your Google Drive to automatically sync and vectorize documents from your Meeting Recordings and Strategy Documents folders.
          </p>
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <HardDrive className="w-4 h-4" />
            <span>Connect Google Drive</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">Connected Account</p>
              <p className="text-white font-medium">{connection.google_account_email}</p>

              {connection.last_sync_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Last sync: {new Date(connection.last_sync_at).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Disconnect</span>
            </button>
          </div>

          <div className="border-t border-gray-600 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">Folder Configuration</h4>
              <button
                onClick={handleLoadFolders}
                disabled={loadingFolders}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors flex items-center space-x-1"
              >
                {loadingFolders ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <FolderOpen className="w-3 h-3" />
                    <span>Select Folders</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Meetings Folder</label>
                <div className="bg-gray-800 rounded px-3 py-2 text-sm">
                  {selectedMeetingsFolder ? (
                    <span className="text-white">{selectedMeetingsFolder.name}</span>
                  ) : (
                    <span className="text-gray-500">Not configured</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Strategy Documents Folder</label>
                <div className="bg-gray-800 rounded px-3 py-2 text-sm">
                  {selectedStrategyFolder ? (
                    <span className="text-white">{selectedStrategyFolder.name}</span>
                  ) : (
                    <span className="text-gray-500">Not configured</span>
                  )}
                </div>
              </div>
            </div>

            {connection.connection_status === 'token_expired' && (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">
                  Your connection has expired. Please reconnect Google Drive.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Folder Picker Modal */}
      {showFolderPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Select Folders</h3>
              <button
                onClick={() => setShowFolderPicker(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">
                    Meetings Folder
                  </label>
                  <select
                    value={selectedMeetingsFolder?.id || ''}
                    onChange={(e) => {
                      const folder = folders.find(f => f.id === e.target.value);
                      setSelectedMeetingsFolder(folder || null);
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Select a folder --</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Folder containing your meeting recordings and notes
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">
                    Strategy Documents Folder
                  </label>
                  <select
                    value={selectedStrategyFolder?.id || ''}
                    onChange={(e) => {
                      const folder = folders.find(f => f.id === e.target.value);
                      setSelectedStrategyFolder(folder || null);
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Select a folder --</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Folder containing your strategy documents and plans
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowFolderPicker(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFolders}
                disabled={savingFolders || (!selectedMeetingsFolder && !selectedStrategyFolder)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center space-x-2"
              >
                {savingFolders ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Save Configuration</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
