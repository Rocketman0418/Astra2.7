import React, { useState, useEffect } from 'react';
import { HardDrive, CheckCircle, AlertCircle } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';
import { initiateGoogleDriveOAuth, getGoogleDriveConnection } from '../../lib/google-drive-oauth';

interface ConnectDriveStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
}

export const ConnectDriveStep: React.FC<ConnectDriveStepProps> = ({ onComplete }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const connection = await getGoogleDriveConnection();
      if (connection?.is_active) {
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      initiateGoogleDriveOAuth();
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Google Drive');
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      // Auto-advance after short delay
      setTimeout(() => onComplete(), 1000);
    }
  }, [isConnected, onComplete]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/20 mb-4">
          <HardDrive className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Connect Your Google Drive
        </h2>
        <p className="text-gray-300">
          Astra needs access to your Google Drive to read your documents and provide intelligent insights
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          What Astra Can Access:
        </h3>
        <div className="space-y-3">
          {[
            'Read documents from folders you select',
            'Create new folders for organizing files',
            'Access file metadata (names, dates, structure)'
          ].map((item, index) => (
            <div key={index} className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
        <p className="text-sm text-green-300">
          <span className="font-medium">🔒 Your data is secure:</span> We only access folders you explicitly select. Your data is never shared with third parties.
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {isConnected ? (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-green-300 font-medium">Google Drive Connected!</p>
              <p className="text-sm text-green-400 mt-1">Moving to next step...</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all min-h-[44px] flex items-center space-x-2"
          >
            <HardDrive className="w-5 h-5" />
            <span>{isConnecting ? 'Connecting...' : 'Connect Google Drive'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
