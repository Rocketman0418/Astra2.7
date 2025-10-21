import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GmailAuthData } from '../lib/gmail-oauth';

const SYNC_WEBHOOK_URL = import.meta.env.VITE_N8N_GMAIL_SYNC_WEBHOOK;

interface SyncResult {
  success: boolean;
  metrics?: {
    emails_processed: number;
    emails_stored: number;
    sync_duration_ms: number;
  };
  error?: string;
}

export interface GmailSyncState {
  isConnected: boolean;
  gmailAuth: GmailAuthData | null;
  emailCount: number;
  lastSyncDate: Date | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
}

export const useGmailSync = () => {
  const [state, setState] = useState<GmailSyncState>({
    isConnected: false,
    gmailAuth: null,
    emailCount: 0,
    lastSyncDate: null,
    loading: true,
    syncing: false,
    error: null
  });

  const loadSyncState = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const { data: gmailAuth } = await supabase
        .from('gmail_auth')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .maybeSingle();

      const { count } = await supabase
        .from('company_emails')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      const { data: lastEmail } = await supabase
        .from('company_emails')
        .select('created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setState({
        isConnected: !!gmailAuth,
        gmailAuth: gmailAuth || null,
        emailCount: count || 0,
        lastSyncDate: lastEmail ? new Date(lastEmail.created_at) : null,
        loading: false,
        syncing: false,
        error: null
      });
    } catch (err: any) {
      console.error('[useGmailSync] Error loading state:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load Gmail sync state'
      }));
    }
  };

  const triggerSync = async (): Promise<SyncResult> => {
    if (!SYNC_WEBHOOK_URL) {
      const error = 'Gmail sync webhook URL is not configured';
      setState(prev => ({ ...prev, error }));
      return { success: false, error };
    }

    try {
      setState(prev => ({ ...prev, syncing: true, error: null }));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log('[useGmailSync] Triggering sync for user:', session.user.id);

      const response = await fetch(SYNC_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: session.user.id,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sync failed: ${errorText}`);
      }

      const result = await response.json();
      console.log('[useGmailSync] Sync result:', result);

      await loadSyncState();

      setState(prev => ({ ...prev, syncing: false }));

      return {
        success: true,
        metrics: result.metrics
      };
    } catch (err: any) {
      console.error('[useGmailSync] Sync error:', err);
      const errorMessage = err.message || 'Failed to sync emails';

      setState(prev => ({
        ...prev,
        syncing: false,
        error: errorMessage
      }));

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  useEffect(() => {
    loadSyncState();
  }, []);

  return {
    ...state,
    triggerSync,
    refreshState: loadSyncState,
    clearError
  };
};
