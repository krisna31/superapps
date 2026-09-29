import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useDb } from '../../context/DbContext';
import {
  LayoutDashboard,
  Link2,
  Share2,
  FileText,
  Wallet,
  Wrench,
  CheckCircle2,
  Database,
  BookOpen,
  ArrowUpRight,
  KanbanSquare,
  Code2,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { isReady, runQuery, refreshSignal } = useDb();
  const [taskCount, setTaskCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isReady) return;
    try {
      const res = runQuery("SELECT COUNT(*) FROM tasks WHERE status != 'completed';");
      if (res.values && res.values[0]) {
        setTaskCount(Number(res.values[0][0]) || 0);
      }
    } catch {
      // In case table not initialized yet
    }
  }, [isReady, runQuery, refreshSignal]);

  const navItems = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/app/tasks', label: 'Kanban & Tasks', icon: KanbanSquare },
    { to: '/app/snippets', label: 'Snippets Vault', icon: Code2 },
    { to: '/app/shortlinks', label: 'Shortlinks & Hub', icon: Link2 },
    { to: '/app/dropzone', label: 'DropZone (Files & P2P)', icon: Share2 },
    { to: '/app/notes', label: 'Encrypted Notes', icon: FileText },
    { to: '/app/expenses', label: 'Expense & Budget', icon: Wallet },
    { to: '/app/tools', label: 'Swiss Knife', icon: Wrench },
    { to: '/app/habits', label: 'Focus & Habits', icon: CheckCircle2 },
    { to: '/app/backup', label: 'Backup & SQL Lab', icon: Database },
    { to: '/app/guide', label: 'User Guide', icon: BookOpen },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between p-4 h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Superapps Suite
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.to === '/app/tasks' && taskCount !== null && taskCount > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                      {taskCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom info card */}
      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300">Local-First</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          All data is encrypted & stored locally in your browser SQLite engine. Zero server tracking.
        </p>
        <a
          href="https://github.com/krisna31/superapps"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 hover:underline pt-1"
        >
          <span>GitHub Source</span>
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
};
