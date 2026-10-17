import React, { useState, useEffect } from 'react';
import { CurrentUser } from '../../types';
import { getNotificationPermission, requestNotificationPermission, sendTestNotification } from '../../lib/notificationService';

interface MandatoryNotificationModalProps {
  currentUser?: CurrentUser | null;
}

export function MandatoryNotificationModal({ currentUser }: MandatoryNotificationModalProps) {
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported' | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mandatory notification prompt applies EXCLUSIVELY to tenants (varatiya)
  const isTenant = currentUser?.role === 'tenant';

  useEffect(() => {
    if (!isTenant) {
      setIsOpen(false);
      return;
    }

    const checkPerm = () => {
      const current = getNotificationPermission();
      setPermissionState(current);
      if (current !== 'granted' && current !== 'unsupported') {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    checkPerm();
    window.addEventListener('focus', checkPerm);
    return () => window.removeEventListener('focus', checkPerm);
  }, [isTenant]);

  if (!isTenant || !isOpen || permissionState === 'granted' || permissionState === 'unsupported') {
    return null;
  }

  const handleEnableClick = async () => {
    setIsLoading(true);
    try {
      const granted = await requestNotificationPermission();
      const newPerm = getNotificationPermission();
      setPermissionState(newPerm);

      if (granted || newPerm === 'granted') {
        setIsOpen(false);
        await sendTestNotification();
      }
    } catch (err) {
      console.error('Failed to enable notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden">
        {/* Glow backdrop effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Icon */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-5 animate-bounce">
          <svg className="w-10 h-10 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        {/* Header Text */}
        <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
          জরুরি সতর্কতা (Mandatory)
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          অ্যাপের নোটিফিকেশন অন করা বাধ্যতামূলক!
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          ভাড়া পরিশোধের সময়সীমা, ইউটিলিটি ও বিদ্যুৎ বিল, জরুরি নোটিশ এবং কিচেন ডিউটির আপডেট তাৎক্ষণিক ফোনে পেতে নোটিফিকেশন চালু রাখা আবশ্যক।
        </p>

        {permissionState === 'denied' ? (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/50 border border-red-500/30 text-left text-xs text-red-200">
            <p className="font-semibold text-red-400 mb-1 flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              নোটিফিকেশন ব্লক করা রয়েছে!
            </p>
            <p className="leading-normal">
              আপনার ফোনের ব্রাউজার সেটিংস থেকে ওয়েবসাইট অথবা অ্যাপ সেটিংসে গিয়ে <span className="font-bold text-white">Notifications Permission</span> পরিবর্তন করে <span className="text-emerald-400 font-bold">'Allow'</span> করে দিন।
            </p>
          </div>
        ) : null}

        {/* Action Button */}
        <button
          onClick={handleEnableClick}
          disabled={isLoading}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="inline-block w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {permissionState === 'denied' ? 'পুনরায় চেষ্টা করুন' : '🔔 নোটিফিকেশন চালু করুন'}
            </>
          )}
        </button>

        <p className="mt-4 text-[11px] text-slate-400">
          * এটি শুধু ফ্ল্যাটের অফিসিয়াল তথ্য ও জরুরি আপডেটের জন্য ব্যবহৃত হয়।
        </p>
      </div>
    </div>
  );
}
