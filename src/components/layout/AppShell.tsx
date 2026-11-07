import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { AuthModal } from '../auth/AuthModal';
import { AuthLockPage } from '@/pages/AuthLockPage';
import { useAuth } from '@/context/AuthContext';

const CommandPaletteModal = lazy(() =>
  import('../palette/CommandPaletteModal').then((m) => ({ default: m.CommandPaletteModal }))
);

export const AppShell: React.FC = () => {
  const { user, systemSettings, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hardware Back Button & Mobile History Handling
  useEffect(() => {
    const handleBackButton = (e: Event) => {
      if (isSidebarOpenMobile) {
        setIsSidebarOpenMobile(false);
        e.preventDefault();
        return;
      }
      if (isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
        e.preventDefault();
        return;
      }
      if (isAuthModalOpen) {
        setIsAuthModalOpen(false);
        e.preventDefault();
        return;
      }

      if (location.pathname !== '/') {
        navigate(-1);
      }
    };

    window.addEventListener('popstate', handleBackButton);
    window.addEventListener('tauri-back-button' as any, handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
      window.removeEventListener('tauri-back-button' as any, handleBackButton);
    };
  }, [isSidebarOpenMobile, isCommandPaletteOpen, isAuthModalOpen, location.pathname, navigate]);

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center space-y-3 font-sans"
      >
        <div className="w-8 h-8 border-2 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin" />
        <span className="text-xs font-medium text-ink-muted tracking-tight">
          Loading Workspace...
        </span>
      </div>
    );
  }

  // Access control lock screen: if guest access is disabled and user is not authenticated or is anonymous
  if (!systemSettings.allowGuestAccess && (!user || user.isAnonymous)) {
    return <AuthLockPage />;
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex transition-colors safe-top safe-bottom safe-left safe-right font-sans antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3.5 focus:py-2 focus:bg-surface focus:text-ink focus:rounded-lg focus:shadow-md focus:border focus:border-border-subtle focus:text-xs focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpenMobile((prev) => !prev)}
        />

        <main id="main-content" className="flex-1 p-3.5 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Modals */}
      {isCommandPaletteOpen && (
        <Suspense fallback={null}>
          <CommandPaletteModal
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
          />
        </Suspense>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
