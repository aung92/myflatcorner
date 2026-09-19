import React, { useState, useEffect } from 'react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification
} from '../../lib/notificationService';

interface NotificationPromptBannerProps {
  onNotificationEnabled?: () => void;
}

export const NotificationPromptBanner: React.FC<NotificationPromptBannerProps> = ({
  onNotificationEnabled
}) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('granted');
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('notif_prompt_dismissed') === 'true';
    setDismissed(isDismissed);
    setPermission(getNotificationPermission());
  }, []);

  if (dismissed || permission === 'granted' || permission === 'unsupported' || permission === 'denied') {
    return null;
  }

  const handleEnable = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setPermission('granted');
        await sendTestNotification();
        if (onNotificationEnabled) onNotificationEnabled();
      } else {
        setPermission(getNotificationPermission());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('notif_prompt_dismissed', 'true');
  };

  return (
    <div className="mb-4 bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 border border-blue-500/30 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white animate-fade">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-100 flex items-center gap-1.5">
            হোম স্ক্রিন ও ডিভাইস নোটিফিকেশন
            <span className="text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full font-normal">রিয়েল-টাইম</span>
          </h4>
          <p className="text-xs text-blue-200/80 mt-0.5">
            নতুন নোটিশ, ইউটিলিটি বিল বা ভাড়ার আপডেট সরাসরি আপনার মোবাইলের নোটিফিকেশন বারে পান।
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs text-gray-400 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition"
        >
          পরে করব
        </button>
        <button
          type="button"
          onClick={handleEnable}
          disabled={loading}
          className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl shadow-md transition flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
        >
          {loading ? 'অনুমতি নেওয়া হচ্ছে...' : 'নোটিফিকেশন চালু করুন'}
        </button>
      </div>
    </div>
  );
};
