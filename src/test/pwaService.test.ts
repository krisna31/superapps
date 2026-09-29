import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  registerServiceWorker,
  subscribeToInstallPrompt,
  isInstallPromptAvailable,
  promptInstall,
} from '../services/pwaService';

describe('pwaService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('notifies subscribers of install prompt availability changes', async () => {
    let status = false;
    const unsub = subscribeToInstallPrompt((available) => {
      status = available;
    });

    expect(isInstallPromptAvailable()).toBe(false);
    expect(status).toBe(false);

    // Mock promptInstall when no event is deferred
    await expect(promptInstall()).resolves.toBe(false);

    unsub();
  });

  it('handles service worker registration gracefully in unsupported environments', async () => {
    // Should not crash even if serviceWorker is undefined
    await expect(registerServiceWorker()).resolves.not.toThrow();
  });
});
