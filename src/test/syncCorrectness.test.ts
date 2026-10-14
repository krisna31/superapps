import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskItem, ShortlinkItem } from '@/types';
import { subscribeSyncErrors, clearLastSyncError, SyncErrorEvent } from '@/services/syncErrors';

// Shared mocks for Firestore functions
const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockDeleteDoc = vi.fn();
const mockOnSnapshot = vi.fn();
const mockRunTransaction = vi.fn();
const mockBatchSet = vi.fn();
const mockBatchDelete = vi.fn();
const mockBatchCommit = vi.fn(async () => {});

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, ...parts) => ({ path: parts.join('/') })),
  doc: vi.fn((_db, ...parts) => ({ path: parts.join('/'), id: parts[parts.length - 1] })),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  updateDoc: vi.fn(async () => {}),
  query: vi.fn((col) => col),
  where: vi.fn(),
  increment: vi.fn((n) => n),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
  writeBatch: vi.fn(() => ({
    set: mockBatchSet,
    delete: mockBatchDelete,
    commit: mockBatchCommit,
  })),
}));

vi.mock('@/firebase/config', () => ({
  isFirebaseConfigured: true,
  db: { type: 'mock-firestore-instance' },
  auth: { currentUser: { uid: 'cloud-mock-uid' } },
  storage: { type: 'mock-storage-instance' },
}));

// Import dataService after mocks are configured
import { dataService, SlugTakenError } from '@/services/dataService';

