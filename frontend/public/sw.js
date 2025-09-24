// Service Worker for Communication Hub Push Notifications
const CACHE_NAME = 'communication-hub-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'New Message',
    body: 'You have a new message',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'communication-notification',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload,
      };
    } catch (error) {
      console.error('Error parsing push payload:', error);
      notificationData.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    vibrate: notificationData.vibrate || [200, 100, 200],
    actions: [
      {
        action: 'reply',
        title: 'Reply',
        icon: '/icons/reply-icon.png',
      },
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationOptions
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  if (action === 'dismiss') {
    return;
  }

  // Handle different actions
  let url = '/';

  if (data.conversationId) {
    if (action === 'reply') {
      url = `/communication/${data.conversationId}?reply=true`;
    } else {
      url = `/communication/${data.conversationId}`;
    }
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes('/communication') && 'focus' in client) {
            // Send message to existing client
            client.postMessage({
              type: 'notification-click',
              action: action,
              data: data,
            });
            return client.focus();
          }
        }

        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync for offline message sending
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  try {
    // Get pending messages from IndexedDB
    const pendingMessages = await getPendingMessages();

    for (const message of pendingMessages) {
      try {
        // Attempt to send message
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${message.token}`,
          },
          body: JSON.stringify(message.data),
        });

        if (response.ok) {
          // Remove from pending messages
          await removePendingMessage(message.id);

          // Notify client of successful send
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'message-sent',
              messageId: message.id,
              success: true,
            });
          });
        }
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// IndexedDB helpers for offline message storage
async function getPendingMessages() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CommunicationHub', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingMessages'], 'readonly');
      const store = transaction.objectStore('pendingMessages');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingMessages')) {
        db.createObjectStore('pendingMessages', { keyPath: 'id' });
      }
    };
  });
}

async function removePendingMessage(messageId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CommunicationHub', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingMessages'], 'readwrite');
      const store = transaction.objectStore('pendingMessages');
      const deleteRequest = store.delete(messageId);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'skip-waiting':
      self.skipWaiting();
      break;

    case 'store-pending-message':
      storePendingMessage(data);
      break;

    case 'clear-notifications':
      clearAllNotifications();
      break;

    default:
      console.log('Unknown message type:', type);
  }
});

async function storePendingMessage(messageData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CommunicationHub', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingMessages'], 'readwrite');
      const store = transaction.objectStore('pendingMessages');
      const addRequest = store.add({
        id: Date.now() + Math.random(),
        ...messageData,
        timestamp: Date.now(),
      });

      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingMessages')) {
        db.createObjectStore('pendingMessages', { keyPath: 'id' });
      }
    };
  });
}

async function clearAllNotifications() {
  const notifications = await self.registration.getNotifications();
  notifications.forEach((notification) => notification.close());
}
