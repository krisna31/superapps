import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Sun, 
  Moon, 
  Monitor, 
  User, 
  LogOut,
  Lock,
  Fingerprint
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
  const { 
    user, 
    signOut, 
    lockVault, 
    isBiometricsSupported, 
    isBiometricsEnrolled, 
    enableBiometrics, 
    disableBiometrics 
  } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleBiometricToggle = async () => {
    if (isBiometricsEnrolled) {
      disableBiometrics();
    } else {
      await enableBiometrics();
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 sm:px-5 flex items-center justify-between transition-colors">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <Link to="/" className="flex items-center space-x-2">
          <img src="/logo.svg" alt="Superapps Logo" className="w-7 h-7 rounded-md" />
          <div className="hidden sm:flex items-center space-x-1.5">
            <span className="font-semibold text-slate-900 dark:text-white text-sm tracking-tight">Superapps</span>
            <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-750 rounded">
              OS
            </span>
          </div>
        </Link>
      </div>

      {/* Global Search / Command Palette Trigger */}
      <div className="flex-1 max-w-sm mx-4 hidden md:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition text-xs"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-xs">Jump to tool or command...</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1 py-0.5 text-[9px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-500 dark:text-slate-300">
              Ctrl
            </kbd>
            <kbd className="px-1 py-0.5 text-[9px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-500 dark:text-slate-300">
              K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={onOpenCommandPalette}
          className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          aria-label="Open command search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Live Cloud Sync Status Badge */}
        <SyncStatusBadge onOpenAuthModal={onOpenAuthModal} />

        {/* Biometrics Enroll / Toggle Button (shown when platform supports WebAuthn) */}
        {isBiometricsSupported && (
          <button
            onClick={handleBiometricToggle}
            className={`p-1.5 rounded-md transition ${
              isBiometricsEnrolled
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={
              isBiometricsEnrolled
                ? 'Fingerprint unlock is enrolled on this device (click to remove)'
                : 'Enable fingerprint unlock for this device'
            }
            aria-label="Toggle fingerprint unlock"
          >
            <Fingerprint className="w-4 h-4" />
          </button>
        )}

        {/* Instant Vault Lock Button */}
        <button
          onClick={lockVault}
          className="p-1.5 rounded-md text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Lock Private Vault"
          aria-label="Lock Private Vault"
        >
          <Lock className="w-4 h-4" />
        </button>

        {/* Theme Mode Toggle Button */}
        <div className="relative group">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Owner'}
                  className="w-6 h-6 rounded-md border border-slate-300 dark:border-slate-700 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-mono font-bold text-xs border border-slate-200 dark:border-slate-700">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'O'}
                </div>
              )}
              <span className="hidden lg:inline-block text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                {user.displayName || 'Owner'}
              </span>
              {user.role === 'superadmin' && (
                <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded">
                  Admin
                </span>
              )}
            </div>

            <button
              onClick={() => signOut()}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs transition"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
