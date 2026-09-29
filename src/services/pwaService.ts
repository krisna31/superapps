// PWA Service: Service Worker registration, install prompts & persistent storage lock

let deferredInstallPrompt: any = null;
let installListeners: Array<(canInstall: boolean) => void> = [];

export function initPwa(): void {
  if (typeof window === 'undefined') return;

  // 1. Listen for browser install prompt
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    notifyInstallListeners(true);
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    notifyInstallListeners(false);
  });

  // 2. Register Service Worker in production
  if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    window.addEventListener('load', () => {
      const baseUrl = import.meta.env.BASE_URL || './';
      const swUrl = `${baseUrl.replace(/\/$/, '')}/sw.js`;
      navigator.serviceWorker.register(swUrl).catch((err) => {
        console.warn('ServiceWorker registration error:', err);
      });
    });
  }

  // 3. Request persistent storage (prevents browser from evicting SQLite IndexedDB)
  requestPersistentStorage();
}

export function isInstallPromptAvailable(): boolean {
  return deferredInstallPrompt !== null;
}

export const promptInstall = promptPwaInstall;

export async function registerServiceWorker(): Promise<void> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const baseUrl = import.meta.env.BASE_URL || './';
      const swUrl = `${baseUrl.replace(/\/$/, '')}/sw.js`;
      await navigator.serviceWorker.register(swUrl);
    } catch {
      // Ignore
    }
  }
}

export function subscribeToInstallPrompt(listener: (canInstall: boolean) => void): () => void {
  installListeners.push(listener);
  listener(deferredInstallPrompt !== null);
  return () => {
    installListeners = installListeners.filter((l) => l !== listener);
  };
}

function notifyInstallListeners(canInstall: boolean) {
  installListeners.forEach((listener) => listener(canInstall));
}

export async function promptPwaInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  try {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    notifyInstallListeners(false);
    return outcome === 'accepted';
  } catch (err) {
    console.error('Error triggering PWA install prompt:', err);
    return false;
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return isPersisted;
    } catch {
      return false;
    }
  }
  return false;
}

export async function getStorageEstimate(): Promise<{ usedBytes: number; quotaBytes: number; percentage: number }> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 1;
      return {
        usedBytes: used,
        quotaBytes: quota,
        percentage: Math.min(100, Math.round((used / quota) * 100)),
      };
    } catch {
      // Fallback
    }
  }
  return { usedBytes: 0, quotaBytes: 0, percentage: 0 };
}
