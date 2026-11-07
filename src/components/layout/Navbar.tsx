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
    <header className="sticky top-0 z-30 h-14 border-b-1.5 border-border-strong bg-canvas px-3 sm:px-5 flex items-center justify-between transition-colors">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 border-1.5 border-border-strong text-ink hover:bg-ink hover:text-canvas transition-colors duration-fast md:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <Link to="/" className="flex items-center space-x-2.5">
          <div className="w-7 h-7 bg-ink text-canvas border-1.5 border-border-strong flex items-center justify-center font-bold text-xs font-mono">
            S
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            <span className="font-display font-bold text-ink text-base tracking-tight uppercase">Superapps</span>
            <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-signal text-canvas uppercase">
              v1.0
            </span>
          </div>
        </Link>
      </div>

      {/* Global Search / Command Palette Trigger */}
      <div className="flex-1 max-w-sm mx-4 hidden md:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 border-1.5 border-border-strong bg-surface hover:bg-subtle text-ink-muted hover:text-ink transition-colors duration-fast text-xs"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-ink-muted" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Jump to tool or command...</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-canvas border border-border-strong text-ink font-bold">
              Ctrl
            </kbd>
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-canvas border border-border-strong text-ink font-bold">
              K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenCommandPalette}
          className="p-1.5 border-1.5 border-border-strong text-ink hover:bg-ink hover:text-canvas transition-colors duration-fast md:hidden"
          aria-label="Open command search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Live Cloud Sync Status Badge */}
        <SyncStatusBadge onOpenAuthModal={onOpenAuthModal} />

        {/* Theme Mode Toggle Button */}
        <div className="relative group">
          <button
            type="button"
            aria-label={`Switch theme (current: ${theme})`}
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
            className="p-1.5 border-1.5 border-border-strong text-ink bg-surface hover:bg-ink hover:text-canvas transition-colors duration-fast"
            title={`Current theme: ${theme}. Click to switch.`}
          >
            {theme === 'system' ? (
              <Monitor className="w-4 h-4" />
            ) : resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-signal" />
            ) : (
              <Sun className="w-4 h-4 text-signal-secondary" />
            )}
          </button>
        </div>

        {/* Auth / Profile button */}
        {user ? (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 pl-2 border-l-1.5 border-border-strong">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 border-1.5 border-border-strong object-cover"
                />
              ) : (
                <div className="w-6 h-6 bg-subtle text-ink flex items-center justify-center font-mono font-bold text-xs border-1.5 border-border-strong">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="hidden lg:inline-block text-xs font-mono text-ink max-w-[140px] truncate" title={user.email || user.displayName || 'User'}>
                {user.email || user.displayName || (user.isAnonymous ? 'Guest' : 'User')}
              </span>
              {user.role === 'superadmin' && (
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-signal text-canvas border border-border-strong">
                  Admin
                </span>
              )}
            </div>

            <button
              type="button"
              aria-label="Sign Out"
              onClick={() => signOut()}
              className="p-1.5 border-1.5 border-border-strong text-ink hover:bg-status-danger hover:text-white transition-colors duration-fast"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="werkbund-btn werkbund-btn-signal text-xs py-1 px-2.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
