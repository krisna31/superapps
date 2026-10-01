import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth, DEFAULT_SUPERADMIN_CREDENTIALS } from '@/context/AuthContext';
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
});
