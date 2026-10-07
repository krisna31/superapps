import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth, DEFAULT_SUPERADMIN_CREDENTIALS } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { dataService, DEFAULT_SYSTEM_SETTINGS } from '@/services/dataService';

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext Superadmin & Access Control Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('authenticates default superadmin credentials in offline mode', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signInWithEmail(
        DEFAULT_SUPERADMIN_CREDENTIALS.email,
        DEFAULT_SUPERADMIN_CREDENTIALS.password
      );
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.email).toBe(DEFAULT_SUPERADMIN_CREDENTIALS.email);
    expect(result.current.user?.role).toBe('superadmin');
    expect(result.current.user?.isAnonymous).toBe(false);
  });

  it('rejects invalid password for superadmin email', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.signInWithEmail(
          DEFAULT_SUPERADMIN_CREDENTIALS.email,
          'WrongPassword123!'
        );
      })
    ).rejects.toThrow();
  });

  it('automatically grants superadmin role to the first registered user and updates systemSettings', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signUpWithEmail('founder@k31.my.id', 'FounderPass123!');
    });

    // First user is superadmin
    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.email).toBe('founder@k31.my.id');
    expect(result.current.user?.role).toBe('superadmin');

    // System settings superadminEmail updated
    expect(result.current.systemSettings.superadminEmail).toBe('founder@k31.my.id');
    const persistedSettings = await dataService.getSystemSettings();
    expect(persistedSettings.superadminEmail).toBe('founder@k31.my.id');

    // Sign out founder
    await act(async () => {
      await result.current.signOut();
    });
    expect(result.current.user).toBeNull();

    // Second user registers
    await act(async () => {
      await result.current.signUpWithEmail('member@k31.my.id', 'MemberPass123!');
    });

    // Second user should be regular 'user'
    expect(result.current.user?.email).toBe('member@k31.my.id');
    expect(result.current.user?.role).toBe('user');

    // System settings superadminEmail should still be founder
    expect(result.current.systemSettings.superadminEmail).toBe('founder@k31.my.id');
  });

  it('blocks registration when allowUserRegistration is false', async () => {
    localStorage.setItem(
      'superapps_system_settings',
      JSON.stringify({
        ...DEFAULT_SYSTEM_SETTINGS,
        allowUserRegistration: false,
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.signUpWithEmail('blocked@k31.my.id', 'Pass123456!');
      })
    ).rejects.toThrow('Registration is closed by administrator.');
  });

  it('blocks guest access when allowGuestAccess is false', async () => {
    localStorage.setItem(
      'superapps_system_settings',
      JSON.stringify({
        ...DEFAULT_SYSTEM_SETTINGS,
        allowGuestAccess: false,
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.continueAsGuest();
      })
    ).rejects.toThrow('Guest access is disabled by administrator.');
  });

  it('dynamically updates logged in user role when superadminEmail setting is changed', async () => {
    // Register normal user first
    localStorage.setItem(
      'superapps_local_registered_users',
      JSON.stringify([
        {
          uid: 'user-first',
          email: 'admin@k31.my.id',
          password: 'AdminSuperapps123!',
          role: 'superadmin',
        },
        {
          uid: 'user-second',
          email: 'promoted@k31.my.id',
          password: 'Password123!',
          role: 'user',
        },
      ])
    );
    localStorage.setItem('superapps_admin_claimed', 'true');

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Sign in as promoted user
    await act(async () => {
      await result.current.signInWithEmail('promoted@k31.my.id', 'Password123!');
    });
    expect(result.current.user?.role).toBe('user');

    // Change superadminEmail to promoted user
    await act(async () => {
      await result.current.updateSystemSettings({ superadminEmail: 'promoted@k31.my.id' });
    });

    // Role should dynamically update to superadmin
    expect(result.current.user?.role).toBe('superadmin');
  });

  it('exposes account linking functions on AuthContext', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(typeof result.current.linkWithGoogle).toBe('function');
    expect(typeof result.current.linkAccountWithGoogle).toBe('function');
    expect(typeof result.current.linkWithEmail).toBe('function');
    expect(typeof result.current.linkAccountWithEmail).toBe('function');
  });

  it('links guest session with email credentials and migrates guest data', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // 1. Start guest session
    await act(async () => {
      await result.current.continueAsGuest();
    });

    const guestId = result.current.user?.uid;
    expect(guestId).toBeDefined();
    expect(result.current.user?.isAnonymous).toBe(true);

    // 2. Create guest task
    await dataService.saveTask(guestId!, {
      id: 'guest-link-task-1',
      userId: guestId!,
      title: 'Task Before Linking',
      status: 'todo',
      priority: 'medium',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 3. Link account with email
    await act(async () => {
      await result.current.linkWithEmail('newuser@k31.my.id', 'Password123!');
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.email).toBe('newuser@k31.my.id');
    expect(result.current.user?.isAnonymous).toBe(false);

    // 4. Verify task was migrated to new user
    const newUserId = result.current.user?.uid!;
    const userTasks = await dataService.getTasks(newUserId);
    expect(userTasks.some((t) => t.id === 'guest-link-task-1' && t.userId === newUserId)).toBe(true);
  });

  it('migrates all entity collections (tasks, notes, habits, expenses, snippets) from multiple guest sources upon email linking', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // 1. Start guest session
    await act(async () => {
      await result.current.continueAsGuest();
    });
    const guestId = result.current.user?.uid!;
    expect(guestId).toBeDefined();

    // 2. Populate items under active guestId
    await dataService.saveTask(guestId, {
      id: 'task-active-guest',
      userId: guestId,
      title: 'Active Guest Task',
      status: 'in_progress',
      priority: 'high',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await dataService.saveNote(guestId, {
      id: 'note-active-guest',
      userId: guestId,
      title: 'Active Guest Note',
      content: '# Markdown content',
      tags: ['guest'],
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await dataService.saveHabit(guestId, {
      id: 'habit-active-guest',
      userId: guestId,
      title: 'Active Guest Habit',
      description: 'Daily habit',
      frequency: 'daily',
      completedDates: ['2026-10-06'],
      streak: 3,
      createdAt: Date.now(),
    });

    await dataService.saveExpense(guestId, {
      id: 'expense-active-guest',
      userId: guestId,
      description: 'Active Guest Expense',
      amount: 45.5,
      type: 'expense',
      category: 'food',
      date: '2026-10-07',
      createdAt: Date.now(),
    });

    await dataService.saveSnippet(guestId, {
      id: 'snippet-active-guest',
      userId: guestId,
      title: 'Active Guest Snippet',
      code: 'console.log("hello");',
      language: 'typescript',
      tags: ['guest'],
      createdAt: Date.now(),
    });

    // 3. Populate items under fallback guest-default
    await dataService.saveTask('guest-default', {
      id: 'task-fallback-guest',
      userId: 'guest-default',
      title: 'Fallback Guest Task',
      status: 'todo',
      priority: 'low',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 4. Link account with email
    await act(async () => {
      await result.current.linkWithEmail('fullmigrated@k31.my.id', 'SecurePassword123!');
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.email).toBe('fullmigrated@k31.my.id');
    expect(result.current.user?.isAnonymous).toBe(false);

    const targetUid = result.current.user?.uid!;

    // 5. Verify all entity collections were migrated to targetUid
    const migratedTasks = await dataService.getTasks(targetUid);
    expect(migratedTasks.some((t) => t.id === 'task-active-guest' && t.userId === targetUid)).toBe(true);
    expect(migratedTasks.some((t) => t.id === 'task-fallback-guest' && t.userId === targetUid)).toBe(true);

    const migratedNotes = await dataService.getNotes(targetUid);
    expect(migratedNotes.some((n) => n.id === 'note-active-guest' && n.userId === targetUid)).toBe(true);

    const migratedHabits = await dataService.getHabits(targetUid);
    expect(migratedHabits.some((h) => h.id === 'habit-active-guest' && h.userId === targetUid)).toBe(true);

    const migratedExpenses = await dataService.getExpenses(targetUid);
    expect(migratedExpenses.some((e) => e.id === 'expense-active-guest' && e.userId === targetUid)).toBe(true);

    const migratedSnippets = await dataService.getSnippets(targetUid);
    expect(migratedSnippets.some((s) => s.id === 'snippet-active-guest' && s.userId === targetUid)).toBe(true);
  });

  it('links guest session to an already registered account and migrates guest items without data loss', async () => {
    // Pre-register user in offline store
    localStorage.setItem(
      'superapps_local_registered_users',
      JSON.stringify([
        {
          uid: 'user-preexisting-99',
          email: 'existinguser@k31.my.id',
          displayName: 'Existing User',
          password: 'ExistingPassword123!',
          role: 'user',
        },
      ])
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // 1. Start guest session
    await act(async () => {
      await result.current.continueAsGuest();
    });
    const guestId = result.current.user?.uid!;

    // 2. Create guest task
    await dataService.saveTask(guestId, {
      id: 'task-pre-linking',
      userId: guestId,
      title: 'Task To Transfer To Existing Account',
      status: 'todo',
      priority: 'high',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 3. Link with existing credentials (credential already registered)
    await act(async () => {
      await result.current.linkWithEmail('existinguser@k31.my.id', 'ExistingPassword123!');
    });

    // 4. Verify user is now signed in as existing user
    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.uid).toBe('user-preexisting-99');
    expect(result.current.user?.email).toBe('existinguser@k31.my.id');
    expect(result.current.user?.isAnonymous).toBe(false);

    // 5. Verify task is migrated to existing user's ID
    const userTasks = await dataService.getTasks('user-preexisting-99');
    expect(userTasks.some((t) => t.id === 'task-pre-linking' && t.userId === 'user-preexisting-99')).toBe(true);
  });

  it('rejects linkWithEmail with invalid password for existing account without corrupting guest session', async () => {
    localStorage.setItem(
      'superapps_local_registered_users',
      JSON.stringify([
        {
          uid: 'user-preexisting-88',
          email: 'protected@k31.my.id',
          password: 'CorrectPassword123!',
          role: 'user',
        },
      ])
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.continueAsGuest();
    });
    const originalGuestUid = result.current.user?.uid;

    await expect(
      act(async () => {
        await result.current.linkWithEmail('protected@k31.my.id', 'WrongPassword!');
      })
    ).rejects.toThrow('Invalid email or password.');

    // Guest session must remain intact
    expect(result.current.user?.uid).toBe(originalGuestUid);
    expect(result.current.user?.isAnonymous).toBe(true);
  });

  it('rejects linkWithEmail when email or password is empty', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.continueAsGuest();
    });

    await expect(
      act(async () => {
        await result.current.linkWithEmail('', '');
      })
    ).rejects.toThrow('Please provide both email and password');
  });

  it('rejects linkWithGoogle when Firebase is not configured with clear guidance', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.continueAsGuest();
    });

    await expect(
      act(async () => {
        await result.current.linkWithGoogle();
      })
    ).rejects.toThrow('Firebase configuration not set');
  });

  it('renders AuthModal with guest linking notice and triggers linkWithEmail on form submission', async () => {
    let hookResult: any;
    const TestComponent = () => {
      hookResult = useAuth();
      const [isOpen, setIsOpen] = React.useState(true);
      return (
        <div>
          <button onClick={() => hookResult.continueAsGuest()}>Start Guest</button>
          <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
      );
    };

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Start guest session
    await act(async () => {
      await hookResult.continueAsGuest();
    });

    // Check modal displays guest linking copy explaining migration
    expect(screen.getByText('Link & Sync Account')).toBeInTheDocument();
    expect(screen.getByText(/Seamless Guest Data Migration/i)).toBeInTheDocument();
    expect(
      screen.getByText(/automatically migrate all your existing guest tasks, notes, habits, expenses, and snippets/i)
    ).toBeInTheDocument();

    // Check Link with Email submit button
    const linkEmailBtn = screen.getByTestId('link-with-email-btn');
    expect(linkEmailBtn).toHaveTextContent('Link with Email');

    // Enter email and password and submit
    const emailInput = screen.getByLabelText(/Email address/i);
    const passInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: 'modalmigrated@k31.my.id' } });
    fireEvent.change(passInput, { target: { value: 'ValidPassword123!' } });

    await act(async () => {
      fireEvent.click(linkEmailBtn);
    });

    // Verify user is now authenticated
    expect(hookResult.user).not.toBeNull();
    expect(hookResult.user?.email).toBe('modalmigrated@k31.my.id');
    expect(hookResult.user?.isAnonymous).toBe(false);

    unmount();
  });
});

