import React, { useEffect, useState } from 'react';
import { Mail, CheckCircle, XCircle, Loader } from 'lucide-react';
import { handleGmailCallback } from '../lib/gmail-oauth';

export const GmailCallback: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const errorParam = params.get('error');

        if (errorParam) {
          throw new Error(`OAuth error: ${errorParam}`);
        }

        if (!code || !state) {
          throw new Error('Missing required OAuth parameters');
        }

        const result = await handleGmailCallback(code, state);

        setEmail(result.email);
        setStatus('success');

        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (err: any) {
        console.error('Gmail callback error:', err);
        let errorMessage = err.message || 'Failed to connect Gmail account';

        if (errorMessage.includes('Missing Google OAuth configuration')) {
          errorMessage = 'Gmail integration is not fully configured on the server. Please ensure GOOGLE_CLIENT_SECRET and GMAIL_REDIRECT_URI are set in Supabase Edge Functions. See GMAIL_SETUP.md for details.';
        } else if (errorMessage.includes('Failed to exchange code')) {
          errorMessage = 'Failed to complete OAuth flow. Please check that your Google OAuth credentials are configured correctly.';
        }

        setError(errorMessage);
        setStatus('error');
      }
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl p-8 max-w-md w-full">
        <div className="text-center space-y-6">
          {status === 'processing' && (
            <>
              <div className="flex justify-center">
                <div className="relative">
                  <Loader className="w-16 h-16 text-blue-500 animate-spin" />
                  <Mail className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Connecting Gmail
                </h2>
                <p className="text-gray-400">
                  Processing your authorization...
                </p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                  <CheckCircle className="w-16 h-16 text-green-500 relative" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Gmail Connected!
                </h2>
                <p className="text-gray-400">
                  Successfully connected{' '}
                  <span className="text-white font-medium">{email}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Redirecting you back to Astra...
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Connection Failed
                </h2>
                <p className="text-gray-400 mb-4">{error}</p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Return to Astra
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
