/**
 * Tiny event bus that carries persistence failures to the UI (finding M3).
 *
 * Before this existed every failed Firestore / localStorage write ended at a
 * `console.warn`, so users lost data without ever being told. Cloud writes are
 * now fire-and-forget (the SDK queues them offline), which means the caller
 * can no longer `await` an error — this bus is how the error reaches
 * `SyncStatusBadge` instead.
 */
export interface SyncErrorEvent {
  /** Operation that failed, e.g. `save`, `delete`, `migrate`. */
  op: string;
  /** Logical collection name, e.g. `tasks`, `shortlinks`, `system`. */
  collection: string;
  /** Human-readable message suitable for showing in the UI. */
  message: string;
  /** Firebase error code when available (e.g. `permission-denied`). */
  code?: string;
  at: number;
}

type Listener = (event: SyncErrorEvent) => void;

const listeners = new Set<Listener>();
let lastError: SyncErrorEvent | null = null;

const describe = (err: unknown): { message: string; code?: string } => {
  if (err && typeof err === 'object') {
    const e = err as { code?: unknown; message?: unknown; name?: unknown };
    const code = typeof e.code === 'string' ? e.code : undefined;
    if (e.name === 'QuotaExceededError') {
      return { message: 'Browser storage is full. Free some space or sign in to use cloud sync.', code: 'quota-exceeded' };
    }
    if (typeof e.message === 'string' && e.message) return { message: e.message, code };
    if (code) return { message: code, code };
  }
  return { message: String(err) };
};

export const reportSyncError = (op: string, collection: string, err: unknown): SyncErrorEvent => {
  const { message, code } = describe(err);
  const event: SyncErrorEvent = { op, collection, message, code, at: Date.now() };
  lastError = event;
  console.warn(`[sync] ${op} ${collection} failed:`, err);
  listeners.forEach((l) => {
    try {
      l(event);
    } catch {
      // A broken listener must never break persistence.
    }
  });
  return event;
};

export const subscribeSyncErrors = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getLastSyncError = (): SyncErrorEvent | null => lastError;

export const clearLastSyncError = (): void => {
  lastError = null;
};
