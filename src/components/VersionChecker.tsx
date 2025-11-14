import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const CURRENT_VERSION = '1.0.0';
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000;

export const VersionChecker: React.FC = () => {
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkVersion = async () => {
    try {
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

        if (serverVersion && serverVersion !== CURRENT_VERSION) {
          console.log(`[Version] New version available: ${serverVersion} (current: ${CURRENT_VERSION})`);
          setNewVersionAvailable(true);
        }
      }
    } catch (error) {
      console.error('[Version] Check failed:', error);
    }
  };

  useEffect(() => {
    checkVersion();

    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    const handleSWUpdate = () => {
      console.log('[Version] Service worker update detected');
      setNewVersionAvailable(true);
    };

    window.addEventListener('sw-update-available', handleSWUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        console.log('[Version] Activating new service worker');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        window.location.reload();
      }
    } else {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      window.location.reload();
    }
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
