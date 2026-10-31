import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import App from '@/App';

describe('Superapps Main Application Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders application shell, brand logo, and navigation links when guest mode is enabled', async () => {
    localStorage.setItem(
      'superapps_system_settings',
      JSON.stringify({
        allowGuestAccess: true,
        allowUserRegistration: false,
        superadminEmail: 'jelvinkrisnaputra31@gmail.com',
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getAllByText(/Superapps/i).length).toBeGreaterThan(0);
    });

    // Nav & module elements (use getAllByText as they appear in sidebar and dashboard)
    expect(screen.getAllByText('Tasks (Kanban)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Notes Vault').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Daily Habits').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Expenses & Budget').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Snippets Vault').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('SwissKnife Dev Tools').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Dropzone File Sharing').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('URL Shortlinks').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Media Downloader').length).toBeGreaterThanOrEqual(1);

    // Domain display in sidebar footer
    expect(screen.getByText('apps.k31.my.id')).toBeInTheDocument();

    // Admin Settings link should NOT appear for unauthenticated guest
    expect(screen.queryByText('Admin Settings')).toBeNull();
  });

  it('renders Admin Settings navigation link and admin badge when logged in as superadmin', async () => {
    localStorage.setItem(
      'superapps_local_user',
      JSON.stringify({
        uid: 'local-superadmin',
        email: 'jelvinkrisnaputra31@gmail.com',
        displayName: 'Superadmin',
        photoURL: null,
        isAnonymous: false,
        role: 'superadmin',
      })
    );

    await act(async () => {
      render(<App />);
    });

    // Admin Settings must be visible in the sidebar navigation
    expect(screen.getByText('Admin Settings')).toBeInTheDocument();

    // Admin badge in navbar
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('hides Admin Settings navigation link when user is a guest or regular user', async () => {
    localStorage.setItem(
      'superapps_local_guest',
      JSON.stringify({
        uid: 'guest-12345',
        email: null,
        displayName: 'Guest Explorer',
        photoURL: null,
        isAnonymous: true,
        role: 'user',
      })
    );

    await act(async () => {
      render(<App />);
    });

    expect(screen.queryByText('Admin Settings')).toBeNull();
    expect(screen.queryByText('Admin')).toBeNull();
  });

  it('displays AuthLockPage and gates workspace tools when allowGuestAccess is false for unauthenticated visitor', async () => {
    localStorage.setItem(
      'superapps_system_settings',
      JSON.stringify({
        allowGuestAccess: false,
        allowUserRegistration: true,
        superadminEmail: 'admin@k31.my.id',
      })
    );

    await act(async () => {
      render(<App />);
    });

    // Private workspace lock screen must be visible
    expect(screen.getByText(/Private Workspace Locked/i)).toBeInTheDocument();
    expect(screen.getByText(/Public guest access is disabled on this workspace/i)).toBeInTheDocument();

    // Normal workspace navigation/tools must NOT be present
    expect(screen.queryByText('Tasks (Kanban)')).toBeNull();
    expect(screen.queryByText('Notes Vault')).toBeNull();
  });

  it('unlocks workspace when authenticated as superadmin even if allowGuestAccess is false', async () => {
    localStorage.setItem(
      'superapps_system_settings',
      JSON.stringify({
        allowGuestAccess: false,
        allowUserRegistration: true,
        superadminEmail: 'admin@k31.my.id',
      })
    );
    localStorage.setItem(
      'superapps_local_user',
      JSON.stringify({
        uid: 'local-superadmin',
        email: 'jelvinkrisnaputra31@gmail.com',
        displayName: 'Superadmin',
        photoURL: null,
        isAnonymous: false,
        role: 'superadmin',
      })
    );

    await act(async () => {
      render(<App />);
    });

    // Lock page should NOT be displayed
    expect(screen.queryByText(/Private Workspace Locked/i)).toBeNull();

    // Normal dashboard and admin settings should be accessible
    expect(screen.getAllByText('Tasks (Kanban)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Admin Settings')).toBeInTheDocument();
  });

  it('locks workspace when guest access is disabled and displays locked screen', async () => {
    localStorage.setItem(
      'superapps_system_settings',
      JSON.stringify({
        allowGuestAccess: false,
        allowUserRegistration: true,
        superadminEmail: 'jelvinkrisnaputra31@gmail.com',
      })
    );

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText(/Private Workspace Locked/i)).toBeInTheDocument();
    expect(screen.getByText(/Public guest access is disabled on this workspace/i)).toBeInTheDocument();
  });

  it('hides guest access button and shows closed notice in AuthModal when policies are disabled', async () => {
    localStorage.setItem(
      'superapps_system_settings',
      JSON.stringify({
        allowGuestAccess: true,
        allowUserRegistration: false,
        superadminEmail: 'admin@k31.my.id',
      })
    );

    await act(async () => {
      render(<App />);
    });

    // Open AuthModal via Sign In button in navbar
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    await act(async () => {
      fireEvent.click(signInButton);
    });

    // Modal is open
    expect(screen.getByText('Sign in to Superapps')).toBeInTheDocument();

    // Registration closed message should be present
    expect(screen.getByText('Registration is closed by administrator.')).toBeInTheDocument();
    // Sign up button should not be present
    expect(screen.queryByRole('button', { name: /sign up/i })).toBeNull();
  });

  it('immediately gates an active guest session behind AuthLockPage when allowGuestAccess is false', async () => {
    // Existing active guest in localStorage
    localStorage.setItem(
      'superapps_local_guest',
      JSON.stringify({
        uid: 'guest-active-123',
        email: null,
        displayName: 'Guest Explorer',
        photoURL: null,
        isAnonymous: true,
        role: 'user',
      })
    );
    // Guest access policy is disabled
    localStorage.setItem(
      'superapps_system_settings',
      JSON.stringify({
        allowGuestAccess: false,
        allowUserRegistration: true,
        superadminEmail: 'admin@k31.my.id',
      })
    );

    await act(async () => {
      render(<App />);
    });

    // Active guest session must be intercepted and locked
    expect(screen.getByText(/Private Workspace Locked/i)).toBeInTheDocument();
    expect(screen.queryByText('Tasks (Kanban)')).toBeNull();
  });

  it('hides Continue as Guest button in AuthModal when allowGuestAccess is false', async () => {
    localStorage.setItem(
      'superapps_system_settings',
      JSON.stringify({
        allowGuestAccess: false,
        allowUserRegistration: true,
        superadminEmail: 'admin@k31.my.id',
      })
    );
    // Logged in as regular user so they can view the workspace and open AuthModal
    localStorage.setItem(
      'superapps_local_user',
      JSON.stringify({
        uid: 'user-regular',
        email: 'user@k31.my.id',
        displayName: 'Regular User',
        role: 'user',
        isAnonymous: false,
      })
    );

    await act(async () => {
      render(<App />);
    });

    // Verify workspace is unlocked for authenticated user
    expect(screen.queryByText(/Private Workspace Locked/i)).toBeNull();

    // The Continue as Guest button must not exist anywhere
    expect(screen.queryByText(/Continue as Guest/i)).toBeNull();
  });
});
