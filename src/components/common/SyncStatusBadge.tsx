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
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
    if (status === 'guest') {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    if (status === 'syncing') {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
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
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition cursor-pointer select-none ${getBadgeStyle()}`}
      >
        {status === 'offline' && (
          <>
            <CloudOff className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Offline</span>
          </>
        )}
        {status === 'guest' && (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="hidden sm:inline">Guest (Local)</span>
          </>
        )}
        {status === 'syncing' && (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
            <span className="hidden sm:inline">Syncing...</span>
          </>
        )}
        {status === 'synced' && (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Synced</span>
          </>
        )}
      </button>

      {/* Dropdown Popover Card */}
      {showPopover && (
        <div
          role="dialog"
          aria-label="Synchronization details"
          className="absolute right-0 mt-2 w-80 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 shadow-lg z-50 text-xs"
        >
          <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-1.5">
              <Cloud className="w-4 h-4 text-emerald-500" />
              <span>Synchronization Center</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                status === 'offline'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  : status === 'syncing'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : status === 'guest'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
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
            <div className="mb-2.5 p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] flex items-start justify-between space-x-2">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Sync Error ({syncError.collection})</span>
                  <span className="text-[10px] opacity-90">{syncError.message}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearLastSyncError();
                  setSyncError(null);
                }}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1"
                title="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          {/* Detailed status metrics */}
          <div className="space-y-1.5 mb-2.5 py-2 px-2.5 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Cloud Connection</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
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
              <span className="text-slate-500">Storage Mode</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
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
              <span className="text-slate-500">Last Sync</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 tabular-nums">
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
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                You are currently in <strong>Guest Mode</strong>. All your notes, tasks, habits, expenses, and snippets are saved locally in this browser.
              </p>
              <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] flex items-center space-x-2">
                <Database className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
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
                className="w-full py-1.5 px-3 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs transition"
              >
                Sign In / Link Account
              </button>
            </div>
          )}

          {status === 'offline' && (
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Superapps is running offline. All updates are staged locally in IndexedDB/localStorage and will automatically sync once connectivity resumes.
            </p>
          )}

          {status === 'synced' && (
            <div className="space-y-1.5">
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                {isLocalSession
                  ? 'Running in local superadmin fallback session. Changes are saved to local browser storage.'
                  : isFirebaseConfigured
                  ? 'All changes synchronize across open tabs and devices in real-time with dual persistence to browser storage and Cloud Firestore.'
                  : 'Running in local storage fallback mode. Configure Firebase secrets in GitHub Actions to enable cloud synchronization across devices.'}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Account</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
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
