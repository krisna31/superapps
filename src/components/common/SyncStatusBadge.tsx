import React, { useState, useEffect, useRef } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertTriangle, Database } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isFirebaseConfigured } from '@/firebase/config';
import { subscribeSyncErrors, getLastSyncError, clearLastSyncError, SyncErrorEvent } from '@/services/syncErrors';

interface SyncStatusBadgeProps {
  onOpenAuthModal: () => void;
  className?: string;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ onOpenAuthModal, className = '' }) => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<SyncErrorEvent | null>(() => getLastSyncError());
  const [showPopover, setShowPopover] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => new Date());
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let syncTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncTime(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen to local sync event bus to briefly trigger syncing indicator
    const handleSync = () => {
      setIsSyncing(true);
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        setIsSyncing(false);
        setLastSyncTime(new Date());
      }, 800);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('superapps_local_sync', handleSync);

    const unsubscribeError = subscribeSyncErrors((event) => {
      setSyncError(event);
    });

    return () => {
      if (syncTimer) {
        clearTimeout(syncTimer);
      }
      unsubscribeError();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('superapps_local_sync', handleSync);
    };
  }, []);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!showPopover) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
        setIsPinned(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPopover(false);
        setIsPinned(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPopover]);

  const isGuest = !user || user.isAnonymous || user.uid.startsWith('guest-');
  const isLocalSession = Boolean(user?.uid?.startsWith('local-'));

  let status: 'offline' | 'guest' | 'syncing' | 'synced' = 'synced';
  if (!isOnline) {
    status = 'offline';
  } else if (isSyncing) {
    status = 'syncing';
  } else if (isGuest) {
    status = 'guest';
  } else {
    status = 'synced';
  }

  const formatLastSync = (date: Date) => {
    const diffSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBadgeStyle = () => {
    if (status === 'offline') {
      return 'bg-subtle text-ink-muted border-border-default';
    }
    if (status === 'guest') {
      return 'bg-surface text-ink border-border-strong';
    }
    if (status === 'syncing') {
      return 'bg-surface text-status-warning border-status-warning';
    }
    return 'bg-surface text-ink border-border-strong';
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Interactive Status Pill Button */}
      <button
        type="button"
        data-testid="sync-status-badge"
        aria-label="Cloud sync status indicator"
        aria-haspopup="dialog"
        aria-expanded={showPopover}
        onClick={() => {
          setIsPinned(!isPinned);
          setShowPopover(!showPopover);
        }}
        onMouseEnter={() => {
          if (!isPinned) setShowPopover(true);
        }}
        onMouseLeave={() => {
          if (!isPinned) setShowPopover(false);
        }}
        className={`flex items-center space-x-1.5 px-2.5 py-1 border-1.5 text-xs font-mono font-bold transition-colors duration-fast cursor-pointer select-none ${getBadgeStyle()}`}
      >
        {status === 'offline' && (
          <>
            <CloudOff className="w-3.5 h-3.5 text-status-danger" />
            <span className="hidden sm:inline">Offline</span>
          </>
        )}
        {status === 'guest' && (
          <>
            <span className="w-2 h-2 bg-signal-secondary" />
            <span className="hidden sm:inline">Guest (Local)</span>
          </>
        )}
        {status === 'syncing' && (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-status-warning" />
            <span className="hidden sm:inline">Syncing...</span>
          </>
        )}
        {status === 'synced' && (
          <>
            <span className="w-2 h-2 bg-status-success" />
            <Check className="w-3.5 h-3.5 text-status-success" />
            <span className="hidden sm:inline">Synced</span>
          </>
        )}
      </button>

      {/* Dropdown Popover Card */}
      {showPopover && (
        <div
          role="dialog"
          aria-label="Synchronization details"
          className="absolute right-0 mt-2 w-80 bg-elevated border-1.5 border-border-strong p-3.5 z-50 text-xs font-mono"
        >
          <div className="flex items-center justify-between font-bold text-ink mb-2.5 pb-2 border-b-1.5 border-border-strong">
            <div className="flex items-center space-x-1.5">
              <Cloud className="w-4 h-4 text-signal" />
              <span className="uppercase tracking-wider">Synchronization Center</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 border border-border-strong uppercase font-bold ${
                status === 'offline'
                  ? 'bg-subtle text-ink-muted'
                  : status === 'syncing'
                  ? 'bg-surface text-status-warning'
                  : status === 'guest'
                  ? 'bg-surface text-ink'
                  : 'bg-ink text-canvas'
              }`}
            >
              {status === 'offline'
                ? 'Offline'
                : status === 'syncing'
                ? 'Syncing'
                : status === 'guest'
                ? 'Guest Mode'
                : 'Synced'}
            </span>
          </div>

          {syncError && (
            <div className="mb-2.5 p-2 bg-surface border-1.5 border-status-danger text-status-danger text-[11px] flex items-start justify-between space-x-2">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-status-danger flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block uppercase">Sync Error ({syncError.collection})</span>
                  <span className="text-[10px] opacity-90">{syncError.message}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearLastSyncError();
                  setSyncError(null);
                }}
                className="text-status-danger hover:opacity-75 text-xs font-bold px-1"
                title="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          {/* Detailed status metrics */}
          <div className="space-y-1.5 mb-2.5 py-2 px-2.5 bg-subtle border-1.5 border-border-strong text-[11px]">
            <div className="flex items-center justify-between">
              <span className="werkbund-coord">Cloud Connection</span>
              <span className="font-bold text-ink">
                {status === 'offline'
                  ? 'Offline (No internet)'
                  : status === 'syncing'
                  ? 'Syncing...'
                  : status === 'guest'
                  ? 'Disconnected (Guest)'
                  : isLocalSession
                  ? 'Local Mode (Offline Admin)'
                  : isFirebaseConfigured
                  ? 'Connected (Firestore)'
                  : 'Local Storage Fallback'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="werkbund-coord">Storage Mode</span>
              <span className="font-bold text-ink">
                {status === 'offline'
                  ? 'Offline Local Cache'
                  : status === 'syncing'
                  ? 'Uploading Mutations'
                  : status === 'guest'
                  ? 'Local-only Storage'
                  : isLocalSession || !isFirebaseConfigured
                  ? 'Local Browser Storage'
                  : 'Dual Persistence'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="werkbund-coord">Last Sync</span>
              <span className="font-mono text-ink tabular-nums">
                {status === 'offline'
                  ? `${formatLastSync(lastSyncTime)} (Paused)`
                  : status === 'syncing'
                  ? 'Syncing in progress...'
                  : status === 'guest'
                  ? 'Saved locally'
                  : formatLastSync(lastSyncTime)}
              </span>
            </div>
          </div>

          {/* Contextual actions and details */}
          {status === 'guest' && (
            <div className="space-y-2">
              <p className="text-ink-secondary text-[11px] leading-relaxed">
                You are currently in <strong>Guest Mode</strong>. All your notes, tasks, habits, expenses, and snippets are saved locally in this browser.
              </p>
              <div className="p-2 border-1.5 border-border-strong bg-subtle text-ink text-[11px] flex items-center space-x-2">
                <Database className="w-3.5 h-3.5 flex-shrink-0 text-signal" />
                <span>Link your account to backup and sync your guest items to Cloud Firestore!</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPopover(false);
                  setIsPinned(false);
                  onOpenAuthModal();
                }}
                data-testid="link-account-btn"
                className="werkbund-btn werkbund-btn-signal w-full py-1.5 text-xs"
              >
                Sign In / Link Account
              </button>
            </div>
          )}

          {status === 'offline' && (
            <p className="werkbund-coord leading-relaxed">
              Superapps is running offline. All updates are staged locally in IndexedDB/localStorage and will automatically sync once connectivity resumes.
            </p>
          )}

          {status === 'synced' && (
            <div className="space-y-1.5">
              <p className="text-ink-secondary text-[11px] leading-relaxed">
                {isLocalSession
                  ? 'Running in local superadmin fallback session. Changes are saved to local browser storage.'
                  : isFirebaseConfigured
                  ? 'All changes synchronize across open tabs and devices in real-time with dual persistence to browser storage and Cloud Firestore.'
                  : 'Running in local storage fallback mode. Configure Firebase secrets in GitHub Actions to enable cloud synchronization across devices.'}
              </p>
              <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1 border-t-1.5 border-border-strong">
                <span className="werkbund-coord">Account</span>
                <span className="font-mono text-ink font-bold truncate max-w-[150px]">
                  {user?.email || user?.displayName || 'User'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
