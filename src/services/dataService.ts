import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where,
  increment,
  onSnapshot,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '@/firebase/config';
import { 
  TaskItem, 
  NoteItem, 
  HabitItem, 
  ExpenseItem, 
  SnippetItem, 
  ShortlinkItem,
  ShortlinkClickLog,
  DropzoneItem,
  UploadProgressCallback,
  MediaDownloadItem,
  SystemSettings,
  WorkspaceBackup 
} from '@/types';
import { reportSyncError } from '@/services/syncErrors';
import { LOCAL_SYNC_EVENT, localBus, notifyLocalChange } from '@/services/localBus';
import { 
  SAMPLE_TASK_TITLES, 
  SAMPLE_NOTE_TITLES, 
  SAMPLE_HABIT_TITLES, 
  SAMPLE_EXPENSE_DESCRIPTIONS, 
  SAMPLE_SNIPPET_TITLES,
  isUnchangedSample,
  seedGuestSamples
} from '@/services/samples';
import { createCollectionRepo, isCloudUser, Unsubscribe } from '@/services/repo/createCollectionRepo';
import { sanitizeRedirectUrl, sanitizeFileName, isDangerousFileExtension } from '@/utils/security';

export type { Unsubscribe };
export { LOCAL_SYNC_EVENT, localBus, notifyLocalChange };
export { seedGuestSamples };

export class SlugTakenError extends Error {
  constructor(slug: string) {
    super(`The shortlink slug "${slug}" is already taken by another user.`);
    this.name = 'SlugTakenError';
  }
}

export const SYSTEM_SETTINGS_KEY = 'superapps_system_settings';

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  allowGuestAccess: false,
  allowUserRegistration: false,
  superadminEmail: 'jelvinkrisnaputra31@gmail.com',
};

export const getCachedSystemSettings = (): SystemSettings => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_SYSTEM_SETTINGS };
  }
  try {
    const raw = localStorage.getItem(SYSTEM_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        allowGuestAccess: parsed.allowGuestAccess !== undefined ? Boolean(parsed.allowGuestAccess) : DEFAULT_SYSTEM_SETTINGS.allowGuestAccess,
        allowUserRegistration: parsed.allowUserRegistration !== undefined ? Boolean(parsed.allowUserRegistration) : DEFAULT_SYSTEM_SETTINGS.allowUserRegistration,
        superadminEmail: parsed.superadminEmail || DEFAULT_SYSTEM_SETTINGS.superadminEmail,
      };
    }
  } catch {
    // fallback
  }
  return { ...DEFAULT_SYSTEM_SETTINGS };
};

// Generic Collection Repositories (tasks, notes, habits, expenses, snippets, dropzone)
const taskRepo = createCollectionRepo<TaskItem>({ name: 'tasks' });
const noteRepo = createCollectionRepo<NoteItem>({ name: 'notes' });
const habitRepo = createCollectionRepo<HabitItem>({ name: 'habits' });
const expenseRepo = createCollectionRepo<ExpenseItem>({ name: 'expenses' });
const snippetRepo = createCollectionRepo<SnippetItem>({ name: 'snippets' });
const dropzoneRepo = createCollectionRepo<DropzoneItem>({ name: 'dropzone' });
const mediaHistoryRepo = createCollectionRepo<MediaDownloadItem>({ name: 'media_history' });

// Local storage helper for shortlinks
const getLocalData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const setLocalData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    notifyLocalChange(key);
  } catch (err) {
    console.error('Failed to write to localStorage:', err);
  }
};

