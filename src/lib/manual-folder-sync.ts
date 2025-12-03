import { supabase } from './supabase';

export interface ManualSyncPayload {
  team_id: string;
  user_id: string;
  folder_id: string;
  folder_type: 'strategy' | 'meetings' | 'financial';
  access_token: string;
}

export interface ManualSyncResponse {
  success: boolean;
  message: string;
  team_id: string;
  folder_id: string;
  folder_type: string;
  files_sent?: number;
  files_failed?: number;
  completed_at?: string;
  has_files?: boolean;
  files_found?: number;
}

const MANUAL_SYNC_WEBHOOK_URL = 'https://healthrocket.app.n8n.cloud/webhook/manual-folder-sync';

/**
 * Calls the manual folder sync webhook for a single folder
 */
export async function triggerManualFolderSync(payload: ManualSyncPayload): Promise<ManualSyncResponse> {
  const response = await fetch(MANUAL_SYNC_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Manual sync failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Gets the current access token for a team, refreshing if necessary
 */
async function getValidAccessToken(teamId: string): Promise<string | null> {
  // Get the connection from user_drive_connections
  const { data: connection, error } = await supabase
    .from('user_drive_connections')
    .select('access_token, refresh_token, token_expires_at')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !connection) {
    console.error('Failed to get drive connection:', error);
    return null;
  }

  // Check if token is expired
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();
  const bufferMinutes = 5; // Refresh if expiring in 5 minutes
  const needsRefresh = expiresAt.getTime() - now.getTime() < bufferMinutes * 60 * 1000;

  if (needsRefresh) {
    // Call refresh token edge function
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      console.error('No auth session available');
      return null;
    }

    try {
      const refreshResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-drive-refresh-token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ team_id: teamId }),
        }
      );

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        return refreshData.access_token;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }

  return connection.access_token;
}

export interface SyncAllFoldersOptions {
  teamId: string;
  userId: string;
  folderTypes?: ('strategy' | 'meetings' | 'financial')[];
}

export interface SyncAllFoldersResult {
  success: boolean;
  results: {
    folderType: string;
    success: boolean;
    filesSent: number;
    filesFailed: number;
    error?: string;
  }[];
  totalFilesSent: number;
  totalFilesFailed: number;
}

/**
 * Syncs all configured folders for a team
 * Calls the webhook once per folder type
 */
export async function syncAllFolders(options: SyncAllFoldersOptions): Promise<SyncAllFoldersResult> {
  const { teamId, userId, folderTypes = ['strategy', 'meetings', 'financial'] } = options;

  // Get folder configuration from user_drive_connections
  // First try to get the user's own connection
  let { data: connection, error: connectionError } = await supabase
    .from('user_drive_connections')
    .select('strategy_folder_id, meetings_folder_id, financial_folder_id, projects_folder_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  // If user doesn't have a connection, try to get team connection
  if (!connection && !connectionError) {
    const result = await supabase
      .from('user_drive_connections')
      .select('strategy_folder_id, meetings_folder_id, financial_folder_id, projects_folder_id')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .maybeSingle();

    connection = result.data;
    connectionError = result.error;
  }

  if (connectionError || !connection) {
    console.error('Connection error:', connectionError);
    throw new Error('No active Google Drive connection found');
  }

  // Get valid access token
  const accessToken = await getValidAccessToken(teamId);
  if (!accessToken) {
    throw new Error('Failed to get valid access token');
  }

  const results: SyncAllFoldersResult['results'] = [];
  let totalFilesSent = 0;
  let totalFilesFailed = 0;

  // Sync each folder type
  for (const folderType of folderTypes) {
    const folderIdKey = `${folderType}_folder_id` as keyof typeof connection;
    const folderId = connection[folderIdKey];

    if (!folderId) {
      results.push({
        folderType,
        success: false,
        filesSent: 0,
        filesFailed: 0,
        error: 'Folder not configured',
      });
      continue;
    }

    try {
      const response = await triggerManualFolderSync({
        team_id: teamId,
        user_id: userId,
        folder_id: folderId as string,
        folder_type: folderType,
        access_token: accessToken,
      });

      results.push({
        folderType,
        success: response.success,
        filesSent: response.files_sent || 0,
        filesFailed: response.files_failed || 0,
      });

      totalFilesSent += response.files_sent || 0;
      totalFilesFailed += response.files_failed || 0;
    } catch (error) {
      console.error(`Failed to sync ${folderType} folder:`, error);
      results.push({
        folderType,
        success: false,
        filesSent: 0,
        filesFailed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    success: results.every(r => r.success),
    results,
    totalFilesSent,
    totalFilesFailed,
  };
}
