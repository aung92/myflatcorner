import React, { useState } from 'react';
import { NotificationItem, CurrentUser } from '../../types';
import { toBn } from '../../lib/storage';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  resolveNotificationDestination
} from '../../lib/notificationService';

interface NotificationListModalProps {
  isOpen: boolean;
  currentUser: CurrentUser | null;
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onSelectNotif: (notif: NotificationItem) => void;
}

export const NotificationListModal: React.FC<NotificationListModalProps> = ({
  isOpen,
  currentUser,
  notifications,
  onClose,
  onMarkAllRead,
  onSelectNotif
}) => {
  const [testing, setTesting] = useState(false);
  const [permission, setPermission] = useState(getNotificationPermission());

  if (!isOpen || !currentUser) return null;

  const role = currentUser.role;
  const filtered = notifications.filter(
    n => n.forRole === role && (!n.room || n.room === currentUser.room)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      await sendTestNotification();
      setPermission(getNotificationPermission());
    } finally {
      setTesting(false);
    }
  };

  const handleEnablePermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermission('granted');
      await sendTestNotification();
    } else {
      setPermission(getNotificationPermission());
    }
  };

  const formatNotifTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'এইমাত্র';
    if (diff < 3600) return toBn(Math.floor(diff / 60)) + ' মিনিট আগে';
    if (diff < 86400) return toBn(Math.floor(diff / 3600)) + ' ঘন্টা আগে';
    if (diff < 604800) return toBn(Math.floor(diff / 86400)) + ' দিন আগে';
    return d.toLocaleDateString('bn-BD');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop overflow-y-auto">
      <div className="glass rounded-2xl w-full max-w-lg p-6 animate-fade my-8 border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span>🔔 নোটিফিকেশন</span>
            <span className="text-xs text-gray-400 font-normal">({toBn(filtered.length)})</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-xs text-purple-400 hover:text-purple-300 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition"
            >
              সব পড়া হয়েছে
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Device Push Notification Quick Action */}
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <p className="text-xs font-semibold text-blue-100">হোম স্ক্রিন ও ডিভাইস অ্যালার্ট</p>
              <p className="text-[10px] text-blue-200/70">
                {permission === 'granted' ? 'ডিভাইস নোটিফিকেশন সক্রিয় আছে' : 'মোবাইলে নোটিফিকেশন পেতে চালু করুন'}
              </p>
            </div>
          </div>
          {permission === 'granted' ? (
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={testing}
              className="text-xs bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50 whitespace-nowrap"
            >
              {testing ? 'পাঠানো হচ্ছে...' : '🔔 টেস্ট পাঠান'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEnablePermission}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1.5 rounded-lg transition whitespace-nowrap"
            >
              চালু করুন
            </button>
          )}
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="text-gray-400 text-center py-8">কোনো নোটিফিকেশন নেই</p>
          ) : (
            filtered.map(n => {
              const isUnread = !n.read;
              const dest = resolveNotificationDestination(n, role);

              return (
                <div
                  key={n.id}
                  onClick={() => onSelectNotif(n)}
                  className={`p-4 rounded-xl cursor-pointer group hover:bg-white/10 transition-all border ${
                    isUnread
                      ? 'bg-cyan-500/10 border-cyan-500/40 hover:border-cyan-400'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400 text-lg group-hover:scale-105 transition-transform">
                      {dest.icon || '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">
                          {n.title}
                        </p>
                        {isUnread && (
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 flex-shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        )}
                      </div>
                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">{n.message}</p>
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 flex-wrap gap-2">
                        <span className="text-[10px] text-gray-400">{formatNotifTime(n.createdAt)}</span>
                        <span className="text-xs font-medium text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                          <span>{dest.label}</span>
                          <span className="transition-transform group-hover:translate-x-0.5">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-white/10 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 glass py-2.5 rounded-xl font-semibold hover:bg-white/10 transition text-sm"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

