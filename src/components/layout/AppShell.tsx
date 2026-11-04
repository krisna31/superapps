import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { CommandPaletteModal } from '../palette/CommandPaletteModal';
import { AuthModal } from '../auth/AuthModal';
import { AuthLockPage } from '@/pages/AuthLockPage';
import { useAuth } from '@/context/AuthContext';

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

  // Android Hardware Back Button & Mobile History Handling
  useEffect(() => {
    const handleBackButton = (e: Event) => {
      // Priority 1: Close active mobile drawer or modals first
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

      // Priority 2: If on sub-route, navigate back to Dashboard
      if (location.pathname !== '/') {
        navigate(-1);
      }
    };

    window.addEventListener('popstate', handleBackButton);
    // Tauri custom event if dispatched by native mobile layer
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
        className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-2.5"
      >
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Initializing workspace...</span>
      </div>
    );
  }

  // Access control lock screen: if guest access is disabled and user is not authenticated or is anonymous
  if (!systemSettings.allowGuestAccess && (!user || user.isAnonymous)) {
    return <AuthLockPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors safe-top safe-bottom safe-left safe-right">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:rounded-md focus:bg-slate-900 focus:text-white dark:focus:bg-white dark:focus:text-slate-900 focus:text-xs focus:font-mono focus:shadow-md"
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

        <main id="main-content" className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Modals */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
