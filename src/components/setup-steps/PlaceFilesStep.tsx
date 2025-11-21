import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Upload, ExternalLink } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getGoogleDriveConnection } from '../../lib/google-drive-oauth';

interface PlaceFilesStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
}

interface FolderInfo {
  type: string;
  count: number;
  folderIds: string[];
}

export const PlaceFilesStep: React.FC<PlaceFilesStepProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [documentCounts, setDocumentCounts] = useState<{ meetings: number; strategy: number; financial: number }>({
    meetings: 0,
    strategy: 0,
    financial: 0
  });
  const [connectedFolders, setConnectedFolders] = useState<FolderInfo[]>([]);

  useEffect(() => {
    checkDocuments();
  }, [user]);

  const checkDocuments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const teamId = user.user_metadata?.team_id;

      // Get connected folders
      const connection = await getGoogleDriveConnection();
      const folders: FolderInfo[] = [];

      if (connection) {
        const meetingIds = connection.selected_meetings_folder_ids || [];
        if (Array.isArray(meetingIds) && meetingIds.length > 0) {
          folders.push({ type: 'meetings', count: meetingIds.length, folderIds: meetingIds });
        }

        const strategyIds = connection.selected_strategy_folder_ids || [];
        if (Array.isArray(strategyIds) && strategyIds.length > 0) {
          folders.push({ type: 'strategy', count: strategyIds.length, folderIds: strategyIds });
        }

        const financialIds = connection.selected_financial_folder_ids || [];
        if (Array.isArray(financialIds) && financialIds.length > 0) {
          folders.push({ type: 'financial', count: financialIds.length, folderIds: financialIds });
        }
      }

      setConnectedFolders(folders);

      // Check for documents in database
      if (teamId) {
        const { data: docs, error } = await supabase
          .from('documents')
          .select('folder_type')
          .eq('team_id', teamId);

        if (!error && docs && docs.length > 0) {
          setHasDocuments(true);

          // Count by folder type
          const counts = { meetings: 0, strategy: 0, financial: 0 };
          docs.forEach(doc => {
            if (doc.folder_type === 'meetings') counts.meetings++;
            if (doc.folder_type === 'strategy') counts.strategy++;
            if (doc.folder_type === 'financial') counts.financial++;
          });

          setDocumentCounts(counts);
        }
      }
    } catch (error) {
      console.error('Error checking documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFolderTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      meetings: '📊',
      strategy: '🎯',
      financial: '💰'
    };
    return icons[type] || '📁';
  };

  const getFolderTypeDisplay = (type: string): string => {
    const displays: Record<string, string> = {
      meetings: 'Meetings',
      strategy: 'Strategy',
      financial: 'Financial'
    };
    return displays[type] || type;
  };

  const openGoogleDriveFolder = (folderId: string) => {
    window.open(`https://drive.google.com/drive/folders/${folderId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/20 mb-4">
            <FileText className="w-8 h-8 text-green-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Place Your Files</h2>
          <p className="text-gray-300">Checking for documents in your folders...</p>
        </div>
      </div>
    );
  }

  if (hasDocuments) {
    const totalDocs = documentCounts.meetings + documentCounts.strategy + documentCounts.financial;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/20 mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Files Successfully Placed!</h2>
          <p className="text-gray-300">
            Great! You have {totalDocs} document{totalDocs !== 1 ? 's' : ''} in your connected folders.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-400" />
            Document Summary
          </h3>
          <div className="space-y-3">
            {documentCounts.meetings > 0 && (
              <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="text-white font-medium">Meetings</p>
                    <p className="text-xs text-gray-400">{documentCounts.meetings} document{documentCounts.meetings !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            )}
            {documentCounts.strategy > 0 && (
              <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="text-white font-medium">Strategy</p>
                    <p className="text-xs text-gray-400">{documentCounts.strategy} document{documentCounts.strategy !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            )}
            {documentCounts.financial > 0 && (
              <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="text-white font-medium">Financial</p>
                    <p className="text-xs text-gray-400">{documentCounts.financial} document{documentCounts.financial !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <p className="text-sm text-green-300">
            <span className="font-medium">✅ All set!</span> Your files are in place and ready to be synced with Astra.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={onComplete}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]"
          >
            Next: Sync Your Data →
          </button>
        </div>
      </div>
    );
  }

  // No documents found - show instructions
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/20 mb-4">
          <Upload className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Place Your Files</h2>
        <p className="text-gray-300">
          Add documents to your connected folders so Astra can analyze them
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Your Connected Folders:
        </h3>
        <div className="space-y-3">
          {connectedFolders.length > 0 ? (
            connectedFolders.map((folder) => (
              <div key={folder.type} className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFolderTypeIcon(folder.type)}</span>
                    <div>
                      <p className="text-white font-medium">{getFolderTypeDisplay(folder.type)}</p>
                      <p className="text-xs text-gray-400">{folder.count} folder{folder.count > 1 ? 's' : ''} connected</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openGoogleDriveFolder(folder.folderIds[0])}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No folders connected. Please go back to Step 3.</p>
          )}
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 space-y-4">
        <h4 className="text-white font-medium flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          How to Add Files:
        </h4>
        <ol className="space-y-2 text-sm text-blue-300 list-decimal list-inside">
          <li>Click "Open in Drive" to open your folder in Google Drive</li>
          <li>Upload or move your documents into the folder</li>
          <li>Supported formats: PDFs, Word docs, Google Docs, text files</li>
          <li>Once files are added, click "Continue" to proceed</li>
        </ol>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]"
        >
          Continue to Sync Data →
        </button>
      </div>
    </div>
  );
};
