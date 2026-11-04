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

  useEffect(() => {
    // Generate an instant cryptographically unbiased 16-char password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    setQuickPassword(generateSecureRandomString(16, chars));

    // Real-time reactive subscriptions to all core modules
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
    { title: 'Tasks (Kanban)', desc: `${pendingTasks} active items pending`, path: '/tasks', icon: CheckSquare },
    { title: 'Notes Vault', desc: `${notes.length} markdown notes stored`, path: '/notes', icon: FileText },
    { title: 'Daily Habits', desc: `${completedHabitsToday}/${habits.length} routines done today`, path: '/habits', icon: Flame },
    { title: 'Expenses & Budget', desc: `Net: Rp ${netBalance.toLocaleString('id-ID')}`, path: '/expenses', icon: Wallet },
    { title: 'Snippets Vault', desc: 'Code repository with tags', path: '/snippets', icon: Code2 },
    { title: 'SwissKnife Dev Tools', desc: 'JSON, Base64, UUID, Regex', path: '/swissknife', icon: Wrench },
    { title: 'Dropzone File Sharing', desc: 'Upload to Firebase Storage', path: '/dropzone', icon: CloudUpload },
    { title: 'URL Shortlinks', desc: 'Fast redirects & tracking', path: '/shortlinks', icon: Link2 },
    { title: 'Media Downloader', desc: 'Universal video & audio saver', path: '/downloader', icon: DownloadCloud },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-1.5 text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
            <Terminal className="w-3.5 h-3.5" />
            <span>Workspace Overview</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome, {user?.displayName || 'Workspace Owner'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Personal workspace and developer toolkit with local-first cloud sync.
          </p>
        </div>

        {/* Quick Password Tool Card */}
        <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 self-start md:self-auto">
          <KeyRound className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Quick Password</div>
            <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[140px] truncate tabular-nums">
              {quickPassword}
            </div>
          </div>
          <button
            type="button"
            aria-label="Copy quick password"
            onClick={copyPassword}
            className="p-1.5 rounded text-slate-400 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Copy Password"
          >
            {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          to="/tasks"
          className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition block"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono uppercase text-[10px] tracking-wider">Tasks to Do</span>
            <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {pendingTasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono tabular-nums">{tasks.length} total tasks</div>
        </Link>

        <Link
          to="/habits"
          className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition block"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono uppercase text-[10px] tracking-wider">Habits Today</span>
            <Flame className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {completedHabitsToday} / {habits.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono tabular-nums">Routines completed</div>
        </Link>

        <Link
          to="/expenses"
          className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition block"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono uppercase text-[10px] tracking-wider">Net Balance</span>
            <Wallet className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className={`mt-1.5 text-lg font-bold font-mono truncate tabular-nums ${netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            Rp {netBalance.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Income - Expenses</div>
        </Link>

        <Link
          to="/notes"
          className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition block"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono uppercase text-[10px] tracking-wider">Notes Vault</span>
            <FileText className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {notes.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono tabular-nums">Markdown notes</div>
        </Link>
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-3">
          Applications Directory
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {appCards.map((app) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.path}
                to={app.path}
                className="group p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-center mb-2.5">
                    <Icon className="w-4 h-4 text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {app.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {app.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
