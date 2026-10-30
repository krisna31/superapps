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
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Tasks (Kanban)', path: '/tasks', icon: CheckSquare },
    { name: 'Notes Vault', path: '/notes', icon: FileText },
    { name: 'Daily Habits', path: '/habits', icon: Flame },
    { name: 'Expenses & Budget', path: '/expenses', icon: Wallet },
    { name: 'Snippets Vault', path: '/snippets', icon: Code2 },
    { name: 'SwissKnife Dev Tools', path: '/swissknife', icon: Wrench },
    { name: 'Dropzone File Sharing', path: '/dropzone', icon: CloudUpload },
    { name: 'URL Shortlinks', path: '/shortlinks', icon: Link2 },
    ...(user?.role === 'superadmin' ? [{ name: 'Admin Settings', path: '/settings', icon: ShieldCheck }] : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen transition-all duration-200 ease-out border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between ${
          collapsed ? 'w-16' : 'w-60'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div>
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-3 border-b border-slate-200 dark:border-slate-800">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold text-xs font-mono">
                  S
                </div>
                <div className="leading-tight">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">Workspace</span>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Free Tier Cloud</span>
                  </div>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="mx-auto w-7 h-7 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold text-xs font-mono">
                S
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-10rem)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    } ${collapsed ? 'justify-center' : 'space-x-2.5'}`
                  }
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info & PWA install */}
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          {installPrompt && !collapsed && (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App (PWA)</span>
            </button>
          )}

          {!collapsed ? (
            <div className="rounded-md bg-slate-50 dark:bg-slate-800/40 p-2 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                <Globe className="w-3 h-3 text-sky-500" />
                <span>apps.k31.my.id</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                GitHub Pages SPA + Firebase
              </p>
            </div>
          ) : (
            <div className="flex justify-center" title="apps.k31.my.id">
              <Globe className="w-3.5 h-3.5 text-sky-500" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
