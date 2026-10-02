import React, { useState, useEffect } from 'react';
import { NotificationItem, CurrentUser } from '../../types';
import { resolveNotificationDestination } from '../../lib/notificationService';

interface InAppNotificationToastProps {
  currentUser: CurrentUser | null;
  onSelectNotif: (notif: NotificationItem) => void;
}

export const InAppNotificationToast: React.FC<InAppNotificationToastProps> = ({
  currentUser,
  onSelectNotif
}) => {
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationItem>;
      if (customEvent.detail) {
        const notif = customEvent.detail;
        // Verify this notification is intended for the active user
        if (currentUser) {
          const isForMe =
            notif.forRole === currentUser.role &&
            (!notif.room || notif.room === currentUser.room);
          if (isForMe) {
            setActiveToast(notif);
          }
        }
      }
    };

    window.addEventListener('appInAppNotificationToast', handleToastEvent);
    return () => {
      window.removeEventListener('appInAppNotificationToast', handleToastEvent);
    };
  }, [currentUser]);

  // Auto-dismiss after 7 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  if (!activeToast || !currentUser) return null;

  const dest = resolveNotificationDestination(activeToast, currentUser.role);

  const handleAction = () => {
    const current = activeToast;
    setActiveToast(null);
    onSelectNotif(current);
  };

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed top-4 right-3 sm:right-5 z-[9999] max-w-sm sm:max-w-md w-[calc(100vw-24px)] pointer-events-auto animate-bounce-short"
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#0d1424]/95 border border-cyan-500/40 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-xl text-white">
        {/* Animated Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 animate-pulse" />

        <div className="flex items-start gap-3 mt-0.5">
          {/* Icon with glow */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center text-xl shrink-0 shadow-inner">
            {dest.icon || '🔔'}
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                নতুন অটো নোটিফিকেশন
              </span>
              <button
                type="button"
                onClick={() => setActiveToast(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                title="বন্ধ করুন"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <h4 className="font-bold text-sm text-white line-clamp-1 leading-snug">
              {activeToast.title}
            </h4>
            <p className="text-xs text-gray-300 mt-1 line-clamp-2 leading-relaxed">
              {activeToast.message}
            </p>

            <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <span className="text-[10px] text-gray-400">এইমাত্র</span>
              <button
                type="button"
                onClick={handleAction}
                className="text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-3 py-1.5 rounded-lg shadow-md transition flex items-center gap-1.5 group"
              >
                <span>{dest.label}</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
