import { CurrentUser, FlatManagerData, NotificationItem } from '../types';

// Audio Chime Synthesizer using Web Audio API (No external mp3 required)
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // First tone (pleasant high frequency)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second chime harmonic (richness)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3); // D6
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (err) {
    // Audio may be blocked before first user interaction
    console.debug('Audio chime notification failed:', err);
  }
}

// Check notification permission state
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request permission to send push notifications
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Register service worker if available
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch (e) {
          console.debug('ServiceWorker registration note:', e);
        }
      }
      playNotificationSound();
      return true;
    }
  } catch (err) {
    console.error('Error requesting notification permission:', err);
  }
  return false;
}

// Send a Device/Browser Native Notification
export async function sendDeviceNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    url?: string;
    playSound?: boolean;
  }
) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const {
    body = '',
    icon = '/pwa-192x192.png',
    tag = 'myflat-notification',
    url = '/',
    playSound = true
  } = options || {};

  if (playSound) {
    playNotificationSound();
  }

  // Try service worker first (better for mobile home screen / PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon,
          badge: '/pwa-192x192.png',
          tag,
          vibrate: [200, 100, 200],
          data: { url }
        } as NotificationOptions);
        return;
      }
    } catch (err) {
      console.debug('Service worker showNotification fallback:', err);
    }
  }

  // Fallback to standard Notification constructor
  try {
    const notif = new Notification(title, {
      body,
      icon,
      tag
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (err) {
    console.error('Failed to trigger native Notification:', err);
  }
}

// Send a Test Notification so user can verify on their screen
export async function sendTestNotification() {
  const perm = getNotificationPermission();
  if (perm !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
  }

  await sendDeviceNotification('🔔 আমার ফ্ল্যাট নোটিফিকেশন সফল!', {
    body: 'অভিনন্দন! আপনার মোবাইল বা পিসির হোম স্ক্রিনে এখন থেকে রিয়েল-টাইম নোটিফিকেশন পাওয়া যাবে।',
    tag: 'myflat-test-notification'
  });
  return true;
}

// Track processed notification IDs in current session
const processedNotifIds = new Set<string>();

// Initialize previous IDs on first run
export function initializeNotificationTracker(notifications: NotificationItem[]) {
  if (processedNotifIds.size === 0 && notifications) {
    notifications.forEach(n => processedNotifIds.add(n.id));
  }
}

// Resolve exact destination tab and sub-tab for any notification
export function resolveNotificationDestination(
  notif: NotificationItem,
  role: 'owner' | 'tenant'
): { tab: string; subTab?: string; label: string; icon: string } {
  // If explicitly provided on the notification item
  if (notif.targetTab) {
    return {
      tab: notif.targetTab,
      subTab: notif.targetSubTab,
      label: 'সরাসরি আপডেটে যান',
      icon: '👉'
    };
  }

  const title = (notif.title || '').toLowerCase();
  const msg = (notif.message || '').toLowerCase();
  const type = (notif.type || '').toLowerCase();
  const combined = `${title} ${msg} ${type}`;

  if (role === 'owner') {
    // 1. Payment Requests
    if (combined.includes('পেমেন্ট রিকুয়েস্ট') || combined.includes('payment_request') || type === 'payment' || combined.includes('টাকা জমা') || combined.includes('অনুরোধ')) {
      return { tab: 'paymentRequests', label: 'পেমেন্ট রিকুয়েস্টে যান', icon: '💳' };
    }
    // 2. Invoices & Utility Bills
    if (combined.includes('ইনভয়েস') || combined.includes('বিল') || combined.includes('ইউটিলিটি') || combined.includes('বকেয়া') || type === 'invoice' || type === 'utility') {
      return { tab: 'invoices', label: 'ইনভয়েস ও বিলে যান', icon: '🧾' };
    }
    // 3. Maintenance Requests
    if (combined.includes('মেরামত') || combined.includes('সার্ভিস') || type === 'maintenance') {
      return { tab: 'complaints', subTab: 'maintenance', label: 'মেরামত রিকোয়েস্টে যান', icon: '🔧' };
    }
    // 4. Complaints & Disputes
    if (combined.includes('অভিযোগ') || combined.includes('আপত্তি') || combined.includes('ইস্যু') || type === 'complaint' || type === 'dispute') {
      return { tab: 'complaints', subTab: 'complaints', label: 'অভিযোগ ও আপত্তিতে যান', icon: '⚠️' };
    }
    // 5. Notices
    if (combined.includes('নোটিশ') || type === 'notice') {
      return { tab: 'notices', label: 'নোটিশ বোর্ডে যান', icon: '📢' };
    }
    // 6. Kitchen Duty
    if (combined.includes('কিচেন') || combined.includes('রান্নাঘর') || combined.includes('ডিউটি') || type === 'kitchenduty') {
      return { tab: 'kitchenDuty', label: 'কিচেন ডিউটিতে যান', icon: '🍳' };
    }
    // 7. Visitors
    if (combined.includes('ভিজিটর') || combined.includes('মেহমান') || combined.includes('গেস্ট') || type === 'visitor') {
      return { tab: 'visitors', label: 'ভিজিটর লগে যান', icon: '🚪' };
    }
    // 8. Move-out / Deposits
    if (combined.includes('বাসা ছাড়া') || combined.includes('ফ্ল্যাট ছাড়') || combined.includes('জামানত') || combined.includes('ডিপোজিট') || type === 'deposit' || type === 'moveout') {
      return { tab: 'deposits', label: 'ডিপোজিট ও নোটিশে যান', icon: '💰' };
    }
    // 9. Room Members / Tenants
    if (combined.includes('সদস্য') || combined.includes('মেম্বার') || combined.includes('ভাড়াটিয়া') || type === 'member' || type === 'tenant') {
      return { tab: 'tenants', label: 'ভাড়াটিয়া ও সদস্যে যান', icon: '👥' };
    }
    // 10. Legal / Police Verification
    if (combined.includes('পুলিশ') || combined.includes('ভেরিফিকেশন') || combined.includes('police') || combined.includes('আইনি')) {
      return { tab: 'legal', subTab: 'legal', label: 'পুলিশ ও আইনি ডকুমেন্টে যান', icon: '📄' };
    }
    // 11. Documents
    if (combined.includes('ডকুমেন্ট') || combined.includes('ফাইল') || type === 'document') {
      return { tab: 'legal', subTab: 'documents', label: 'ডকুমেন্টসে যান', icon: '📁' };
    }
    // 12. Rooms
    if (combined.includes('রুম') || type === 'room') {
      return { tab: 'rooms', label: 'রুম ব্যবস্থাপনায় যান', icon: '🏠' };
    }
    return { tab: 'overview', label: 'ওভারভিউতে যান', icon: '🏠' };
  } else {
    // Tenant Role Destinations
    // 1. Invoices / Bills / Payments Approved
    if (combined.includes('ইনভয়েস') || combined.includes('বিল') || combined.includes('অনুমোদিত') || combined.includes('অনুমোদন') || combined.includes('বকেয়া') || type === 'invoice' || type === 'utility') {
      return { tab: 'invoices', label: 'আমার রুম ও বিল হিসাবে যান', icon: '🧾' };
    }
    // 2. Payment Rejected / Submit Payment
    if (combined.includes('পেমেন্ট বাতিল') || combined.includes('পেমেন্ট জমা') || combined.includes('টাকা পরিশোধ') || type === 'payment') {
      return { tab: 'submitPayment', label: 'পেমেন্ট জমা দিন পেজে যান', icon: '💳' };
    }
    // 3. Complaints & Maintenance
    if (combined.includes('অভিযোগ') || combined.includes('মেরামত') || combined.includes('আপত্তি') || combined.includes('সার্ভিস') || type === 'complaint' || type === 'maintenance' || type === 'dispute') {
      return { tab: 'complaints', label: 'অভিযোগ ও মেরামতে যান', icon: '🔧' };
    }
    // 4. Notices
    if (combined.includes('নোটিশ') || type === 'notice') {
      return { tab: 'notices', label: 'নোটিশ বোর্ডে যান', icon: '📢' };
    }
    // 5. Rules
    if (combined.includes('রুলস') || combined.includes('নিয়ম') || combined.includes('হাউস') || type === 'rules') {
      return { tab: 'rules', label: 'হাউস রুলসে যান', icon: '📋' };
    }
    // 6. Kitchen Duty
    if (combined.includes('কিচেন') || combined.includes('রান্নাঘর') || combined.includes('ডিউটি') || type === 'kitchenduty') {
      return { tab: 'kitchenDuty', label: 'কিচেন ডিউটিতে যান', icon: '🍳' };
    }
    // 7. Visitors
    if (combined.includes('ভিজিটর') || combined.includes('মেহমান') || combined.includes('গেস্ট') || type === 'visitor') {
      return { tab: 'visitors', label: 'ভিজিটর লগে যান', icon: '🚪' };
    }
    // 8. Documents / Police Verification
    if (combined.includes('পুলিশ') || combined.includes('ফরম') || combined.includes('ডকুমেন্ট') || type === 'document' || type === 'police') {
      return { tab: 'documents', label: 'ডকুমেন্ট ও পুলিশ ফরমে যান', icon: '📄' };
    }
    // 9. Profile / Room Members / Deposits
    if (combined.includes('প্রোফাইল') || combined.includes('সদস্য') || combined.includes('মেম্বার') || combined.includes('জামানত') || combined.includes('বাসা ছাড়া') || type === 'profile' || type === 'member') {
      return { tab: 'profile', label: 'প্রোফাইল ও মেম্বার পেজে যান', icon: '👤' };
    }
    return { tab: 'overview', label: 'ওভারভিউতে যান', icon: '🏠' };
  }
}

// Auto-check for new incoming updates from cloud/store and notify user
export function checkAndNotifyNewUpdates(
  newData: FlatManagerData,
  currentUser: CurrentUser | null
) {
  if (!newData || !newData.notifications || !currentUser) return;

  const role = currentUser.role;
  const userRoom = currentUser.room;

  // Find any newly arrived notifications for this user that haven't been alerted yet
  newData.notifications.forEach(notif => {
    if (!processedNotifIds.has(notif.id)) {
      processedNotifIds.add(notif.id);

      const isForMe = notif.forRole === role && (!notif.room || notif.room === userRoom);
      if (isForMe && !notif.read) {
        sendDeviceNotification(notif.title, {
          body: notif.message,
          tag: notif.id
        });
      }
    }
  });
}

