import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  CheckSquare, 
  FileText, 
  Flame, 
  Wallet, 
  Code2, 
  Wrench, 
  CloudUpload, 
  Link2, 
  LayoutDashboard,
  Sun, 
  Moon, 
  PlusCircle, 
  KeyRound
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Tools';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toggleTheme, resolvedTheme } = useTheme();

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dash',
      title: 'Go to Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => navigate('/'),
      keywords: ['home', 'overview', 'dashboard', 'stats']
    },
    {
      id: 'nav-tasks',
      title: 'Go to Tasks (Kanban)',
      category: 'Navigation',
      icon: CheckSquare,
      action: () => navigate('/tasks'),
      keywords: ['tasks', 'kanban', 'todo', 'board']
    },
    {
      id: 'nav-notes',
      title: 'Go to Notes Vault',
      category: 'Navigation',
      icon: FileText,
      action: () => navigate('/notes'),
      keywords: ['notes', 'markdown', 'vault', 'memo']
    },
    {
      id: 'nav-habits',
      title: 'Go to Daily Habits',
      category: 'Navigation',
      icon: Flame,
      action: () => navigate('/habits'),
      keywords: ['habits', 'streaks', 'daily', 'routine']
    },
    {
      id: 'nav-expenses',
      title: 'Go to Expenses & Budget',
      category: 'Navigation',
      icon: Wallet,
      action: () => navigate('/expenses'),
      keywords: ['expenses', 'budget', 'money', 'finance', 'income']
    },
    {
      id: 'nav-snippets',
      title: 'Go to Snippets Vault',
      category: 'Navigation',
      icon: Code2,
      action: () => navigate('/snippets'),
      keywords: ['snippets', 'code', 'syntax', 'gist']
    },
    {
      id: 'nav-swissknife',
      title: 'Go to SwissKnife Utilities',
      category: 'Navigation',
      icon: Wrench,
      action: () => navigate('/swissknife'),
      keywords: ['tools', 'swissknife', 'developer', 'utilities']
    },
    {
      id: 'nav-dropzone',
      title: 'Go to Dropzone File Sharing',
      category: 'Navigation',
      icon: CloudUpload,
      action: () => navigate('/dropzone'),
      keywords: ['dropzone', 'file', 'upload', 'share', 'storage']
    },
    {
      id: 'nav-shortlinks',
      title: 'Go to URL Shortlinks',
      category: 'Navigation',
      icon: Link2,
      action: () => navigate('/shortlinks'),
      keywords: ['shortlinks', 'url', 'redirect', 'link']
    },
    // Quick Actions
    {
      id: 'act-new-task',
      title: 'Create New Task',
      category: 'Actions',
      icon: PlusCircle,
      action: () => navigate('/tasks?create=true'),
      keywords: ['new task', 'add todo']
    },
    {
      id: 'act-new-note',
      title: 'Create New Note',
      category: 'Actions',
      icon: PlusCircle,
      action: () => navigate('/notes?create=true'),
      keywords: ['new note', 'write']
    },
    {
      id: 'act-gen-password',
      title: 'Generate Strong Password',
      category: 'Tools',
      icon: KeyRound,
      action: () => navigate('/swissknife?tab=password'),
      keywords: ['password', 'generator', 'security']
    },
    {
      id: 'act-theme',
      title: `Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Actions',
      icon: resolvedTheme === 'dark' ? Sun : Moon,
      action: () => toggleTheme(),
      keywords: ['theme', 'dark', 'light', 'mode']
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

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
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search tools..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition ${
                    isSelected
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span>{cmd.title}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] text-slate-400">
          <span>Navigate with <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd></span>
          <span>Select with <kbd className="font-mono">↵ Enter</kbd></span>
        </div>
      </div>
    </div>
  );
};
