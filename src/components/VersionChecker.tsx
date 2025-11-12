import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const CURRENT_VERSION = '1.0.0';
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

export const VersionChecker: React.FC = () => {
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkVersion = async () => {
    try {
      // Add a cache-busting parameter to ensure we get the latest version
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const serverVersion = data.version;

        // Compare versions
        if (serverVersion && serverVersion !== CURRENT_VERSION) {
          console.log(`New version available: ${serverVersion} (current: ${CURRENT_VERSION})`);
          setNewVersionAvailable(true);
        }
      }
    } catch (error) {
      // Silently fail - don't bother the user if version check fails
      console.error('Version check failed:', error);
    }
  };

  useEffect(() => {
    // Check version on mount
    checkVersion();

    // Set up periodic version checks
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);

    // Clear all caches and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // Force a hard reload
    window.location.reload();
  };

  if (!newVersionAvailable) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg shadow-2xl p-4 flex items-center gap-4 max-w-md">
        <AlertCircle className="w-6 h-6 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm">New Version Available!</p>
          <p className="text-xs opacity-90">A newer version of AI Rocket is ready.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Updating...' : 'Update Now'}
        </button>
      </div>
    </div>
  );
};
