// Service Worker for MyFlat PWA & Web Push Notifications
const CACHE_NAME = 'myflat-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Notification Click (Focus or open the app)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle incoming Push Event if FCM / WebPush is used
self.addEventListener('push', (event) => {
  let data = {
    title: 'আমার ফ্ল্যাট আপডেট',
    body: 'ফ্ল্যাটে একটি নতুন আপডেট বা নোটিশ এসেছে।',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'myflat-notification',
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/pwa-192x192.png',
      badge: data.badge || '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'myflat-update',
      data: { url: data.url || '/' }
    })
  );
});
