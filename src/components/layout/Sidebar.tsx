import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  Flame, 
  Wallet, 
  Code2, 
  Wrench, 
  CloudUpload, 
  Link2, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Video,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    });
  };

  const navItems = [
    { code: '01', name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { code: '02', name: 'Tasks (Kanban)', path: '/tasks', icon: CheckSquare },
    { code: '03', name: 'Notes Vault', path: '/notes', icon: FileText },
    { code: '04', name: 'Daily Habits', path: '/habits', icon: Flame },
    { code: '05', name: 'Expenses & Budget', path: '/expenses', icon: Wallet },
    { code: '06', name: 'Snippets Vault', path: '/snippets', icon: Code2 },
    { code: '07', name: 'SwissKnife Dev Tools', path: '/swissknife', icon: Wrench },
    { code: '08', name: 'Dropzone File Sharing', path: '/dropzone', icon: CloudUpload },
    { code: '09', name: 'URL Shortlinks', path: '/shortlinks', icon: Link2 },
    { code: '10', name: 'Media Downloader', path: '/downloader', icon: Video },
    ...(user?.role === 'superadmin' ? [{ code: '99', name: 'Admin Settings', path: '/settings', icon: ShieldCheck }] : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-[#0A0A0A]/75 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen transition-all duration-fast ease-out border-r-1.5 border-border-strong bg-subtle flex flex-col justify-between ${
          collapsed ? 'w-16' : 'w-64'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div>
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-3.5 border-b-1.5 border-border-strong bg-canvas">
            {!collapsed && (
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 bg-ink text-canvas border-1.5 border-border-strong flex items-center justify-center font-bold text-xs font-mono">
                  S
                </div>
                <div className="leading-tight">
                  <span className="font-display font-bold text-xs text-ink uppercase tracking-wider">Workspace</span>
                  <div className="flex items-center space-x-1 text-[10px] text-ink-muted font-mono">
                    <span className="w-1.5 h-1.5 bg-signal" />
                    <span>WERKBUND V1</span>
                  </div>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="mx-auto w-7 h-7 bg-ink text-canvas border-1.5 border-border-strong flex items-center justify-center font-bold text-xs font-mono">
                S
              </div>
            )}

            <button
              type="button"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1 border-1.5 border-border-strong text-ink bg-surface hover:bg-ink hover:text-canvas transition-colors duration-fast"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-10rem)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center px-2.5 py-1.5 text-xs font-mono transition-colors duration-fast border-1.5 ${
                      isActive
                        ? 'bg-ink text-canvas border-border-strong font-bold'
                        : 'text-ink-secondary bg-surface/60 border-border-subtle hover:border-border-strong hover:bg-surface hover:text-ink'
                    } ${collapsed ? 'justify-center' : 'justify-between'}`
                  }
                  title={collapsed ? item.name : undefined}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="truncate uppercase tracking-wider">{item.name}</span>}
                  </div>
                  {!collapsed && (
                    <span className="text-[10px] font-mono opacity-70">
                      [{item.code}]
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info & PWA install */}
        <div className="p-2.5 border-t-1.5 border-border-strong bg-canvas space-y-2">
          {installPrompt && !collapsed && (
            <button
              onClick={handleInstallClick}
              className="werkbund-btn werkbund-btn-signal w-full py-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>INSTALL PWA</span>
            </button>
          )}

          {!collapsed ? (
            <div className="border-1.5 border-border-strong bg-surface p-2 text-xs">
              <div className="flex items-center space-x-1.5 text-[11px] font-mono text-ink font-bold">
                <Globe className="w-3 h-3 text-signal" />
                <span>apps.k31.my.id</span>
              </div>
              <p className="werkbund-coord mt-1">
                SPA + FIREBASE DUAL PERSISTENCE
              </p>
            </div>
          ) : (
            <div className="flex justify-center p-1" title="apps.k31.my.id">
              <Globe className="w-4 h-4 text-signal" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