describe('Deep Sync & Data Layer Correctness (C1-C4, H2-H3, Q3)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearLastSyncError();
    vi.clearAllMocks();
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
    mockGetDocs.mockResolvedValue({ docs: [] });
    mockBatchCommit.mockResolvedValue(undefined);
  });

  /* ==================== C1: STORAGE BACKEND ISOLATION ==================== */
  it('C1: Cloud write failure does NOT silently fall back to localStorage and reports to syncErrors', async () => {
    let capturedError: SyncErrorEvent | null = null;
    const unsubscribe = subscribeSyncErrors((err) => {
      capturedError = err;
    });

    // Mock cloud write rejection (e.g. offline network dropout or permission denied)
    const firestoreError = new Error('Permission denied: setDoc rejected');
    mockSetDoc.mockRejectedValueOnce(firestoreError);

    const cloudTask: TaskItem = {
      id: 'task-cloud-err',
      userId: 'cloud-user-alpha',
      title: 'Cloud Task Subject to Network Error',
      status: 'todo',
      priority: 'high',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save must resolve non-blocking
    await dataService.saveTask('cloud-user-alpha', cloudTask);

    // Allow promise microtasks to run
    await new Promise((resolve) => setTimeout(resolve, 20));

    // 1. MUST NOT fall back to localStorage (Finding C1: No dual-backend split-brain)
    expect(localStorage.getItem('superapps_tasks_cloud-user-alpha')).toBeNull();

    // 2. MUST report error through syncErrors bus (Finding M3)
    expect(capturedError).not.toBeNull();
    const errObj = capturedError as SyncErrorEvent | null;
    expect(errObj?.collection).toBe('tasks');
    expect(errObj?.op).toBe('save');

    unsubscribe();
  });

  /* ==================== C2: UNDEFINED PROPERTY SAFE HANDLING ==================== */
  it('C2: Saves payloads containing undefined fields to Firestore without payload rejection', async () => {
    const taskWithUndefined: TaskItem = {
      id: 'task-undef-1',
      userId: 'cloud-user-alpha',
      title: 'Task with undefined fields',
      description: undefined,
      dueDate: undefined,
      status: 'todo',
      priority: 'low',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await dataService.saveTask('cloud-user-alpha', taskWithUndefined);

    // Verify setDoc was called directly with the item
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const calledPayload = mockSetDoc.mock.calls[0][1];
    expect(calledPayload.title).toBe('Task with undefined fields');
    expect(calledPayload.description).toBeUndefined();
    expect(calledPayload.dueDate).toBeUndefined();
  });

  /* ==================== C3: SAMPLE DATA CLEAN SEEDING & RENAMING ==================== */
  it('C3: Migration skips unchanged initial sample items and gives edited samples new unique IDs', async () => {
    const guestId = 'guest-source-user';
    const targetCloudUid = 'cloud-target-uid';

    // 1. Seed initial samples in guest localStorage
    dataService.seedGuestSamples(guestId);

    // 2. Edit sample task-1 (change title)
    await dataService.saveTask(guestId, {
      id: 'task-1',
      userId: guestId,
      title: 'User Edited Welcome Task (Important!)',
      status: 'in_progress',
      priority: 'urgent',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 3. Add custom non-sample task
    await dataService.saveTask(guestId, {
      id: 'task-user-custom-42',
      userId: guestId,
      title: 'My Custom Homework Task',
      status: 'todo',
      priority: 'high',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 4. Run guest migration to cloud
    const result = await dataService.migrateGuestData(guestId, targetCloudUid);
    expect(result.success).toBe(true);

    // Verify batch commits were called
    expect(mockBatchCommit).toHaveBeenCalled();

    // Check calls to mockBatchSet
    const batchSetCalls = mockBatchSet.mock.calls;

    // Unchanged task-2 and task-3 must NOT be migrated
    const migratedIds = batchSetCalls.map((call) => call[1].id);
    expect(migratedIds).not.toContain('task-2');
    expect(migratedIds).not.toContain('task-3');

    // Custom task must be migrated with its original ID preserved
    expect(migratedIds).toContain('task-user-custom-42');

    // Edited sample item task-1 MUST be migrated with a NEW unique ID (never overwrite cloud task-1)
    expect(migratedIds).not.toContain('task-1');
    const editedSampleMigrated = batchSetCalls.find(
      (call) => call[1].title === 'User Edited Welcome Task (Important!)'
    );
    expect(editedSampleMigrated).toBeDefined();
    expect(editedSampleMigrated![1].id).toMatch(/^tasks-\d+-[a-z0-9]+/);
    expect(editedSampleMigrated![1].userId).toBe(targetCloudUid);
  });

  /* ==================== C4: NON-BLOCKING CLOUD SAVE ==================== */
  it('C4: Cloud saveTask resolves immediately even if network connection hangs or is offline', async () => {
    // Simulate an offline hang where setDoc promise never resolves
    mockSetDoc.mockImplementationOnce(() => new Promise(() => {}));

    const task: TaskItem = {
      id: 'task-hang-test',
      userId: 'cloud-user-offline-hang',
      title: 'Offline modal test',
      status: 'todo',
      priority: 'medium',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const startTime = Date.now();
    await dataService.saveTask('cloud-user-offline-hang', task);
    const elapsed = Date.now() - startTime;

    // Must resolve instantaneously (< 50ms)
    expect(elapsed).toBeLessThan(50);
  });

  /* ==================== H2 / H3: SHORTLINK UNIQUENESS & TRANSACTIONS ==================== */
  it('H3: saveShortlink enforces slug uniqueness using Firestore runTransaction and throws SlugTakenError', async () => {
    const existingSlug = 'cool-docs';

    // Mock transaction behavior: slug already exists and belongs to another user
    mockRunTransaction.mockImplementationOnce(async (_db, updateFunction) => {
      const mockTx = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ slug: existingSlug, userId: 'other-user-999', originalUrl: 'https://other.com' }),
        }),
        set: vi.fn(),
      };
      return updateFunction(mockTx);
    });

    const newLink: ShortlinkItem = {
      id: existingSlug,
      userId: 'cloud-user-me',
      slug: existingSlug,
      originalUrl: 'https://mywebsite.com',
      clicks: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await expect(dataService.saveShortlink('cloud-user-me', newLink)).rejects.toThrow(SlugTakenError);
    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
  });

  it('H3: saveShortlink allows owner to update their own slug via runTransaction', async () => {
    const ownedSlug = 'my-portfolio';

    // Mock transaction behavior: slug exists and belongs to current user
    mockRunTransaction.mockImplementationOnce(async (_db, updateFunction) => {
      const mockTx = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ slug: ownedSlug, userId: 'cloud-user-me', originalUrl: 'https://old.com' }),
        }),
        set: vi.fn(),
      };
      return updateFunction(mockTx);
    });

    const updatedLink: ShortlinkItem = {
      id: ownedSlug,
      userId: 'cloud-user-me',
      slug: ownedSlug,
      originalUrl: 'https://new-portfolio.com',
      clicks: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await expect(dataService.saveShortlink('cloud-user-me', updatedLink)).resolves.not.toThrow();
  });

  /* ==================== Q3: ONE-TIME CLEANUP OF UNCHANGED SAMPLES ==================== */
  it('Q3: cleanupLegacySamples deletes only unchanged samples in parallel batch', async () => {
    const cloudUid = 'cloud-legacy-cleanup-uid';

    // Mock getDoc: task-1 is unchanged, task-2 is modified
    mockGetDoc.mockImplementation(async (ref: { path: string }) => {
      if (ref.path.includes('tasks/task-1')) {
        return {
          exists: () => true,
          ref,
          data: () => ({ title: 'Welcome to Superapps Workspace!' }),
        };
      }
      if (ref.path.includes('tasks/task-2')) {
        return {
          exists: () => true,
          ref,
          data: () => ({ title: 'User Custom Modified Task Title' }),
        };
      }
      return { exists: () => false, data: () => ({}) };
    });

    await dataService.cleanupLegacySamples(cloudUid);

    // Verify task-1 was queued for delete, task-2 was spared
    expect(mockBatchDelete).toHaveBeenCalledTimes(1);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);

    // Verify flag was set in localStorage to avoid running again
    expect(localStorage.getItem(`superapps_legacy_samples_cleaned_${cloudUid}`)).toBe('true');
  });
});
