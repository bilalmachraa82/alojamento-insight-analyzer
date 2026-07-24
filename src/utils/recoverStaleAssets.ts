const RECOVERY_KEY = 'mariafaz-stale-assets-recovery-v3';
const MAX_RECOVERY_ATTEMPTS = 2;

const STALE_ASSET_PATTERNS = [
  "Export 'supabase' is not defined in module",
  "Export \"supabase\" is not defined in module",
  'does not provide an export named',
  'Failed to execute \'appendChild\' on \'Node\'',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
  'Unable to preload CSS',
];

type VitePreloadErrorEvent = Event & { payload?: unknown };

function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name} ${error.message} ${error.stack ?? ''}`;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function isStaleAssetError(error: unknown): boolean {
  const message = stringifyError(error);
  return STALE_ASSET_PATTERNS.some((pattern) => message.includes(pattern));
}

function isAppCache(name: string): boolean {
  if (name.startsWith('alojamento-insights-')) {
    return true;
  }

  return /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);
}

async function clearStaleBrowserState(): Promise<void> {
  if ('caches' in window) {
    const cacheNames = await window.caches.keys();
    await Promise.allSettled(
      cacheNames
        .filter(isAppCache)
        .map((name) => window.caches.delete(name))
    );
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registrations
        .filter((registration) => registration.scope.startsWith(`${window.location.origin}/`))
        .map((registration) => registration.unregister())
    );
  }
}

export async function recoverFromStaleAssets(error: unknown): Promise<boolean> {
  if (!isStaleAssetError(error)) {
    return false;
  }

  const recoveryAttempts = Number(window.sessionStorage.getItem(RECOVERY_KEY) ?? '0');
  if (recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
    return false;
  }

  window.sessionStorage.setItem(RECOVERY_KEY, String(recoveryAttempts + 1));

  try {
    await clearStaleBrowserState();
  } finally {
    window.location.reload();
  }

  return true;
}

export function installStaleAssetRecovery(): void {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    const preloadEvent = event as VitePreloadErrorEvent;
    void recoverFromStaleAssets(preloadEvent.payload ?? event);
  });

  window.addEventListener('error', (event) => {
    void recoverFromStaleAssets(event.error ?? event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    void recoverFromStaleAssets(event.reason);
  });
}