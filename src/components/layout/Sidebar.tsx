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
      {/* Mobile Backdrop with Frosted Vibrancy */}
      {isOpenMobile && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen transition-all duration-interactive border-r border-border-subtle bg-subtle/80 backdrop-blur-xl flex flex-col justify-between ${
          collapsed ? 'w-16' : 'w-64'
        } ${isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}
      >
        <div>
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-3.5 border-b border-border-subtle bg-canvas/60">
            {!collapsed && (
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-[10px] bg-accent-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  S
                </div>
                <div className="leading-tight">
                  <span className="font-display font-semibold text-xs text-ink tracking-tight">Workspace</span>
                  <div className="flex items-center space-x-1 text-[11px] text-ink-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                    <span>Apple HIG iOS</span>
                  </div>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="mx-auto w-8 h-8 rounded-[10px] bg-accent-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
                S
              </div>
            )}

            <button
              type="button"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex w-7 h-7 rounded-full border border-border-subtle text-ink-secondary bg-surface/80 hover:bg-surface hover:text-ink items-center justify-center transition-colors shadow-sm"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-2.5 space-y-1 overflow-y-auto max-h-[calc(100vh-10.5rem)]">
            {!collapsed && (
              <div className="ios-section-header">
                Apps & Tools
              </div>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-[13px] rounded-[10px] transition-all duration-fast font-medium min-h-[40px] ${
                      isActive
                        ? 'bg-accent-primary text-white shadow-sm font-semibold'
                        : 'text-ink-secondary hover:bg-surface/80 hover:text-ink'
                    } ${collapsed ? 'justify-center' : 'justify-between'}`
                  }
                  title={collapsed ? item.name : undefined}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </div>
                  {!collapsed && (
                    <span className="text-[11px] opacity-60 tabular-nums font-mono">
                      {item.code}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info & PWA install */}
        <div className="p-3 border-t border-border-subtle bg-canvas/40 space-y-2">
          {installPrompt && !collapsed && (
            <button
              onClick={handleInstallClick}
              className="ios-btn ios-btn-primary w-full py-2 text-xs font-semibold rounded-[10px] min-h-[38px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install PWA</span>
            </button>
          )}

          {!collapsed ? (
            <div className="ios-inset-grouped p-2.5 bg-surface/70">
              <div className="flex items-center space-x-1.5 text-xs text-ink font-semibold">
                <Globe className="w-3.5 h-3.5 text-accent-primary" />
                <span>apps.k31.my.id</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5">
                SPA + Firebase Dual Persistence
              </p>
            </div>
          ) : (
            <div className="flex justify-center p-1" title="apps.k31.my.id">
              <Globe className="w-4 h-4 text-accent-primary" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
