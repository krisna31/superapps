import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act, render, screen } from '@testing-library/react';
import * as AuthContextModule from '@/context/AuthContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { dataService, DEFAULT_SYSTEM_SETTINGS } from '@/services/dataService';

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext Superadmin & Access Control Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('verifies hardcoded superadmin credentials are removed from bundle (Finding C5 & C6)', () => {
    // DEFAULT_SUPERADMIN_CREDENTIALS must not exist
    expect((AuthContextModule as any).DEFAULT_SUPERADMIN_CREDENTIALS).toBeUndefined();
  });

  it('rejects offline email sign in and registration when Firebase is not configured with clear message', async () => {
    localStorage.setItem(
      'superapps_system_settings',
      JSON.stringify({
        ...DEFAULT_SYSTEM_SETTINGS,
        allowUserRegistration: true,
      })
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      result.current.signInWithEmail('admin@k31.my.id', 'SomePassword123!')
    ).rejects.toThrow('Firebase configuration not set. Cloud authentication requires Firebase configuration.');

    await expect(
      result.current.signUpWithEmail('new@k31.my.id', 'SomePassword123!')
    ).rejects.toThrow('Firebase configuration not set. Cloud registration requires Firebase configuration.');
  });

  it('starts guest session and seeds guest items when guest access is allowed', async () => {
    localStorage.setItem(
      'superapps_system_settings',
      JSON.stringify({
        ...DEFAULT_SYSTEM_SETTINGS,
        allowGuestAccess: true,
      })
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.continueAsGuest();
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.isAnonymous).toBe(true);
    expect(result.current.user?.role).toBe('user');

    const guestId = result.current.user?.uid!;
    const tasks = await dataService.getTasks(guestId);
    expect(tasks.length).toBeGreaterThan(0);
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
      result.current.signUpWithEmail('blocked@k31.my.id', 'Pass123456!')
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
      result.current.continueAsGuest()
    ).rejects.toThrow('Guest access is disabled by administrator.');
  });

  it('grants superadmin role exclusively to the verified administrator email (jelvinkrisnaputra31@gmail.com)', async () => {
    // Authenticated regular user
    localStorage.setItem(
      'superapps_local_user',
      JSON.stringify({
        uid: 'user-regular',
        email: 'member@k31.my.id',
        displayName: 'Regular User',
        role: 'user',
        isAnonymous: false,
      })
    );

    const { result: regResult } = renderHook(() => useAuth(), { wrapper });
    expect(regResult.current.user?.role).toBe('user');

    // Authenticated superadmin user
    localStorage.setItem(
      'superapps_local_user',
      JSON.stringify({
        uid: 'user-admin',
        email: 'jelvinkrisnaputra31@gmail.com',
        displayName: 'Verified Admin',
        role: 'superadmin',
        isAnonymous: false,
      })
    );

    const { result: adminResult } = renderHook(() => useAuth(), { wrapper });
    expect(adminResult.current.user?.role).toBe('superadmin');
  });

  it('dynamically updates logged in user role when superadminEmail setting is changed', async () => {
    localStorage.setItem(
      'superapps_local_user',
      JSON.stringify({
        uid: 'user-promoted',
        email: 'promoted@k31.my.id',
        displayName: 'Promoted User',
        role: 'user',
        isAnonymous: false,
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
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

  it('rejects linkWithEmail when email or password is empty', async () => {
    localStorage.setItem(
      'superapps_system_settings',
      JSON.stringify({
        ...DEFAULT_SYSTEM_SETTINGS,
        allowGuestAccess: true,
      })
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.continueAsGuest();
    });

    await expect(
      result.current.linkWithEmail('', '')
    ).rejects.toThrow('Please provide both email and password');
  });

  it('rejects linkWithGoogle when Firebase is not configured with clear guidance', async () => {
    localStorage.setItem(
      'superapps_system_settings',
      JSON.stringify({
        ...DEFAULT_SYSTEM_SETTINGS,
        allowGuestAccess: true,
      })
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.continueAsGuest();
    });

    await expect(
      result.current.linkWithGoogle()
    ).rejects.toThrow('Firebase configuration not set');
  });

  it('rejects linkWithEmail when Firebase is not configured with clear guidance', async () => {
    localStorage.setItem(
      'superapps_system_settings',
      JSON.stringify({
        ...DEFAULT_SYSTEM_SETTINGS,
        allowGuestAccess: true,
      })
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.continueAsGuest();
    });

    await expect(
      result.current.linkWithEmail('test@k31.my.id', 'Password123!')
    ).rejects.toThrow('Firebase configuration not set. Cloud account linking requires Firebase configuration.');
  });

  it('migrates guest entities cleanly without copying unchanged sample items (Finding C3)', async () => {
    const guestId = 'guest-test-source';
    const targetUserId = 'guest-test-target';

    // 1. Seed initial samples
    dataService.seedGuestSamples(guestId);

    // 2. Add custom items created by the user
    await dataService.saveTask(guestId, {
      id: 'task-custom-created',
      userId: guestId,
      title: 'Real Custom Task',
      status: 'in_progress',
      priority: 'high',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await dataService.saveNote(guestId, {
      id: 'note-custom-created',
      userId: guestId,
      title: 'Real Custom Note',
      content: '# Real Content',
      tags: ['personal'],
      isPinned: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 3. Migrate data to target
    const result = await dataService.migrateGuestData(guestId, targetUserId);
    expect(result.success).toBe(true);

    // Unchanged samples must NOT be migrated
    const targetTasks = await dataService.getTasks(targetUserId);
    expect(targetTasks.some((t) => t.id === 'task-1')).toBe(false);
    expect(targetTasks.some((t) => t.id === 'task-custom-created')).toBe(true);

    const targetNotes = await dataService.getNotes(targetUserId);
    expect(targetNotes.some((n) => n.id === 'note-1')).toBe(false);
    expect(targetNotes.some((n) => n.id === 'note-custom-created')).toBe(true);
  });

  it('renders AuthModal with guest linking notice and explains seamless migration', async () => {
    // Set guest session in storage
    localStorage.setItem(
      'superapps_local_guest',
      JSON.stringify({
        uid: 'guest-explorer-123',
        displayName: 'Guest Explorer',
        isAnonymous: true,
        role: 'user',
      })
    );

    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={() => {}} />
      </AuthProvider>
    );

    // Check modal displays guest linking copy explaining migration
    expect(screen.getByText('Link & Sync Account')).toBeInTheDocument();
    expect(screen.getByText(/Seamless Guest Data Migration/i)).toBeInTheDocument();
    expect(
      screen.getByText(/automatically migrate all your existing guest tasks, notes, habits, expenses, and snippets/i)
    ).toBeInTheDocument();
  });
});
