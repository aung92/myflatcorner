import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('PWA_PROMPT_DISMISSED') === 'true';
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('PWA_PROMPT_DISMISSED', 'true');
  };

  // If already installed or explicitly dismissed, don't show the prompt
  if (isInstalled || dismissed) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <div className="bg-blue-600/15 border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md max-w-xl mx-auto my-4 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg hidden sm:block">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="text-center sm:text-left">
            <h4 className="font-semibold text-white text-sm">হোমস্ক্রিনে অ্যাপটি ইন্সটল করুন!</h4>
            <p className="text-xs text-gray-300 mt-0.5">সহজ অ্যাক্সেস এবং অ্যাপের মতো দারুণ অভিজ্ঞতার জন্য হোমস্ক্রিনে শর্টকাট যোগ করুন।</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <button
            onClick={install}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            অ্যাপ ইন্সটল করুন
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-gray-400 hover:text-white rounded-lg transition"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <div className="bg-blue-600/15 border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md max-w-xl mx-auto my-4 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-white text-sm">আইফোনে অ্যাপ যুক্ত করুন!</h4>
              <p className="text-xs text-gray-300 mt-0.5">সাফারি ব্রাউজারের মাধ্যমে সহজে এটিকে হোমস্ক্রিনে অ্যাপ হিসেবে যুক্ত করুন।</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all whitespace-nowrap"
            >
              ইন্সটল গাইড দেখুন
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h3 className="text-md font-semibold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  iPhone / iPad-এ ইন্সটল করুন
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 text-sm text-gray-300 space-y-3">
                <p>১. আপনার সাফারি (Safari) ব্রাউজারের নিচে থাকা <strong className="text-white">Share (শেয়ার)</strong> বাটনে ট্যাপ করুন।</p>
                <p>২. অপশনগুলো থেকে স্ক্রোল করে নিচের দিকে যান।</p>
                <p>৩. এরপর <strong className="text-white">Add to Home Screen (হোম স্ক্রিনে যোগ করুন)</strong> অপশনটিতে ট্যাপ করুন।</p>
                <p>৪. ডানদিকের ওপরে থাকা <strong className="text-blue-500">Add</strong> বাটনে ক্লিক করে কনফার্ম করুন।</p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-gray-800 hover:bg-gray-700 py-2.5 text-sm font-medium text-white transition-all"
              >
                বুঝেছি, বন্ধ করুন
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
