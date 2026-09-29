import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Database,
  Lock,
  Zap,
  Link2,
  Share2,
  FileText,
  Wallet,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Download,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const apps = [
    {
      icon: Link2,
      name: 'Shortlink & Launcher',
      tag: 'SQLite + Stateless',
      desc: 'Create personal quick-jump keys (go/gh, go/cal) and generate stateless, URL-compressed redirect links that work for anyone without a server.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Share2,
      name: 'DropZone & P2P Transfer',
      tag: 'WebRTC + Ephemeral',
      desc: 'Stream files browser-to-browser with 0 bytes on any server via WebRTC, upload temporary auto-expiring files, or stash files locally.',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: FileText,
      name: 'Encrypted Notes Vault',
      tag: 'AES-256-GCM',
      desc: 'Distraction-free Markdown editor with live preview, tagging, pinned notes, and instant relational search stored directly in SQLite.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Wallet,
      name: 'Expense & Budget Flow',
      tag: 'Financial Tracker',
      desc: 'Track daily expenses and incomes, categorize spending, view interactive monthly budget charts, and export to CSV or SQL.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Wrench,
      name: 'Dev Swiss Knife',
      tag: 'Daily Utilities',
      desc: 'Instant JSON formatter/validator, Base64/Hex encoder, JWT inspector, SHA/MD5 hasher, UUID generator, and live Regex tester.',
      color: 'from-rose-500 to-pink-500',
    },
    {
      icon: CheckCircle2,
      name: 'Focus & Habit Tracker',
      tag: 'Productivity',
      desc: 'Built-in Pomodoro focus timer with audible notifications paired with daily habit streak tracking to boost your daily workflow.',
      color: 'from-violet-500 to-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="text-white text-lg font-black">⚡</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Superapps<span className="text-blue-500">OS</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
            v1.0 • GITHUB PAGES READY
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/krisna31/superapps"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <Link
            to="/app"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
          >
            <span>Launch Superapps</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 max-w-5xl mx-auto text-center">
        {/* Ambient Gradient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-purple-600/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>100% Client-Side • Zero-Knowledge Encryption • SQLite WASM</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Your Private Daily Superapp Suite,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            Hosted Purely on GitHub Pages.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Zero servers. Zero monthly hosting fees. Zero tracking. Powered by an in-browser SQLite WebAssembly engine, protected with Bitwarden-style master password encryption, and packed with daily productivity utilities.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/app"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/25 transition-all hover:scale-105 flex items-center gap-2"
          >
            <span>Open Superapps Vault</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/app/backup"
            className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-medium text-sm transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Encrypted Backup & Import</span>
          </Link>
        </div>

        {/* Pillar Badges */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="glass-card p-4 rounded-2xl">
            <Database className="w-5 h-5 text-blue-400 mb-2" />
            <div className="text-sm font-semibold text-white">SQLite WASM</div>
            <div className="text-xs text-slate-400 mt-1">Real SQL engine in your browser, backed by IndexedDB VFS.</div>
          </div>
          <div className="glass-card p-4 rounded-2xl">
            <Lock className="w-5 h-5 text-indigo-400 mb-2" />
            <div className="text-sm font-semibold text-white">Zero-Knowledge</div>
            <div className="text-xs text-slate-400 mt-1">AES-256-GCM + PBKDF2. Only your master password unlocks it.</div>
          </div>
          <div className="glass-card p-4 rounded-2xl">
            <Zap className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-sm font-semibold text-white">100% Client-Side</div>
            <div className="text-xs text-slate-400 mt-1">Stateless redirects & WebRTC P2P. Runs anywhere statically.</div>
          </div>
          <div className="glass-card p-4 rounded-2xl">
            <KeyRound className="w-5 h-5 text-purple-400 mb-2" />
            <div className="text-sm font-semibold text-white">Password Export</div>
            <div className="text-xs text-slate-400 mt-1">One-click export of password-protected encrypted .vault files.</div>
          </div>
        </div>
      </section>

      {/* Mini Apps Catalog Section */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Integrated Daily Life Superapps
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Everything you need for daily work, bookmarking, secure transfers, budgeting, and focus—bundled into one offline-capable suite.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <div
                key={app.name}
                className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${app.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                      {app.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {app.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center text-xs text-blue-400 font-medium gap-1 group-hover:translate-x-1 transition-transform">
                  <Link to="/app" className="flex items-center gap-1">
                    <span>Open in Vault</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Superapps OS</span>
            <span>•</span>
            <span>Zero-Knowledge Client-Side Suite</span>
          </div>
          <div>
            Built for GitHub Pages with React, Vite, SQLite WASM & Web Crypto API.
          </div>
        </div>
      </footer>
    </div>
  );
};
