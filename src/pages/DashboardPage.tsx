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
  Terminal,
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
    { code: '01', title: 'Tasks (Kanban)', desc: `${pendingTasks} active items pending`, path: '/tasks', icon: CheckSquare },
    { code: '02', title: 'Notes Vault', desc: `${notes.length} markdown notes stored`, path: '/notes', icon: FileText },
    { code: '03', title: 'Daily Habits', desc: `${completedHabitsToday}/${habits.length} routines done today`, path: '/habits', icon: Flame },
    { code: '04', title: 'Expenses & Budget', desc: `Net: Rp ${netBalance.toLocaleString('id-ID')}`, path: '/expenses', icon: Wallet },
    { code: '05', title: 'Snippets Vault', desc: 'Code repository with tags', path: '/snippets', icon: Code2 },
    { code: '06', title: 'SwissKnife Dev Tools', desc: 'JSON, Base64, UUID, Regex', path: '/swissknife', icon: Wrench },
    { code: '07', title: 'Dropzone File Sharing', desc: 'Upload to Firebase Storage', path: '/dropzone', icon: CloudUpload },
    { code: '08', title: 'URL Shortlinks', desc: 'Fast redirects & tracking', path: '/shortlinks', icon: Link2 },
    { code: '09', title: 'Media Downloader', desc: 'Universal video & audio saver', path: '/downloader', icon: DownloadCloud },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-surface border-1.5 border-border-strong">
        <div>
          <div className="flex items-center space-x-1.5 werkbund-coord mb-1.5">
            <Terminal className="w-3.5 h-3.5 text-signal" />
            <span>[SYS-OVERVIEW] WORKSPACE ARCHITECTURE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink uppercase tracking-tight">
            Welcome, {user?.displayName || 'Workspace Owner'}
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            Modular developer toolkit and daily operations cockpit built on continuous architectural grids.
          </p>
        </div>

        {/* Quick Password Tool Card */}
        <div className="p-3 bg-subtle border-1.5 border-border-strong flex items-center space-x-3 self-start md:self-auto">
          <KeyRound className="w-4 h-4 text-signal flex-shrink-0" />
          <div>
            <div className="werkbund-coord text-[10px]">Quick Password</div>
            <div className="font-mono text-xs font-bold text-ink max-w-[140px] truncate tabular-nums">
              {quickPassword}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              aria-label="Copy quick password"
              onClick={copyPassword}
              className="p-1.5 border border-border-strong bg-canvas text-ink hover:bg-ink hover:text-canvas transition-colors duration-fast"
              title="Copy Password"
            >
              {copiedPass ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              aria-label="Regenerate quick password"
              onClick={regenerateQuickPassword}
              className="p-1.5 border border-border-strong bg-canvas text-ink hover:bg-ink hover:text-canvas transition-colors duration-fast"
              title="Regenerate Password"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row: Shared-Border Werkbund Grid */}
      <div className="werkbund-grid grid-cols-2 lg:grid-cols-4">
        <Link
          to="/tasks"
          className="group block transition-colors duration-fast hover:bg-subtle relative"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="werkbund-coord">[KPI-01] Tasks to Do</span>
            <CheckSquare className="w-3.5 h-3.5 text-ink-muted group-hover:text-signal transition-colors" />
          </div>
          <div className="mt-2 text-2xl font-display font-bold text-ink tabular-nums tracking-tight">
            {pendingTasks}
          </div>
          <div className="werkbund-coord text-[10px] mt-1 tabular-nums">{tasks.length} total tasks</div>
        </Link>

        <Link
          to="/habits"
          className="group block transition-colors duration-fast hover:bg-subtle relative"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="werkbund-coord">[KPI-02] Habits Today</span>
            <Flame className="w-3.5 h-3.5 text-ink-muted group-hover:text-signal-secondary transition-colors" />
          </div>
          <div className="mt-2 text-2xl font-display font-bold text-ink tabular-nums tracking-tight">
            {completedHabitsToday} / {habits.length}
          </div>
          <div className="werkbund-coord text-[10px] mt-1 tabular-nums">Routines completed</div>
        </Link>

        <Link
          to="/expenses"
          className="group block transition-colors duration-fast hover:bg-subtle relative"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="werkbund-coord">[KPI-03] Net Balance</span>
            <Wallet className="w-3.5 h-3.5 text-ink-muted group-hover:text-signal transition-colors" />
          </div>
          <div className={`mt-2 text-xl font-mono font-bold truncate tabular-nums ${netBalance >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
            Rp {netBalance.toLocaleString('id-ID')}
          </div>
          <div className="werkbund-coord text-[10px] mt-1">Income - Expenses</div>
        </Link>

        <Link
          to="/notes"
          className="group block transition-colors duration-fast hover:bg-subtle relative"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="werkbund-coord">[KPI-04] Notes Vault</span>
            <FileText className="w-3.5 h-3.5 text-ink-muted group-hover:text-signal transition-colors" />
          </div>
          <div className="mt-2 text-2xl font-display font-bold text-ink tabular-nums tracking-tight">
            {notes.length}
          </div>
          <div className="werkbund-coord text-[10px] mt-1 tabular-nums">Markdown notes</div>
        </Link>
      </div>

      {/* Modules Grid: Continuous Shared-Border Grid */}
      <div>
        <div className="werkbund-coord mb-2.5">
          [DIR-01] APPLICATIONS DIRECTORY
        </div>
        <div className="werkbund-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {appCards.map((app) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.path}
                to={app.path}
                className="group flex flex-col justify-between transition-colors duration-fast hover:bg-subtle"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 bg-subtle border-1.5 border-border-strong flex items-center justify-center">
                      <Icon className="w-4 h-4 text-ink group-hover:text-signal transition-colors" />
                    </div>
                    <span className="werkbund-coord text-[10px]">
                      [{app.code}]
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-ink uppercase tracking-tight group-hover:text-signal transition-colors">
                    {app.title}
                  </h3>
                  <p className="text-xs text-ink-secondary mt-1">
                    {app.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t-1.5 border-border-strong flex items-center justify-between text-[11px] font-mono text-ink-muted group-hover:text-ink transition-colors">
                  <span className="uppercase tracking-wider">Open Tool</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
