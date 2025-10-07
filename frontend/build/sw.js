/**
 * Service Worker for PharmacyCopilot Application
 * Implements caching strategies for optimal performance and offline support
 */

const CACHE_NAME = 'PharmacyCopilot-v1';
const STATIC_CACHE = 'PharmacyCopilot-static-v1';
const DYNAMIC_CACHE = 'PharmacyCopilot-dynamic-v1';
const API_CACHE = 'PharmacyCopilot-api-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add critical CSS and JS files (will be populated by build process)
];

// API endpoints to cache with network-first strategy
const API_ENDPOINTS = [
  '/api/auth/me',
  '/api/dashboard/overview',
  '/api/patients',
  '/api/medications',
  '/api/clinical-notes',
];

// Cache strategies configuration
const CACHE_STRATEGIES = {
  // Static assets: Cache first, fallback to network
  static: {
    cacheName: STATIC_CACHE,
    strategy: 'CacheFirst',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    maxEntries: 100,
  },

  // API calls: Network first, fallback to cache
  api: {
    cacheName: API_CACHE,
    strategy: 'NetworkFirst',
    maxAge: 5 * 60, // 5 minutes
    maxEntries: 50,
  },

  // Dynamic content: Stale while revalidate
  dynamic: {
    cacheName: DYNAMIC_CACHE,
    strategy: 'StaleWhileRevalidate',
    maxAge: 24 * 60 * 60, // 24 hours
    maxEntries: 200,
  },
};

/**
 * Service Worker Event Listeners
 */

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];

        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!validCaches.includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip ALL navigation and document requests to prevent hydration issues
  // This is critical to prevent React error #185
  if (request.destination === 'document' ||
    request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    request.destination === 'iframe') {
    return;
  }

  // Handle API requests (all methods)
  if (isAPIRequest(request)) {
    // Skip Service Worker for critical MTR operations to prevent timeout conflicts
    if (isCriticalMTREndpoint(request)) {
      return; // Let the request go directly to the network
    }
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Only handle GET requests for static assets and dynamic content
  if (request.method !== 'GET') {
    return;
  }

  // Determine caching strategy based on request type
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      // Send response back if port available
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
      break;

    case 'CACHE_URLS':
      cacheUrls(payload?.urls || [])
        .then(() => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true });
          }
        })
        .catch((error) => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: false, error: error.message });
          }
        });
      break;

    case 'CLEAR_CACHE':
      clearCache(payload?.cacheName)
        .then(() => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true });
          }
        })
        .catch((error) => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: false, error: error.message });
          }
        });
      break;

    case 'GET_CACHE_INFO':
      getCacheInfo()
        .then(info => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage(info);
          }
        })
        .catch((error) => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ error: error.message });
          }
        });
      break;

    default:
      console.log('[SW] Unknown message type:', type);
      // Send error response if port available
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          success: false,
          error: `Unknown message type: ${type}`
        });
      }
  }
});

/**
 * Request Type Detection
 */

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  return (
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.includes('/assets/')
  );
}

function isCriticalMTREndpoint(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Skip Service Worker for MTR creation and critical operations
  return (
    pathname.startsWith('/api/mtr') && (
      request.method === 'POST' || // MTR creation
      request.method === 'PUT' ||  // MTR updates
      request.method === 'PATCH'   // MTR modifications
    )
  );
}

/**
 * Caching Strategy Implementations
 */

