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
    <header className="sticky top-0 z-30 h-14 ios-frosted-nav px-3.5 sm:px-5 flex items-center justify-between transition-colors">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-full text-ink hover:bg-subtle transition-colors md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-[10px] bg-accent-primary text-white flex items-center justify-center font-bold text-sm shadow-sm transition-transform duration-200 group-active:scale-95">
            S
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            <span className="font-display font-bold text-ink text-base tracking-tight">Superapps</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-accent-primary/10 text-accent-primary">
              v1.0
            </span>
          </div>
        </Link>
      </div>

      {/* Global Search / Command Palette Trigger - iOS Pill Style */}
      <div className="flex-1 max-w-sm mx-4 hidden md:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-full border border-border-subtle bg-subtle/60 hover:bg-subtle text-ink-muted hover:text-ink transition-colors duration-fast text-xs min-h-[36px]"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-ink-muted" />
            <span className="text-xs">Search tools & commands...</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-surface rounded border border-border-subtle text-ink-secondary font-medium shadow-sm">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenCommandPalette}
          className="p-2 rounded-full text-ink hover:bg-subtle transition-colors duration-fast md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open command search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Live Cloud Sync Status Badge */}
        <SyncStatusBadge onOpenAuthModal={onOpenAuthModal} />

        {/* Theme Mode Toggle Button */}
        <button
          type="button"
          aria-label={`Switch theme (current: ${theme})`}
          onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
          className="w-9 h-9 rounded-full bg-subtle/80 hover:bg-subtle text-ink flex items-center justify-center transition-colors border border-border-subtle"
          title={`Current theme: ${theme}. Click to switch.`}
        >
          {theme === 'system' ? (
            <Monitor className="w-4 h-4" />
          ) : resolvedTheme === 'dark' ? (
            <Moon className="w-4 h-4 text-accent-primary" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* Auth / Profile button */}
        {user ? (
          <div className="flex items-center space-x-1.5 pl-1.5 border-l border-border-subtle">
            <div className="flex items-center space-x-2 px-1.5 py-1 rounded-full bg-subtle/50">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full object-cover border border-border-subtle"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center font-bold text-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="hidden lg:inline-block text-xs font-medium text-ink max-w-[130px] truncate" title={user.email || user.displayName || 'User'}>
                {user.email || user.displayName || (user.isAnonymous ? 'Guest' : 'User')}
              </span>
              {user.role === 'superadmin' && (
                <span className="hidden sm:inline-block px-2 py-0.2 text-[10px] font-semibold rounded-full bg-accent-primary/15 text-accent-primary">
                  Admin
                </span>
              )}
            </div>

            <button
              type="button"
              aria-label="Sign Out"
              onClick={() => signOut()}
              className="p-2 rounded-full text-ink-muted hover:text-status-danger hover:bg-status-danger/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="ios-btn ios-btn-primary rounded-full text-xs font-semibold px-3.5 py-1.5 min-h-[36px]"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
