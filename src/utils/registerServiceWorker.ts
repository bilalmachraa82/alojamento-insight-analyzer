/**
 * Service Worker Registration Utility
 *
 * Handles:
 * - Service worker registration on app load
 * - Update detection and notification
 * - Online/offline event handling
 * - Error handling and logging
 * - TypeScript type safety
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

/**
 * Check if service workers are supported and app is served over HTTPS or localhost
 */
function isServiceWorkerSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
  );
}

/**
 * Register service worker with configuration callbacks
 */
export async function registerServiceWorker(config: ServiceWorkerConfig = {}): Promise<void> {
  // Check if service workers are supported
  if (!isServiceWorkerSupported()) {
    console.log('[PWA] Service workers are not supported or not running on HTTPS/localhost');
    return;
  }

  try {
    // Wait for page to load completely before registering
    if (document.readyState === 'loading') {
      await new Promise((resolve) => {
        window.addEventListener('load', resolve);
      });
    }

    console.log('[PWA] Registering service worker...');

    // Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Always check for updates
    });

    console.log('[PWA] Service worker registered successfully:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      console.log('[PWA] New service worker found, installing...');

      newWorker.addEventListener('statechange', () => {
        console.log('[PWA] Service worker state changed:', newWorker.state);

        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New service worker available, show update notification
            console.log('[PWA] New content available, please refresh');
            if (config.onUpdate) {
              config.onUpdate(registration);
            } else {
              showUpdateNotification(registration);
            }
          } else {
            // First time installation
            console.log('[PWA] Content cached for offline use');
            if (config.onSuccess) {
              config.onSuccess(registration);
            }
          }
        }
      });
    });

    // Check for updates periodically (every hour)
    setInterval(() => {
      console.log('[PWA] Checking for service worker updates...');
      registration.update();
    }, 60 * 60 * 1000);

    // Manual update check on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('[PWA] Page visible, checking for updates...');
        registration.update();
      }
    });

  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
  }
}

/**
 * Show update notification to user
 */
function showUpdateNotification(registration: ServiceWorkerRegistration): void {
  const updateBanner = document.createElement('div');
  updateBanner.id = 'sw-update-banner';
  updateBanner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #2563eb;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 16px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    max-width: 90%;
  `;

  updateBanner.innerHTML = `
    <span>New version available!</span>
    <button id="sw-update-btn" style="
      background: white;
      color: #2563eb;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
    ">
      Update Now
    </button>
    <button id="sw-dismiss-btn" style="
      background: transparent;
      color: white;
      border: 1px solid white;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
    ">
      Later
    </button>
  `;

  document.body.appendChild(updateBanner);

  // Handle update button click
  document.getElementById('sw-update-btn')?.addEventListener('click', () => {
    const waiting = registration.waiting;
    if (waiting) {
      // Tell service worker to skip waiting
      waiting.postMessage({ type: 'SKIP_WAITING' });

      // Listen for controlling service worker change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload the page to get new content
        window.location.reload();
      });
    }
  });

  // Handle dismiss button click
  document.getElementById('sw-dismiss-btn')?.addEventListener('click', () => {
    updateBanner.remove();
  });
}

/**
 * Unregister service worker (for development/testing)
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!isServiceWorkerSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const unregistered = await registration.unregister();

    if (unregistered) {
      console.log('[PWA] Service worker unregistered successfully');

      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      console.log('[PWA] All caches cleared');
    }
  } catch (error) {
    console.error('[PWA] Service worker unregistration failed:', error);
  }
}

/**
 * Setup online/offline event listeners
 */
export function setupNetworkListeners(config: ServiceWorkerConfig = {}): void {
  // Handle online event
  window.addEventListener('online', () => {
    console.log('[PWA] Network status: ONLINE');
    if (config.onOnline) {
      config.onOnline();
    } else {
      showNetworkStatus('online');
    }
  });

  // Handle offline event
  window.addEventListener('offline', () => {
    console.log('[PWA] Network status: OFFLINE');
    if (config.onOffline) {
      config.onOffline();
    } else {
      showNetworkStatus('offline');
    }
  });

  // Initial network status check
  if (!navigator.onLine) {
    console.log('[PWA] Initial network status: OFFLINE');
    if (config.onOffline) {
      config.onOffline();
    }
  }
}

/**
 * Show network status notification
 */
function showNetworkStatus(status: 'online' | 'offline'): void {
  // Remove existing notification if any
  const existing = document.getElementById('network-status-banner');
  if (existing) {
    existing.remove();
  }

  const banner = document.createElement('div');
  banner.id = 'network-status-banner';
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${status === 'online' ? '#10b981' : '#ef4444'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 600;
    transition: opacity 0.3s;
  `;

  banner.textContent = status === 'online'
    ? '✓ Back online'
    : '✗ You are offline';

  document.body.appendChild(banner);

  // Auto-hide after 3 seconds for online status
  if (status === 'online') {
    setTimeout(() => {
      banner.style.opacity = '0';
      setTimeout(() => banner.remove(), 300);
    }, 3000);
  }
}

/**
 * Request background sync (for offline form submissions)
 */
export async function requestBackgroundSync(tag: string): Promise<void> {
  if (!isServiceWorkerSupported()) {
    console.log('[PWA] Background sync not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if sync is supported
    if ('sync' in registration) {
      await (registration as any).sync.register(tag);
      console.log(`[PWA] Background sync registered: ${tag}`);
    } else {
      console.log('[PWA] Background sync not supported by browser');
    }
  } catch (error) {
    console.error('[PWA] Background sync registration failed:', error);
  }
}

/**
 * Clear all service worker caches (for debugging)
 */
export async function clearAllCaches(): Promise<void> {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    console.log('[PWA] All caches cleared successfully');
  } catch (error) {
    console.error('[PWA] Failed to clear caches:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<Record<string, number>> {
  const stats: Record<string, number> = {};

  try {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats[cacheName] = keys.length;
    }

    console.log('[PWA] Cache statistics:', stats);
  } catch (error) {
    console.error('[PWA] Failed to get cache stats:', error);
  }

  return stats;
}
