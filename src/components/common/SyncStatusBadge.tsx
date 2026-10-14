import React, { useState, useEffect, useRef } from 'react';
import { Cloud, CloudOff, RefreshCw, UserCheck, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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

    // Listen to local sync event bus to briefly trigger syncing animation
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

  const formatLastSync = (date: Date): string => {
    try {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showPopover && isPinned) {
      setShowPopover(false);
      setIsPinned(false);
    } else {
      setShowPopover(true);
      setIsPinned(true);
    }
  };

  return (
    <div
      className={`relative ${className}`}
      ref={popoverRef}
      data-testid="sync-status-badge"
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => {
        if (!isPinned) {
          setShowPopover(false);
        }
      }}
    >
      <button
        type="button"
        onClick={handleToggleClick}
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium border transition ${
          status === 'offline'
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            : status === 'guest'
            ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            : status === 'syncing'
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
        }`}
        title="Click to view cloud sync status"
        aria-label="Cloud sync status indicator"
      >
        {status === 'offline' && (
          <>
            <CloudOff className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
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
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
            <span className="hidden sm:inline">Syncing...</span>
          </>
        )}
        {status === 'synced' && (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
          className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xl z-50 text-xs animate-scale-up"
        >
          <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Cloud className="w-4 h-4 text-emerald-500" />
              <span>Synchronization Center</span>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                status === 'offline'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
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
            <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] flex items-start justify-between space-x-2">
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
          <div className="space-y-2 mb-3 py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Cloud Connection</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {status === 'offline'
                  ? 'Offline (No internet)'
                  : status === 'syncing'
                  ? 'Syncing...'
                  : status === 'guest'
                  ? 'Disconnected (Guest)'
                  : 'Connected (Firestore)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Storage Mode</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {status === 'offline'
                  ? 'Offline Local Cache'
                  : status === 'syncing'
                  ? 'Uploading Mutations'
                  : status === 'guest'
                  ? 'Local-only Storage'
                  : 'Dual Persistence'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Last Sync</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
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
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                You are currently in <strong>Guest Mode</strong>. All your notes, tasks, habits, expenses, and snippets are saved locally in this browser.
              </p>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] flex items-center space-x-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 text-amber-500" />
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
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Link Account & Sync Data</span>
              </button>
            </div>
          )}

          {status === 'synced' && (
            <div className="space-y-2 text-slate-600 dark:text-slate-400 text-[11px]">
              <p>
                Connected to <strong>Cloud Firestore</strong> with offline persistent cache.
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-500">
                All changes synchronize across open tabs and devices in real-time.
              </p>
            </div>
          )}

          {status === 'offline' && (
            <div className="space-y-2 text-slate-600 dark:text-slate-400 text-[11px]">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Working Offline</p>
              <p>
                You are disconnected from the network. Any changes you make are safely preserved in local storage and will sync automatically once reconnected.
              </p>
            </div>
          )}

          {status === 'syncing' && (
            <div className="space-y-2 text-slate-600 dark:text-slate-400 text-[11px]">
              <p className="font-semibold text-amber-600 dark:text-amber-400">Syncing Data...</p>
              <p>Uploading pending mutations to Firebase Cloud Firestore.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