export const dataService = {
  /* ==================== TASKS SERVICE ==================== */
  getTasks: (userId: string): Promise<TaskItem[]> => taskRepo.list(userId),
  saveTask: (userId: string, task: TaskItem): Promise<void> => taskRepo.save(userId, task),
  deleteTask: (userId: string, taskId: string): Promise<void> => taskRepo.remove(userId, taskId),
  subscribeToTasks: (userId: string, callback: (tasks: TaskItem[]) => void): Unsubscribe =>
    taskRepo.subscribe(userId, callback),

  /* ==================== NOTES SERVICE ==================== */
  getNotes: (userId: string): Promise<NoteItem[]> => noteRepo.list(userId),
  saveNote: (userId: string, note: NoteItem): Promise<void> => noteRepo.save(userId, note),
  deleteNote: (userId: string, noteId: string): Promise<void> => noteRepo.remove(userId, noteId),
  subscribeToNotes: (userId: string, callback: (notes: NoteItem[]) => void): Unsubscribe =>
    noteRepo.subscribe(userId, callback),

  /* ==================== HABITS SERVICE ==================== */
  getHabits: (userId: string): Promise<HabitItem[]> => habitRepo.list(userId),
  saveHabit: (userId: string, habit: HabitItem): Promise<void> => habitRepo.save(userId, habit),
  deleteHabit: (userId: string, habitId: string): Promise<void> => habitRepo.remove(userId, habitId),
  subscribeToHabits: (userId: string, callback: (habits: HabitItem[]) => void): Unsubscribe =>
    habitRepo.subscribe(userId, callback),

  /* ==================== EXPENSES SERVICE ==================== */
  getExpenses: (userId: string): Promise<ExpenseItem[]> => expenseRepo.list(userId),
  saveExpense: (userId: string, expense: ExpenseItem): Promise<void> => expenseRepo.save(userId, expense),
  deleteExpense: (userId: string, expenseId: string): Promise<void> => expenseRepo.remove(userId, expenseId),
  subscribeToExpenses: (userId: string, callback: (expenses: ExpenseItem[]) => void): Unsubscribe =>
    expenseRepo.subscribe(userId, callback),

  /* ==================== SNIPPETS SERVICE ==================== */
  getSnippets: (userId: string): Promise<SnippetItem[]> => snippetRepo.list(userId),
  saveSnippet: (userId: string, snippet: SnippetItem): Promise<void> => snippetRepo.save(userId, snippet),
  deleteSnippet: (userId: string, snippetId: string): Promise<void> => snippetRepo.remove(userId, snippetId),
  subscribeToSnippets: (userId: string, callback: (snippets: SnippetItem[]) => void): Unsubscribe =>
    snippetRepo.subscribe(userId, callback),

  /* ==================== SHORTLINKS SERVICE ==================== */
  async getShortlinks(userId: string): Promise<ShortlinkItem[]> {
    if (isCloudUser(userId)) {
      try {
        const colRef = collection(db!, 'shortlinks');
        const q = query(colRef, where('userId', '==', userId));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ShortlinkItem));
      } catch (err) {
        reportSyncError('list', 'shortlinks', err);
        return [];
      }
    }
    const key = `superapps_shortlinks_${userId}`;
    return getLocalData<ShortlinkItem>(key);
  },

  async saveShortlink(userId: string, shortlink: ShortlinkItem): Promise<void> {
    const validatedUrl = sanitizeRedirectUrl(shortlink.originalUrl);
    if (!validatedUrl) {
      throw new Error('Invalid shortlink destination URL. Only HTTP and HTTPS protocols are allowed.');
    }
    shortlink.originalUrl = validatedUrl;

    if (isCloudUser(userId)) {
      const docRef = doc(db!, 'shortlinks', shortlink.slug);
      // Atomic verification and creation using Firestore transaction (Finding H3)
      try {
        await runTransaction(db!, async (transaction) => {
          const snap = await transaction.get(docRef);
          if (snap.exists()) {
            const data = snap.data() as Partial<ShortlinkItem>;
            if (data.userId && data.userId !== userId) {
              throw new SlugTakenError(shortlink.slug);
            }
          }
          transaction.set(docRef, { ...shortlink, userId }, { merge: true });
        });
        return;
      } catch (err) {
        if (err instanceof SlugTakenError) {
          throw err;
        }
        reportSyncError('save', 'shortlinks', err);
        throw err;
      }
    }

    // Guest / local mode
    const key = `superapps_shortlinks_${userId}`;
    const items = getLocalData<ShortlinkItem>(key);
    const index = items.findIndex((i) => i.slug === shortlink.slug);
    if (index >= 0) {
      items[index] = shortlink;
    } else {
      items.unshift(shortlink);
    }
    setLocalData(key, items);
  },

  async resolveShortlink(slug: string): Promise<ShortlinkItem | null> {
    const clickLog: ShortlinkClickLog = {
      timestamp: Date.now(),
      device: 'Desktop',
      os: 'Other',
      browser: 'Other',
      referrer: 'Direct'
    };

    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        clickLog.device = 'Tablet';
      } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) {
        clickLog.device = 'Mobile';
      } else {
        clickLog.device = 'Desktop';
      }

      if (/windows/i.test(ua)) clickLog.os = 'Windows';
      else if (/macintosh|mac os x/i.test(ua)) clickLog.os = 'macOS';
      else if (/android/i.test(ua)) clickLog.os = 'Android';
      else if (/iphone|ipad|ipod/i.test(ua)) clickLog.os = 'iOS';
      else if (/linux/i.test(ua)) clickLog.os = 'Linux';
      else if (/cros/i.test(ua)) clickLog.os = 'Chrome OS';

      if (/edg/i.test(ua)) clickLog.browser = 'Edge';
      else if (/opr|opera/i.test(ua)) clickLog.browser = 'Opera';
      else if (/chrome|crios/i.test(ua)) clickLog.browser = 'Chrome';
      else if (/firefox|fxios/i.test(ua)) clickLog.browser = 'Firefox';
      else if (/safari/i.test(ua)) clickLog.browser = 'Safari';

      if (document.referrer && document.referrer.trim()) {
        try {
          const refUrl = new URL(document.referrer);
          clickLog.referrer = refUrl.hostname || document.referrer;
        } catch {
          clickLog.referrer = document.referrer;
        }
      }

      // Quick IP and Geo lookup with 1.2s timeout so redirect is never delayed
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        const geoRes = await fetch('https://ipwho.is/', { signal: controller.signal });
        clearTimeout(timeout);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.success !== false) {
            clickLog.ip = geoData.ip;
            clickLog.country = geoData.country;
            clickLog.countryCode = geoData.country_code;
            clickLog.city = geoData.city;
            clickLog.region = geoData.region;
          }
        }
      } catch {
        // Fallback to fast country.is lookup
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 800);
          const cRes = await fetch('https://api.country.is/', { signal: controller.signal });
          clearTimeout(timeout);
          if (cRes.ok) {
            const cData = await cRes.json();
            if (cData && cData.country) {
              clickLog.ip = cData.ip;
              clickLog.countryCode = cData.country;
            }
          }
        } catch {
          // offline or restricted, proceed gracefully
        }
      }
    }

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'shortlinks', slug);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as ShortlinkItem;
          const currentRecent = Array.isArray(data.recentClicks) ? data.recentClicks : [];
          const updatedRecent = [clickLog, ...currentRecent].slice(0, 50);

          // Update click count and click tracker log asynchronously (Finding H2)
          updateDoc(docRef, {
            clicks: increment(1),
            recentClicks: updatedRecent,
          }).catch((err) => {
            console.warn('Click counter increment non-fatal error:', err);
          });
          return { ...data, recentClicks: updatedRecent };
        }
      } catch (err) {
        console.warn('Firestore resolveShortlink fallback:', err);
      }
    }

    // Fallback: search across local storages
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('superapps_shortlinks_')) {
        const list = getLocalData<ShortlinkItem>(k);
        const found = list.find((s) => s.slug === slug);
        if (found) {
          found.clicks += 1;
          const currentRecent = Array.isArray(found.recentClicks) ? found.recentClicks : [];
          found.recentClicks = [clickLog, ...currentRecent].slice(0, 50);
          setLocalData(k, list);
          return found;
        }
      }
    }
    return null;
  },

  async deleteShortlink(userId: string, slug: string): Promise<void> {
    if (isCloudUser(userId)) {
      try {
        const docRef = doc(db!, 'shortlinks', slug);
        const p = deleteDoc(docRef);
        p.catch((err) => reportSyncError('delete', 'shortlinks', err));
        return Promise.resolve();
      } catch (err) {
        reportSyncError('delete', 'shortlinks', err);
        return Promise.resolve();
      }
    }
    const key = `superapps_shortlinks_${userId}`;
    const items = getLocalData<ShortlinkItem>(key).filter((i) => i.slug !== slug);
    setLocalData(key, items);
  },

  subscribeToShortlinks(userId: string, callback: (links: ShortlinkItem[]) => void): Unsubscribe {
    let isActive = true;

    if (isCloudUser(userId)) {
      try {
        const targetQuery = query(collection(db!, 'shortlinks'), where('userId', '==', userId));
        const unsubscribeFirestore = onSnapshot(
          targetQuery,
          (snapshot) => {
            if (!isActive) return;
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ShortlinkItem));
            callback(items);
          },
          (error) => {
            reportSyncError('subscribe', 'shortlinks', error);
          }
        );
        return () => {
          isActive = false;
          unsubscribeFirestore();
        };
      } catch (err) {
        reportSyncError('subscribe', 'shortlinks', err);
        return () => {
          isActive = false;
        };
      }
    }

    // Guest / local mode
    const key = `superapps_shortlinks_${userId}`;
    callback(getLocalData<ShortlinkItem>(key));

    const handleUpdate = () => {
      if (!isActive) return;
      callback(getLocalData<ShortlinkItem>(key));
    };

    const handleLocalEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string }>).detail;
      if (!detail || detail.key === key) handleUpdate();
    };

    localBus.addEventListener(LOCAL_SYNC_EVENT, handleLocalEvent);
    if (typeof window !== 'undefined') {
      window.addEventListener(LOCAL_SYNC_EVENT, handleLocalEvent);
      window.addEventListener('storage', (e) => {
        if (!e.key || e.key === key) handleUpdate();
      });
    }

    return () => {
      isActive = false;
      localBus.removeEventListener(LOCAL_SYNC_EVENT, handleLocalEvent);
    };
  },

  /* ==================== DROPZONE SERVICE ==================== */
  getDropzoneItems: (userId: string): Promise<DropzoneItem[]> => dropzoneRepo.list(userId),

  async uploadFile(
    userId: string, 
    file: File, 
    onProgress?: UploadProgressCallback
  ): Promise<DropzoneItem> {
    const fileId = 'drop-' + Math.random().toString(36).substring(2, 9);

    if (isDangerousFileExtension(file.name)) {
      throw new Error('Executable and script files (.exe, .bat, .sh, etc.) are blocked for security.');
    }
    const safeName = sanitizeFileName(file.name);

    // Initial progress report (0%)
    onProgress?.({ loaded: 0, total: file.size, percent: 0 });

    // Helper: read file as Data URL for offline / fallback persistence across refreshes
    const toDataUrl = async (f: File): Promise<string> => {
      return new Promise<string>((resolve) => {
        if (typeof FileReader === 'undefined') {
          onProgress?.({ loaded: f.size, total: f.size, percent: 100 });
          return resolve(typeof URL !== 'undefined' ? URL.createObjectURL(f) : '');
        }
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable && e.total > 0) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress?.({ loaded: e.loaded, total: e.total, percent });
          }
        };
        reader.onloadend = () => {
          onProgress?.({ loaded: f.size, total: f.size, percent: 100 });
          resolve((reader.result as string) || (typeof URL !== 'undefined' ? URL.createObjectURL(f) : ''));
        };
        reader.onerror = () => resolve(typeof URL !== 'undefined' ? URL.createObjectURL(f) : '');
        reader.readAsDataURL(f);
      });
    };

    // If Cloud user with Firebase Storage configured, attempt cloud upload with a 5-second timeout
    if (isCloudUser(userId) && storage) {
      try {
        const storagePath = `dropzone/${userId}/${Date.now()}_${safeName}`;
        const storageReference = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageReference, file);

        // Track live Firebase upload progress
        uploadTask.on('state_changed', (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress?.({
              loaded: snapshot.bytesTransferred,
              total: snapshot.totalBytes,
              percent,
            });
          }
        });

        // Add 5-second timeout to prevent hanging if bucket is uninitialized in Firebase Console
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            try {
              uploadTask.cancel();
            } catch {
              // ignore
            }
            reject(new Error('Firebase Storage timeout. Bucket may not be initialized in Firebase Console.'));
          }, 5000);
        });

        const snapshot = await Promise.race([uploadTask, timeoutPromise]);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        onProgress?.({ loaded: file.size, total: file.size, percent: 100 });

        const dropItem: DropzoneItem = {
          id: fileId,
          userId,
          fileName: safeName,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          downloadUrl,
          storagePath,
          uploadedAt: Date.now(),
        };

        // Save dropzone metadata to Firestore users/{uid}/dropzone/{id} (Finding H4)
        await dropzoneRepo.save(userId, dropItem);
        return dropItem;
      } catch (err) {
        console.warn('Firebase Storage upload failed, falling back to local persistent storage:', err);
        // Fall back gracefully below
      }
    }

    // Guest / local fallback (also used if Firebase Storage bucket is uninitialized)
    let fallbackUrl: string;
    if (file.size <= 4 * 1024 * 1024) {
      fallbackUrl = await toDataUrl(file);
    } else if (typeof URL !== 'undefined' && URL.createObjectURL) {
      onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
      fallbackUrl = URL.createObjectURL(file);
    } else {
      onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
      fallbackUrl = '';
    }

    const dropItem: DropzoneItem = {
      id: fileId,
      userId,
      fileName: safeName,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      downloadUrl: fallbackUrl,
      storagePath: 'local-blob',
      uploadedAt: Date.now(),
    };

    await dropzoneRepo.save(userId, dropItem);
    return dropItem;
  },

  async deleteDropzoneItem(userId: string, item: DropzoneItem): Promise<void> {
    if (isCloudUser(userId) && storage && item.storagePath !== 'local-blob') {
      try {
        const fileRef = ref(storage, item.storagePath);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn('Storage deleteObject fallback:', err);
      }
    }
    await dropzoneRepo.remove(userId, item.id);
  },

  subscribeToDropzone: (userId: string, callback: (items: DropzoneItem[]) => void): Unsubscribe =>
    dropzoneRepo.subscribe(userId, callback),

  /* ==================== MEDIA DOWNLOADER HISTORY SERVICE ==================== */
  getMediaHistory: (userId: string): Promise<MediaDownloadItem[]> =>
    mediaHistoryRepo.list(userId),

  async saveMediaDownloadItem(userId: string, item: Omit<MediaDownloadItem, 'id' | 'createdAt' | 'userId'> & { id?: string; createdAt?: number; userId?: string }): Promise<MediaDownloadItem> {
    const historyItem: MediaDownloadItem = {
      id: item.id || 'media-' + Math.random().toString(36).substring(2, 9),
      userId,
      originalUrl: item.originalUrl,
      title: item.title,
      platform: item.platform,
      format: item.format,
      quality: item.quality,
      downloadUrl: item.downloadUrl,
      thumbnailUrl: item.thumbnailUrl,
      filename: item.filename,
      createdAt: item.createdAt || Date.now(),
    };
    await mediaHistoryRepo.save(userId, historyItem);
    return historyItem;
  },

  deleteMediaDownloadItem: (userId: string, id: string): Promise<void> =>
    mediaHistoryRepo.remove(userId, id),

  async clearMediaHistory(userId: string): Promise<void> {
    const items = await mediaHistoryRepo.list(userId);
    for (const item of items) {
      await mediaHistoryRepo.remove(userId, item.id);
    }
  },

  subscribeToMediaHistory: (userId: string, callback: (items: MediaDownloadItem[]) => void): Unsubscribe =>
    mediaHistoryRepo.subscribe(userId, callback),

  /* ==================== SYSTEM SETTINGS SERVICE ==================== */
  async getSystemSettings(): Promise<SystemSettings> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'system', 'settings');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Partial<SystemSettings>;
          const settings: SystemSettings = {
            allowGuestAccess:
              data.allowGuestAccess !== undefined
                ? Boolean(data.allowGuestAccess)
                : DEFAULT_SYSTEM_SETTINGS.allowGuestAccess,
            allowUserRegistration:
              data.allowUserRegistration !== undefined
                ? Boolean(data.allowUserRegistration)
                : DEFAULT_SYSTEM_SETTINGS.allowUserRegistration,
            superadminEmail: data.superadminEmail || DEFAULT_SYSTEM_SETTINGS.superadminEmail,
          };
          try {
            localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(settings));
          } catch {
            // ignore
          }
          return settings;
        }
      } catch (err) {
        console.warn('Firestore getSystemSettings fallback:', err);
      }
    }

    return getCachedSystemSettings();
  },

  async saveSystemSettings(settings: SystemSettings): Promise<void> {
    try {
      localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(settings));
      notifyLocalChange(SYSTEM_SETTINGS_KEY);
    } catch (err) {
      console.error('Failed to save system settings to localStorage:', err);
    }

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'system', 'settings');
        await setDoc(docRef, settings, { merge: true });
      } catch (err) {
        reportSyncError('save', 'system', err);
        console.warn('Firestore saveSystemSettings warning:', err);
      }
    }
  },

  /* ==================== ONE-TIME CLEANUP OF LEGACY SAMPLE ITEMS (Q3) ==================== */
  async cleanupLegacySamples(uid: string): Promise<void> {
    if (!isCloudUser(uid)) return;
    const flagKey = `superapps_legacy_samples_cleaned_${uid}`;
    if (typeof window !== 'undefined' && localStorage.getItem(flagKey) === 'true') {
      return;
    }

    try {
      const batch = writeBatch(db!);
      let ops = 0;

      // Check all collections concurrently with Promise.all for fast execution
      const checkTasks = Object.entries(SAMPLE_TASK_TITLES).map(async ([id, title]) => {
        const snap = await getDoc(doc(db!, 'users', uid, 'tasks', id));
        if (snap.exists() && snap.data().title === title) {
          batch.delete(snap.ref);
          ops++;
        }
      });

      const checkNotes = Object.entries(SAMPLE_NOTE_TITLES).map(async ([id, title]) => {
        const snap = await getDoc(doc(db!, 'users', uid, 'notes', id));
        if (snap.exists() && snap.data().title === title) {
          batch.delete(snap.ref);
          ops++;
        }
      });

      const checkHabits = Object.entries(SAMPLE_HABIT_TITLES).map(async ([id, title]) => {
        const snap = await getDoc(doc(db!, 'users', uid, 'habits', id));
        if (snap.exists() && snap.data().title === title) {
          batch.delete(snap.ref);
          ops++;
        }
      });

      const checkExpenses = Object.entries(SAMPLE_EXPENSE_DESCRIPTIONS).map(async ([id, desc]) => {
        const snap = await getDoc(doc(db!, 'users', uid, 'expenses', id));
        if (snap.exists() && snap.data().description === desc) {
          batch.delete(snap.ref);
          ops++;
        }
      });

      const checkSnippets = Object.entries(SAMPLE_SNIPPET_TITLES).map(async ([id, title]) => {
        const snap = await getDoc(doc(db!, 'users', uid, 'snippets', id));
        if (snap.exists() && snap.data().title === title) {
          batch.delete(snap.ref);
          ops++;
        }
      });

      await Promise.all([
        ...checkTasks,
        ...checkNotes,
        ...checkHabits,
        ...checkExpenses,
        ...checkSnippets,
      ]);

      if (ops > 0) {
        await batch.commit();
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(flagKey, 'true');
      }
    } catch (err) {
      console.warn('cleanupLegacySamples non-fatal warning:', err);
    }
  },

  /* ==================== GUEST DATA MIGRATION ==================== */
  async migrateGuestData(
    fromGuestIds: string | string[],
    toUserId: string
  ): Promise<{ success: boolean; migratedCount: number }> {
    if (!fromGuestIds || !toUserId) {
      return { success: true, migratedCount: 0 };
    }

    const ids = Array.isArray(fromGuestIds) ? fromGuestIds : [fromGuestIds];
    let count = 0;

    // Helper to generate a new unique ID for edited sample items so they never collide with cloud docs
    const getMigratedId = (col: string, originalId: string): string => {
      const isSampleId =
        (col === 'tasks' && SAMPLE_TASK_TITLES[originalId]) ||
        (col === 'notes' && SAMPLE_NOTE_TITLES[originalId]) ||
        (col === 'habits' && SAMPLE_HABIT_TITLES[originalId]) ||
        (col === 'expenses' && SAMPLE_EXPENSE_DESCRIPTIONS[originalId]) ||
        (col === 'snippets' && SAMPLE_SNIPPET_TITLES[originalId]);

      return isSampleId
        ? `${col}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        : originalId;
    };

    try {
      const isTargetCloud = isCloudUser(toUserId);

      for (const fromGuestId of ids) {
        if (!fromGuestId || fromGuestId === toUserId) continue;

        // Read raw localStorage keys directly so get* is never called and cannot seed (C3, M4)
        const rawTasks = getLocalData<TaskItem>(`superapps_tasks_${fromGuestId}`);
        const rawNotes = getLocalData<NoteItem>(`superapps_notes_${fromGuestId}`);
        const rawHabits = getLocalData<HabitItem>(`superapps_habits_${fromGuestId}`);
        const rawExpenses = getLocalData<ExpenseItem>(`superapps_expenses_${fromGuestId}`);
        const rawSnippets = getLocalData<SnippetItem>(`superapps_snippets_${fromGuestId}`);
        const rawLinks = getLocalData<ShortlinkItem>(`superapps_shortlinks_${fromGuestId}`);
        const rawDropzone = getLocalData<DropzoneItem>(`superapps_dropzone_${fromGuestId}`);

        // Filter out unchanged sample documents
        const filteredTasks = rawTasks.filter((t) => !isUnchangedSample('tasks', t));
        const filteredNotes = rawNotes.filter((n) => !isUnchangedSample('notes', n));
        const filteredHabits = rawHabits.filter((h) => !isUnchangedSample('habits', h));
        const filteredExpenses = rawExpenses.filter((e) => !isUnchangedSample('expenses', e));
        const filteredSnippets = rawSnippets.filter((s) => !isUnchangedSample('snippets', s));
        const filteredLinks = rawLinks;
        const filteredDropzone = rawDropzone;

        const totalItems =
          filteredTasks.length +
          filteredNotes.length +
          filteredHabits.length +
          filteredExpenses.length +
          filteredSnippets.length +
          filteredLinks.length +
          filteredDropzone.length;

        if (totalItems === 0) {
          // Clear empty or sample-only guest keys
          this.clearGuestStorage(fromGuestId);
          continue;
        }

        if (isTargetCloud) {
          // 1. Chunked atomic Firestore batch writes for user-isolated private collections (tasks, notes, habits, expenses, snippets, dropzone)
          let currentBatch = writeBatch(db!);
          let opsInBatch = 0;

          const commitBatchIfFull = async () => {
            if (opsInBatch >= 450) {
              await currentBatch.commit();
              currentBatch = writeBatch(db!);
              opsInBatch = 0;
            }
          };

          for (const item of filteredTasks) {
            const newId = getMigratedId('tasks', item.id);
            const docRef = doc(db!, 'users', toUserId, 'tasks', newId);
            currentBatch.set(docRef, { ...item, id: newId, userId: toUserId }, { merge: true });
            opsInBatch++;
            count++;
            await commitBatchIfFull();
          }

          for (const item of filteredNotes) {
            const newId = getMigratedId('notes', item.id);
            const docRef = doc(db!, 'users', toUserId, 'notes', newId);
            currentBatch.set(docRef, { ...item, id: newId, userId: toUserId }, { merge: true });
            opsInBatch++;
            count++;
            await commitBatchIfFull();
          }

          for (const item of filteredHabits) {
            const newId = getMigratedId('habits', item.id);
            const docRef = doc(db!, 'users', toUserId, 'habits', newId);
            currentBatch.set(docRef, { ...item, id: newId, userId: toUserId }, { merge: true });
            opsInBatch++;
            count++;
            await commitBatchIfFull();
          }

          for (const item of filteredExpenses) {
            const newId = getMigratedId('expenses', item.id);
            const docRef = doc(db!, 'users', toUserId, 'expenses', newId);
            currentBatch.set(docRef, { ...item, id: newId, userId: toUserId }, { merge: true });
            opsInBatch++;
            count++;
            await commitBatchIfFull();
          }

          for (const item of filteredSnippets) {
            const newId = getMigratedId('snippets', item.id);
            const docRef = doc(db!, 'users', toUserId, 'snippets', newId);
            currentBatch.set(docRef, { ...item, id: newId, userId: toUserId }, { merge: true });
            opsInBatch++;
            count++;
            await commitBatchIfFull();
          }

          for (const item of filteredDropzone) {
            const docRef = doc(db!, 'users', toUserId, 'dropzone', item.id);
            currentBatch.set(docRef, { ...item, userId: toUserId }, { merge: true });
            opsInBatch++;
            count++;
            await commitBatchIfFull();
          }

          if (opsInBatch > 0) {
            await currentBatch.commit();
          }

          // 2. Shortlinks migration: isolated transaction checks so taken slugs never fail the user private data batch
          for (const item of filteredLinks) {
            try {
              const docRef = doc(db!, 'shortlinks', item.slug);
              await runTransaction(db!, async (tx) => {
                const snap = await tx.get(docRef);
                if (snap.exists()) {
                  const data = snap.data();
                  if (data?.userId && data.userId !== toUserId) {
                    // Slug taken by another user; skip to avoid overwriting or permission denial
                    return;
                  }
                }
                tx.set(docRef, { ...item, userId: toUserId }, { merge: true });
                count++;
              });
            } catch (linkErr) {
              console.warn(`Shortlink migration conflict for slug "${item.slug}":`, linkErr);
            }
          }
        } else {
          // Merge into target guest localStorage
          const mergeItems = <T extends { id: string }>(col: string, source: T[]) => {
            const key = `superapps_${col}_${toUserId}`;
            const target = getLocalData<T>(key);
            for (const item of source) {
              const idx = target.findIndex((t) => t.id === item.id);
              if (idx >= 0) {
                target[idx] = { ...item, userId: toUserId } as unknown as T;
              } else {
                target.unshift({ ...item, userId: toUserId } as unknown as T);
              }
              count++;
            }
            setLocalData(key, target);
          };

          mergeItems('tasks', filteredTasks);
          mergeItems('notes', filteredNotes);
          mergeItems('habits', filteredHabits);
          mergeItems('expenses', filteredExpenses);
          mergeItems('snippets', filteredSnippets);
          mergeItems('shortlinks', filteredLinks);
          mergeItems('dropzone', filteredDropzone);
        }

        // Clean up transferred guest items
        this.clearGuestStorage(fromGuestId);
      }

      return { success: true, migratedCount: count };
    } catch (err) {
      reportSyncError('migrate', 'guest', err);
      return { success: false, migratedCount: count };
    }
  },

  clearGuestStorage(guestId: string): void {
    try {
      localStorage.removeItem(`superapps_tasks_${guestId}`);
      localStorage.removeItem(`superapps_notes_${guestId}`);
      localStorage.removeItem(`superapps_habits_${guestId}`);
      localStorage.removeItem(`superapps_expenses_${guestId}`);
      localStorage.removeItem(`superapps_snippets_${guestId}`);
      localStorage.removeItem(`superapps_shortlinks_${guestId}`);
      localStorage.removeItem(`superapps_dropzone_${guestId}`);
      localStorage.removeItem(`superapps_seeded_${guestId}`);
    } catch {
      // ignore
    }
  },

  seedGuestSamples(guestId: string, force = false): void {
    seedGuestSamples(guestId, force);
  },

  /* ==================== WORKSPACE BACKUP & PORTABILITY (MILESTONE 4) ==================== */
  async exportWorkspaceBackup(userId: string): Promise<WorkspaceBackup> {
    const [tasks, notes, habits, expenses, snippets, shortlinks, dropzone, mediaHistory, systemSettings] = await Promise.all([
      this.getTasks(userId),
      this.getNotes(userId),
      this.getHabits(userId),
      this.getExpenses(userId),
      this.getSnippets(userId),
      this.getShortlinks(userId),
      this.getDropzoneItems(userId),
      mediaHistoryRepo.list(userId),
      this.getSystemSettings(),
    ]);

    return {
      version: '1.0.0',
      exportedAt: Date.now(),
      userId,
      data: {
        tasks,
        notes,
        habits,
        expenses,
        snippets,
        shortlinks,
        dropzone,
        mediaHistory,
        systemSettings,
      },
    };
  },

  async importWorkspaceBackup(userId: string, backup: WorkspaceBackup): Promise<{ success: boolean; importedCount: number; errors?: string[] }> {
    if (!backup || !backup.data || typeof backup.data !== 'object') {
      throw new Error('Invalid workspace backup format.');
    }

    let count = 0;
    const errors: string[] = [];

    // Import tasks
    if (Array.isArray(backup.data.tasks)) {
      for (const t of backup.data.tasks) {
        try {
          await this.saveTask(userId, { ...t, userId });
          count++;
        } catch (err: any) {
          errors.push(`Task "${t.title}": ${err?.message}`);
        }
      }
    }

    // Import notes
    if (Array.isArray(backup.data.notes)) {
      for (const n of backup.data.notes) {
        try {
          await this.saveNote(userId, { ...n, userId });
          count++;
        } catch (err: any) {
          errors.push(`Note "${n.title}": ${err?.message}`);
        }
      }
    }

    // Import habits
    if (Array.isArray(backup.data.habits)) {
      for (const h of backup.data.habits) {
        try {
          await this.saveHabit(userId, { ...h, userId });
          count++;
        } catch (err: any) {
          errors.push(`Habit "${h.title}": ${err?.message}`);
        }
      }
    }

    // Import expenses
    if (Array.isArray(backup.data.expenses)) {
      for (const e of backup.data.expenses) {
        try {
          await this.saveExpense(userId, { ...e, userId });
          count++;
        } catch (err: any) {
          errors.push(`Expense "${e.description}": ${err?.message}`);
        }
      }
    }

    // Import snippets
    if (Array.isArray(backup.data.snippets)) {
      for (const s of backup.data.snippets) {
        try {
          await this.saveSnippet(userId, { ...s, userId });
          count++;
        } catch (err: any) {
          errors.push(`Snippet "${s.title}": ${err?.message}`);
        }
      }
    }

    // Import shortlinks
    if (Array.isArray(backup.data.shortlinks)) {
      for (const l of backup.data.shortlinks) {
        try {
          await this.saveShortlink(userId, { ...l, userId });
          count++;
        } catch (err: any) {
          errors.push(`Shortlink "${l.slug}": ${err?.message}`);
        }
      }
    }

    // Import dropzone metadata
    if (Array.isArray(backup.data.dropzone)) {
      for (const d of backup.data.dropzone) {
        try {
          await dropzoneRepo.save(userId, { ...d, userId });
          count++;
        } catch (err: any) {
          errors.push(`Dropzone "${d.fileName}": ${err?.message}`);
        }
      }
    }

    // Import media history
    if (Array.isArray(backup.data.mediaHistory)) {
      for (const m of backup.data.mediaHistory) {
        try {
          await mediaHistoryRepo.save(userId, { ...m, userId });
          count++;
        } catch (err: any) {
          errors.push(`Media history "${m.title}": ${err?.message}`);
        }
      }
    }

    return {
      success: errors.length === 0,
      importedCount: count,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  /* ==================== WORKSPACE RESET & SAMPLE PURGE ==================== */
  cleanLocalSamples(userId: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const collections = ['tasks', 'notes', 'habits', 'expenses', 'snippets'];
    for (const col of collections) {
      const key = `superapps_${col}_${userId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const items = JSON.parse(raw);
          if (Array.isArray(items)) {
            const cleaned = items.filter((item) => !isUnchangedSample(col, item));
            if (cleaned.length !== items.length) {
              localStorage.setItem(key, JSON.stringify(cleaned));
              notifyLocalChange(key);
            }
          }
        } catch {
          // ignore
        }
      }
    }
  },

  resetWorkspaceData(userId: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const collections = ['tasks', 'notes', 'habits', 'expenses', 'snippets', 'shortlinks', 'dropzone', 'media_history'];
    for (const col of collections) {
      const key = `superapps_${col}_${userId}`;
      localStorage.setItem(key, JSON.stringify([]));
      notifyLocalChange(key);
    }
    // Set seeded flag to prevent future re-seeding
    try {
      localStorage.setItem(`superapps_seeded_${userId}`, 'true');
    } catch {
      // ignore
    }
  },
};
