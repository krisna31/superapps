import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDb } from '../../context/DbContext';
import {
  Lock,
  Unlock,
  Database,
  ShieldCheck,
  Clock,
  BookOpen,
  Search,
  Palette,
  Volume2,
  VolumeX,
  Download,
  Fingerprint,
  KanbanSquare,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SuperappsLogo } from '../brand/SuperappsLogo';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import { useTheme } from '../../context/ThemeContext';
import { soundService } from '../../services/soundService';
import { subscribeToInstallPrompt, promptInstall } from '../../services/pwaService';

export const Navbar: React.FC = () => {
  const { isUnlocked, lockVault, vaultMeta, updateAutoLock, isBiometricEnrolled } = useAuth();
  const { isReady, runQuery, refreshSignal } = useDb();
  const { openPalette } = useCommandPalette();
  const { theme, cycleTheme, themes } = useTheme();

  const [soundEnabled, setSoundEnabled] = useState(() => soundService.getSoundEnabled());
  const [canInstall, setCanInstall] = useState(false);
  const [taskStats, setTaskStats] = useState({ pending: 0, urgent: 0 });

  useEffect(() => {
    return subscribeToInstallPrompt((available) => {
      setCanInstall(available);
    });
  }, []);

  useEffect(() => {
    if (!isUnlocked || !isReady) return;
    try {
      const res = runQuery("SELECT COUNT(*), SUM(CASE WHEN priority='urgent' THEN 1 ELSE 0 END) FROM tasks WHERE status != 'completed';");
      if (res.values && res.values[0]) {
        setTaskStats({
          pending: Number(res.values[0][0]) || 0,
          urgent: Number(res.values[0][1]) || 0,
        });
      }
    } catch {
      // In case table not initialized yet
    }
  }, [isUnlocked, isReady, runQuery, refreshSignal]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    soundService.setSoundEnabled(next);
    setSoundEnabled(next);
    if (next) soundService.playClick();
  };

  const handleLock = () => {
    soundService.playLock();
    lockVault();
  };

  const currentThemeConfig = themes.find((t) => t.id === theme);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Link to="/" className="group flex items-center">
          <SuperappsLogo size={36} showWordmark />
        </Link>
      </div>

      {/* Command Palette Omni-Search Trigger Button */}
      {isUnlocked && (
        <div className="flex-1 max-w-xs mx-4 hidden sm:block">
          <button
            onClick={() => {
              soundService.playClick();
              openPalette();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 text-xs transition-all shadow-inner group"
            title="Command Palette (Ctrl+K / Cmd+K)"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <span className="truncate">Search or command...</span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] text-slate-400">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Mobile Search Button */}
        {isUnlocked && (
          <button
            onClick={() => {
              soundService.playClick();
              openPalette();
            }}
            className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white"
            title="Search (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-blue-400" />
          </button>
        )}

        {/* Task Matrix Quick Metric Jump Button */}
        {isUnlocked && (
          <Link
            to="/app/tasks"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-all group"
            title={`Kanban Tasks: ${taskStats.pending} pending (${taskStats.urgent} urgent)`}
          >
            <KanbanSquare className={`w-3.5 h-3.5 ${taskStats.urgent > 0 ? 'text-rose-400' : 'text-blue-400'}`} />
            <span className="hidden md:inline">Tasks</span>
            {taskStats.pending > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold border ${
                  taskStats.urgent > 0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}
              >
                {taskStats.pending}
              </span>
            )}
          </Link>
        )}

        {/* Quick New Task Action Button */}
        {isUnlocked && (
          <Link
            to="/app/tasks?action=new"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 text-xs font-medium transition-all"
            title="Quick New Task (Ctrl+Shift+T)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Task</span>
          </Link>
        )}

        {/* PWA Install Button */}
        {canInstall && (
          <button
            onClick={() => promptInstall()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-medium transition-all"
            title="Install Superapps OS as a Native App"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {/* Theme Cycler */}
        <button
          onClick={cycleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-all"
          title={`Active Theme: ${currentThemeConfig?.name || theme} (Click to cycle)`}
        >
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">{currentThemeConfig?.name?.split(' ')[0] || 'Theme'}</span>
        </button>

        {/* Acoustic Soundscape Toggle */}
        <button
          onClick={handleToggleSound}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs transition-all"
          title={soundEnabled ? 'Acoustic Soundscapes: Enabled (Click to mute)' : 'Acoustic Soundscapes: Muted (Click to enable)'}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>

        {/* Biometric Enrolled Badge */}
        {isUnlocked && isBiometricEnrolled && (
          <div
            className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs"
            title="Biometric Fast Unlock Enrolled"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Touch ID</span>
          </div>
        )}

        {/* SQLite Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <Database className={`w-3.5 h-3.5 ${isReady ? 'text-emerald-400' : 'text-amber-400 animate-spin'}`} />
          <span className="text-slate-300 font-mono text-[11px]">
            {isReady ? 'SQLite WASM' : 'Loading DB...'}
          </span>
        </div>

        {/* Zero-Knowledge Security Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-300 text-[11px]">AES-256</span>
        </div>

        {/* User Guide Link */}
        <Link
          to="/app/guide"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-all"
          title="User Guide & Help"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Guide</span>
        </Link>

        {/* Auto-Lock Selector */}
        {isUnlocked && vaultMeta && (
          <div className="hidden 2xl:flex items-center gap-1 text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/40">
            <Clock className="w-3 h-3 text-slate-400" />
            <select
              value={vaultMeta.autoLockMinutes}
              onChange={(e) => updateAutoLock(Number(e.target.value))}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
              title="Auto-lock timeout"
            >
              <option value="5" className="bg-slate-900 text-slate-200">5m</option>
              <option value="15" className="bg-slate-900 text-slate-200">15m</option>
              <option value="30" className="bg-slate-900 text-slate-200">30m</option>
              <option value="0" className="bg-slate-900 text-slate-200">Never</option>
            </select>
          </div>
        )}

        {/* Lock / Unlock Quick Button */}
        {isUnlocked ? (
          <button
            onClick={handleLock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium transition-all"
            title="Lock Vault Now"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        ) : (
          <Link
            to="/app"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/30 transition-all"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Open Vault</span>
          </Link>
        )}
      </div>
    </header>
  );
};
