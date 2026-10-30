import React, { useState, useEffect } from 'react';
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
  Sparkles,
  KeyRound,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { TaskItem, NoteItem, HabitItem, ExpenseItem } from '@/types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.uid || 'vault-owner';

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [quickPassword, setQuickPassword] = useState('');
  const [copiedPass, setCopiedPass] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      const [t, n, h, e] = await Promise.all([
        dataService.getTasks(currentUserId),
        dataService.getNotes(currentUserId),
        dataService.getHabits(currentUserId),
        dataService.getExpenses(currentUserId),
      ]);
      setTasks(t);
      setNotes(n);
      setHabits(h);
      setExpenses(e);
    };
    loadDashboardData();
  }, [currentUserId]);

  const generateQuickPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let res = '';
    for (let i = 0; i < 16; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setQuickPassword(res);
  };

  useEffect(() => {
    generateQuickPassword();
  }, []);

  const copyPassword = () => {
    navigator.clipboard.writeText(quickPassword);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const completedHabitsToday = habits.filter(h => h.completedDates?.includes(todayStr)).length;
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;
  
  const totalIncome = expenses.filter(e => e.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.filter(e => e.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const appCards = [
    { title: 'Tasks (Kanban)', desc: `${pendingTasks} tasks remaining`, path: '/tasks', icon: CheckSquare, color: 'text-sky-500' },
    { title: 'Notes Vault', desc: `${notes.length} notes saved`, path: '/notes', icon: FileText, color: 'text-amber-500' },
    { title: 'Daily Habits', desc: `${completedHabitsToday}/${habits.length} habits completed today`, path: '/habits', icon: Flame, color: 'text-rose-500' },
    { title: 'Expenses & Budget', desc: `Net: Rp ${netBalance.toLocaleString('id-ID')}`, path: '/expenses', icon: Wallet, color: 'text-emerald-500' },
    { title: 'Snippets Vault', desc: 'Code repository with tags', path: '/snippets', icon: Code2, color: 'text-indigo-500' },
    { title: 'SwissKnife Dev Tools', desc: 'JSON, Base64, UUID, Regex', path: '/swissknife', icon: Wrench, color: 'text-purple-500' },
    { title: 'Dropzone File Sharing', desc: 'Upload to Firebase Storage', path: '/dropzone', icon: CloudUpload, color: 'text-teal-500' },
    { title: 'URL Shortlinks', desc: 'Fast redirects & tracking', path: '/shortlinks', icon: Link2, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-indigo-500/10 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome, {user?.displayName || 'Workspace Owner'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            All your personal tools, secured with your private master password and local biometrics.
          </p>
        </div>

        {/* Quick Password Tool Card */}
        <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <KeyRound className="w-5 h-5 text-indigo-500 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Quick Password</div>
            <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[150px] truncate">
              {quickPassword}
            </div>
          </div>
          <button
            onClick={copyPassword}
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Copy Password"
          >
            {copiedPass ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Tasks to Do</span>
            <CheckSquare className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{pendingTasks}</div>
          <div className="text-[11px] text-slate-400 mt-1">{tasks.length} total tasks</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Habits Today</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {completedHabitsToday} / {habits.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Daily routines completed</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Net Balance</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
            Rp {netBalance.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Income - Expenses</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Notes Vault</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{notes.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Markdown notes</div>
        </div>
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
          All Workspace Applications
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {appCards.map((app) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.path}
                to={app.path}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                    <Icon className={`w-5 h-5 ${app.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition">
                    {app.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {app.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-emerald-500 transition">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
