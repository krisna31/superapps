import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDb } from '../../context/DbContext';
import { Lock, Unlock, Database, ShieldCheck, Clock, BookOpen, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { isUnlocked, lockVault, vaultMeta, updateAutoLock } = useAuth();
  const { isReady } = useDb();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white text-lg font-black">⚡</span>
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white group-hover:text-blue-400 transition-colors">
              Superapps<span className="text-blue-500">OS</span>
            </span>
            <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              CLIENT-SIDE
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
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
