import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/firebase/config';
import { reportSyncError } from '@/services/syncErrors';
import { LOCAL_SYNC_EVENT, localBus, notifyLocalChange } from '@/services/localBus';
import { seedGuestSamples } from '@/services/samples';

export type Unsubscribe = () => void;

export type SupportedCollection =
  | 'tasks'
  | 'notes'
  | 'habits'
  | 'expenses'
  | 'snippets'
  | 'dropzone'
  | 'media_history';

export interface CollectionRepo<T extends { id: string }> {
  list(userId: string): Promise<T[]>;
  save(userId: string, item: T): Promise<void>;
  remove(userId: string, id: string): Promise<void>;
  subscribe(userId: string, callback: (items: T[]) => void): Unsubscribe;
}

export function isCloudUser(userId: string): boolean {
  return Boolean(
    isFirebaseConfigured && 
    db && 
    userId && 
    !userId.startsWith('guest-') && 
    !userId.startsWith('local-')
  );
}

const getLocalKey = (name: string, userId: string) => `superapps_${name}_${userId}`;

const getLocalData = <T>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setLocalData = <T>(key: string, data: T[], collectionName: string): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    notifyLocalChange(key);
  } catch (err) {
    reportSyncError('save', collectionName, err);
    throw err;
  }
};

/**
 * Creates a generic collection repository adhering to the single-backend rule:
 * - Signed-in users write to Firestore (with persistent cache) and never fall back to localStorage (C1).
 * - Writes are non-blocking so offline users are not frozen waiting for server ack (C4).
 * - Errors are routed to syncErrorBus for user-visible status (M3).
 * - Guests use localStorage with sample seeding on first access (C3).
 */
export function createCollectionRepo<T extends { id: string }>(cfg: {
  name: SupportedCollection;
}): CollectionRepo<T> {
  const colName = cfg.name;

  return {
    async list(userId: string): Promise<T[]> {
      if (isCloudUser(userId)) {
        try {
          const colRef = collection(db!, 'users', userId, colName);
          const snap = await getDocs(colRef);
          return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
        } catch (err) {
          reportSyncError('list', colName, err);
          return [];
        }
      }

      // Guest / local mode
      if (userId.startsWith('guest-') || userId.startsWith('test-')) {
        seedGuestSamples(userId);
      }
      const key = getLocalKey(colName, userId);
      return getLocalData<T>(key);
    },

    async save(userId: string, item: T): Promise<void> {
      if (isCloudUser(userId)) {
        try {
          const docRef = doc(db!, 'users', userId, colName, item.id);
          // Hand off to Firestore SDK and do not block the UI waiting for server ack.
          // Firestore SDK writes to persistent cache immediately and dispatches onSnapshot.
          const p = setDoc(docRef, item, { merge: true });
          p.catch((err) => {
            reportSyncError('save', colName, err);
          });
          return Promise.resolve();
        } catch (err) {
          reportSyncError('save', colName, err);
          return Promise.resolve();
        }
      }

      // Guest / local mode
      const key = getLocalKey(colName, userId);
      const items = getLocalData<T>(key);
      const index = items.findIndex((i) => i.id === item.id);
      if (index >= 0) {
        items[index] = item;
      } else {
        items.unshift(item);
      }
      setLocalData(key, items, colName);
      return Promise.resolve();
    },

    async remove(userId: string, id: string): Promise<void> {
      if (isCloudUser(userId)) {
        try {
          const docRef = doc(db!, 'users', userId, colName, id);
          const p = deleteDoc(docRef);
          p.catch((err) => {
            reportSyncError('delete', colName, err);
          });
          return Promise.resolve();
        } catch (err) {
          reportSyncError('delete', colName, err);
          return Promise.resolve();
        }
      }

      // Guest / local mode
      const key = getLocalKey(colName, userId);
      const items = getLocalData<T>(key).filter((i) => i.id !== id);
      setLocalData(key, items, colName);
      return Promise.resolve();
    },

    subscribe(userId: string, callback: (items: T[]) => void): Unsubscribe {
      let isActive = true;

      if (isCloudUser(userId)) {
        try {
          const colRef = collection(db!, 'users', userId, colName);
          const unsubscribeFirestore = onSnapshot(
            colRef,
            (snapshot) => {
              if (!isActive) return;
              const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
              callback(items);
            },
            (error) => {
              reportSyncError('subscribe', colName, error);
            }
          );

          return () => {
            isActive = false;
            unsubscribeFirestore();
          };
        } catch (err) {
          reportSyncError('subscribe', colName, err);
          return () => {
            isActive = false;
          };
        }
      }

      // Guest / local mode
      if (userId.startsWith('guest-') || userId.startsWith('test-')) {
        seedGuestSamples(userId);
      }
      const key = getLocalKey(colName, userId);

      // Initial push
      callback(getLocalData<T>(key));

      const handleUpdate = () => {
        if (!isActive) return;
        callback(getLocalData<T>(key));
      };

      const handleLocalEvent = (e: Event) => {
        const detail = (e as CustomEvent<{ key?: string }>).detail;
        if (!detail || detail.key === key) {
          handleUpdate();
        }
      };

      const handleStorageEvent = (e: StorageEvent) => {
        if (!e.key || e.key === key) {
          handleUpdate();
        }
      };

      localBus.addEventListener(LOCAL_SYNC_EVENT, handleLocalEvent);
      if (typeof window !== 'undefined') {
        window.addEventListener(LOCAL_SYNC_EVENT, handleLocalEvent);
        window.addEventListener('storage', handleStorageEvent);
      }

      return () => {
        isActive = false;
        localBus.removeEventListener(LOCAL_SYNC_EVENT, handleLocalEvent);
        if (typeof window !== 'undefined') {
          window.removeEventListener(LOCAL_SYNC_EVENT, handleLocalEvent);
          window.removeEventListener('storage', handleStorageEvent);
        }
      };
    },
  };
}
