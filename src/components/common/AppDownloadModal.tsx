import React from 'react';
import { Smartphone, Download, X, CheckCircle, Globe, Monitor } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert?: (msg: string, opts?: { type?: 'success' | 'info' | 'warning' | 'error' }) => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ isOpen, onClose, showAlert }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      showAlert?.('অ্যাপ সফলভাবে হোমস্ক্রিনে ইনস্টল করা হয়েছে!', { type: 'success' });
      onClose();
    } else {
      showAlert?.('আপনার ব্রাউজার মেনু (⋮ বা Share) থেকে "Add to Home Screen" সিলেক্ট করুন।', { type: 'info' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-gray-900 border border-white/10 p-6 md:p-8 shadow-2xl text-white space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg text-white">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">আমার ফ্ল্যাট অ্যাপ ডাউনলোড</h3>
              <p className="text-xs text-gray-400">আপনার মোবাইলে বা পিসিতে অ্যাপ হিসেবে ইনস্টল করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center gap-3 text-green-300">
            <CheckCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-sm">অ্যাপটি ইতিমধ্যেই ইনস্টল করা আছে!</p>
              <p className="text-xs text-green-300/80">আপনি আপনার হোমস্ক্রিন বা অ্যাপ ড্রয়ার থেকে সরাসরি অ্যাপটি ব্যবহার করতে পারেন।</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition"
              >
                <Download className="w-5 h-5" />
                <span>এক ক্লিকে অ্যাপ ইনস্টল করুন</span>
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Android Guide */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Smartphone className="w-4 h-4" />
                  <span>অ্যান্ড্রয়েড (Android)</span>
                </div>
                <ol className="text-xs text-gray-300 space-y-1.5 list-decimal list-inside">
                  <li>ব্রাউজারের ওপরের ডানপাশের <strong className="text-white">(⋮) মেনুতে</strong> ক্লিক করুন।</li>
                  <li><strong className="text-white">"Install App"</strong> অথবা <strong className="text-white">"Add to Home screen"</strong> সিলেক্ট করুন।</li>
                  <li>কনফার্ম করলেই অ্যাপটি আপনার ফোনে ইনস্টল হয়ে যাবে!</li>
                </ol>
              </div>

              {/* iOS Guide */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Globe className="w-4 h-4" />
                  <span>আইফোন / আইপ্যাড (iOS)</span>
                </div>
                <ol className="text-xs text-gray-300 space-y-1.5 list-decimal list-inside">
                  <li>সাফারি (Safari) ব্রাউজারে নিচের <strong className="text-white">Share (শেয়ার)</strong> আইকনে ট্যাপ করুন।</li>
                  <li>স্ক্রোল করে <strong className="text-white">"Add to Home Screen"</strong> অপশনটি বেছে নিন।</li>
                  <li>ওপরের <strong className="text-cyan-400">Add</strong> বাটনে ক্লিক করুন।</li>
                </ol>
              </div>
            </div>

            {/* PC / Laptop Guide */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
              <Monitor className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-300 space-y-1">
                <p className="font-bold text-white text-sm">কম্পিউটার / ল্যাপটপ (PC / Mac)</p>
                <p>ক্রোম বা এজ (Edge) ব্রাউজারের অ্যাড্রেস বারের ডানপাশে থাকা ইনস্টল আইকন (<Download className="w-3.5 h-3.5 inline" />) অথবা ব্রাউজার মেনু থেকে ইনস্টল করতে পারেন।</p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
