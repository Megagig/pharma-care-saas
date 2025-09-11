// Clinical Interventions Service Worker
// Provides offline functionality and background sync for intervention forms

const CACHE_NAME = 'clinical-interventions-v1';
const STATIC_CACHE_NAME = 'clinical-interventions-static-v1';
const DYNAMIC_CACHE_NAME = 'clinical-interventions-dynamic-v1';

// Static assets to cache
const STATIC_ASSETS = [
   '/',
   '/static/js/bundle.js',
   '/static/css/main.css',
   '/manifest.json',
   // Add other critical static assets
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
   /\/api\/patients\/search/,
   /\/api\/clinical-interventions\/recommendations/,
   /\/api\/workplaces\/\w+\/users/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
   console.log('Service Worker: Installing...');

   event.waitUntil(
      caches
         .open(STATIC_CACHE_NAME)
         .then((cache) => {
            console.log('Service Worker: Caching static assets');
            return cache.addAll(STATIC_ASSETS);
         })
         .then(() => {
            console.log('Service Worker: Static assets cached');
            return self.skipWaiting();
         })
         .catch((error) => {
            console.error(
               'Service Worker: Failed to cache static assets',
               error
            );
         })
   );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
   console.log('Service Worker: Activating...');

   event.waitUntil(
      caches
         .keys()
         .then((cacheNames) => {
            return Promise.all(
               cacheNames.map((cacheName) => {
                  if (
                     cacheName !== STATIC_CACHE_NAME &&
                     cacheName !== DYNAMIC_CACHE_NAME &&
                     cacheName !== CACHE_NAME
                  ) {
                     console.log(
                        'Service Worker: Deleting old cache',
                        cacheName
                     );
                     return caches.delete(cacheName);
                  }
               })
            );
         })
         .then(() => {
            console.log('Service Worker: Activated');
            return self.clients.claim();
         })
   );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
   const { request } = event;
   const url = new URL(request.url);

   // Skip non-GET requests and chrome-extension requests
   if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
      return;
   }

   // Handle different types of requests
   if (request.url.includes('/api/')) {
      // API requests - Network First with Cache Fallback
      event.respondWith(handleApiRequest(request));
   } else if (STATIC_ASSETS.some((asset) => request.url.includes(asset))) {
      // Static assets - Cache First
      event.respondWith(handleStaticRequest(request));
   } else {
      // Other requests - Stale While Revalidate
      event.respondWith(handleDynamicRequest(request));
   }
});

// Handle API requests with Network First strategy
async function handleApiRequest(request) {
   const url = new URL(request.url);

   try {
      // Try network first
      const networkResponse = await fetch(request);

      // Cache successful responses for specific endpoints
      if (networkResponse.ok && shouldCacheApiResponse(url)) {
         const cache = await caches.open(DYNAMIC_CACHE_NAME);
         cache.put(request, networkResponse.clone());
      }

      return networkResponse;
   } catch (error) {
      console.log(
         'Service Worker: Network failed, trying cache for',
         request.url
      );

      // Fallback to cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
         return cachedResponse;
      }

      // Return offline response for intervention-related APIs
      if (url.pathname.includes('/clinical-interventions')) {
         return new Response(
            JSON.stringify({
               success: false,
               message: 'Offline - data will sync when connection is restored',
               offline: true,
            }),
            {
               status: 503,
               statusText: 'Service Unavailable',
               headers: { 'Content-Type': 'application/json' },
            }
         );
      }

      throw error;
   }
}

// Handle static requests with Cache First strategy
async function handleStaticRequest(request) {
   const cachedResponse = await caches.match(request);

   if (cachedResponse) {
      return cachedResponse;
   }

   try {
      const networkResponse = await fetch(request);
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
   } catch (error) {
      console.error(
         'Service Worker: Failed to fetch static asset',
         request.url
      );
      throw error;
   }
}

// Handle dynamic requests with Stale While Revalidate strategy
async function handleDynamicRequest(request) {
   const cache = await caches.open(DYNAMIC_CACHE_NAME);
   const cachedResponse = await cache.match(request);

   const fetchPromise = fetch(request)
      .then((networkResponse) => {
         if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
         }
         return networkResponse;
      })
      .catch(() => cachedResponse);

   return cachedResponse || fetchPromise;
}

