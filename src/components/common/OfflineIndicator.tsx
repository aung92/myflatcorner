import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 border border-amber-500 text-white px-4 py-2.5 text-xs font-medium shadow-2xl animate-bounce">
      <WifiOff className="h-4 w-4 text-white animate-pulse" />
      <span>অফলাইন মোড — ক্যাশ করা ডাটা প্রদর্শিত হচ্ছে</span>
    </div>
  );
};
