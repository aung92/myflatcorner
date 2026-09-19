import React from 'react';
import { CurrentUser, NotificationItem } from '../../types';
import { toBn } from '../../lib/storage';

interface HeaderProps {
  currentUser: CurrentUser;
  notifications: NotificationItem[];
  subtitle?: string;
  onRefresh: () => void;
  onOpenNotifications: () => void;
  onOpenMobileMenu?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  notifications,
  subtitle,
  onRefresh,
  onOpenNotifications,
  onOpenMobileMenu,
  onLogout
}) => {
  const role = currentUser.role;
  const unreadNotifs = notifications.filter(
    n => n.forRole === role && (!n.room || n.room === currentUser.room) && !n.read
  ).length;

  return (
    <header className="flex flex-wrap sm:flex-nowrap items-center justify-between mb-6 sm:mb-8 gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden glass p-2 rounded-xl text-white hover:bg-white/10 shrink-0"
            title="মেনু"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-white/10 shrink-0 bg-white/5">
            {currentUser.photo ? (
              <img 
                src={currentUser.photo} 
                alt={currentUser.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center text-white text-base sm:text-lg font-bold">
                {currentUser.name?.[0] || 'ম'}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white truncate flex items-center gap-1.5">
              <span>স্বাগতম,</span> <span className="truncate">{currentUser.name}</span> <span className="shrink-0">👋</span>
            </h2>
            <p className="text-gray-400 text-[11px] sm:text-xs mt-0.5 truncate">{subtitle || 'আপনার তথ্য একনজরে'}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onRefresh}
          className="glass p-2 sm:p-2.5 rounded-xl hover:bg-white/10 transition text-gray-300 hover:text-white shrink-0"
          title="রিফ্রেশ"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button
          onClick={onOpenNotifications}
          className="glass p-2 sm:p-2.5 rounded-xl relative hover:bg-white/10 transition text-gray-300 hover:text-white shrink-0"
          title="নোটিফিকেশন"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadNotifs > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center pulse-dot text-white">
              {toBn(unreadNotifs)}
            </span>
          )}
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            className="glass p-2 sm:p-2.5 rounded-xl hover:bg-red-500/15 hover:text-red-400 text-red-300 transition lg:hidden flex items-center justify-center gap-1.5 border border-red-500/10 shrink-0"
            title="লগআউট"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs font-semibold hidden sm:inline">লগআউট</span>
          </button>
        )}
      </div>
    </header>
  );
};
