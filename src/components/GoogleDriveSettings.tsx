import React, { useState, useEffect } from 'react';
import { HardDrive, CheckCircle, XCircle, Trash2, FolderOpen, RefreshCw, Info, FileText, CreditCard as Edit, Search } from 'lucide-react';
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
  const [showMeetingsBestPractices, setShowMeetingsBestPractices] = useState(false);
  const [showStrategyBestPractices, setShowStrategyBestPractices] = useState(false);
  const [showFinancialBestPractices, setShowFinancialBestPractices] = useState(false);
  const [syncedDocuments, setSyncedDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showAllDocumentsModal, setShowAllDocumentsModal] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [strategySearchTerm, setStrategySearchTerm] = useState('');
  const [meetingsSearchTerm, setMeetingsSearchTerm] = useState('');
  const [financialSearchTerm, setFinancialSearchTerm] = useState('');
  const [teamConnection, setTeamConnection] = useState<GoogleDriveConnection | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [connectedAdminName, setConnectedAdminName] = useState<string>('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<'all' | 'strategy' | 'meetings' | 'financial'>('all');
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');

  // Temporary state for folder selection
  const [selectedMeetingsFolder, setSelectedMeetingsFolder] = useState<FolderInfo | null>(null);
  const [selectedStrategyFolder, setSelectedStrategyFolder] = useState<FolderInfo | null>(null);
  const [selectedFinancialFolder, setSelectedFinancialFolder] = useState<FolderInfo | null>(null);

  const loadSyncedDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('team_id', user.user_metadata?.team_id)
        .eq('source_type', 'google_drive')
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;
      setSyncedDocuments(documents || []);
    } catch (err: any) {
      console.error('Failed to load synced documents:', err);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadConnection = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAdmin(user.user_metadata?.role === 'admin');
        setCurrentUserId(user.id);

        // Check if team already has a connection (from any user)
        const teamId = user.user_metadata?.team_id;
        if (teamId) {
          const { data: existingTeamConnection, error: teamConnError } = await supabase
            .from('user_drive_connections')
            .select(`
              *,
              users!user_drive_connections_user_id_fkey(
                id,
                name,
                email
              )
            `)
            .eq('team_id', teamId)
            .maybeSingle();

          if (!teamConnError && existingTeamConnection) {
            setTeamConnection(existingTeamConnection as any);
            // Get the connected admin's name
            const adminUser = (existingTeamConnection as any).users;
            const adminName = adminUser?.name || adminUser?.email?.split('@')[0] || 'Team Admin';
            setConnectedAdminName(adminName);
          }
        }
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
        if (conn.financial_folder_id && conn.financial_folder_name) {
          setSelectedFinancialFolder({
            id: conn.financial_folder_id,
            name: conn.financial_folder_name
          });
        }

        // Load synced documents if connected
        if (conn.is_active) {
          loadSyncedDocuments();
        }
      } else if (teamConnection && teamConnection.is_active) {
        // Also load documents if team has a connection but user doesn't
        loadSyncedDocuments();
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

    // Also subscribe to documents table for synced documents updates
    const docsChannel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        (payload) => {
          console.log('[GoogleDriveSettings] Documents changed, reloading...');
          loadSyncedDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(docsChannel);
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
    if (!confirm('Are you sure you want to disconnect Google Drive? Your data sync will stop. Any team admin will be able to reconnect.')) {
      return;
    }

    try {
      setLoading(true);
      await disconnectDrive();
      setConnection(null);
      setTeamConnection(null);
      setSelectedMeetingsFolder(null);
      setSelectedStrategyFolder(null);
      setSelectedFinancialFolder(null);
      setConnectedAdminName('');
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
      setShowSetupGuide(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load folders');
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleContinueFromGuide = () => {
    setShowSetupGuide(false);
    setShowFolderPicker(true);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document? This will remove it from Astra Intelligence.')) {
      return;
    }

    try {
      setDeletingDocId(docId);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find the document to get its title and folder_type
      const doc = syncedDocuments.find(d => d.id === docId);
      if (!doc) throw new Error('Document not found');

      // Delete from the appropriate document_chunks table based on folder_type
      const chunksTable = doc.folder_type === 'strategy'
        ? 'document_chunks_strategy'
        : 'document_chunks_meetings';

      const { error: chunksError } = await supabase
        .from(chunksTable)
        .delete()
        .eq('team_id', user.user_metadata?.team_id)
        .eq('title', doc.title);

      if (chunksError) {
        console.error(`Failed to delete chunks from ${chunksTable}:`, chunksError);
        throw new Error(`Failed to delete document chunks: ${chunksError.message}`);
      }

      // Delete from documents table
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);

      if (deleteError) throw deleteError;

      await loadSyncedDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleSaveFolders = async () => {
    if (!selectedMeetingsFolder && !selectedStrategyFolder && !selectedFinancialFolder) {
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
        strategy_folder_name: selectedStrategyFolder?.name || null,
        financial_folder_id: selectedFinancialFolder?.id || null,
        financial_folder_name: selectedFinancialFolder?.name || null
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
          {teamConnection ? (
            // Team already has a connection
            teamConnection.user_id !== currentUserId ? (
              // Connection managed by another user
              <>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium mb-1">
                        {isAdmin ? 'Team Data Sync Already Configured' : 'Team Connected to Google Drive'}
                      </h4>
                      <p className="text-sm text-gray-300 mb-2">
                        Your team's Google Drive sync is {isAdmin ? 'already set up and being' : ''} managed by{' '}
                        <span className="font-semibold text-green-300">
                          {connectedAdminName}
                        </span>.
                      </p>
                      {isAdmin ? (
                        <p className="text-xs text-gray-400">
                          Only one team member can manage the Google Drive connection to avoid conflicts. If you need to change who manages this, {connectedAdminName} must disconnect first.
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">
                          Your team's documents are being synchronized automatically. Contact {connectedAdminName} if you have questions about the sync configuration.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Show folder configuration and sync info */}
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Current Configuration</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Connected Account</label>
                      <div className="bg-gray-800 rounded px-3 py-2 text-sm">
                        <span className="text-white">{teamConnection.google_account_email || 'Connected'}</span>
                      </div>
                    </div>
                    {teamConnection.last_sync_at && (
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Last Sync</label>
                        <div className="bg-gray-800 rounded px-3 py-2 text-sm">
                          <span className="text-white">{new Date(teamConnection.last_sync_at).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    {teamConnection.strategy_folder_name && (
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Strategy Documents Folder</label>
                        <div className="bg-gray-800 rounded px-3 py-2 text-sm">
                          <span className="text-white">{teamConnection.strategy_folder_name}</span>
                        </div>
                      </div>
                    )}
                    {teamConnection.meetings_folder_name && (
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Meetings Folder</label>
                        <div className="bg-gray-800 rounded px-3 py-2 text-sm">
                          <span className="text-white">{teamConnection.meetings_folder_name}</span>
                        </div>
                      </div>
                    )}
                    {teamConnection.financial_folder_name && (
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Financial Documents Folder</label>
                        <div className="bg-gray-800 rounded px-3 py-2 text-sm">
                          <span className="text-white">{teamConnection.financial_folder_name}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Synced Documents Summary */}
                  {teamConnection.is_active && (
                    <div className="mt-4 border-t border-gray-600 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span>Synced Documents</span>
                        </h4>
                        <button
                          onClick={loadSyncedDocuments}
                          disabled={loadingDocuments}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Refresh"
                        >
                          <RefreshCw className={`w-4 h-4 ${loadingDocuments ? 'animate-spin' : ''}`} />
                        </button>
                      </div>

                      {loadingDocuments ? (
                        <div className="flex items-center space-x-2 text-gray-400 text-sm">
                          <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                          <span>Loading documents...</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-gray-800/50 rounded p-3 border border-gray-700">
                              <p className="text-gray-400 text-xs mb-1">Total Documents</p>
                              <p className="text-white font-semibold text-lg">{syncedDocuments.length}</p>
                            </div>
                            <div className="bg-gray-800/50 rounded p-3 border border-gray-700">
                              <p className="text-gray-400 text-xs mb-1">By Type</p>
                              <div className="text-xs space-y-0.5">
                                <p className="text-white">
                                  Meetings: <span className="font-semibold">{syncedDocuments.filter(d => d.folder_type === 'meetings').length}</span>
                                </p>
                                <p className="text-white">
                                  Strategy: <span className="font-semibold">{syncedDocuments.filter(d => d.folder_type === 'strategy').length}</span>
                                </p>
                                <p className="text-white">
                                  Financial: <span className="font-semibold">{syncedDocuments.filter(d => d.folder_type === 'financial').length}</span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {syncedDocuments.length > 0 && (
                            <>
                              <div className="bg-gray-800/50 rounded p-3 border border-gray-700 max-h-40 overflow-y-auto">
                                <p className="text-gray-400 text-xs mb-2">Recent Documents</p>
                                <div className="space-y-1.5">
                                  {syncedDocuments.slice(0, 5).map((doc) => (
                                    <div key={doc.id} className="flex items-start space-x-2">
                                      <FileText className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-white truncate">{doc.title}</p>
                                        <p className="text-xs text-gray-500">
                                          {doc.folder_type} • {new Date(doc.created_at).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={() => setShowAllDocumentsModal(true)}
                                className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors flex items-center justify-center space-x-2"
                              >
                                <Edit className="w-3 h-3" />
                                <span>View All Documents</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null
          ) : !isAdmin ? (
            // User is not an admin and no connection exists
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-medium mb-1">Admin Access Required</h4>
                  <p className="text-sm text-gray-300">
                    Only team administrators can connect Google Drive. Please contact your team admin to set up data sync.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Admin user, no existing connection - show connect button
            <>
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
            </>
          )}
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
            {isAdmin && (
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Disconnect</span>
              </button>
            )}
          </div>

          <div className="border-t border-gray-600 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">Folder Configuration</h4>
              {isAdmin && (
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
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Strategy Documents Folder</label>
                <div className="bg-gray-800 rounded px-3 py-2 text-sm">
                  {selectedStrategyFolder ? (
                    <span className="text-white">{selectedStrategyFolder.name}</span>
                  ) : (
                    <span className="text-gray-500">Not configured</span>
                  )}
                </div>

                {/* Strategy Best Practices */}
                <div className="mt-2">
                  <button
                    onClick={() => setShowStrategyBestPractices(!showStrategyBestPractices)}
                    className="flex items-center space-x-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Info className="w-3 h-3" />
                    <span>Strategy Documents Best Practices: How to optimize for Astra Intelligence</span>
                  </button>

                  {showStrategyBestPractices && (
                    <div className="mt-2 text-xs text-gray-300 bg-gray-800/50 rounded p-3 border border-blue-500/20">
                      <p className="font-semibold text-blue-300 mb-2">Follow these best practices to get the best AI insights on your Strategy data:</p>
                      <ol className="list-decimal ml-4 space-y-1.5">
                        <li>
                          <span className="font-medium">Astra loves documents</span> such as your Mission, Core Values, Goals, EOS VTO, SWOT, etc. to help keep you aligned. Timely documents such as Marketing Plans, Market Research, Revenue Plan, etc. can also be added as you go.
                        </li>
                        <li>
                          <span className="font-medium">Evergreen documents:</span> If you update a Strategy document with the same name as an older document, Astra will treat the newest version as the source of truth, but still be able to reference the older version if needed.
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Meetings Folder</label>
                <div className="bg-gray-800 rounded px-3 py-2 text-sm">
                  {selectedMeetingsFolder ? (
                    <span className="text-white">{selectedMeetingsFolder.name}</span>
                  ) : (
                    <span className="text-gray-500">Not configured</span>
                  )}
                </div>

                {/* Meetings Best Practices */}
                <div className="mt-2">
                  <button
                    onClick={() => setShowMeetingsBestPractices(!showMeetingsBestPractices)}
                    className="flex items-center space-x-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Info className="w-3 h-3" />
                    <span>Meetings Folder Best Practices: How to optimize for Astra Intelligence</span>
                  </button>

                  {showMeetingsBestPractices && (
                    <div className="mt-2 text-xs text-gray-300 bg-gray-800/50 rounded p-3 border border-blue-500/20">
                      <p className="font-semibold text-blue-300 mb-2">Follow these best practices to get the best AI insights on your Meetings data:</p>
                      <ol className="list-decimal ml-4 space-y-1.5">
                        <li>
                          <span className="font-medium">Ensure meeting documents are in Google Docs format</span> (PDF, txt or other files types are not yet supported). Note: You can setup your Google Drive to automatically convert uploaded files to Google Doc format in settings.
                        </li>
                        <li>
                          <span className="font-medium">Summaries are good, Transcripts are much better.</span> For best results, include full meeting transcripts, not just summaries (both is also ok). If using Google Meet, you can enable auto transcriptions and syncing to your Google Drive in the user settings. Other programs may offer this as well.
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Financial Documents Folder</label>
                <div className="bg-gray-800 rounded px-3 py-2 text-sm">
                  {selectedFinancialFolder ? (
                    <span className="text-white">{selectedFinancialFolder.name}</span>
                  ) : (
                    <span className="text-gray-500">Not configured</span>
                  )}
                </div>

                {/* Financial Best Practices */}
                <div className="mt-2">
                  <button
                    onClick={() => setShowFinancialBestPractices(!showFinancialBestPractices)}
                    className="flex items-center space-x-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Info className="w-3 h-3" />
                    <span>Financial Documents Best Practices: How to optimize for Astra Intelligence</span>
                  </button>

                  {showFinancialBestPractices && (
                    <div className="mt-2 text-xs text-gray-300 bg-gray-800/50 rounded p-3 border border-blue-500/20">
                      <p className="font-semibold text-blue-300 mb-2">Follow these best practices to get the best AI insights on your Financial data:</p>
                      <ol className="list-decimal ml-4 space-y-1.5">
                        <li>
                          <span className="font-medium">Astra can understand your P&L, Balance Sheet, Transaction Statements, Cash Flow, etc.</span> as well as Budgets, Equity, Tax, AR and AP documents.
                        </li>
                        <li>
                          <span className="font-medium">Only Google Sheets files are accepted</span> for financial documents (other file types are not yet supported). You can configure your Google Drive settings to automatically convert uploaded Excel, CSV, and other spreadsheet files to Google Sheets format.
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Controls Info for Members */}
            {!isAdmin && (
              <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-300 text-xs">
                    Only team administrators can connect, disconnect, or modify folder settings. Contact an admin if changes are needed.
                  </p>
                </div>
              </div>
            )}

            {/* Synced Documents Summary - All Team Members */}
            {connection.is_active && (
              <div className="mt-4 border-t border-gray-600 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Synced Documents</span>
                  </h4>
                  <button
                    onClick={loadSyncedDocuments}
                    disabled={loadingDocuments}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingDocuments ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loadingDocuments ? (
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <span>Loading documents...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-800/50 rounded p-3 border border-gray-700">
                        <p className="text-gray-400 text-xs mb-1">Total Documents</p>
                        <p className="text-white font-semibold text-lg">{syncedDocuments.length}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded p-3 border border-gray-700">
                        <p className="text-gray-400 text-xs mb-1">By Type</p>
                        <div className="text-xs space-y-0.5">
                          <p className="text-white">
                            Meetings: <span className="font-semibold">{syncedDocuments.filter(d => d.folder_type === 'meetings').length}</span>
                          </p>
                          <p className="text-white">
                            Strategy: <span className="font-semibold">{syncedDocuments.filter(d => d.folder_type === 'strategy').length}</span>
                          </p>
                          <p className="text-white">
                            Financial: <span className="font-semibold">{syncedDocuments.filter(d => d.folder_type === 'financial').length}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {syncedDocuments.length > 0 && (
                      <>
                        <div className="bg-gray-800/50 rounded p-3 border border-gray-700 max-h-40 overflow-y-auto">
                          <p className="text-gray-400 text-xs mb-2">Recent Documents</p>
                          <div className="space-y-1.5">
                            {syncedDocuments.slice(0, 5).map((doc) => (
                              <div key={doc.id} className="flex items-start space-x-2">
                                <FileText className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-white truncate">{doc.title}</p>
                                  <p className="text-xs text-gray-500">
                                    {doc.folder_type} • {new Date(doc.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => setShowAllDocumentsModal(true)}
                          className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors flex items-center justify-center space-x-2"
                        >
                          <Edit className="w-3 h-3" />
                          <span>{isAdmin ? 'View and Edit All Documents' : 'View All Documents'}</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

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

      {/* Setup Guide Modal */}
      {showSetupGuide && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Google Drive Folder Setup Guide</h3>
              <button
                onClick={() => setShowSetupGuide(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-gray-300 mb-6">
                Before selecting your folders, review these best practices to optimize your AI experience with Astra Intelligence.
              </p>

              <div className="space-y-6">
                {/* Strategy Documents Best Practices */}
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center space-x-2 mb-3">
                    <Info className="w-5 h-5 text-blue-400" />
                    <h4 className="text-md font-semibold text-white">Strategy Documents Folder</h4>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    This folder should contain your key strategic documents that help Astra understand your business direction and goals.
                  </p>
                  <div className="bg-gray-800/50 rounded p-3 border border-blue-500/20">
                    <p className="font-semibold text-blue-300 text-sm mb-2">Best Practices:</p>
                    <ol className="list-decimal ml-4 space-y-2 text-sm text-gray-300">
                      <li>
                        <span className="font-medium">Astra loves documents</span> such as your Mission, Core Values, Goals, EOS VTO, SWOT, etc. to help keep you aligned. Timely documents such as Marketing Plans, Market Research, Revenue Plan, etc. can also be added as you go.
                      </li>
                      <li>
                        <span className="font-medium">Evergreen documents:</span> If you update a Strategy document with the same name as an older document, Astra will treat the newest version as the source of truth, but still be able to reference the older version if needed.
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Meetings Best Practices */}
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center space-x-2 mb-3">
                    <Info className="w-5 h-5 text-blue-400" />
                    <h4 className="text-md font-semibold text-white">Meetings Folder</h4>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    This folder should contain your meeting notes, recordings, and transcripts for AI-powered insights.
                  </p>
                  <div className="bg-gray-800/50 rounded p-3 border border-blue-500/20">
                    <p className="font-semibold text-blue-300 text-sm mb-2">Best Practices:</p>
                    <ol className="list-decimal ml-4 space-y-2 text-sm text-gray-300">
                      <li>
                        <span className="font-medium">Ensure meeting documents are in Google Docs format</span> (PDF, txt or other files types are not yet supported). Note: You can setup your Google Drive to automatically convert uploaded files to Google Doc format in settings.
                      </li>
                      <li>
                        <span className="font-medium">Summaries are good, Transcripts are much better.</span> For best results, include full meeting transcripts, not just summaries (both is also ok). If using Google Meet, you can enable auto transcriptions and syncing to your Google Drive in the user settings. Other programs may offer this as well.
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Financial Documents Best Practices */}
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center space-x-2 mb-3">
                    <Info className="w-5 h-5 text-blue-400" />
                    <h4 className="text-md font-semibold text-white">Financial Documents Folder</h4>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    This folder should contain your financial documents like budgets, forecasts, and reports in Google Sheets format.
                  </p>
                  <div className="bg-gray-800/50 rounded p-3 border border-blue-500/20">
                    <p className="font-semibold text-blue-300 text-sm mb-2">Best Practices:</p>
                    <ol className="list-decimal ml-4 space-y-2 text-sm text-gray-300">
                      <li>
                        <span className="font-medium">Astra can understand your P&L, Balance Sheet, Transaction Statements, Cash Flow, etc.</span> as well as Budgets, Equity, Tax, AR and AP documents.
                      </li>
                      <li>
                        <span className="font-medium">Only Google Sheets files are accepted</span> for financial documents (other file types are not yet supported). You can configure your Google Drive settings to automatically convert uploaded Excel, CSV, and other spreadsheet files to Google Sheets format.
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowSetupGuide(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleContinueFromGuide}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center space-x-2"
              >
                <span>Continue to Folder Selection</span>
              </button>
            </div>
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
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-white mb-3 block">
                    Strategy Documents Folder
                  </label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search folders..."
                      value={strategySearchTerm}
                      onChange={(e) => setStrategySearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto bg-gray-700/30 border border-gray-600 rounded-lg">
                    <button
                      onClick={() => setSelectedStrategyFolder(null)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                        !selectedStrategyFolder
                          ? 'bg-blue-600/30 text-blue-200 border-l-4 border-blue-500 font-semibold'
                          : 'text-gray-400 hover:bg-gray-700/50'
                      }`}
                    >
                      <span>-- No folder selected --</span>
                      {!selectedStrategyFolder && <CheckCircle className="w-4 h-4 text-blue-400" />}
                    </button>
                    {folders
                      .filter(folder => folder.name.toLowerCase().includes(strategySearchTerm.toLowerCase()))
                      .map(folder => (
                        <button
                          key={folder.id}
                          onClick={() => setSelectedStrategyFolder(folder)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-t border-gray-600/50 flex items-center justify-between ${
                            selectedStrategyFolder?.id === folder.id
                              ? 'bg-blue-600/30 text-blue-200 border-l-4 border-blue-500 font-semibold'
                              : 'text-white hover:bg-gray-700/50'
                          }`}
                        >
                          <span className="flex items-center">
                            <FolderOpen className="w-4 h-4 inline mr-2" />
                            {folder.name}
                          </span>
                          {selectedStrategyFolder?.id === folder.id && <CheckCircle className="w-4 h-4 text-blue-400" />}
                        </button>
                      ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Folder containing your strategy documents and plans
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white mb-3 block">
                    Meetings Folder
                  </label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search folders..."
                      value={meetingsSearchTerm}
                      onChange={(e) => setMeetingsSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto bg-gray-700/30 border border-gray-600 rounded-lg">
                    <button
                      onClick={() => setSelectedMeetingsFolder(null)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                        !selectedMeetingsFolder
                          ? 'bg-blue-600/30 text-blue-200 border-l-4 border-blue-500 font-semibold'
                          : 'text-gray-400 hover:bg-gray-700/50'
                      }`}
                    >
                      <span>-- No folder selected --</span>
                      {!selectedMeetingsFolder && <CheckCircle className="w-4 h-4 text-blue-400" />}
                    </button>
                    {folders
                      .filter(folder => folder.name.toLowerCase().includes(meetingsSearchTerm.toLowerCase()))
                      .map(folder => (
                        <button
                          key={folder.id}
                          onClick={() => setSelectedMeetingsFolder(folder)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-t border-gray-600/50 flex items-center justify-between ${
                            selectedMeetingsFolder?.id === folder.id
                              ? 'bg-blue-600/30 text-blue-200 border-l-4 border-blue-500 font-semibold'
                              : 'text-white hover:bg-gray-700/50'
                          }`}
                        >
                          <span className="flex items-center">
                            <FolderOpen className="w-4 h-4 inline mr-2" />
                            {folder.name}
                          </span>
                          {selectedMeetingsFolder?.id === folder.id && <CheckCircle className="w-4 h-4 text-blue-400" />}
                        </button>
                      ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Folder containing your meeting recordings and notes
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white mb-3 block">
                    Financial Documents Folder
                  </label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search folders..."
                      value={financialSearchTerm}
                      onChange={(e) => setFinancialSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto bg-gray-700/30 border border-gray-600 rounded-lg">
                    <button
                      onClick={() => setSelectedFinancialFolder(null)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                        !selectedFinancialFolder
                          ? 'bg-blue-600/30 text-blue-200 border-l-4 border-blue-500 font-semibold'
                          : 'text-gray-400 hover:bg-gray-700/50'
                      }`}
                    >
                      <span>-- No folder selected --</span>
                      {!selectedFinancialFolder && <CheckCircle className="w-4 h-4 text-blue-400" />}
                    </button>
                    {folders
                      .filter(folder => folder.name.toLowerCase().includes(financialSearchTerm.toLowerCase()))
                      .map(folder => (
                        <button
                          key={folder.id}
                          onClick={() => setSelectedFinancialFolder(folder)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-t border-gray-600/50 flex items-center justify-between ${
                            selectedFinancialFolder?.id === folder.id
                              ? 'bg-blue-600/30 text-blue-200 border-l-4 border-blue-500 font-semibold'
                              : 'text-white hover:bg-gray-700/50'
                          }`}
                        >
                          <span className="flex items-center">
                            <FolderOpen className="w-4 h-4 inline mr-2" />
                            {folder.name}
                          </span>
                          {selectedFinancialFolder?.id === folder.id && <CheckCircle className="w-4 h-4 text-blue-400" />}
                        </button>
                      ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Folder containing your financial documents (Google Sheets only)
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowFolderPicker(false)}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFolders}
                disabled={savingFolders || (!selectedMeetingsFolder && !selectedStrategyFolder && !selectedFinancialFolder)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2 font-medium"
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

      {/* All Documents Modal */}
      {showAllDocumentsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">All Synced Documents</h3>
                <button
                  onClick={() => setShowAllDocumentsModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">Filter by Type</label>
                  <select
                    value={documentTypeFilter}
                    onChange={(e) => setDocumentTypeFilter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="strategy">Strategy</option>
                    <option value="meetings">Meetings</option>
                    <option value="financial">Financial</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">Search Documents</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by title..."
                      value={documentSearchTerm}
                      onChange={(e) => setDocumentSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-gray-700 text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {!isAdmin && (
                <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-300 text-xs">
                      You can view all synced documents here. Only team administrators can delete documents from Astra Intelligence.
                    </p>
                  </div>
                </div>
              )}

              {loadingDocuments ? (
                <div className="flex items-center justify-center space-x-2 text-gray-400 py-8">
                  <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <span>Loading documents...</span>
                </div>
              ) : syncedDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No synced documents found</p>
                </div>
              ) : (
                (() => {
                  // Apply filters
                  const filteredDocuments = syncedDocuments.filter(doc => {
                    // Type filter
                    if (documentTypeFilter !== 'all' && doc.folder_type !== documentTypeFilter) {
                      return false;
                    }
                    // Search filter
                    if (documentSearchTerm && !doc.title.toLowerCase().includes(documentSearchTerm.toLowerCase())) {
                      return false;
                    }
                    return true;
                  });

                  if (filteredDocuments.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No documents match your filters</p>
                        <button
                          onClick={() => {
                            setDocumentTypeFilter('all');
                            setDocumentSearchTerm('');
                          }}
                          className="mt-3 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Clear Filters
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {filteredDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-start space-x-3 bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                        >
                          <FileText className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white truncate mb-1">
                              {doc.title}
                            </h4>
                            <div className="flex items-center space-x-3 text-xs text-gray-400">
                              <span className="capitalize">{doc.folder_type}</span>
                              <span>•</span>
                              <span>{new Date(doc.created_at).toLocaleString()}</span>
                            </div>
                            {doc.source_url && (
                              <a
                                href={doc.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
                              >
                                View in Google Drive
                              </a>
                            )}
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              disabled={deletingDocId === doc.id}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded transition-colors flex items-center space-x-1"
                            >
                              {deletingDocId === doc.id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>Deleting...</span>
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-700 flex justify-between items-center">
              <p className="text-sm text-gray-400">
                {(() => {
                  const filteredCount = syncedDocuments.filter(doc => {
                    if (documentTypeFilter !== 'all' && doc.folder_type !== documentTypeFilter) return false;
                    if (documentSearchTerm && !doc.title.toLowerCase().includes(documentSearchTerm.toLowerCase())) return false;
                    return true;
                  }).length;

                  if (documentTypeFilter !== 'all' || documentSearchTerm) {
                    return `Showing ${filteredCount} of ${syncedDocuments.length} document${syncedDocuments.length !== 1 ? 's' : ''}`;
                  }
                  return `Total: ${syncedDocuments.length} document${syncedDocuments.length !== 1 ? 's' : ''}`;
                })()}
              </p>
              <button
                onClick={() => {
                  setShowAllDocumentsModal(false);
                  setDocumentTypeFilter('all');
                  setDocumentSearchTerm('');
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
