import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dataService } from '@/services/dataService';
import { TaskItem, NoteItem, ExpenseItem, ShortlinkItem, SystemSettings } from '@/types';

describe('dataService Tests', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize and return seeded tasks for new user', async () => {
    const tasks = await dataService.getTasks(testUserId);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].title).toBeDefined();
  });

  it('should save and retrieve a new task', async () => {
    const newTask: TaskItem = {
      id: 'task-custom',
      userId: testUserId,
      title: 'Unit Test Task',
      status: 'todo',
      priority: 'urgent',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await dataService.saveTask(testUserId, newTask);
    const tasks = await dataService.getTasks(testUserId);
    const found = tasks.find((t) => t.id === 'task-custom');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Unit Test Task');
    expect(found?.priority).toBe('urgent');
  });

  it('should delete a task', async () => {
    const newTask: TaskItem = {
      id: 'task-to-delete',
      userId: testUserId,
      title: 'Delete me',
      status: 'todo',
      priority: 'low',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await dataService.saveTask(testUserId, newTask);
    await dataService.deleteTask(testUserId, 'task-to-delete');
    const tasks = await dataService.getTasks(testUserId);
    expect(tasks.find((t) => t.id === 'task-to-delete')).toBeUndefined();
  });

  it('should save, retrieve, and delete a note', async () => {
    const note: NoteItem = {
      id: 'note-test',
      userId: testUserId,
      title: 'Secret Notes',
      content: '# Secret\nClassified info',
      tags: ['secret', 'test'],
      isPinned: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await dataService.saveNote(testUserId, note);
    let notes = await dataService.getNotes(testUserId);
    expect(notes.find((n) => n.id === 'note-test')?.title).toBe('Secret Notes');

    await dataService.deleteNote(testUserId, 'note-test');
    notes = await dataService.getNotes(testUserId);
    expect(notes.find((n) => n.id === 'note-test')).toBeUndefined();
  });

  it('should record expenses and calculate net balance', async () => {
    const expense: ExpenseItem = {
      id: 'exp-1',
      userId: testUserId,
      type: 'expense',
      amount: 15000,
      category: 'Food',
      description: 'Nasi Goreng',
      date: '2026-09-30',
      createdAt: Date.now(),
    };

    const income: ExpenseItem = {
      id: 'inc-1',
      userId: testUserId,
      type: 'income',
      amount: 50000,
      category: 'Salary',
      description: 'Freelance Bonus',
      date: '2026-09-30',
      createdAt: Date.now(),
    };

    await dataService.saveExpense(testUserId, expense);
    await dataService.saveExpense(testUserId, income);

    const list = await dataService.getExpenses(testUserId);
    const expItem = list.find((e) => e.id === 'exp-1');
    const incItem = list.find((e) => e.id === 'inc-1');

    expect(expItem?.amount).toBe(15000);
    expect(incItem?.amount).toBe(50000);
  });

  it('should save and resolve shortlinks with click increment', async () => {
    const shortlink: ShortlinkItem = {
      id: 'my-docs',
      userId: testUserId,
      slug: 'my-docs',
      originalUrl: 'https://docs.github.com',
      title: 'GitHub Docs',
      clicks: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await dataService.saveShortlink(testUserId, shortlink);
    const resolved = await dataService.resolveShortlink('my-docs');
    expect(resolved).not.toBeNull();
    expect(resolved?.originalUrl).toBe('https://docs.github.com');
    expect(resolved?.clicks).toBe(1);
  });

  /* ==================== SYSTEM SETTINGS TESTS ==================== */
  it('should initialize and return default system settings', async () => {
    const settings = await dataService.getSystemSettings();
    expect(settings).toBeDefined();
    expect(settings.allowGuestAccess).toBe(false);
    expect(settings.allowUserRegistration).toBe(false);
    expect(settings.superadminEmail).toBe('jelvinkrisnaputra31@gmail.com');
  });

  it('should update and persist system settings', async () => {
    const updatedSettings: SystemSettings = {
      allowGuestAccess: true,
      allowUserRegistration: true,
      superadminEmail: 'customadmin@k31.my.id',
    };

    await dataService.saveSystemSettings(updatedSettings);
    const retrieved = await dataService.getSystemSettings();
    expect(retrieved.allowGuestAccess).toBe(true);
    expect(retrieved.allowUserRegistration).toBe(true);
    expect(retrieved.superadminEmail).toBe('customadmin@k31.my.id');
  });

  it('should maintain system settings in localStorage under superapps_system_settings', async () => {
    const custom: SystemSettings = {
      allowGuestAccess: true,
      allowUserRegistration: false,
      superadminEmail: 'secops@k31.my.id',
    };
    await dataService.saveSystemSettings(custom);
    const raw = localStorage.getItem('superapps_system_settings');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.allowUserRegistration).toBe(false);
    expect(parsed.superadminEmail).toBe('secops@k31.my.id');
  });

  /* ==================== REAL-TIME SUBSCRIPTION TESTS ==================== */
  it('should emit initial seeded tasks immediately to subscriber', async () => {
    const callback = vi.fn();
    const unsubscribe = dataService.subscribeToTasks(testUserId, callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });

    const firstCallArg = callback.mock.calls[0][0];
    expect(Array.isArray(firstCallArg)).toBe(true);
    expect(firstCallArg.length).toBeGreaterThan(0);

    unsubscribe();
  });

  it('should emit updated tasks when a task is saved in the same tab', async () => {
    const callback = vi.fn();
    const unsubscribe = dataService.subscribeToTasks(testUserId, callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });
    callback.mockClear();

    const newTask: TaskItem = {
      id: 'task-realtime-1',
      userId: testUserId,
      title: 'Live Synchronized Task',
      status: 'in_progress',
      priority: 'urgent',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await dataService.saveTask(testUserId, newTask);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
      const latest = callback.mock.calls[callback.mock.calls.length - 1][0] as TaskItem[];
      expect(latest.some((t) => t.id === 'task-realtime-1')).toBe(true);
    });

    unsubscribe();
  });

  it('should emit updated tasks when a task is deleted', async () => {
    const newTask: TaskItem = {
      id: 'task-to-remove',
      userId: testUserId,
      title: 'To Be Deleted',
      status: 'todo',
      priority: 'low',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dataService.saveTask(testUserId, newTask);

    const callback = vi.fn();
    const unsubscribe = dataService.subscribeToTasks(testUserId, callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });
    callback.mockClear();

    await dataService.deleteTask(testUserId, 'task-to-remove');

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
      const latest = callback.mock.calls[callback.mock.calls.length - 1][0] as TaskItem[];
      expect(latest.some((t) => t.id === 'task-to-remove')).toBe(false);
    });

    unsubscribe();
  });

  it('should react to cross-tab storage events and emit updated tasks', async () => {
    const callback = vi.fn();
    const unsubscribe = dataService.subscribeToTasks(testUserId, callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });
    callback.mockClear();

    const externalTask: TaskItem = {
      id: 'task-from-tab-b',
      userId: testUserId,
      title: 'Task Created in Tab B',
      status: 'done',
      priority: 'high',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const storageKey = `superapps_tasks_${testUserId}`;
    const currentTasks = await dataService.getTasks(testUserId);
    const updatedTasks = [externalTask, ...currentTasks];

    // Simulate cross-tab localStorage mutation
    localStorage.setItem(storageKey, JSON.stringify(updatedTasks));
    window.dispatchEvent(new StorageEvent('storage', {
      key: storageKey,
      newValue: JSON.stringify(updatedTasks),
    }));

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
      const latest = callback.mock.calls[callback.mock.calls.length - 1][0] as TaskItem[];
      expect(latest.some((t) => t.id === 'task-from-tab-b')).toBe(true);
    });

    unsubscribe();
  });

  it('should stop emitting after unsubscribe is called', async () => {
    const callback = vi.fn();
    const unsubscribe = dataService.subscribeToTasks(testUserId, callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });

    unsubscribe();
    callback.mockClear();

    // Perform mutation after unsubscribe
    const afterUnsubTask: TaskItem = {
      id: 'task-after-unsub',
      userId: testUserId,
      title: 'Ghost Task',
      status: 'todo',
      priority: 'low',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dataService.saveTask(testUserId, afterUnsubTask);

    // Simulate storage event after unsubscribe
    window.dispatchEvent(new StorageEvent('storage', {
      key: `superapps_tasks_${testUserId}`,
    }));

    // Wait briefly to confirm no unexpected invocation
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(callback).not.toHaveBeenCalled();
  });

  it('should support subscriptions across notes, habits, expenses, snippets, shortlinks, and dropzone', async () => {
    const notesCb = vi.fn();
    const habitsCb = vi.fn();
    const expensesCb = vi.fn();
    const snippetsCb = vi.fn();
    const linksCb = vi.fn();
    const dropzoneCb = vi.fn();

    const unsubs = [
      dataService.subscribeToNotes(testUserId, notesCb),
      dataService.subscribeToHabits(testUserId, habitsCb),
      dataService.subscribeToExpenses(testUserId, expensesCb),
      dataService.subscribeToSnippets(testUserId, snippetsCb),
      dataService.subscribeToShortlinks(testUserId, linksCb),
      dataService.subscribeToDropzone(testUserId, dropzoneCb),
    ];

    await vi.waitFor(() => {
      expect(notesCb).toHaveBeenCalled();
      expect(habitsCb).toHaveBeenCalled();
      expect(expensesCb).toHaveBeenCalled();
      expect(snippetsCb).toHaveBeenCalled();
      expect(linksCb).toHaveBeenCalled();
      expect(dropzoneCb).toHaveBeenCalled();
    });

    unsubs.forEach((unsub) => unsub());
  });

  it('should support notes subscriptions with same-tab mutations and cross-tab storage events', async () => {
    const callback = vi.fn();
    const unsubscribe = dataService.subscribeToNotes(testUserId, callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });
    callback.mockClear();

    // 1. Same-tab saveNote
    const newNote: NoteItem = {
      id: 'note-reactive-1',
      userId: testUserId,
      title: 'Reactive Architecture Note',
      content: '# Reactive Note Content',
      tags: ['sync', 'reactive'],
      isPinned: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dataService.saveNote(testUserId, newNote);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
      const latest = callback.mock.calls[callback.mock.calls.length - 1][0] as NoteItem[];
      expect(latest.some((n) => n.id === 'note-reactive-1')).toBe(true);
    });
    callback.mockClear();

    // 2. Cross-tab storage event
    const externalNote: NoteItem = {
      id: 'note-external-tab',
      userId: testUserId,
      title: 'Note from Tab 2',
      content: 'Remote content',
      tags: ['remote'],
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const currentNotes = await dataService.getNotes(testUserId);
    const updatedNotes = [externalNote, ...currentNotes];
    const notesKey = `superapps_notes_${testUserId}`;

    localStorage.setItem(notesKey, JSON.stringify(updatedNotes));
    window.dispatchEvent(new StorageEvent('storage', {
      key: notesKey,
      newValue: JSON.stringify(updatedNotes),
    }));

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
      const latest = callback.mock.calls[callback.mock.calls.length - 1][0] as NoteItem[];
      expect(latest.some((n) => n.id === 'note-external-tab')).toBe(true);
    });

    unsubscribe();
  });

  it('should support multiple concurrent subscribers to the same collection independently', async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const unsub1 = dataService.subscribeToTasks(testUserId, callback1);
    const unsub2 = dataService.subscribeToTasks(testUserId, callback2);

    await vi.waitFor(() => {
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
    callback1.mockClear();
    callback2.mockClear();

    // Save task -> both receive update
    const sharedTask: TaskItem = {
      id: 'task-shared-broadcast',
      userId: testUserId,
      title: 'Broadcast to both subscribers',
      status: 'in_progress',
      priority: 'high',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dataService.saveTask(testUserId, sharedTask);

    await vi.waitFor(() => {
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    // Unsubscribe subscriber 1
    unsub1();
    callback1.mockClear();
    callback2.mockClear();

    // Save another task -> only subscriber 2 receives update
    const secondTask: TaskItem = {
      id: 'task-shared-second',
      userId: testUserId,
      title: 'Only for subscriber 2',
      status: 'done',
      priority: 'low',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dataService.saveTask(testUserId, secondTask);

    await vi.waitFor(() => {
      expect(callback2).toHaveBeenCalled();
      const latest = callback2.mock.calls[callback2.mock.calls.length - 1][0] as TaskItem[];
      expect(latest.some((t) => t.id === 'task-shared-second')).toBe(true);
    });

    // Ensure subscriber 1 did NOT receive the second update
    expect(callback1).not.toHaveBeenCalled();

    unsub2();
  });

  it('should refresh data when storage event with key === null is dispatched', async () => {
    const callback = vi.fn();
    const unsubscribe = dataService.subscribeToTasks(testUserId, callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });
    callback.mockClear();

    // Dispatch clear event (key === null)
    window.dispatchEvent(new StorageEvent('storage', {
      key: null,
    }));

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });

    unsubscribe();
  });
});

