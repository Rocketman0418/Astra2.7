import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import {
  initiateGmailOAuth,
  getGmailAuth,
  disconnectGmail,
  isGmailTokenExpired,
  refreshGmailToken,
  GmailAuthData
} from '../lib/gmail-oauth';

export const GmailSettings: React.FC = () => {
  const [gmailAuth, setGmailAuth] = useState<GmailAuthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const loadGmailAuth = async () => {
    try {
      setLoading(true);
      const auth = await getGmailAuth();
      setGmailAuth(auth);
      setError('');
    } catch (err: any) {
      console.error('Failed to load Gmail auth:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGmailAuth();
  }, []);

  const handleConnect = () => {
    try {
      initiateGmailOAuth();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Gmail account?')) {
      return;
    }

    try {
      setLoading(true);
      await disconnectGmail();
      setGmailAuth(null);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshGmailToken();
      await loadGmailAuth();
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const isExpired = gmailAuth ? isGmailTokenExpired(gmailAuth.expires_at) : false;

  if (loading && !gmailAuth) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Mail className="w-6 h-6 text-blue-500" />
        <h3 className="text-lg font-semibold text-white">Gmail Workspace Integration</h3>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!gmailAuth ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="space-y-4">
            <p className="text-gray-300">
              Connect your Gmail Workspace account to allow Astra to access your emails and help you manage your inbox.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Astra will be able to:</p>
              <ul className="text-sm text-gray-400 space-y-1 ml-4">
                <li>• Read your emails</li>
                <li>• Compose and send emails on your behalf</li>
                <li>• Manage labels and categories</li>
                <li>• Search through your inbox</li>
              </ul>
            </div>
            <button
              onClick={handleConnect}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Mail className="w-5 h-5" />
              <span>Connect Gmail Account</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${gmailAuth.is_active && !isExpired ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                  {gmailAuth.is_active && !isExpired ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{gmailAuth.email}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {gmailAuth.is_active && !isExpired
                      ? 'Connected and active'
                      : isExpired
                      ? 'Token expired - refresh needed'
                      : 'Connection inactive'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Token expires: {new Date(gmailAuth.expires_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isExpired && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh Token'}</span>
                </button>
              )}
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Privacy Note:</strong> Your Gmail credentials are stored securely and are only used to perform actions you explicitly request through Astra.
        </p>
      </div>
    </div>
  );
};
