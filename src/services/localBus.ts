/* ==================== REAL-TIME MULTI-TAB SYNC BUS ==================== */
export const LOCAL_SYNC_EVENT = 'superapps_local_sync';
export const localBus = new EventTarget();

export const notifyLocalChange = (key: string): void => {
  try {
    localBus.dispatchEvent(new CustomEvent(LOCAL_SYNC_EVENT, { detail: { key } }));
  } catch {
    // fallback
  }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent(LOCAL_SYNC_EVENT, { detail: { key } }));
    } catch {
      // fallback
    }
  }
};
