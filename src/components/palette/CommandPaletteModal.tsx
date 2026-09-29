import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import { useDb } from '../../context/DbContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { soundService } from '../../services/soundService';
import { promptInstall, isInstallPromptAvailable } from '../../services/pwaService';
import {
  Search,
  Zap,
  Navigation,
  Link2,
  FileText,
  Wallet,
  CheckCircle2,
  Lock,
  Download,
  BookOpen,
  Wrench,
  Share2,
  LayoutDashboard,
  ExternalLink,
  Plus,
  CornerDownLeft,
  Palette,
  Volume2,
  KanbanSquare,
  Code2,
} from 'lucide-react';

interface PaletteItem {
  id: string;
  category: 'Actions' | 'Navigation' | 'Shortlinks' | 'Notes' | 'Expenses' | 'Habits' | 'Tasks' | 'Snippets';
  title: string;
  subtitle?: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  onSelect: () => void;
}

export const CommandPaletteModal: React.FC = () => {
  const { isOpen, closePalette } = useCommandPalette();
  const { runQuery } = useDb();
  const { lockVault } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened and reset state
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static Navigation items
  const navItems: PaletteItem[] = useMemo(() => [
    {
      id: 'nav-dash',
      category: 'Navigation',
      title: 'Go to Dashboard',
      subtitle: 'Overview & metrics',
      icon: LayoutDashboard,
      onSelect: () => { navigate('/app'); closePalette(); },
    },
    {
      id: 'nav-links',
      category: 'Navigation',
      title: 'Go to Shortlink Hub',
      subtitle: 'Personal bookmarks & stateless redirector',
      icon: Link2,
      onSelect: () => { navigate('/app/shortlinks'); closePalette(); },
    },
    {
      id: 'nav-drop',
      category: 'Navigation',
      title: 'Go to DropZone',
      subtitle: 'P2P WebRTC transfers & ephemeral uploads',
      icon: Share2,
      onSelect: () => { navigate('/app/dropzone'); closePalette(); },
    },
    {
      id: 'nav-notes',
      category: 'Navigation',
      title: 'Go to Encrypted Notes',
      subtitle: 'Distraction-free Markdown editor',
      icon: FileText,
      onSelect: () => { navigate('/app/notes'); closePalette(); },
    },
    {
      id: 'nav-exp',
      category: 'Navigation',
      title: 'Go to Expense & Budget Flow',
      subtitle: 'Financial ledger & spending charts',
      icon: Wallet,
      onSelect: () => { navigate('/app/expenses'); closePalette(); },
    },
    {
      id: 'nav-tools',
      category: 'Navigation',
      title: 'Go to Dev Swiss Knife',
      subtitle: 'JSON, JWT, Hashes, UUID, Regex',
      icon: Wrench,
      onSelect: () => { navigate('/app/tools'); closePalette(); },
    },
    {
      id: 'nav-habits',
      category: 'Navigation',
      title: 'Go to Focus & Habits',
      subtitle: 'Pomodoro timer & streak tracker',
      icon: CheckCircle2,
      onSelect: () => { navigate('/app/habits'); closePalette(); },
    },
    {
      id: 'nav-tasks',
      category: 'Navigation',
      title: 'Go to Task Matrix',
      subtitle: 'Kanban board, priorities & checklists',
      icon: KanbanSquare,
      onSelect: () => { navigate('/app/tasks'); closePalette(); },
    },
    {
      id: 'nav-snippets',
      category: 'Navigation',
      title: 'Go to Snippets Vault',
      subtitle: 'Reusable code, shell commands & prompts',
      icon: Code2,
      onSelect: () => { navigate('/app/snippets'); closePalette(); },
    },
    {
      id: 'nav-backup',
      category: 'Navigation',
      title: 'Go to Backup & SQL Lab',
      subtitle: 'Export encrypted .vault & SQL runner',
      icon: Download,
      onSelect: () => { navigate('/app/backup'); closePalette(); },
    },
    {
      id: 'nav-guide',
      category: 'Navigation',
      title: 'Go to User Guide',
      subtitle: 'Manual, walkthroughs & FAQs',
      icon: BookOpen,
      onSelect: () => { navigate('/app/guide'); closePalette(); },
    },
  ], [navigate, closePalette]);

  // Static Quick Actions
  const actionItems: PaletteItem[] = useMemo(() => [
    {
      id: 'act-new-link',
      category: 'Actions',
      title: 'Create New Shortlink',
      subtitle: 'Add shortcut or generate stateless link',
      badge: 'Ctrl+Shift+S',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      icon: Plus,
      onSelect: () => { navigate('/app/shortlinks?action=new'); closePalette(); },
    },
    {
      id: 'act-new-note',
      category: 'Actions',
      title: 'Create New Note',
      subtitle: 'Open editor with blank note',
      badge: 'Ctrl+Shift+N',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: Plus,
      onSelect: () => { navigate('/app/notes?action=new'); closePalette(); },
    },
    {
      id: 'act-new-expense',
      category: 'Actions',
      title: 'Log New Expense / Income',
      subtitle: 'Record a new transaction',
      badge: 'Finance',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: Plus,
      onSelect: () => { navigate('/app/expenses?action=new'); closePalette(); },
    },
    {
      id: 'act-new-task',
      category: 'Actions',
      title: 'Create New Task',
      subtitle: 'Add item to Kanban matrix',
      badge: 'Ctrl+Shift+T',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      icon: Plus,
      onSelect: () => { navigate('/app/tasks?action=new'); closePalette(); },
    },
    {
      id: 'act-new-snippet',
      category: 'Actions',
      title: 'Create New Snippet',
      subtitle: 'Save reusable code or shell template',
      badge: 'Snippets',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: Plus,
      onSelect: () => { navigate('/app/snippets?action=new'); closePalette(); },
    },
    {
      id: 'act-lock',
      category: 'Actions',
      title: 'Lock Vault Now',
      subtitle: 'Discard in-memory keys & lock database',
      badge: 'Ctrl+Shift+L',
      badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
      icon: Lock,
      onSelect: () => { closePalette(); lockVault(); },
    },
    {
      id: 'act-export',
      category: 'Actions',
      title: 'Export Encrypted Backup',
      subtitle: 'Download password-protected .vault',
      badge: 'Backup',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      icon: Download,
      onSelect: () => { navigate('/app/backup'); closePalette(); },
    },
    ...themes.map((th) => ({
      id: `act-theme-${th.id}`,
      category: 'Actions' as const,
      title: `Switch Theme: ${th.name}`,
      subtitle: th.description,
      badge: th.id === theme ? 'Active' : 'Theme',
      badgeColor: th.id === theme ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700',
      icon: Palette,
      onSelect: () => { setTheme(th.id); closePalette(); },
    })),
    {
      id: 'act-sound-toggle',
      category: 'Actions',
      title: soundService.getSoundEnabled() ? 'Mute Acoustic Soundscapes' : 'Enable Acoustic Soundscapes',
      subtitle: 'Synthesized micro-interactions and audio feedback',
      badge: 'Audio',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      icon: Volume2,
      onSelect: () => {
        soundService.setSoundEnabled(!soundService.getSoundEnabled());
        closePalette();
      },
    },
    {
      id: 'act-pwa-install',
      category: 'Actions',
      title: 'Install Native App (PWA)',
      subtitle: 'Install onto desktop dock or home screen',
      badge: 'PWA',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      icon: Download,
      onSelect: () => {
        promptInstall();
        closePalette();
      },
    },
  ], [navigate, closePalette, lockVault, themes, theme, setTheme]);

  // Dynamic SQLite Search Results
  const dynamicResults = useMemo(() => {
    const q = query.trim();
    if (!q) return [];

    const results: PaletteItem[] = [];
    const wildcard = `%${q}%`;

    // 1. Query Shortlinks
    try {
      const linksRes = runQuery(
        'SELECT id, key, title, url, clicks FROM shortlinks WHERE key LIKE ? OR title LIKE ? OR url LIKE ? ORDER BY clicks DESC LIMIT 4;',
        [wildcard, wildcard, wildcard]
      );
      linksRes.values.forEach((v) => {
        results.push({
          id: `sl-${v[0]}`,
          category: 'Shortlinks',
          title: `go/${v[1]} — ${v[2] || v[3]}`,
          subtitle: `${v[3]} • ${v[4]} clicks`,
          icon: Link2,
          badge: 'Shortlink',
          badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          onSelect: () => {
            window.open(v[3] as string, '_blank');
            closePalette();
          },
        });
      });
    } catch {
      // Ignore query errors in memory
    }

    // 2. Query Notes
    try {
      const notesRes = runQuery(
        'SELECT id, title, category FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updatedAt DESC LIMIT 4;',
        [wildcard, wildcard]
      );
      notesRes.values.forEach((v) => {
        results.push({
          id: `note-${v[0]}`,
          category: 'Notes',
          title: (v[1] as string) || 'Untitled Note',
          subtitle: `Category: ${(v[2] as string) || 'General'}`,
          icon: FileText,
          badge: 'Note',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          onSelect: () => {
            navigate('/app/notes');
            closePalette();
          },
        });
      });
    } catch {
      // Ignore query errors in memory
    }

    // 3. Query Expenses
    try {
      const expRes = runQuery(
        'SELECT id, title, amount, type, category FROM expenses WHERE title LIKE ? OR category LIKE ? ORDER BY date DESC LIMIT 4;',
        [wildcard, wildcard]
      );
      expRes.values.forEach((v) => {
        results.push({
          id: `exp-${v[0]}`,
          category: 'Expenses',
          title: `${v[1]} ($${Number(v[2]).toFixed(2)})`,
          subtitle: `${v[3]} • ${v[4]}`,
          icon: Wallet,
          badge: 'Expense',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          onSelect: () => {
            navigate('/app/expenses');
            closePalette();
          },
        });
      });
    } catch {
      // Ignore query errors in memory
    }

    // 4. Query Habits
    try {
      const habitRes = runQuery(
        'SELECT id, title, streak FROM habits WHERE title LIKE ? ORDER BY streak DESC LIMIT 4;',
        [wildcard]
      );
      habitRes.values.forEach((v) => {
        results.push({
          id: `hb-${v[0]}`,
          category: 'Habits',
          title: v[1] as string,
          subtitle: `Current Streak: ${v[2]} days`,
          icon: CheckCircle2,
          badge: 'Habit',
          badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          onSelect: () => {
            navigate('/app/habits');
            closePalette();
          },
        });
      });
    } catch {
      // Ignore query errors in memory
    }

    // 5. Query Tasks
    try {
      const taskRes = runQuery(
        'SELECT id, title, priority, status FROM tasks WHERE title LIKE ? OR description LIKE ? OR tags LIKE ? ORDER BY updatedAt DESC LIMIT 4;',
        [wildcard, wildcard, wildcard]
      );
      taskRes.values.forEach((v) => {
        results.push({
          id: `task-${v[0]}`,
          category: 'Tasks',
          title: v[1] as string,
          subtitle: `Priority: ${v[2]} • ${String(v[3]).replace('_', ' ')}`,
          icon: KanbanSquare,
          badge: String(v[2]).toUpperCase(),
          badgeColor:
            v[2] === 'urgent'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          onSelect: () => {
            navigate('/app/tasks');
            closePalette();
          },
        });
      });
    } catch {
      // Ignore query errors in memory
    }

    // 6. Query Snippets
    try {
      const snipRes = runQuery(
        'SELECT id, title, language, code FROM snippets WHERE title LIKE ? OR code LIKE ? OR tags LIKE ? ORDER BY isPinned DESC, updatedAt DESC LIMIT 4;',
        [wildcard, wildcard, wildcard]
      );
      snipRes.values.forEach((v) => {
        results.push({
          id: `snip-${v[0]}`,
          category: 'Snippets',
          title: v[1] as string,
          subtitle: `${v[2]} • ${String(v[3]).slice(0, 45).replace(/\n/g, ' ')}...`,
          icon: Code2,
          badge: String(v[2]).toUpperCase(),
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          onSelect: () => {
            navigate('/app/snippets');
            closePalette();
          },
        });
      });
    } catch {
      // Ignore query errors in memory
    }

    return results;
  }, [query, runQuery, navigate, closePalette]);

  // Combine and filter all items
  const allFilteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...actionItems, ...navItems];
    }

    const filteredActions = actionItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );

    const filteredNav = navItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );

    return [...dynamicResults, ...filteredActions, ...filteredNav];
  }, [query, actionItems, navItems, dynamicResults]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [allFilteredItems]);

  // Handle keyboard navigation inside the modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (allFilteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allFilteredItems.length);
      scrollItemIntoView((selectedIndex + 1) % allFilteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allFilteredItems.length) % allFilteredItems.length);
      scrollItemIntoView((selectedIndex - 1 + allFilteredItems.length) % allFilteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allFilteredItems[selectedIndex];
      if (current) {
        current.onSelect();
      }
    }
  };

  const scrollItemIntoView = (index: number) => {
    if (!listRef.current) return;
    const element = listRef.current.children[index] as HTMLElement;
    if (element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ block: 'nearest' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md transition-opacity">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={closePalette} />

      <div
        className="relative w-full max-w-xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden flex flex-col max-h-[70vh] z-10 animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search SQLite records..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-500 hover:text-slate-300 font-mono"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-slate-800/40">
          {allFilteredItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              No matching records or actions found for "{query}".
            </div>
          ) : (
            allFilteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600/20 text-white border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="text-xs font-medium truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Cheatsheet Bar */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-400">
                ↑
              </kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-400">
                ↓
              </kbd>{' '}
              navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-400">
                ↵
              </kbd>{' '}
              select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-400">
                esc
              </kbd>{' '}
              close
            </span>
          </div>
          <div className="hidden sm:inline-block font-mono text-[10px] text-slate-600">
            Superapps OS • Omni-Search
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPaletteModal;