// Check if API response should be cached
function shouldCacheApiResponse(url) {
   return API_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

// Background Sync for offline intervention submissions
self.addEventListener('sync', (event) => {
   console.log('Service Worker: Background sync triggered', event.tag);

   if (event.tag === 'intervention-sync') {
      event.waitUntil(syncInterventions());
   }
});

// Sync offline interventions when connection is restored
async function syncInterventions() {
   console.log('Service Worker: Syncing offline interventions...');

   try {
      // Get offline interventions from IndexedDB
      const offlineInterventions = await getOfflineInterventions();

      if (offlineInterventions.length === 0) {
         console.log('Service Worker: No offline interventions to sync');
         return;
      }

      console.log(
         `Service Worker: Syncing ${offlineInterventions.length} interventions`
      );

      // Sync each intervention
      for (const intervention of offlineInterventions) {
         try {
            const response = await fetch('/api/clinical-interventions', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
                  Authorization: intervention.authToken,
               },
               body: JSON.stringify(intervention.data),
            });

            if (response.ok) {
               // Remove from offline storage
               await removeOfflineIntervention(intervention.id);
               console.log(
                  'Service Worker: Synced intervention',
                  intervention.id
               );

               // Notify client about successful sync
               await notifyClients({
                  type: 'INTERVENTION_SYNCED',
                  interventionId: intervention.id,
                  success: true,
               });
            } else {
               console.error(
                  'Service Worker: Failed to sync intervention',
                  intervention.id,
                  response.status
               );
            }
         } catch (error) {
            console.error(
               'Service Worker: Error syncing intervention',
               intervention.id,
               error
            );
         }
      }

      console.log('Service Worker: Intervention sync completed');
   } catch (error) {
      console.error('Service Worker: Background sync failed', error);
   }
}

// Get offline interventions from IndexedDB
async function getOfflineInterventions() {
   return new Promise((resolve, reject) => {
      const request = indexedDB.open('ClinicalInterventionsDB', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
         const db = request.result;
         const transaction = db.transaction(
            ['offlineInterventions'],
            'readonly'
         );
         const store = transaction.objectStore('offlineInterventions');
         const getAllRequest = store.getAll();

         getAllRequest.onsuccess = () => resolve(getAllRequest.result);
         getAllRequest.onerror = () => reject(getAllRequest.error);
      };

      request.onupgradeneeded = () => {
         const db = request.result;
         if (!db.objectStoreNames.contains('offlineInterventions')) {
            db.createObjectStore('offlineInterventions', { keyPath: 'id' });
         }
      };
   });
}

// Remove synced intervention from offline storage
async function removeOfflineIntervention(id) {
   return new Promise((resolve, reject) => {
      const request = indexedDB.open('ClinicalInterventionsDB', 1);

      request.onsuccess = () => {
         const db = request.result;
         const transaction = db.transaction(
            ['offlineInterventions'],
            'readwrite'
         );
         const store = transaction.objectStore('offlineInterventions');
         const deleteRequest = store.delete(id);

         deleteRequest.onsuccess = () => resolve();
         deleteRequest.onerror = () => reject(deleteRequest.error);
      };
   });
}

// Notify all clients about sync status
async function notifyClients(message) {
   const clients = await self.clients.matchAll();
   clients.forEach((client) => {
      client.postMessage(message);
   });
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
   console.log('Service Worker: Push notification received');

   if (event.data) {
      const data = event.data.json();

      const options = {
         body: data.body || 'New clinical intervention update',
         icon: '/icons/icon-192x192.png',
         badge: '/icons/badge-72x72.png',
         tag: 'clinical-intervention',
         data: data.data || {},
         actions: [
            {
               action: 'view',
               title: 'View Details',
            },
            {
               action: 'dismiss',
               title: 'Dismiss',
            },
         ],
      };

      event.waitUntil(
         self.registration.showNotification(
            data.title || 'Clinical Interventions',
            options
         )
      );
   }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
   console.log('Service Worker: Notification clicked', event.action);

   event.notification.close();

   if (event.action === 'view') {
      // Open the app to the relevant intervention
      event.waitUntil(clients.openWindow('/clinical-interventions'));
   }
});

console.log('Service Worker: Loaded');
