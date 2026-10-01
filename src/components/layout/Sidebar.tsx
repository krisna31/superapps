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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col justify-between ${
          collapsed ? 'w-20' : 'w-64'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div>
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center text-white font-bold shadow-sm">
                  S
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Workspace</span>
                  <div className="flex items-center space-x-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Free Tier Cloud</span>
                  </div>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="mx-auto w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center text-white font-bold shadow-sm">
                S
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                      isActive
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    } ${collapsed ? 'justify-center' : 'space-x-3'}`
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
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {installPrompt && !collapsed && (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App (PWA)</span>
            </button>
          )}

          {!collapsed ? (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                <span>apps.k31.my.id</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                GitHub Pages SPA + Firebase Spark
              </p>
            </div>
          ) : (
            <div className="flex justify-center" title="apps.k31.my.id">
              <Globe className="w-4 h-4 text-sky-500" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
