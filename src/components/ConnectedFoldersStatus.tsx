import React, { useState, useEffect } from 'react';
import { Folder, CheckCircle, Loader2, FolderPlus, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ConnectedFoldersStatusProps {
  onConnectMore: () => void;
  onClose: () => void;
}

interface FolderInfo {
  type: 'strategy' | 'meetings' | 'financial' | 'projects';
  label: string;
  folderId: string | null;
  folderName: string | null;
  documentCount: number;
}

export const ConnectedFoldersStatus: React.FC<ConnectedFoldersStatusProps> = ({ onConnectMore, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFolderStatus();
  }, []);

  const loadFolderStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Get user's team_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      const teamId = userData?.team_id;
      if (!teamId) {
        setError('No team found');
        setLoading(false);
        return;
      }

      // Get drive connection info
      const { data: driveConnection, error: driveError } = await supabase
        .from('user_drive_connections')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle();

      if (driveError) throw driveError;

      // Get document counts by folder type
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('folder_type')
        .eq('team_id', teamId);

      if (docsError) throw docsError;

      // Count documents by type
      const docCounts = {
        strategy: documents?.filter(d => d.folder_type === 'strategy').length || 0,
        meetings: documents?.filter(d => d.folder_type === 'meetings').length || 0,
        financial: documents?.filter(d => d.folder_type === 'financial').length || 0,
        projects: documents?.filter(d => d.folder_type === 'projects').length || 0,
      };

      // Build folder info array
      const folderInfos: FolderInfo[] = [
        {
          type: 'strategy',
          label: 'Strategy',
          folderId: driveConnection?.strategy_folder_id || null,
          folderName: driveConnection?.strategy_folder_name || null,
          documentCount: docCounts.strategy
        },
        {
          type: 'meetings',
          label: 'Meetings',
          folderId: driveConnection?.meetings_folder_id || null,
          folderName: driveConnection?.meetings_folder_name || null,
          documentCount: docCounts.meetings
        },
        {
          type: 'financial',
          label: 'Financial',
          folderId: driveConnection?.financial_folder_id || null,
          folderName: driveConnection?.financial_folder_name || null,
          documentCount: docCounts.financial
        },
        {
          type: 'projects',
          label: 'Projects',
          folderId: driveConnection?.projects_folder_id || null,
          folderName: driveConnection?.projects_folder_name || null,
          documentCount: docCounts.projects
        }
      ];

      setFolders(folderInfos);
    } catch (err) {
      console.error('Error loading folder status:', err);
      setError('Failed to load folder information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading your connected folders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const connectedFolders = folders.filter(f => f.folderId);
  const unconnectedFolders = folders.filter(f => !f.folderId);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/20 mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Your Connected Folders</h2>
        <p className="text-gray-300">
          {connectedFolders.length} of 4 folder types connected
        </p>
      </div>

      {/* Connected Folders */}
      {connectedFolders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Connected Folders</h3>
          {connectedFolders.map((folder) => (
            <div
              key={folder.type}
              className="bg-gray-800/50 border border-green-700/50 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center flex-shrink-0">
                  <Folder className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{folder.label}</p>
                  <p className="text-sm text-gray-400">📁 {folder.folderName || 'Unnamed Folder'}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 text-green-400">
                  <FileText className="w-4 h-4" />
                  <span className="font-semibold">{folder.documentCount}</span>
                </div>
                <p className="text-xs text-gray-400">documents</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unconnected Folders */}
      {unconnectedFolders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Not Yet Connected</h3>
          {unconnectedFolders.map((folder) => (
            <div
              key={folder.type}
              className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 flex items-center justify-between opacity-60"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Folder className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-gray-300 font-medium">{folder.label}</p>
                  <p className="text-sm text-gray-500">Not connected</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3 pt-4">
        {unconnectedFolders.length > 0 && (
          <button
            onClick={onConnectMore}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
          >
            <FolderPlus className="w-5 h-5" />
            <span>Connect More Folders</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          Done
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <span className="font-medium">💡 Tip:</span> Add more documents to your connected folders to increase your Fuel level and unlock more features!
        </p>
      </div>
    </div>
  );
};
