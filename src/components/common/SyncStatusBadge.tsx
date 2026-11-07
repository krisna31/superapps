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
      return 'bg-subtle text-ink-muted border-border-default hover:bg-border-subtle';
    }
    if (status === 'guest') {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/15';
    }
    if (status === 'syncing') {
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30 hover:bg-accent-primary/15';
    }
    return 'bg-status-success/10 text-status-success border-status-success/30 hover:bg-status-success/15';
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Interactive Status Pill Button - Apple HIG Style */}
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
        className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-all duration-fast cursor-pointer select-none shadow-sm min-h-[32px] ${getBadgeStyle()}`}
      >
        {status === 'offline' && (
          <>
            <CloudOff className="w-3.5 h-3.5 text-status-danger" />
            <span className="hidden sm:inline">Offline</span>
          </>
        )}
        {status === 'guest' && (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="hidden sm:inline">Guest (Local)</span>
          </>
        )}
        {status === 'syncing' && (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent-primary" />
            <span className="hidden sm:inline">Syncing...</span>
          </>
        )}
        {status === 'synced' && (
          <>
            <span className="w-2 h-2 rounded-full bg-status-success" />
            <Check className="w-3.5 h-3.5 text-status-success" />
            <span className="hidden sm:inline">Synced</span>
          </>
        )}
      </button>

      {/* Dropdown Popover Card - Apple HIG Frosted Vibrancy */}
      {showPopover && (
        <div
          role="dialog"
          aria-label="Synchronization details"
          className="absolute right-0 mt-2 w-80 bg-elevated/95 backdrop-blur-xl border border-border-subtle rounded-[16px] p-4 z-50 text-xs shadow-xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between font-semibold text-ink mb-3 pb-2.5 border-b border-border-subtle">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-[8px] bg-accent-primary/10 text-accent-primary flex items-center justify-center">
                <Cloud className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-[13px]">Synchronization Center</span>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                status === 'offline'
                  ? 'bg-subtle text-ink-muted'
                  : status === 'syncing'
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : status === 'guest'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-status-success/10 text-status-success'
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
            <div className="mb-3 p-2.5 bg-status-danger/10 border border-status-danger/30 rounded-[10px] text-status-danger text-xs flex items-start justify-between space-x-2">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-status-danger flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Sync Error ({syncError.collection})</span>
                  <span className="text-[11px] opacity-90">{syncError.message}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearLastSyncError();
                  setSyncError(null);
                }}
                className="text-status-danger hover:opacity-75 text-sm font-bold px-1"
                title="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          {/* Detailed status metrics - iOS Inset Grouped */}
          <div className="ios-inset-grouped mb-3 py-2 px-3 space-y-2 bg-subtle/50 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Cloud Connection</span>
              <span className="font-medium text-ink">
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
              <span className="text-ink-muted">Storage Mode</span>
              <span className="font-medium text-ink">
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
              <span className="text-ink-muted">Last Sync</span>
              <span className="text-ink font-mono tabular-nums">
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
            <div className="space-y-2.5">
              <p className="text-ink-secondary text-[12px] leading-relaxed">
                You are currently in <strong>Guest Mode</strong>. All your notes, tasks, habits, expenses, and snippets are saved locally in this browser.
              </p>
              <div className="p-2.5 rounded-[10px] bg-subtle/70 border border-border-subtle text-ink text-[12px] flex items-center space-x-2">
                <Database className="w-4 h-4 flex-shrink-0 text-accent-primary" />
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
                className="ios-btn ios-btn-primary w-full py-2 rounded-[10px] text-xs font-semibold"
              >
                Sign In / Link Account
              </button>
            </div>
          )}

          {status === 'offline' && (
            <p className="text-ink-secondary text-[12px] leading-relaxed">
              Superapps is running offline. All updates are staged locally in IndexedDB/localStorage and will automatically sync once connectivity resumes.
            </p>
          )}

          {status === 'synced' && (
            <div className="space-y-2">
              <p className="text-ink-secondary text-[12px] leading-relaxed">
                {isLocalSession
                  ? 'Running in local superadmin fallback session. Changes are saved to local browser storage.'
                  : isFirebaseConfigured
                  ? 'All changes synchronize across open tabs and devices in real-time with dual persistence to browser storage and Cloud Firestore.'
                  : 'Running in local storage fallback mode. Configure Firebase secrets in GitHub Actions to enable cloud synchronization across devices.'}
              </p>
              <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-border-subtle">
                <span>Account</span>
                <span className="text-ink font-medium truncate max-w-[150px]">
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
