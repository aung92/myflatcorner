import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FlatManagerData, CurrentUser, NotificationItem } from './types';
import {
  getFlatData,
  saveFlatData,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  checkAndTriggerAutoInvoices
} from './lib/storage';
import { fetchCloudData, saveCloudData, subscribeToCloudData } from './lib/firebase';
import {
  initializeNotificationTracker,
  checkAndNotifyNewUpdates,
  resolveNotificationDestination
} from './lib/notificationService';
import { AlertModal, ConfirmModal } from './components/common/Modals';
import { NotificationListModal } from './components/common/NotificationListModal';
import { NotificationPromptBanner } from './components/common/NotificationPromptBanner';
import { LoginPage } from './components/login/LoginPage';
import { AvailableRoomsPage } from './components/public/AvailableRoomsPage';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { TenantDashboard } from './components/tenant/TenantDashboard';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { OfflineIndicator } from './components/common/OfflineIndicator';

export default function App() {
  const [data, setData] = useState<FlatManagerData>(() => getFlatData());
  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(() => getCurrentUser());
  const [page, setPage] = useState<'main' | 'public'>('main');

  // Modal states
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    message: string;
    title?: string;
    type?: 'info' | 'success' | 'error' | 'warning';
  }>({
    isOpen: false,
    message: ''
  });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    title?: string;
    okText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    message: ''
  });
  const confirmResolveRef = useRef<((val: boolean) => void) | null>(null);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const isNotifInitializedRef = useRef(false);

  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [navTarget, setNavTarget] = useState<{
    tab: string;
    subTab?: string;
    timestamp: number;
    payload?: any;
  } | null>(null);

  // Register service worker on startup
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.debug('Service Worker registration skipped:', err);
      });
    }
  }, []);

  // Initialize tracker on mount
  useEffect(() => {
    if (data && data.notifications) {
      initializeNotificationTracker(data.notifications);
    }
  }, []);

  // Synchronize on external changes and Firestore real-time sync
  useEffect(() => {
    // 1. Subscribe to Firestore updates
    const unsubscribe = subscribeToCloudData((cloudData) => {
      if (cloudData) {
        localStorage.setItem('flatManagerData', JSON.stringify(cloudData));
        setData(cloudData);
        // Trigger live native device push notification if there are new items
        checkAndNotifyNewUpdates(cloudData, currentUser);
      }
    });

    // 2. Initial cloud state sync: if cloud is empty, seed it with current local/default data
    const initCloud = async () => {
      try {
        const cloudData = await fetchCloudData();
        if (!cloudData) {
          const localData = getFlatData();
          await saveCloudData(localData);
        } else {
          localStorage.setItem('flatManagerData', JSON.stringify(cloudData));
          setData(cloudData);
          initializeNotificationTracker(cloudData.notifications);
        }
      } catch (err) {
        console.error('Initial cloud data sync failed:', err);
      }
    };
    initCloud();

    const handleUpdate = () => {
      const updated = getFlatData();
      setData(updated);
      checkAndNotifyNewUpdates(updated, currentUser);
    };
    window.addEventListener('flatDataUpdated', handleUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('flatDataUpdated', handleUpdate);
    };
  }, [currentUser]);

  // Run auto-invoice check once on mount
  useEffect(() => {
    checkAndTriggerAutoInvoices(data);
  }, []);

  const handleUpdateData = useCallback((newData: FlatManagerData) => {
    saveFlatData(newData);
    setData(newData);
  }, []);

  const handleLogin = (user: CurrentUser) => {
    seenNotificationIdsRef.current.clear();
    isNotifInitializedRef.current = false;
    setCurrentUserState(user);
    setPage('main');
  };

  const handleLogout = () => {
    seenNotificationIdsRef.current.clear();
    isNotifInitializedRef.current = false;
    clearCurrentUser();
    setCurrentUserState(null);
    setPage('main');
  };

  const showAlert = useCallback(
    (message: string, opts?: { title?: string; type?: 'info' | 'success' | 'error' | 'warning' }) => {
      setAlertState({
        isOpen: true,
        message,
        title: opts?.title,
        type: opts?.type || 'info'
      });
    },
    []
  );

  // Watch for new notifications and trigger real-time modal popup for owner
  useEffect(() => {
    if (!data || !data.notifications || !currentUser || currentUser.role !== 'owner') return;

    const newNotifsToAlert: typeof data.notifications = [];

    data.notifications.forEach(n => {
      // We only alert for booking requests meant for the owner that are unread and not yet seen in this session
      if (
        n.forRole === 'owner' &&
        n.type === 'booking_request' &&
        !n.read &&
        !seenNotificationIdsRef.current.has(n.id)
      ) {
        newNotifsToAlert.push(n);
      }
      // Add all notifications to seen list so they won't trigger popups again in the current session
      seenNotificationIdsRef.current.add(n.id);
    });

    if (newNotifsToAlert.length > 0) {
      // Create updated notifications list marking the alerted ones as read
      const updatedNotifs = data.notifications.map(n => {
        const isAlerted = newNotifsToAlert.some(alerted => alerted.id === n.id);
        if (isAlerted) {
          return { ...n, read: true };
        }
        return n;
      });

      // Show the alert modal to the owner
      if (newNotifsToAlert.length === 1) {
        showAlert(newNotifsToAlert[0].message, { title: '🔔 ' + newNotifsToAlert[0].title, type: 'success' });
      } else {
        const messages = newNotifsToAlert.map((n, i) => `${i + 1}. ${n.message}`).join('\n\n');
        showAlert(
          `নতুন ${newNotifsToAlert.length}টি অগ্রিম বুকিং অনুরোধ এসেছে:\n\n${messages}`,
          { title: '🔔 নতুন অগ্রিম বুকিং অনুরোধ', type: 'success' }
        );
      }

      // Update data immediately so read: true is saved to Firestore/LocalStorage
      handleUpdateData({
        ...data,
        notifications: updatedNotifs
      });
    }
  }, [data?.notifications, currentUser, showAlert, handleUpdateData]);

  // 15-minute inactivity auto-logout
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetActivityTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    if (currentUser) {
      logoutTimerRef.current = setTimeout(() => {
        handleLogout();
        showAlert('১৫ মিনিট ধরে কোনো কাজ না করায় নিরাপত্তার স্বার্থে অটো লগআউট হয়ে গেছে।', { type: 'warning' });
      }, 15 * 60 * 1000);
    }
  }, [currentUser, showAlert]);

  useEffect(() => {
    if (currentUser) {
      resetActivityTimer();
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      const handleActivity = () => resetActivityTimer();
      
      events.forEach(event => window.addEventListener(event, handleActivity));
      
      return () => {
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        events.forEach(event => window.removeEventListener(event, handleActivity));
      };
    }
  }, [currentUser, resetActivityTimer]);

  const showConfirm = useCallback(
    (
      message: string,
      opts?: { title?: string; okText?: string; cancelText?: string; type?: 'danger' | 'warning' | 'info' }
    ): Promise<boolean> => {
      return new Promise<boolean>(resolve => {
        confirmResolveRef.current = resolve;
        setConfirmState({
          isOpen: true,
          message,
          title: opts?.title,
          okText: opts?.okText,
          cancelText: opts?.cancelText,
          type: opts?.type || 'warning'
        });
      });
    },
    []
  );

  const handleConfirmClose = (confirmed: boolean) => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
    if (confirmResolveRef.current) {
      confirmResolveRef.current(confirmed);
      confirmResolveRef.current = null;
    }
  };

  const handleMarkAllRead = () => {
    if (!currentUser) return;
    const role = currentUser.role;
    const updated = data.notifications.map(n => {
      if (n.forRole === role && (!n.room || n.room === currentUser.room)) {
        return { ...n, read: true };
      }
      return n;
    });
    handleUpdateData({ ...data, notifications: updated });
  };

  const handleSelectNotif = (notif: NotificationItem) => {
    const updated = data.notifications.map(n => (n.id === notif.id ? { ...n, read: true } : n));
    handleUpdateData({ ...data, notifications: updated });
    
    // Close the notification list modal
    setNotifModalOpen(false);

    // Deep link directly to the target tab/page based on the notification
    if (currentUser) {
      const dest = resolveNotificationDestination(notif, currentUser.role);
      setNavTarget({
        tab: dest.tab,
        subTab: dest.subTab,
        timestamp: Date.now(),
        payload: {
          notifId: notif.id,
          relatedId: notif.relatedId,
          invoiceId: notif.invoiceId
        }
      });
      
      showAlert(notif.message, { 
        title: `${dest.icon || '🔔'} ${notif.title}`, 
        type: 'info' 
      });
    }
  };

  // Routing
  if (page === 'public') {
    return (
      <>
        <AvailableRoomsPage
          data={data}
          currentUser={currentUser}
          onNavigateBack={() => setPage('main')}
          onNavigateLogin={() => setPage('main')}
          showAlert={showAlert}
          onUpdateData={handleUpdateData}
        />
        <AlertModal
          isOpen={alertState.isOpen}
          message={alertState.message}
          title={alertState.title}
          type={alertState.type}
          onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        />
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <div className="max-w-md mx-auto pt-4 px-4">
          <PWAInstallButton />
        </div>
        <LoginPage
          data={data}
          onLogin={handleLogin}
          onLoginSuccess={handleLogin}
          onNavigatePublic={() => setPage('public')}
          onNavigateAvailableRooms={() => setPage('public')}
          showAlert={showAlert}
        />
        <AlertModal
          isOpen={alertState.isOpen}
          message={alertState.message}
          title={alertState.title}
          type={alertState.type}
          onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        />
        <OfflineIndicator />
      </>
    );
  }
  
  // Dynamically attach photo for Header & Dashboard
  const activeUser: CurrentUser = {
    ...currentUser,
    photo: currentUser.role === 'owner' 
      ? data.flatInfo.ownerPhoto 
      : data.tenants.find(t => t.room === currentUser.room && t.name === currentUser.name)?.photo || currentUser.photo
  };

  return (
    <>
      <div className="max-w-7xl mx-auto pt-4 px-4 space-y-3">
        <PWAInstallButton />
        <NotificationPromptBanner />
      </div>
      {activeUser.role === 'owner' ? (
        <OwnerDashboard
          data={data}
          currentUser={activeUser}
          onUpdateData={handleUpdateData}
          onLogout={handleLogout}
          onNavigatePublic={() => setPage('public')}
          showAlert={showAlert}
          showConfirm={showConfirm}
          onOpenNotifications={() => setNotifModalOpen(true)}
          navTarget={navTarget}
        />
      ) : (
        <TenantDashboard
          data={data}
          currentUser={activeUser}
          onUpdateData={handleUpdateData}
          onLogout={handleLogout}
          showAlert={showAlert}
          showConfirm={showConfirm}
          onOpenNotifications={() => setNotifModalOpen(true)}
          navTarget={navTarget}
        />
      )}

      {/* Global Modals */}
      <AlertModal
        isOpen={alertState.isOpen}
        message={alertState.message}
        title={alertState.title}
        type={alertState.type}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        message={confirmState.message}
        title={confirmState.title}
        okText={confirmState.okText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
        onConfirm={() => handleConfirmClose(true)}
        onCancel={() => handleConfirmClose(false)}
      />

      <NotificationListModal
        isOpen={notifModalOpen}
        currentUser={activeUser}
        notifications={data.notifications}
        onClose={() => setNotifModalOpen(false)}
        onMarkAllRead={handleMarkAllRead}
        onSelectNotif={handleSelectNotif}
      />
      <OfflineIndicator />
    </>
  );
}