async function handleAPIRequest(request) {
  const cacheName = CACHE_STRATEGIES.api.cacheName;
  const maxAge = CACHE_STRATEGIES.api.maxAge * 1000; // Convert to milliseconds

  try {
    console.log('[SW] Handling API request:', request.url);

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout to match backend

    try {
      // Simple network-first strategy with timeout
      const networkResponse = await fetch(request, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (networkResponse.ok) {
        // Cache successful responses for GET requests only
        if (request.method === 'GET') {
          try {
            const cache = await caches.open(cacheName);
            const responseClone = networkResponse.clone();

            // Add timestamp for cache expiration
            const responseWithTimestamp = new Response(responseClone.body, {
              status: responseClone.status,
              statusText: responseClone.statusText,
              headers: {
                ...Object.fromEntries(responseClone.headers.entries()),
                'sw-cached-at': Date.now().toString(),
              },
            });

            cache.put(request, responseWithTimestamp);
            console.log('[SW] Cached API response:', request.url);
          } catch (cacheError) {
            console.warn('[SW] Failed to cache response:', cacheError);
            // Continue without caching if there's an error
          }
        }
      }

      return networkResponse;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    // Handle different types of errors appropriately
    if (error.name === 'AbortError') {
      console.warn('[SW] API request timed out after 5 minutes:', request.url);
    } else {
      console.error('[SW] Network failed for API request:', request.url, error);
    }

    // Fallback to cache for GET requests only
    if (request.method === 'GET') {
      try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
          const cachedAt = cachedResponse.headers.get('sw-cached-at');
          const isExpired = cachedAt && (Date.now() - parseInt(cachedAt)) > maxAge;

          if (!isExpired) {
            console.log('[SW] Serving from API cache:', request.url);
            return cachedResponse;
          } else {
            console.log('[SW] Cached API response expired:', request.url);
            cache.delete(request);
          }
        }
      } catch (cacheError) {
        console.warn('[SW] Failed to access cache:', cacheError);
      }
    }

    // Return offline fallback for critical API endpoints
    if (isCriticalAPIEndpoint(request)) {
      return createOfflineFallback(request);
    }

    // For non-critical or non-GET requests, just throw the error
    // This will let the browser handle it normally
    throw error;
  }
}

async function handleStaticAsset(request) {
  const cacheName = CACHE_STRATEGIES.static.cacheName;

  // Cache first strategy
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('[SW] Serving static asset from cache:', request.url);
    return cachedResponse;
  }

  try {
    console.log('[SW] Fetching static asset from network:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url, error);
    throw error;
  }
}

async function handleDynamicRequest(request) {
  const cacheName = CACHE_STRATEGIES.dynamic.cacheName;

  // Stale while revalidate strategy
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Always try to fetch from network in background
  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Network failed for dynamic request:', request.url);
      return null;
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    console.log('[SW] Serving dynamic content from cache:', request.url);
    return cachedResponse;
  }

  // Wait for network response if no cache available
  return networkPromise || createOfflineFallback(request);
}

/**
 * Utility Functions
 */

function isCriticalAPIEndpoint(request) {
  const url = new URL(request.url);
  return API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint));
}

function createOfflineFallback(request) {
  const url = new URL(request.url);

  if (isAPIRequest(request)) {
    // Return offline API response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature is not available offline',
        offline: true,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return caches.match('/offline.html') || new Response(
      '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  return new Response('Offline', { status: 503 });
}

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('[SW] Cached URL:', url);
      }
    } catch (error) {
      console.error('[SW] Failed to cache URL:', url, error);
    }
  }
}

async function clearCache(cacheName) {
  if (cacheName) {
    const deleted = await caches.delete(cacheName);
    console.log('[SW] Cache cleared:', cacheName, deleted);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] All caches cleared');
  }
}

async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const cacheInfo = {};

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    cacheInfo[cacheName] = {
      size: keys.length,
      urls: keys.map(request => request.url),
    };
  }

  return cacheInfo;
}

/**
 * Cache Cleanup
 */

// Clean up expired cache entries periodically
setInterval(async () => {
  console.log('[SW] Running cache cleanup...');

  const apiCache = await caches.open(API_CACHE);
  const apiRequests = await apiCache.keys();
  const maxAge = CACHE_STRATEGIES.api.maxAge * 1000;

  for (const request of apiRequests) {
    const response = await apiCache.match(request);
    const cachedAt = response?.headers.get('sw-cached-at');

    if (cachedAt && (Date.now() - parseInt(cachedAt)) > maxAge) {
      await apiCache.delete(request);
      console.log('[SW] Deleted expired cache entry:', request.url);
    }
  }
}, 60 * 60 * 1000); // Run every hour

console.log('[SW] Service worker script loaded');