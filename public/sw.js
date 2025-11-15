/**
 * Service Worker for Alojamento Insight Analyzer PWA
 *
 * Implements:
 * - Cache-first strategy for static assets (JS, CSS, images, fonts)
 * - Network-first strategy for API calls (fresh data with fallback)
 * - Offline fallback page for navigation requests
 * - Cache versioning for proper updates
 * - Background sync capability
 * - Comprehensive error handling
 */

// Cache version - increment to force cache update on all clients
const CACHE_VERSION = 'v2';
const CACHE_NAME = `alojamento-insights-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Cache categories for organized cache management
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const API_CACHE = `${CACHE_NAME}-api`;

// Routes and assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Assets to cache with cache-first strategy
const CACHE_FIRST_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.woff2$/,
  /\.woff$/,
  /\.ttf$/,
  /\.eot$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.svg$/,
  /\.gif$/,
  /\.webp$/
];

// API patterns to cache with network-first strategy
const API_PATTERNS = [
  /\/api\//,
  /supabase\.co/
];

// Max cache sizes to prevent storage bloat
const MAX_CACHE_SIZE = {
  static: 50,
  dynamic: 30,
  api: 20
};

/**
 * Install Event - Pre-cache essential assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching essential assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Pre-caching failed:', error);
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete caches that don't match current version
            if (cacheName.startsWith('alojamento-insights-') && cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Handle all network requests with appropriate caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Determine caching strategy based on request type
  if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else if (isNavigationRequest(request)) {
    event.respondWith(navigationStrategy(request));
  } else {
    event.respondWith(dynamicCacheStrategy(request, DYNAMIC_CACHE));
  }
});

/**
 * Check if request is for an API endpoint
 */
function isAPIRequest(url) {
  return API_PATTERNS.some(pattern => pattern.test(url.href));
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(url) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname));
}

/**
 * Check if request is a navigation request
 */
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

/**
 * Cache-First Strategy - For static assets that rarely change
 * 1. Check cache first
 * 2. If not in cache, fetch from network
 * 3. Cache the response for future use
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[Service Worker] Cache hit:', request.url);
      return cachedResponse;
    }

    console.log('[Service Worker] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await trimCache(cacheName, MAX_CACHE_SIZE.static);
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache-first strategy failed:', error);
    throw error;
  }
}

/**
 * Network-First Strategy - For API calls that need fresh data
 * 1. Try network first
 * 2. If network fails, fall back to cache
 * 3. Cache successful network responses
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await trimCache(cacheName, MAX_CACHE_SIZE.api);
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);

    // Fall back to cache if network fails
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache:', request.url);
      return cachedResponse;
    }

    console.error('[Service Worker] Network-first strategy failed:', error);
    throw error;
  }
}

/**
 * Navigation Strategy - For HTML page requests
 * 1. Try network first
 * 2. If offline, show offline page
 */
async function navigationStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Navigation offline, showing offline page');

    // Show offline page
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match(OFFLINE_URL);

    if (offlinePage) {
      return offlinePage;
    }

    // If offline page is not cached, return a basic response
    return new Response(
      '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

/**
 * Dynamic Cache Strategy - For other requests
 * 1. Try network
 * 2. Cache successful responses
 * 3. Fall back to cache if network fails
 */
async function dynamicCacheStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await trimCache(cacheName, MAX_CACHE_SIZE.dynamic);
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

/**
 * Trim cache to prevent unlimited growth
 */
async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxItems) {
      // Delete oldest entries (FIFO)
      const itemsToDelete = keys.length - maxItems;
      for (let i = 0; i < itemsToDelete; i++) {
        await cache.delete(keys[i]);
      }
      console.log(`[Service Worker] Trimmed cache ${cacheName} to ${maxItems} items`);
    }
  } catch (error) {
    console.error('[Service Worker] Cache trimming failed:', error);
  }
}

/**
 * Background Sync - For offline form submissions
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync event:', event.tag);

  if (event.tag === 'sync-analysis') {
    event.waitUntil(syncAnalysisData());
  }
});

/**
 * Sync analysis data when back online
 */
async function syncAnalysisData() {
  try {
    console.log('[Service Worker] Syncing analysis data...');
    // Implementation depends on your data storage strategy
    // This is a placeholder for background sync logic
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Background sync failed:', error);
    throw error;
  }
}

/**
 * Message Handler - Communication with main thread
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(STATIC_CACHE)
        .then(cache => cache.addAll(event.data.payload))
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then(cacheNames => Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        ))
    );
  }
});

/**
 * Push Notification Handler (for future use)
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Alojamento Insights';
  const options = {
    body: data.body || 'New notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

console.log('[Service Worker] Script loaded');
