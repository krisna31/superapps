import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDb } from '../context/DbContext';
import {
  Link2,
  Share2,
  FileText,
  Wallet,
  Wrench,
  CheckCircle2,
  Database,
  ArrowRight,
  TrendingUp,
  Plus,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  KanbanSquare,
  Code2,
} from 'lucide-react';
import { NAVIGATION_GROUPS } from '../config/navigation';

export const DashboardPage: React.FC = () => {
  const { runQuery, refreshSignal } = useDb();
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    shortlinkCount: 0,
    totalClicks: 0,
    notesCount: 0,
    expensesTotal: 0,
    habitsCount: 0,
    activeStreaks: 0,
    tasksCount: 0,
    urgentTasks: 0,
    snippetsCount: 0,
  });
  const [recentLinks, setRecentLinks] = useState<any[]>([]);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch shortlinks stats
    const linksRes = runQuery('SELECT COUNT(*), SUM(clicks) FROM shortlinks;');
    const sCount = linksRes.values[0]?.[0] || 0;
    const sClicks = linksRes.values[0]?.[1] || 0;

    // 2. Fetch notes stats
    const notesRes = runQuery('SELECT COUNT(*) FROM notes;');
    const nCount = notesRes.values[0]?.[0] || 0;

    // 3. Fetch expenses stats
    const expensesRes = runQuery("SELECT SUM(amount) FROM expenses WHERE type='expense';");
    const eTotal = expensesRes.values[0]?.[0] || 0;

    // 4. Fetch habits stats
    const habitsRes = runQuery('SELECT COUNT(*), SUM(streak) FROM habits;');
    const hCount = habitsRes.values[0]?.[0] || 0;
    const hStreaks = habitsRes.values[0]?.[1] || 0;

    // 5. Fetch tasks stats
    const tasksRes = runQuery("SELECT COUNT(*), SUM(CASE WHEN priority='urgent' AND status != 'completed' THEN 1 ELSE 0 END) FROM tasks;");
    const tCount = tasksRes.values[0]?.[0] || 0;
    const tUrgent = tasksRes.values[0]?.[1] || 0;

    // 6. Fetch snippets stats
    const snipRes = runQuery('SELECT COUNT(*) FROM snippets;');
    const snipCount = snipRes.values[0]?.[0] || 0;

    setStats({
      shortlinkCount: sCount,
      totalClicks: sClicks,
      notesCount: nCount,
      expensesTotal: eTotal,
      habitsCount: hCount,
      activeStreaks: hStreaks,
      tasksCount: tCount,
      urgentTasks: tUrgent,
      snippetsCount: snipCount,
    });

    // Recent links
    const recLinks = runQuery('SELECT id, key, title, url, clicks FROM shortlinks ORDER BY clicks DESC LIMIT 4;');
    if (recLinks.values.length > 0) {
      setRecentLinks(
        recLinks.values.map((v) => ({
          id: v[0],
          key: v[1],
          title: v[2],
          url: v[3],
          clicks: v[4],
        }))
      );
    }

    // Recent notes
    const recNotes = runQuery('SELECT id, title, category, updatedAt FROM notes ORDER BY updatedAt DESC LIMIT 3;');
    if (recNotes.values.length > 0) {
      setRecentNotes(
        recNotes.values.map((v) => ({
          id: v[0],
          title: v[1],
          category: v[2],
          updatedAt: v[3],
        }))
      );
    }
  }, [runQuery, refreshSignal]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>VAULT UNLOCKED & ACTIVE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome to your Superapps Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              All data is running on your client-side SQLite WASM database. Zero cloud telemetry.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/app/tasks?action=new"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </Link>
            <Link
              to="/app/snippets?action=new"
              className="px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Snippet</span>
            </Link>
            <Link
              to="/app/shortlinks"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Shortlink</span>
            </Link>
            <Link
              to="/app/notes"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Note</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tasks</span>
            <KanbanSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1.5">{stats.tasksCount}</div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <span className={stats.urgentTasks > 0 ? 'text-rose-400 font-semibold' : ''}>
              {stats.urgentTasks} urgent
            </span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Snippets</span>
            <Code2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1.5">{stats.snippetsCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Code & commands</div>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Shortlinks</span>
            <Link2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1.5">{stats.shortlinkCount}</div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>{stats.totalClicks} clicks</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Notes</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1.5">{stats.notesCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Encrypted DB</div>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Expenses</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1.5">${stats.expensesTotal.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Local ledger</div>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Habits</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1.5">{stats.habitsCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">{stats.activeStreaks}d streak sum</div>
        </div>
      </div>

      {/* Main Two-Column Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Shortlinks */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-bold text-white">Most Used Shortlinks</h2>
            </div>
            <Link to="/app/shortlinks" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentLinks.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No shortlinks yet. Add personal shortcuts like <code className="text-blue-400">go/gh</code> or <code className="text-blue-400">go/mail</code>.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      go/{link.key}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
                        {link.title || link.url}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                        {link.url}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {link.clicks} clicks
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notes */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Recent Notes</h2>
            </div>
            <Link to="/app/notes" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentNotes.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No notes created yet. Take quick notes with full Markdown and local encryption.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentNotes.map((note) => (
                <Link
                  key={note.id}
                  to="/app/notes"
                  className="block p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-white">{note.title || 'Untitled Note'}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      {note.category || 'General'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Updated {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grouped App Directory / Launchpad */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Superapps Application Directory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Modular client-side apps organized by functional domain
            </p>
          </div>

          {/* Group Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            <button
              onClick={() => setActiveGroupFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeGroupFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Apps
            </button>
            {NAVIGATION_GROUPS.filter((g) => g.id !== 'core').map((group) => (
              <button
                key={group.id}
                onClick={() => setActiveGroupFilter(group.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeGroupFilter === group.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {group.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Group Sections */}
        <div className="space-y-6">
          {NAVIGATION_GROUPS.filter(
            (g) => g.id !== 'core' && (activeGroupFilter === 'all' || activeGroupFilter === g.id)
          ).map((group) => (
            <div key={group.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {group.title}
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  — {group.description}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {group.items.map((app) => {
                  const Icon = app.icon;
                  return (
                    <Link
                      key={app.id}
                      to={app.to}
                      className="glass-card p-4 rounded-2xl flex flex-col justify-between hover:border-blue-500/40 hover:bg-slate-800/60 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          <Icon className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {app.label}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {app.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Guide and Docs Callout */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-gradient-to-r from-blue-950/30 via-slate-900 to-indigo-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Need help or tips on Superapps OS?</div>
            <div className="text-xs text-slate-400">
              Explore the interactive User Guide covering zero-knowledge encryption, P2P WebRTC transfers, go/links, and backups.
            </div>
          </div>
        </div>
        <Link
          to="/app/guide"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 shrink-0 transition-all"
        >
          <span>Read User Guide</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
