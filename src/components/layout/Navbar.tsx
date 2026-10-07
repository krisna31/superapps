import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Sun, 
  Moon, 
  Monitor, 
  User, 
  LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { SyncStatusBadge } from '@/components/common/SyncStatusBadge';

interface NavbarProps {
  onOpenCommandPalette: () => void;
  onOpenAuthModal: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCommandPalette,
  onOpenAuthModal,
  onToggleSidebar,
}) => {
  const { user, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center space-x-2.5">
          <img src="/logo.svg" alt="Superapps Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <div className="hidden sm:block">
            <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Superapps</span>
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md">
              OS
            </span>
          </div>
        </Link>
      </div>

      {/* Global Search / Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition text-xs shadow-sm"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search or jump to tool...</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-500 dark:text-slate-300">
              Ctrl
            </kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-500 dark:text-slate-300">
              K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenCommandPalette}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          aria-label="Open command search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Live Cloud Sync Status Badge */}
        <SyncStatusBadge onOpenAuthModal={onOpenAuthModal} />

        {/* Theme Mode Toggle Button */}
        <div className="relative group">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={`Current theme: ${theme}. Click to switch.`}
          >
            {theme === 'system' ? (
              <Monitor className="w-4 h-4" />
            ) : resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-sky-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>
        </div>

        {/* Auth / Profile button */}
        {user ? (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-700 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="hidden lg:inline-block text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                {user.displayName || (user.isAnonymous ? 'Guest' : 'User')}
              </span>
              {user.role === 'superadmin' && (
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded">
                  Admin
                </span>
              )}
            </div>

            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
