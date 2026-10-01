import { describe, it, expect, beforeEach } from 'vitest';
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
    expect(settings.allowGuestAccess).toBe(true);
    expect(settings.allowUserRegistration).toBe(true);
    expect(settings.superadminEmail).toBe('admin@k31.my.id');
  });

  it('should update and persist system settings', async () => {
    const updatedSettings: SystemSettings = {
      allowGuestAccess: false,
      allowUserRegistration: false,
      superadminEmail: 'customadmin@k31.my.id',
    };

    await dataService.saveSystemSettings(updatedSettings);
    const retrieved = await dataService.getSystemSettings();
    expect(retrieved.allowGuestAccess).toBe(false);
    expect(retrieved.allowUserRegistration).toBe(false);
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
});
