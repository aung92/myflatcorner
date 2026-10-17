import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, CheckCircle, Share, PlusSquare, X } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'compact' | 'badge';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '', variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (res) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/20 border border-cyan-400/30 ${className}`}
          title="মোবাইলে অ্যাপ ইনস্টল করুন"
        >
          <Smartphone className="w-3.5 h-3.5 animate-pulse" />
          <span>অ্যাপ ইনস্টল</span>
        </button>
      ) : variant === 'badge' ? (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition ${className}`}
        >
          <Download className="w-3 h-3" />
          <span>মোবাইল অ্যাপ</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/25 border border-indigo-400/30 active:scale-95 ${className}`}
        >
          <Download className="w-4 h-4 animate-bounce" />
          <span>মোবাইলে অ্যাপ ইনস্টল করুন</span>
        </button>
      )}

      {/* Manual & iOS Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#16162a] border border-cyan-500/30 p-6 shadow-2xl space-y-4 text-white relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg text-2xl">
                📱
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">মোবাইল অ্যাপ ইনস্টল নির্দেশিকা</h3>
                <p className="text-xs text-cyan-300">হোম স্ক্রিনে সরাসরি অ্যাপের মতো ব্যবহার করুন</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm text-gray-200">
                <p className="text-xs text-amber-300 font-semibold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  🍎 <strong>iPhone / iPad (Safari ব্রাউজার)</strong> ব্যবহারকারীদের জন্য:
                </p>
                <div className="space-y-2 text-xs bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">১</span>
                    <span>সাফারি ব্রাউজারের নিচে থাকা <Share className="w-3.5 h-3.5 inline text-cyan-400" /> <strong>Share</strong> বাটনে চাপ দিন।</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">২</span>
                    <span>তালিকা স্ক্রল করে <PlusSquare className="w-3.5 h-3.5 inline text-cyan-400" /> <strong>Add to Home Screen</strong> সিলেক্ট করুন।</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">৩</span>
                    <span>উপরে ডানে <strong>Add</strong> চাপলেই আপনার ফোনে অ্যাপ ইনস্টল হয়ে যাবে!</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-gray-200">
                <p className="text-xs text-cyan-300 font-semibold bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20">
                  🤖 <strong>Android (Chrome / Browser)</strong> ব্যবহারকারীদের জন্য:
                </p>
                <div className="space-y-2 text-xs bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">১</span>
                    <span>ক্রোম ব্রাউজারের উপরের ডানে <strong>৩টি ডট (⋮)</strong> মেন্যুতে ক্লিক করুন।</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">২</span>
                    <span><strong>"Install app"</strong> অথবা <strong>"Add to Home screen"</strong> এ চাপ দিন।</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">৩</span>
                    <span><strong>Install</strong> নিশ্চিত করলে হোম স্ক্রিনে ফুল-স্ক্রিন অ্যাপ যোগ হবে।</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs text-white transition shadow-md"
            >
              বুঝেছি / বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {installSuccess && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>অ্যাপ সফলভাবে ইনস্টল করা হয়েছে!</span>
        </div>
      )}
    </>
  );
};
