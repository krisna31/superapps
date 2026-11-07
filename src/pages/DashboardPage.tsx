import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, 
  FileText, 
  Flame, 
  Wallet, 
  Code2, 
  Wrench, 
  CloudUpload, 
  Link2, 
  ArrowRight,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  DownloadCloud
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { TaskItem, HabitItem, ExpenseItem, NoteItem } from '@/types';
import { generateSecureRandomString } from '@/utils/security';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.uid || 'guest-default';

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [quickPassword, setQuickPassword] = useState('');
  const [copiedPass, setCopiedPass] = useState(false);

  const regenerateQuickPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    setQuickPassword(generateSecureRandomString(16, chars));
  };

  useEffect(() => {
    regenerateQuickPassword();

    const unsubTasks = dataService.subscribeToTasks(currentUserId, setTasks);
    const unsubHabits = dataService.subscribeToHabits(currentUserId, setHabits);
    const unsubExpenses = dataService.subscribeToExpenses(currentUserId, setExpenses);
    const unsubNotes = dataService.subscribeToNotes(currentUserId, setNotes);

    return () => {
      unsubTasks();
      unsubHabits();
      unsubExpenses();
      unsubNotes();
    };
  }, [currentUserId]);

  const copyPassword = () => {
    navigator.clipboard.writeText(quickPassword);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const pendingTasks = useMemo(() => tasks.filter((t) => t.status !== 'done').length, [tasks]);
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const completedHabitsToday = useMemo(
    () => habits.filter((h) => h.completedDates.includes(todayStr)).length,
    [habits, todayStr]
  );

  const netBalance = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const e of expenses) {
      if (e.type === 'income') income += e.amount;
      else expense += e.amount;
    }
    return income - expense;
  }, [expenses]);

  const appCards = [
    { code: '01', title: 'Tasks (Kanban)', desc: `${pendingTasks} active items pending`, path: '/tasks', icon: CheckSquare, color: 'bg-accent-primary' },
    { code: '02', title: 'Notes Vault', desc: `${notes.length} markdown notes stored`, path: '/notes', icon: FileText, color: 'bg-amber-500' },
    { code: '03', title: 'Daily Habits', desc: `${completedHabitsToday}/${habits.length} routines done today`, path: '/habits', icon: Flame, color: 'bg-rose-500' },
    { code: '04', title: 'Expenses & Budget', desc: `Net: Rp ${netBalance.toLocaleString('id-ID')}`, path: '/expenses', icon: Wallet, color: 'bg-emerald-600' },
    { code: '05', title: 'Snippets Vault', desc: 'Code repository with tags', path: '/snippets', icon: Code2, color: 'bg-indigo-600' },
    { code: '06', title: 'SwissKnife Dev Tools', desc: 'JSON, Base64, UUID, Regex', path: '/swissknife', icon: Wrench, color: 'bg-slate-700 dark:bg-slate-600' },
    { code: '07', title: 'Dropzone File Sharing', desc: 'Upload to Firebase Storage', path: '/dropzone', icon: CloudUpload, color: 'bg-sky-500' },
    { code: '08', title: 'URL Shortlinks', desc: 'Fast redirects & tracking', path: '/shortlinks', icon: Link2, color: 'bg-teal-600' },
    { code: '09', title: 'Media Downloader', desc: 'Universal video & audio saver', path: '/downloader', icon: DownloadCloud, color: 'bg-purple-600' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Overview Banner - iOS Inset Grouped */}
      <div className="ios-inset-grouped p-5 sm:p-6 bg-surface flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-1.5 text-xs text-accent-primary font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight">
            Welcome, {user?.displayName || 'Workspace Owner'}
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1 max-w-xl leading-relaxed">
            Your unified Apple HIG productivity studio and developer cockpit with real-time cloud sync.
          </p>
        </div>

        {/* Quick Password Tool Card */}
        <div className="p-3 bg-subtle/70 rounded-[12px] border border-border-subtle flex items-center space-x-3 self-start md:self-auto shadow-sm">
          <div className="w-8 h-8 rounded-[8px] bg-accent-primary/10 text-accent-primary flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-ink-muted font-medium">Quick Password</div>
            <div className="font-mono text-xs font-semibold text-ink max-w-[140px] truncate tabular-nums">
              {quickPassword}
            </div>
          </div>
          <div className="flex items-center space-x-1 pl-1">
            <button
              type="button"
              aria-label="Copy quick password"
              onClick={copyPassword}
              className="p-1.5 rounded-lg border border-border-subtle bg-surface text-ink hover:bg-subtle transition-colors"
              title="Copy Password"
            >
              {copiedPass ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              aria-label="Regenerate quick password"
              onClick={regenerateQuickPassword}
              className="p-1.5 rounded-lg border border-border-subtle bg-surface text-ink hover:bg-subtle transition-colors"
              title="Regenerate Password"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row - Inset Grouped Squircles */}
      <div>
        <div className="ios-section-header">
          Key Metrics
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/tasks"
            className="ios-inset-grouped p-4 sm:p-5 hover:bg-subtle/40 transition-colors block group shadow-sm"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-secondary font-medium">Tasks to Do</span>
              <div className="w-7 h-7 rounded-[8px] bg-accent-primary/10 text-accent-primary flex items-center justify-center">
                <CheckSquare className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-display font-bold text-ink tabular-nums tracking-tight">
              {pendingTasks}
            </div>
            <div className="text-[11px] text-ink-muted mt-1 tabular-nums">{tasks.length} total tasks</div>
          </Link>

          <Link
            to="/notes"
            className="ios-inset-grouped p-4 sm:p-5 hover:bg-subtle/40 transition-colors block group shadow-sm"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-secondary font-medium">Active Notes</span>
              <div className="w-7 h-7 rounded-[8px] bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-display font-bold text-ink tabular-nums tracking-tight">
              {notes.length}
            </div>
            <div className="text-[11px] text-ink-muted mt-1">Markdown Vault</div>
          </Link>

          <Link
            to="/habits"
            className="ios-inset-grouped p-4 sm:p-5 hover:bg-subtle/40 transition-colors block group shadow-sm"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-secondary font-medium">Habit Streaks</span>
              <div className="w-7 h-7 rounded-[8px] bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-display font-bold text-ink tabular-nums tracking-tight">
              {completedHabitsToday}/{habits.length}
            </div>
            <div className="text-[11px] text-ink-muted mt-1">Completed today</div>
          </Link>

          <Link
            to="/expenses"
            className="ios-inset-grouped p-4 sm:p-5 hover:bg-subtle/40 transition-colors block group shadow-sm"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-secondary font-medium">Net Balance</span>
              <div className="w-7 h-7 rounded-[8px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-display font-bold text-ink tabular-nums tracking-tight truncate">
              Rp {netBalance.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-ink-muted mt-1">{expenses.length} records logged</div>
          </Link>
        </div>
      </div>

      {/* App Launchers - Apple HIG Inset Grouped Tiles */}
      <div>
        <div className="ios-section-header">
          Productivity & Developer Suite
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {appCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.path}
                to={card.path}
                className="ios-inset-grouped p-4 sm:p-5 hover:shadow-md hover:border-accent-primary/40 transition-all duration-fast group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-11 h-11 rounded-[12px] ${card.color} text-white flex items-center justify-center shadow-sm transition-transform duration-fast group-hover:scale-105`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono text-ink-muted opacity-60">
                      {card.code}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-ink group-hover:text-accent-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-medium text-accent-primary">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-fast group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
