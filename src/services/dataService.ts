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
  increment
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
  DropzoneItem 
} from '@/types';

// Helper for local storage persistence fallback
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
  } catch (err) {
    console.error('Failed to write to localStorage:', err);
  }
};

/* ==================== TASKS SERVICE ==================== */
export const dataService = {
  // Tasks
  async getTasks(userId: string): Promise<TaskItem[]> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const colRef = collection(db, 'users', userId, 'tasks');
        const snap = await getDocs(colRef);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as TaskItem));
      } catch (err) {
        console.warn('Firestore getTasks fallback:', err);
      }
    }
    const key = `superapps_tasks_${userId}`;
    const local = getLocalData<TaskItem>(key);
    if (local.length === 0) {
      // Seed sample tasks
      const sample: TaskItem[] = [
        {
          id: 'task-1',
          userId,
          title: 'Welcome to Superapps Workspace!',
          description: 'Try dragging or changing the status of this task. Everything is synced.',
          status: 'todo',
          priority: 'high',
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'task-2',
          userId,
          title: 'Explore SwissKnife Dev Tools',
          description: 'Check out the Password Generator, UUID, Base64, and JSON tools.',
          status: 'in_progress',
          priority: 'medium',
          createdAt: Date.now() - 3600000,
          updatedAt: Date.now(),
        },
        {
          id: 'task-3',
          userId,
          title: 'Setup Custom Domain DNS',
          description: 'Add CNAME apps.k31.my.id in Cloudflare / DNS Provider.',
          status: 'done',
          priority: 'urgent',
          createdAt: Date.now() - 7200000,
          updatedAt: Date.now(),
        }
      ];
      setLocalData(key, sample);
      return sample;
    }
    return local;
  },

  async saveTask(userId: string, task: TaskItem): Promise<void> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const docRef = doc(db, 'users', userId, 'tasks', task.id);
        await setDoc(docRef, task, { merge: true });
        return;
      } catch (err) {
        console.warn('Firestore saveTask fallback:', err);
      }
    }
    const key = `superapps_tasks_${userId}`;
    const items = getLocalData<TaskItem>(key);
    const index = items.findIndex(i => i.id === task.id);
    if (index >= 0) {
      items[index] = task;
    } else {
      items.unshift(task);
    }
    setLocalData(key, items);
  },

  async deleteTask(userId: string, taskId: string): Promise<void> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const docRef = doc(db, 'users', userId, 'tasks', taskId);
        await deleteDoc(docRef);
        return;
      } catch (err) {
        console.warn('Firestore deleteTask fallback:', err);
      }
    }
    const key = `superapps_tasks_${userId}`;
    const items = getLocalData<TaskItem>(key).filter(i => i.id !== taskId);
    setLocalData(key, items);
  },

  /* ==================== NOTES SERVICE ==================== */
  async getNotes(userId: string): Promise<NoteItem[]> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const colRef = collection(db, 'users', userId, 'notes');
        const snap = await getDocs(colRef);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as NoteItem));
      } catch (err) {
        console.warn('Firestore getNotes fallback:', err);
      }
    }
    const key = `superapps_notes_${userId}`;
    const local = getLocalData<NoteItem>(key);
    if (local.length === 0) {
      const sample: NoteItem[] = [
        {
          id: 'note-1',
          userId,
          title: 'Getting Started with Superapps',
          content: `# Welcome to Superapps Notes\n\nThis is a full-featured markdown notes vault with **live preview**, tags, and offline caching.\n\n### Features\n- 📝 Real-time markdown formatting\n- 🏷️ Searchable tags\n- 📌 Pinned notes support\n- ⚡ Instant offline caching`,
          tags: ['guide', 'welcome'],
          isPinned: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      ];
      setLocalData(key, sample);
      return sample;
    }
    return local;
  },

  async saveNote(userId: string, note: NoteItem): Promise<void> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const docRef = doc(db, 'users', userId, 'notes', note.id);
        await setDoc(docRef, note, { merge: true });
        return;
      } catch (err) {
        console.warn('Firestore saveNote fallback:', err);
      }
    }
    const key = `superapps_notes_${userId}`;
    const items = getLocalData<NoteItem>(key);
    const index = items.findIndex(i => i.id === note.id);
    if (index >= 0) {
      items[index] = note;
    } else {
      items.unshift(note);
    }
    setLocalData(key, items);
  },

  async deleteNote(userId: string, noteId: string): Promise<void> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const docRef = doc(db, 'users', userId, 'notes', noteId);
        await deleteDoc(docRef);
        return;
      } catch (err) {
        console.warn('Firestore deleteNote fallback:', err);
      }
    }
    const key = `superapps_notes_${userId}`;
    const items = getLocalData<NoteItem>(key).filter(i => i.id !== noteId);
    setLocalData(key, items);
  },

  /* ==================== HABITS SERVICE ==================== */
  async getHabits(userId: string): Promise<HabitItem[]> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const colRef = collection(db, 'users', userId, 'habits');
        const snap = await getDocs(colRef);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as HabitItem));
      } catch (err) {
        console.warn('Firestore getHabits fallback:', err);
      }
    }
    const key = `superapps_habits_${userId}`;
    const local = getLocalData<HabitItem>(key);
    if (local.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      const sample: HabitItem[] = [
        {
          id: 'habit-1',
          userId,
          title: 'Drink 2L Water',
          description: 'Stay hydrated throughout the workday',
          frequency: 'daily',
          completedDates: [today],
          streak: 1,
          createdAt: Date.now(),
        },
        {
          id: 'habit-2',
          userId,
          title: 'Read 20 Pages',
          description: 'Tech articles, books, or documentation',
          frequency: 'daily',
          completedDates: [],
          streak: 0,
          createdAt: Date.now(),
        }
      ];
      setLocalData(key, sample);
      return sample;
    }
    return local;
  },

  async saveHabit(userId: string, habit: HabitItem): Promise<void> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const docRef = doc(db, 'users', userId, 'habits', habit.id);
        await setDoc(docRef, habit, { merge: true });
        return;
      } catch (err) {
        console.warn('Firestore saveHabit fallback:', err);
      }
    }
    const key = `superapps_habits_${userId}`;
    const items = getLocalData<HabitItem>(key);
    const index = items.findIndex(i => i.id === habit.id);
    if (index >= 0) {
      items[index] = habit;
    } else {
      items.unshift(habit);
    }
    setLocalData(key, items);
  },

  async deleteHabit(userId: string, habitId: string): Promise<void> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const docRef = doc(db, 'users', userId, 'habits', habitId);
        await deleteDoc(docRef);
        return;
      } catch (err) {
        console.warn('Firestore deleteHabit fallback:', err);
      }
    }
    const key = `superapps_habits_${userId}`;
    const items = getLocalData<HabitItem>(key).filter(i => i.id !== habitId);
    setLocalData(key, items);
  },

  /* ==================== EXPENSES SERVICE ==================== */
  async getExpenses(userId: string): Promise<ExpenseItem[]> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const colRef = collection(db, 'users', userId, 'expenses');
        const snap = await getDocs(colRef);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ExpenseItem));
      } catch (err) {
        console.warn('Firestore getExpenses fallback:', err);
      }
    }
    const key = `superapps_expenses_${userId}`;
    const local = getLocalData<ExpenseItem>(key);
    if (local.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      const sample: ExpenseItem[] = [
        {
          id: 'exp-1',
          userId,
          type: 'income',
          amount: 5000000,
          category: 'Salary',
          description: 'Monthly Allowance / Salary',
          date: today,
          createdAt: Date.now(),
        },
        {
          id: 'exp-2',
          userId,
          type: 'expense',
          amount: 45000,
          category: 'Food',
          description: 'Lunch & Coffee',
          date: today,
          createdAt: Date.now(),
        }
      ];
      setLocalData(key, sample);
      return sample;
    }
    return local;
  },

  async saveExpense(userId: string, expense: ExpenseItem): Promise<void> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const docRef = doc(db, 'users', userId, 'expenses', expense.id);
        await setDoc(docRef, expense, { merge: true });
        return;
      } catch (err) {
        console.warn('Firestore saveExpense fallback:', err);
      }
    }
    const key = `superapps_expenses_${userId}`;
    const items = getLocalData<ExpenseItem>(key);
    const index = items.findIndex(i => i.id === expense.id);
    if (index >= 0) {
      items[index] = expense;
    } else {
      items.unshift(expense);
    }
    setLocalData(key, items);
  },

  async deleteExpense(userId: string, expenseId: string): Promise<void> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const docRef = doc(db, 'users', userId, 'expenses', expenseId);
        await deleteDoc(docRef);
        return;
      } catch (err) {
        console.warn('Firestore deleteExpense fallback:', err);
      }
    }
    const key = `superapps_expenses_${userId}`;
    const items = getLocalData<ExpenseItem>(key).filter(i => i.id !== expenseId);
    setLocalData(key, items);
  },

  /* ==================== SNIPPETS SERVICE ==================== */
  async getSnippets(userId: string): Promise<SnippetItem[]> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const colRef = collection(db, 'users', userId, 'snippets');
        const snap = await getDocs(colRef);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as SnippetItem));
      } catch (err) {
        console.warn('Firestore getSnippets fallback:', err);
      }
    }
    const key = `superapps_snippets_${userId}`;
    const local = getLocalData<SnippetItem>(key);
    if (local.length === 0) {
      const sample: SnippetItem[] = [
        {
          id: 'snip-1',
          userId,
          title: 'Debounce Function in TypeScript',
          code: `export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {\n  let timer: ReturnType<typeof setTimeout>;\n  return (...args: Parameters<T>) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}`,
          language: 'typescript',
          tags: ['utility', 'javascript', 'typescript'],
          description: 'Standard debouncing utility for search inputs and resize events.',
          createdAt: Date.now(),
        }
      ];
      setLocalData(key, sample);
      return sample;
    }
    return local;
  },

  async saveSnippet(userId: string, snippet: SnippetItem): Promise<void> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const docRef = doc(db, 'users', userId, 'snippets', snippet.id);
        await setDoc(docRef, snippet, { merge: true });
        return;
      } catch (err) {
        console.warn('Firestore saveSnippet fallback:', err);
      }
    }
    const key = `superapps_snippets_${userId}`;
    const items = getLocalData<SnippetItem>(key);
    const index = items.findIndex(i => i.id === snippet.id);
    if (index >= 0) {
      items[index] = snippet;
    } else {
      items.unshift(snippet);
    }
    setLocalData(key, items);
  },

  async deleteSnippet(userId: string, snippetId: string): Promise<void> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const docRef = doc(db, 'users', userId, 'snippets', snippetId);
        await deleteDoc(docRef);
        return;
      } catch (err) {
        console.warn('Firestore deleteSnippet fallback:', err);
      }
    }
    const key = `superapps_snippets_${userId}`;
    const items = getLocalData<SnippetItem>(key).filter(i => i.id !== snippetId);
    setLocalData(key, items);
  },

  /* ==================== SHORTLINKS SERVICE ==================== */
  async getShortlinks(userId: string): Promise<ShortlinkItem[]> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const colRef = collection(db, 'shortlinks');
        const q = query(colRef, where('userId', '==', userId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ShortlinkItem));
      } catch (err) {
        console.warn('Firestore getShortlinks fallback:', err);
      }
    }
    const key = `superapps_shortlinks_${userId}`;
    return getLocalData<ShortlinkItem>(key);
  },

  async saveShortlink(userId: string, shortlink: ShortlinkItem): Promise<void> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const docRef = doc(db, 'shortlinks', shortlink.slug);
        await setDoc(docRef, shortlink, { merge: true });
      } catch (err) {
        console.warn('Firestore saveShortlink fallback:', err);
      }
    }
    // Also save locally for instant UI update
    const key = `superapps_shortlinks_${userId}`;
    const items = getLocalData<ShortlinkItem>(key);
    const index = items.findIndex(i => i.slug === shortlink.slug);
    if (index >= 0) {
      items[index] = shortlink;
    } else {
      items.unshift(shortlink);
    }
    setLocalData(key, items);
  },

  async resolveShortlink(slug: string): Promise<ShortlinkItem | null> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'shortlinks', slug);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          // Increment click count asynchronously
          try {
            await updateDoc(docRef, { clicks: increment(1) });
          } catch {
            // Ignore click increment failure
          }
          return snap.data() as ShortlinkItem;
        }
      } catch (err) {
        console.warn('Firestore resolveShortlink fallback:', err);
      }
    }
    // Search across local storages
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('superapps_shortlinks_')) {
        const list = getLocalData<ShortlinkItem>(k);
        const found = list.find(s => s.slug === slug);
        if (found) {
          found.clicks += 1;
          setLocalData(k, list);
          return found;
        }
      }
    }
    return null;
  },

  async deleteShortlink(userId: string, slug: string): Promise<void> {
    if (isFirebaseConfigured && db && !userId.startsWith('guest-')) {
      try {
        const docRef = doc(db, 'shortlinks', slug);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('Firestore deleteShortlink fallback:', err);
      }
    }
    const key = `superapps_shortlinks_${userId}`;
    const items = getLocalData<ShortlinkItem>(key).filter(i => i.slug !== slug);
    setLocalData(key, items);
  },

  /* ==================== DROPZONE SERVICE ==================== */
  async getDropzoneItems(userId: string): Promise<DropzoneItem[]> {
    const key = `superapps_dropzone_${userId}`;
    return getLocalData<DropzoneItem>(key);
  },

  async uploadFile(userId: string, file: File): Promise<DropzoneItem> {
    const fileId = 'drop-' + Math.random().toString(36).substring(2, 9);
    
    if (isFirebaseConfigured && storage && !userId.startsWith('guest-')) {
      const storagePath = `dropzone/${userId}/${Date.now()}_${file.name}`;
      const storageReference = ref(storage, storagePath);
      const snapshot = await uploadBytesResumable(storageReference, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      const dropItem: DropzoneItem = {
        id: fileId,
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        downloadUrl,
        storagePath,
        uploadedAt: Date.now(),
      };

      const key = `superapps_dropzone_${userId}`;
      const items = getLocalData<DropzoneItem>(key);
      items.unshift(dropItem);
      setLocalData(key, items);
      return dropItem;
    }

    // Local / In-memory blob fallback for guest or unconfigured mode
    const blobUrl = URL.createObjectURL(file);
    const dropItem: DropzoneItem = {
      id: fileId,
      userId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      downloadUrl: blobUrl,
      storagePath: 'local-blob',
      uploadedAt: Date.now(),
    };

    const key = `superapps_dropzone_${userId}`;
    const items = getLocalData<DropzoneItem>(key);
    items.unshift(dropItem);
    setLocalData(key, items);
    return dropItem;
  },

  async deleteDropzoneItem(userId: string, item: DropzoneItem): Promise<void> {
    if (isFirebaseConfigured && storage && item.storagePath !== 'local-blob') {
      try {
        const fileRef = ref(storage, item.storagePath);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn('Storage deleteObject fallback:', err);
      }
    }
    const key = `superapps_dropzone_${userId}`;
    const items = getLocalData<DropzoneItem>(key).filter(i => i.id !== item.id);
    setLocalData(key, items);
  }
};
