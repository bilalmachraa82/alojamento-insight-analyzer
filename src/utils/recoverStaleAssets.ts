const RECOVERY_KEY = 'mariafaz-stale-assets-recovery';

const STALE_ASSET_PATTERNS = [
  "Export 'supabase' is not defined in module",
  'does not provide an export named',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
];

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

export async function recoverFromStaleAssets(error: unknown): Promise<boolean> {
  if (!isStaleAssetError(error)) {
    return false;
  }

  const lastRecovery = window.sessionStorage.getItem(RECOVERY_KEY);
  if (lastRecovery) {
    return true;
  }

  window.sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));

  if ('caches' in window) {
    const cacheNames = await window.caches.keys();
    await Promise.allSettled(
      cacheNames
        .filter((name) => name.startsWith('alojamento-insights-'))
        .map((name) => window.caches.delete(name))
    );
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registrations
        .filter((registration) => registration.scope === `${window.location.origin}/`)
        .map((registration) => registration.unregister())
    );
  }

  window.location.reload();
  return true;
}

export function installStaleAssetRecovery(): void {
  window.addEventListener('error', (event) => {
    void recoverFromStaleAssets(event.error ?? event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    void recoverFromStaleAssets(event.reason);
  });
}