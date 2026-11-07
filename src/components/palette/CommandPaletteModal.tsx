import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { setTheme, resolvedTheme } = useTheme();
  const { user } = useAuth();

  const commands: CommandItem[] = useMemo(() => [
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
      id: 'action-new-habit',
      title: 'Create New Daily Habit',
      category: 'Actions',
      icon: Plus,
      action: () => navigate('/habits?create=true'),
    },
    {
      id: 'action-new-expense',
      title: 'Add New Expense/Income',
      category: 'Actions',
      icon: Plus,
      action: () => navigate('/expenses?create=true'),
    },
    {
      id: 'action-new-snippet',
      title: 'Create New Code Snippet',
      category: 'Actions',
      icon: Plus,
      action: () => navigate('/snippets?create=true'),
    },
    {
      id: 'action-new-shortlink',
      title: 'Create New Shortlink',
      category: 'Actions',
      icon: Plus,
      action: () => navigate('/shortlinks?create=true'),
    },
    {
      id: 'theme-toggle',
      title: `Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Appearance',
      icon: resolvedTheme === 'dark' ? Sun : Moon,
      action: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    },
  ], [navigate, user?.role, resolvedTheme, setTheme]);

  const filteredCommands = useMemo(
    () =>
      commands.filter(
        (cmd) =>
          cmd.title.toLowerCase().includes(query.toLowerCase()) ||
          cmd.category.toLowerCase().includes(query.toLowerCase())
      ),
    [commands, query]
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
    const activeEl = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    activeEl?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.keyCode === 229) return;

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
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-md transition-all duration-fast"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        className="w-full max-w-lg bg-elevated/95 backdrop-blur-2xl border border-border-subtle rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-border-subtle bg-subtle/50">
          <Search className="w-4 h-4 text-ink-muted mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            aria-label="Search commands"
            type="text"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands or jump to tool..."
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono bg-surface rounded-md border border-border-subtle text-ink-muted shadow-sm">
            esc
          </kbd>
        </div>

        <div
          ref={listRef}
          role="listbox"
          aria-label="Commands"
          className="max-h-72 overflow-y-auto p-2 space-y-1"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-muted">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-active={isSelected ? 'true' : 'false'}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-xs rounded-[10px] transition-colors duration-fast ${
                    isSelected
                      ? 'bg-accent-primary text-white font-medium shadow-sm'
                      : 'text-ink hover:bg-subtle/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-ink-muted'}`} />
                    <span className="font-medium">{cmd.title}</span>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-subtle text-ink-muted'
                  }`}>
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border-subtle bg-subtle/40 text-[11px] text-ink-muted">
          <span>Navigate <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle font-mono text-ink">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle font-mono text-ink">↓</kbd></span>
          <span>Select <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle font-mono text-ink">↵</kbd></span>
        </div>
      </div>
    </div>
  );
};
