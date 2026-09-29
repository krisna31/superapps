import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDb } from '../../context/DbContext';
import { Lock, Unlock, Database, ShieldCheck, Clock, BookOpen, ExternalLink, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SuperappsLogo } from '../brand/SuperappsLogo';
import { useCommandPalette } from '../../context/CommandPaletteContext';

export const Navbar: React.FC = () => {
  const { isUnlocked, lockVault, vaultMeta, updateAutoLock } = useAuth();
  const { isReady } = useDb();
  const { openPalette } = useCommandPalette();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Link to="/" className="group">
          <SuperappsLogo size={36} showWordmark />
        </Link>
      </div>

      {/* Command Palette Omni-Search Trigger Button */}
      {isUnlocked && (
        <div className="flex-1 max-w-xs mx-4 hidden sm:block">
          <button
            onClick={openPalette}
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

      <div className="flex items-center gap-3">
        {/* Mobile Search Button */}
        {isUnlocked && (
          <button
            onClick={openPalette}
            className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white"
            title="Search (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-blue-400" />
          </button>
        )}
        {/* SQLite Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <Database className={`w-3.5 h-3.5 ${isReady ? 'text-emerald-400' : 'text-amber-400 animate-spin'}`} />
          <span className="text-slate-300 font-mono text-[11px]">
            {isReady ? 'SQLite WASM' : 'Loading DB...'}
          </span>
        </div>

        {/* Zero-Knowledge Security Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-300 text-[11px]">AES-256-GCM</span>
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
          <div className="hidden lg:flex items-center gap-1 text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/40">
            <Clock className="w-3 h-3 text-slate-400" />
            <select
              value={vaultMeta.autoLockMinutes}
              onChange={(e) => updateAutoLock(Number(e.target.value))}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
              title="Auto-lock timeout"
            >
              <option value="5" className="bg-slate-900 text-slate-200">Lock in 5m</option>
              <option value="15" className="bg-slate-900 text-slate-200">Lock in 15m</option>
              <option value="30" className="bg-slate-900 text-slate-200">Lock in 30m</option>
              <option value="0" className="bg-slate-900 text-slate-200">Never auto-lock</option>
            </select>
          </div>
        )}

        {/* Lock / Unlock Quick Button */}
        {isUnlocked ? (
          <button
            onClick={lockVault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium transition-all"
            title="Lock Vault Now"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
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
