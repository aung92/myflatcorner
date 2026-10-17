import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

export function AppUpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleRegistration = (reg: ServiceWorkerRegistration) => {
      // Check if a service worker is already waiting to activate
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setUpdateAvailable(true);
      }

      // Listen for new service workers being installed
      reg.addEventListener('updatefound', () => {
        const installingWorker = reg.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(installingWorker);
              setUpdateAvailable(true);
            }
          });
        }
      });
    };

    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        handleRegistration(reg);
        // Periodically check for updates every 10 minutes
        const interval = setInterval(() => {
          reg.update().catch(err => console.debug('SW update check note:', err));
        }, 10 * 60 * 1000);
        return () => clearInterval(interval);
      }
    });

    // Custom event dispatch for forced updates or app updates
    const handleCustomUpdate = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('appUpdateAvailable', handleCustomUpdate);
    return () => window.removeEventListener('appUpdateAvailable', handleCustomUpdate);
  }, []);

  if (!updateAvailable || dismissed) {
    return null;
  }

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    // Reload page to get fresh assets
    window.location.reload();
  };

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[99990] animate-slideDown">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-teal-950/95 to-slate-900/95 border border-emerald-500/50 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-slate-950 animate-spin-slow" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-white truncate flex items-center gap-1.5">
              <span>🚀 অ্যাপের নতুন আপডেট উপলব্ধ!</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-500/40">v2.0</span>
            </p>
            <p className="text-[11px] text-emerald-100/80 truncate">নতুন ডিজাইন ও গতি পেতে আপডেট করুন</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleUpdate}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>আপডেট করুন</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            title="পরে কথা হবে"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
