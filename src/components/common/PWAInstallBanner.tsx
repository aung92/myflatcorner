import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Smartphone, Download, X } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  if (isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-40 animate-slideUp">
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/95 via-[#16162a]/95 to-blue-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                <span>আমার ফ্ল্যাট মোবাইল অ্যাপ</span>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold border border-cyan-500/30">PWA</span>
              </p>
              <p className="text-[11px] text-gray-300 truncate">ফোনে অ্যাপ হিসেবে দ্রুত ব্যবহার করুন</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-md shadow-cyan-500/20 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ইনস্টল</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#16162a] border border-cyan-500/30 p-5 shadow-2xl space-y-4 text-white">
            <h4 className="text-base font-bold text-cyan-300">📲 ফোনে অ্যাপ ইনস্টল পদ্ধতি</h4>
            {isIOS ? (
              <p className="text-xs text-gray-300 leading-relaxed">
                সাফারি ব্রাউজারের নিচে থাকা <strong>Share (শেয়ার)</strong> বাটনে চাপ দিয়ে <strong>"Add to Home Screen"</strong> চাপুন।
              </p>
            ) : (
              <p className="text-xs text-gray-300 leading-relaxed">
                ব্রাউজারের উপরের ৩-ডট (⋮) মেন্যু থেকে <strong>"Install app"</strong> অথবা <strong>"Add to Home screen"</strong> এ চাপ দিন।
              </p>
            )}
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xs font-bold text-white transition"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}
    </>
  );
};
