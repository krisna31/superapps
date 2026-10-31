import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SyncStatusBadge } from '@/components/common/SyncStatusBadge';
import { AuthProvider } from '@/context/AuthContext';

describe('SyncStatusBadge Component', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /* ------------------------------------------------------------------------- */
  /* 1. RENDERING IN EACH OF THE 4 STATES                                      */
  /* ------------------------------------------------------------------------- */

  it('renders Guest Mode badge when user is in guest / anonymous mode', async () => {
    localStorage.setItem(
      'superapps_local_guest',
      JSON.stringify({
        uid: 'guest-explorer',
        displayName: 'Guest Explorer',
        isAnonymous: true,
        role: 'user',
      })
    );

    await act(async () => {
      render(
        <AuthProvider>
          <SyncStatusBadge onOpenAuthModal={() => {}} />
        </AuthProvider>
      );
    });

    const badge = screen.getByTestId('sync-status-badge');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('Guest (Local)')).toBeInTheDocument();
  });

  it('renders Synced badge with emerald pulse and check icon when authenticated and online', async () => {
    localStorage.setItem(
      'superapps_local_user',
      JSON.stringify({
        uid: 'authenticated-user-123',
        email: 'user@k31.my.id',
        displayName: 'Cloud User',
        isAnonymous: false,
        role: 'user',
      })
    );

    await act(async () => {
      render(
        <AuthProvider>
          <SyncStatusBadge onOpenAuthModal={() => {}} />
        </AuthProvider>
      );
    });

    const badge = screen.getByTestId('sync-status-badge');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('renders Offline badge with cloud-off icon when navigator.onLine is false', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true });

    await act(async () => {
      render(
        <AuthProvider>
          <SyncStatusBadge onOpenAuthModal={() => {}} />
        </AuthProvider>
      );
    });

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renders Syncing... badge with amber spinner when superapps_local_sync event fires', async () => {
    vi.useFakeTimers();

    await act(async () => {
      render(
        <AuthProvider>
          <SyncStatusBadge onOpenAuthModal={() => {}} />
        </AuthProvider>
      );
    });

    act(() => {
      window.dispatchEvent(new CustomEvent('superapps_local_sync', { detail: { key: 'tasks' } }));
    });

    expect(screen.getByText('Syncing...')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText('Syncing...')).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------------- */
  /* 2. DYNAMIC NETWORK ONLINE / OFFLINE EVENTS                                */
  /* ------------------------------------------------------------------------- */

  it('reacts dynamically to window online and offline events', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <SyncStatusBadge onOpenAuthModal={() => {}} />
        </AuthProvider>
      );
    });

    // Fire offline event
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText('Offline')).toBeInTheDocument();

    // Fire online event to recover
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------------- */
  /* 3. POPOVER INTERACTION: CLICK, HOVER, AND LINK ACCOUNT                    */
  /* ------------------------------------------------------------------------- */

  it('opens popover on click and invokes onOpenAuthModal when Link Account is clicked', async () => {
    const onOpenAuthModal = vi.fn();
    localStorage.setItem(
      'superapps_local_guest',
      JSON.stringify({
        uid: 'guest-explorer',
        displayName: 'Guest Explorer',
        isAnonymous: true,
        role: 'user',
      })
    );

    await act(async () => {
      render(
        <AuthProvider>
          <SyncStatusBadge onOpenAuthModal={onOpenAuthModal} />
        </AuthProvider>
      );
    });

    const button = screen.getByRole('button', { name: /cloud sync status indicator/i });
    fireEvent.click(button);

    // Popover is displayed with detailed metrics
    expect(screen.getByText('Synchronization Center')).toBeInTheDocument();
    expect(screen.getByText('Cloud Connection')).toBeInTheDocument();
    expect(screen.getByText('Storage Mode')).toBeInTheDocument();
    expect(screen.getByText('Last Sync')).toBeInTheDocument();
    expect(screen.getByText(/Link your account to backup and sync your guest items/i)).toBeInTheDocument();

    const linkButton = screen.getByTestId('link-account-btn');
    fireEvent.click(linkButton);

    expect(onOpenAuthModal).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Synchronization Center')).not.toBeInTheDocument();
  });

  it('opens popover on hover (mouseEnter) and closes on mouseLeave when not pinned', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <SyncStatusBadge onOpenAuthModal={() => {}} />
        </AuthProvider>
      );
    });

    const badgeContainer = screen.getByTestId('sync-status-badge');

    // Hover enters
    fireEvent.mouseEnter(badgeContainer);
    expect(screen.getByText('Synchronization Center')).toBeInTheDocument();

    // Hover leaves
    fireEvent.mouseLeave(badgeContainer);
    expect(screen.queryByText('Synchronization Center')).not.toBeInTheDocument();
  });

  it('closes popover on Escape key press and outside click', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <SyncStatusBadge onOpenAuthModal={() => {}} />
        </AuthProvider>
      );
    });

    const button = screen.getByRole('button', { name: /cloud sync status indicator/i });

    // Open via click (pinned)
    fireEvent.click(button);
    expect(screen.getByText('Synchronization Center')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Synchronization Center')).not.toBeInTheDocument();

    // Reopen and click outside
    fireEvent.click(button);
    expect(screen.getByText('Synchronization Center')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Synchronization Center')).not.toBeInTheDocument();
  });

  it('displays Cloud Connection, Storage Mode, and Last Sync in Synced mode', async () => {
    localStorage.setItem(
      'superapps_local_user',
      JSON.stringify({
        uid: 'user-synced-test',
        email: 'synced@k31.my.id',
        displayName: 'Synced Member',
        isAnonymous: false,
        role: 'user',
      })
    );

    await act(async () => {
      render(
        <AuthProvider>
          <SyncStatusBadge onOpenAuthModal={() => {}} />
        </AuthProvider>
      );
    });

    const button = screen.getByRole('button', { name: /cloud sync status indicator/i });
    fireEvent.click(button);

    // In test environment without live Firebase env vars, it correctly shows Local Storage Fallback
    expect(screen.getByText('Local Storage Fallback')).toBeInTheDocument();
    expect(screen.getByText('Local Browser Storage')).toBeInTheDocument();
    expect(screen.getByText('Last Sync')).toBeInTheDocument();
    expect(screen.getByText(/Running in local storage fallback mode/i)).toBeInTheDocument();
  });

  /* ------------------------------------------------------------------------- */
  /* 4. CLEAN UNMOUNT AND TEARDOWN HYGIENE                                     */
  /* ------------------------------------------------------------------------- */

  it('unmounts cleanly without hanging timers or unhandled memory leaks', async () => {
    vi.useFakeTimers();
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    let unmountFn: () => void = () => {};

    await act(async () => {
      const { unmount } = render(
        <AuthProvider>
          <SyncStatusBadge onOpenAuthModal={() => {}} />
        </AuthProvider>
      );
      unmountFn = unmount;
    });

    // Trigger sync to set an active timeout
    act(() => {
      window.dispatchEvent(new CustomEvent('superapps_local_sync', { detail: { key: 'notes' } }));
    });

    // Unmount while timer is pending
    act(() => {
      unmountFn();
    });

    // Verify listeners were cleaned up
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('superapps_local_sync', expect.any(Function));

    // Fast-forward past the timer
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // No exceptions, no dangling handlers
  });
});