describe('dataService.migrateGuestData', () => {
  const guestUser = 'guest-mig-source';
  const targetUser = 'user-mig-destination';

  beforeEach(() => {
    localStorage.clear();
  });

  it('migrates all guest entities (tasks, notes, habits, expenses, snippets) to target user', async () => {
    // 1. Setup guest data
    await dataService.saveTask(guestUser, {
      id: 'task-mig-1',
      userId: guestUser,
      title: 'Guest Task',
      status: 'todo',
      priority: 'high',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await dataService.saveNote(guestUser, {
      id: 'note-mig-1',
      userId: guestUser,
      title: 'Guest Note',
      content: 'Note Body',
      tags: ['guest'],
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await dataService.saveHabit(guestUser, {
      id: 'habit-mig-1',
      userId: guestUser,
      title: 'Drink Water',
      frequency: 'daily',
      streak: 3,
      completedDates: ['2026-10-06'],
      createdAt: Date.now(),
    });

    await dataService.saveExpense(guestUser, {
      id: 'expense-mig-1',
      userId: guestUser,
      description: 'Coffee',
      amount: 45000,
      category: 'Food',
      date: '2026-10-07',
      type: 'expense',
      createdAt: Date.now(),
    });

    await dataService.saveSnippet(guestUser, {
      id: 'snippet-mig-1',
      userId: guestUser,
      title: 'Console Log',
      code: 'console.log("hello")',
      language: 'javascript',
      tags: ['debug'],
      createdAt: Date.now(),
    });

    // 2. Perform migration
    const result = await dataService.migrateGuestData(guestUser, targetUser);
    expect(result.success).toBe(true);
    expect(result.migratedCount).toBeGreaterThanOrEqual(5);

    // 3. Verify target user has items
    const targetTasks = await dataService.getTasks(targetUser);
    const targetNotes = await dataService.getNotes(targetUser);
    const targetHabits = await dataService.getHabits(targetUser);
    const targetExpenses = await dataService.getExpenses(targetUser);
    const targetSnippets = await dataService.getSnippets(targetUser);

    expect(targetTasks.some((t) => t.id === 'task-mig-1' && t.userId === targetUser)).toBe(true);
    expect(targetNotes.some((n) => n.id === 'note-mig-1' && n.userId === targetUser)).toBe(true);
    expect(targetHabits.some((h) => h.id === 'habit-mig-1' && h.userId === targetUser)).toBe(true);
    expect(targetExpenses.some((e) => e.id === 'expense-mig-1' && e.userId === targetUser)).toBe(true);
    expect(targetSnippets.some((s) => s.id === 'snippet-mig-1' && s.userId === targetUser)).toBe(true);

    // 4. Verify guest local data was cleared
    expect(localStorage.getItem(`superapps_tasks_${guestUser}`)).toBeNull();
    expect(localStorage.getItem(`superapps_notes_${guestUser}`)).toBeNull();
  });

  it('handles empty guest data gracefully', async () => {
    const result = await dataService.migrateGuestData('guest-empty', 'user-dest');
    expect(result.success).toBe(true);
  });

  /* ==================== WORKSPACE BACKUP & RESTORE TESTS ==================== */
  it('exports complete workspace snapshot across all modules', async () => {
    const userId = 'backup-export-user';

    await dataService.saveTask(userId, {
      id: 'task-bk-1',
      userId,
      title: 'Backup Task',
      status: 'todo',
      priority: 'high',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await dataService.saveNote(userId, {
      id: 'note-bk-1',
      userId,
      title: 'Backup Note',
      content: 'Important info',
      tags: ['backup'],
      isPinned: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const backup = await dataService.exportWorkspaceBackup(userId);
    expect(backup.version).toBe('1.0.0');
    expect(backup.userId).toBe(userId);
    expect(backup.exportedAt).toBeGreaterThan(0);
    expect(backup.data.tasks.some((t) => t.id === 'task-bk-1')).toBe(true);
    expect(backup.data.notes.some((n) => n.id === 'note-bk-1')).toBe(true);
    expect(backup.data.systemSettings).toBeDefined();
  });

  it('restores workspace snapshot and merges data into target user repository', async () => {
    const userId = 'backup-import-user';

    const testBackup = {
      version: '1.0.0',
      exportedAt: Date.now(),
      userId: 'source-user',
      data: {
        tasks: [
          {
            id: 'task-imported-1',
            userId: 'source-user',
            title: 'Imported Task',
            status: 'done' as const,
            priority: 'urgent' as const,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        notes: [
          {
            id: 'note-imported-1',
            userId: 'source-user',
            title: 'Imported Note',
            content: 'Recovered content',
            tags: ['restored'],
            isPinned: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        habits: [
          {
            id: 'habit-imported-1',
            userId: 'source-user',
            title: 'Imported Habit',
            frequency: 'daily' as const,
            completedDates: ['2026-10-30'],
            streak: 5,
            createdAt: Date.now(),
          },
        ],
        expenses: [
          {
            id: 'exp-imported-1',
            userId: 'source-user',
            type: 'expense' as const,
            amount: 50000,
            category: 'Tech/SaaS',
            description: 'Cloud storage',
            date: '2026-10-30',
            createdAt: Date.now(),
          },
        ],
        snippets: [],
        shortlinks: [],
        dropzone: [],
      },
    };

    const res = await dataService.importWorkspaceBackup(userId, testBackup);
    expect(res.success).toBe(true);
    expect(res.importedCount).toBe(4);

    const tasks = await dataService.getTasks(userId);
    const notes = await dataService.getNotes(userId);
    const habits = await dataService.getHabits(userId);
    const expenses = await dataService.getExpenses(userId);

    expect(tasks.some((t) => t.id === 'task-imported-1' && t.userId === userId)).toBe(true);
    expect(notes.some((n) => n.id === 'note-imported-1' && n.userId === userId)).toBe(true);
    expect(habits.some((h) => h.id === 'habit-imported-1' && h.userId === userId)).toBe(true);
    expect(expenses.some((e) => e.id === 'exp-imported-1' && e.userId === userId)).toBe(true);
  });
});

describe('dataService Media Downloader History Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and retrieves media download history for a user', async () => {
    const userId = 'media-user-1';
    const saved = await dataService.saveMediaDownloadItem(userId, {
      originalUrl: 'https://instagram.com/reel/123',
      title: 'cool-reel.mp4',
      platform: 'instagram',
      format: 'video',
      quality: '1080',
      downloadUrl: 'https://cdn.example.com/reel.mp4',
      filename: 'cool-reel.mp4',
    });

    expect(saved.id).toBeDefined();
    expect(saved.userId).toBe(userId);
    expect(saved.platform).toBe('instagram');

    const history = await dataService.getMediaHistory(userId);
    expect(history).toHaveLength(1);
    expect(history[0].title).toBe('cool-reel.mp4');
  });

  it('deletes an individual media history entry', async () => {
    const userId = 'media-user-2';
    const item = await dataService.saveMediaDownloadItem(userId, {
      originalUrl: 'https://tiktok.com/@u/video/1',
      title: 'dance.mp4',
      platform: 'tiktok',
      format: 'video',
      downloadUrl: 'https://cdn.example.com/dance.mp4',
    });

    await dataService.deleteMediaDownloadItem(userId, item.id);
    const history = await dataService.getMediaHistory(userId);
    expect(history).toHaveLength(0);
  });

  it('clears all media history entries', async () => {
    const userId = 'media-user-3';
    await dataService.saveMediaDownloadItem(userId, {
      originalUrl: 'https://x.com/status/1',
      title: 'tweet1.mp4',
      platform: 'twitter',
      format: 'video',
      downloadUrl: 'https://cdn.example.com/1.mp4',
    });
    await dataService.saveMediaDownloadItem(userId, {
      originalUrl: 'https://x.com/status/2',
      title: 'tweet2.mp4',
      platform: 'twitter',
      format: 'video',
      downloadUrl: 'https://cdn.example.com/2.mp4',
    });

    await dataService.clearMediaHistory(userId);
    const history = await dataService.getMediaHistory(userId);
    expect(history).toHaveLength(0);
  });

  it('resetWorkspaceData wipes media_history alongside other collections', async () => {
    const userId = 'media-user-4';
    await dataService.saveMediaDownloadItem(userId, {
      originalUrl: 'https://youtube.com/watch?v=1',
      title: 'yt.mp4',
      platform: 'youtube',
      format: 'video',
      downloadUrl: 'https://cdn.example.com/yt.mp4',
    });

    dataService.resetWorkspaceData(userId);
    const history = await dataService.getMediaHistory(userId);
    expect(history).toHaveLength(0);
  });
});
