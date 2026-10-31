import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  Flame, 
  Wallet, 
  Code2, 
  Wrench, 
  CloudUpload, 
  Link2,
  Video,
  Moon,
  Sun,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Appearance';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setTheme, resolvedTheme } = useTheme();
  const { user } = useAuth();

  const commands: CommandItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => navigate('/'),
    },
    {
      id: 'nav-tasks',
      title: 'Go to Tasks (Kanban)',
      category: 'Navigation',
      icon: CheckSquare,
      action: () => navigate('/tasks'),
    },
    {
      id: 'nav-notes',
      title: 'Go to Notes Vault',
      category: 'Navigation',
      icon: FileText,
      action: () => navigate('/notes'),
    },
    {
      id: 'nav-habits',
      title: 'Go to Daily Habits',
      category: 'Navigation',
      icon: Flame,
      action: () => navigate('/habits'),
    },
    {
      id: 'nav-expenses',
      title: 'Go to Expenses & Budget',
      category: 'Navigation',
      icon: Wallet,
      action: () => navigate('/expenses'),
    },
    {
      id: 'nav-snippets',
      title: 'Go to Snippets Vault',
      category: 'Navigation',
      icon: Code2,
      action: () => navigate('/snippets'),
    },
    {
      id: 'nav-swissknife',
      title: 'Go to SwissKnife Dev Tools',
      category: 'Navigation',
      icon: Wrench,
      action: () => navigate('/swissknife'),
    },
    {
      id: 'nav-dropzone',
      title: 'Go to Dropzone File Sharing',
      category: 'Navigation',
      icon: CloudUpload,
      action: () => navigate('/dropzone'),
    },
    {
      id: 'nav-shortlinks',
      title: 'Go to URL Shortlinks',
      category: 'Navigation',
      icon: Link2,
      action: () => navigate('/shortlinks'),
    },
    {
      id: 'nav-downloader',
      title: 'Go to Media Downloader',
      category: 'Navigation',
      icon: Video,
      action: () => navigate('/downloader'),
    },

    ...(user?.role === 'superadmin' ? [
      {
        id: 'nav-settings',
        title: 'Go to Admin Settings & Security',
        category: 'Navigation' as const,
        icon: ShieldCheck,
        action: () => navigate('/settings'),
      }
    ] : []),
    {
      id: 'action-new-task',
      title: 'Create New Task',
      category: 'Actions',
      icon: Plus,
      action: () => navigate('/tasks?create=true'),
    },
    {
      id: 'action-new-note',
      title: 'Create New Note',
      category: 'Actions',
      icon: Plus,
      action: () => navigate('/notes?create=true'),
    },
    {
      id: 'action-new-expense',
      title: 'Add New Expense/Income',
      category: 'Actions',
      icon: Plus,
      action: () => navigate('/expenses?create=true'),
    },
    {
      id: 'theme-toggle',
      title: `Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Appearance',
      icon: resolvedTheme === 'dark' ? Sun : Moon,
      action: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-3 py-2 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or jump to tool..."
            className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1 py-0.5 text-[9px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
          {filteredCommands.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left text-xs transition ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span>{cmd.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-mono text-slate-400">
          <span>Navigate <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Select <kbd>↵</kbd></span>
        </div>
      </div>
    </div>
  );
};
