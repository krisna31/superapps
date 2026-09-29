import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  ShieldCheck,
  KeyRound,
  Link2,
  Share2,
  FileText,
  Wallet,
  Wrench,
  CheckCircle2,
  Database,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Lock,
  ChevronDown,
  ChevronUp,
  Terminal,
  WifiOff,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
  FileCode2,
  Fingerprint,
  Palette,
  Volume2,
} from 'lucide-react';
import { SuperappsLogo } from '../components/brand/SuperappsLogo';

interface GuideSection {
  id: string;
  title: string;
  category: string;
  icon: any;
  badge: string;
  badgeColor: string;
  summary: string;
  content: React.ReactNode;
  routeLink?: string;
  routeLabel?: string;
}

interface UserGuideProps {
  standalone?: boolean;
}

export const UserGuidePage: React.FC<UserGuideProps> = ({ standalone = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const sections: GuideSection[] = useMemo(() => [
    {
      id: 'quickstart',
      title: 'Getting Started & Zero-Knowledge Vault',
      category: 'core',
      icon: ShieldCheck,
      badge: 'Zero-Knowledge',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      summary: 'Learn how your master password encrypts all your daily data in-memory with AES-256-GCM and PBKDF2.',
      routeLink: '/app',
      routeLabel: 'Open Dashboard',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Superapps OS is a <strong>100% client-side application</strong> built to run entirely in your web browser. There are no remote application databases, tracking servers, or user accounts hosted on a third-party server.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="font-semibold text-white flex items-center gap-1.5 text-xs">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>How Vault Encryption Works</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li><strong>PBKDF2 Key Derivation:</strong> Your master password undergoes 100,000 iterations of PBKDF2 with a cryptographic salt to produce a 256-bit encryption key.</li>
              <li><strong>In-Memory Only:</strong> Your master password and decrypted encryption keys are never written to disk or LocalStorage. They remain only in volatile browser RAM while unlocked.</li>
              <li><strong>Auto-Lock Timer:</strong> After inactivity (configurable to 5m, 15m, 30m, or disabled), the vault locks automatically and discards all cryptographic keys.</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] flex items-start gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
            <div>
              <strong>Pro-Tip:</strong> Because this is zero-knowledge, there is no "Forgot Password" link. Be sure to export an encrypted backup of your vault regularly!
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'palette',
      title: 'Command Palette & Keyboard Shortcuts',
      category: 'core',
      icon: Terminal,
      badge: 'Cmd+K / Ctrl+K',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      summary: 'Spotlight/Raycast-style omni-search to jump across shortlinks, notes, and actions instantly.',
      routeLink: '/app',
      routeLabel: 'Open App',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Superapps OS includes a global <strong>Spotlight/Raycast-style Command Palette</strong> accessible from anywhere by pressing <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-white">Ctrl+K</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-white">Cmd+K</kbd>.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <h4 className="font-semibold text-white flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Keyboard Shortcuts Cheat Sheet</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Toggle Command Palette</span>
                <kbd className="font-mono text-blue-400 font-semibold">Ctrl + K</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Instant Vault Lock</span>
                <kbd className="font-mono text-red-400 font-semibold">Ctrl + Shift + L</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Quick New Note</span>
                <kbd className="font-mono text-emerald-400 font-semibold">Ctrl + Shift + N</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Quick New Shortlink</span>
                <kbd className="font-mono text-cyan-400 font-semibold">Ctrl + Shift + S</kbd>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
            Type anything in the palette search bar to perform a real-time relational query across your local SQLite database (including shortlink shortcuts, note contents, expense transactions, and habit streaks).
          </div>
        </div>
      ),
    },
    {
      id: 'shortlinks',
      title: 'Shortlink Hub & Stateless Redirects',
      category: 'apps',
      icon: Link2,
      badge: 'SQLite + Stateless',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      summary: 'Manage personal fast-jump bookmarks (go/xxx) and generate serverless, compressed public redirect links.',
      routeLink: '/app/shortlinks',
      routeLabel: 'Manage Shortlinks',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            The Shortlinks app gives you two powerful modes: <strong>Internal Personal Shortlinks</strong> and <strong>Stateless Public Links</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wide block mb-1">
                1. Personal Shortlinks (go/key)
              </span>
              <p className="text-[11px] text-slate-400 mb-2">
                Stored in your browser SQLite database. Perfect for fast work bookmarks like <code className="text-white">go/gh</code>, <code className="text-white">go/cal</code>, or <code className="text-white">go/jira</code>.
              </p>
              <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800 font-mono">
                Click count tracking + custom tags + instant launch
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wide block mb-1">
                2. Stateless Public Links
              </span>
              <p className="text-[11px] text-slate-400 mb-2">
                Generates a URL where the target URL is compressed with <strong>LZ-String</strong> directly into the URL hash fragment (<code className="text-white">/#/r?d=...</code>).
              </p>
              <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800 font-mono">
                Works for anyone worldwide • Zero backend server
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <h5 className="font-semibold text-white mb-1.5 text-[11px]">Optional Stateless Link Password:</h5>
            <p className="text-[11px] text-slate-400">
              When creating a Stateless link, you can check <em>Password Protection</em>. The destination URL is encrypted with AES-256-GCM. The recipient must enter the password in the client-side redirector to unlock and navigate.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'dropzone',
      title: 'DropZone: P2P Transfer & Ephemeral Uploads',
      category: 'apps',
      icon: Share2,
      badge: 'WebRTC + Litterbox',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      summary: 'Stream files direct browser-to-browser with 0 bytes stored on servers, or upload self-destructing links.',
      routeLink: '/app/dropzone',
      routeLabel: 'Open DropZone',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            DropZone solves quick file transfers without exposing files to permanent cloud storage providers:
          </p>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-xs">🌐 WebRTC P2P Direct Streaming</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">0-Server Footprint</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Click <em>Create Transfer Room</em> to get a 6-character room code. On the receiving computer or phone, enter the code. Files are transferred directly peer-to-peer via WebRTC DataChannels at local network or direct speed. No file size limits.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-xs">⏳ Ephemeral Upload (Litterbox API)</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">Auto-Expiring</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Upload files up to 1GB with an automatic expiration period: <strong>1 hour, 12 hours, 24 hours, or 72 hours</strong>. Once expired, the file is automatically purged forever from the host.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-xs">💾 Offline Local Stash</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">In-Browser SQLite</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Store essential documents, tokens, or images directly in your browser's encrypted SQLite engine. Download them anytime, even without an internet connection.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'notes',
      title: 'Encrypted Markdown Notes Vault',
      category: 'apps',
      icon: FileText,
      badge: 'Markdown + SQLite',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      summary: 'Private, distraction-free markdown note-taking with instant search, tags, and pin support.',
      routeLink: '/app/notes',
      routeLabel: 'Open Notes',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            All notes are stored in the local SQLite database. Notes are never synced to third-party cloud servers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-semibold text-white text-[11px]">Live Preview</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Dual-pane side-by-side editing</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-semibold text-white text-[11px]">Tag Filtering</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Filter by Work, Dev, Personal, Ideas</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-semibold text-white text-[11px]">Pin to Top</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Keep critical checklists visible</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
            <p className="text-slate-400">
              Supported markdown syntax includes headers (<code className="text-emerald-400">#</code>), code blocks (<code className="text-emerald-400">```code```</code>), bold/italics, bullet lists, blockquotes, and inline links.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'expenses',
      title: 'Expense & Budget Flow',
      category: 'apps',
      icon: Wallet,
      badge: 'Budgeting',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      summary: 'Track income, daily expenditures, category allocations, and export financial reports to CSV.',
      routeLink: '/app/expenses',
      routeLabel: 'Open Budget Flow',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Keep track of personal or business finances with zero monthly SaaS subscriptions:
          </p>

          <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-[11px]">
            <li><strong>Expense & Income Logging:</strong> Log transactions with customizable categories (Food, Housing, Tech, Salary, Investment, etc.).</li>
            <li><strong>Visual Breakdown:</strong> Interactive category distribution bars show where your money flows each month.</li>
            <li><strong>CSV Export:</strong> Click <em>Export CSV</em> to generate spreadsheets compatible with Microsoft Excel, Google Sheets, or Numbers.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'tools',
      title: 'Dev Swiss Knife Utilities',
      category: 'apps',
      icon: Wrench,
      badge: '6 Developer Tools',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      summary: 'Instant browser-side utilities: JSON formatter, Base64/Hex, JWT inspector, Hashes, UUID, and Regex.',
      routeLink: '/app/tools',
      routeLabel: 'Open Swiss Knife',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="font-semibold text-rose-400 text-xs">JSON Prettifier</div>
              <div className="text-[10px] text-slate-400 mt-1">Format, validate, and minify dirty JSON blobs.</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="font-semibold text-rose-400 text-xs">Base64 & Hex</div>
              <div className="text-[10px] text-slate-400 mt-1">Encode & decode strings or tokens with one click.</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="font-semibold text-rose-400 text-xs">JWT Inspector</div>
              <div className="text-[10px] text-slate-400 mt-1">Decode header & payload claims without sharing tokens with web servers.</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="font-semibold text-rose-400 text-xs">Crypto Hasher</div>
              <div className="text-[10px] text-slate-400 mt-1">Compute SHA-256, SHA-512, and MD5 hashes via Web Crypto.</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="font-semibold text-rose-400 text-xs">UUID v4 Generator</div>
              <div className="text-[10px] text-slate-400 mt-1">Generate cryptographically secure random UUIDs.</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="font-semibold text-rose-400 text-xs">Live Regex Tester</div>
              <div className="text-[10px] text-slate-400 mt-1">Test patterns against sample texts with match counts and capture groups.</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'habits',
      title: 'Focus Pomodoro & Daily Habit Streaks',
      category: 'apps',
      icon: CheckCircle2,
      badge: 'Productivity',
      badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      summary: 'Configurable Pomodoro focus timer with audible chimes and daily habit completion streaks.',
      routeLink: '/app/habits',
      routeLabel: 'Open Focus & Habits',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Build momentum throughout your day with an integrated timer and habit tracker:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-semibold text-violet-300 text-xs block mb-1">⏱️ Pomodoro Timer</span>
              <p className="text-[11px] text-slate-400">
                Switch between <strong>25m Focus</strong>, <strong>5m Short Break</strong>, and <strong>15m Long Break</strong>. Includes in-browser Web Audio synthesize chimes when sessions finish.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-semibold text-violet-300 text-xs block mb-1">🔥 Habit Streak Counters</span>
              <p className="text-[11px] text-slate-400">
                Track daily routines (e.g. Code Review, Exercise, Reading). Check in each day to increment streaks and maintain consistency.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'backup',
      title: 'Encrypted Backup (.vault) & SQL Console',
      category: 'backup',
      icon: Database,
      badge: 'Data Portability',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      summary: 'Export and import password-protected encrypted .vault backups, raw .sqlite3 binaries, and query live tables.',
      routeLink: '/app/backup',
      routeLabel: 'Open Backup & SQL Lab',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Your data is 100% yours. You can export or import at any time from the <strong>Backup & SQL Lab</strong>.
          </p>

          <div className="space-y-2">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="font-semibold text-white text-xs mb-1 flex items-center justify-between">
                <span>🔐 Password-Protected Encrypted Export (.vault)</span>
                <span className="text-[10px] text-blue-400 font-mono">Recommended</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Exports your entire SQLite database encapsulated inside a standard AES-256-GCM container protected by your chosen backup password. Perfect for moving your setup to a new laptop, browser, or saving to Google Drive/Dropbox securely.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="font-semibold text-white text-xs mb-1">
                💾 Raw SQLite Database Export (.sqlite3)
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Downloads the raw unencrypted SQLite binary file. You can open it in <em>DB Browser for SQLite</em>, <em>DBeaver</em>, or the <em>sqlite3</em> CLI.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="font-semibold text-white text-xs mb-1 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>In-Browser SQL Query Runner</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Execute raw SQL statements directly in your browser. Example:
              </p>
              <div className="mt-2 p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400 flex items-center justify-between">
                <code>SELECT * FROM shortlinks ORDER BY clicks DESC;</code>
                <button
                  onClick={() => copyToClipboard('SELECT * FROM shortlinks ORDER BY clicks DESC;', 'sql-1')}
                  className="text-slate-400 hover:text-white"
                  title="Copy SQL"
                >
                  {copiedSnippet === 'sql-1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'pwa-biometrics',
      title: 'PWA Offline Mode & Biometrics (Touch ID / Face ID)',
      category: 'core',
      icon: Fingerprint,
      badge: 'PWA + WebAuthn',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      summary: 'Install Superapps OS as a native desktop or mobile app, run fully offline, and unlock your vault in milliseconds with hardware biometrics.',
      routeLink: '/app',
      routeLabel: 'Open App',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Superapps OS is a fully certified <strong>Progressive Web App (PWA)</strong> and supports <strong>WebAuthn hardware authenticators</strong>:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide block mb-1">
                Offline Service Worker Pre-Caching
              </span>
              <p className="text-[11px] text-slate-400">
                Core UI bundles and the WebAssembly SQLite binary are cached locally. Once loaded, Superapps OS operates seamlessly with zero internet access, on airplanes, or in isolated high-security environments.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wide block mb-1">
                WebAuthn Hardware Passkeys
              </span>
              <p className="text-[11px] text-slate-400">
                Enroll Touch ID, Windows Hello, or Face ID to quickly unlock your vault without typing your long master password on every visit. Keys are protected with device-bound hardware envelopes.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'themes-soundscapes',
      title: 'Multi-Theme Studio & Acoustic Soundscapes',
      category: 'core',
      icon: Palette,
      badge: 'Customization',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      summary: 'Personalize your workspace with 4 custom cyberpunk color palettes and toggle synthesized acoustic feedback.',
      routeLink: '/app',
      routeLabel: 'Open App',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Customize your visual and acoustic working environment directly from the top navigation bar or via <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-white">Cmd+K</kbd>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-semibold text-indigo-300 text-xs block mb-1">🎨 4 Curated Themes</span>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li><strong>Cyber Midnight:</strong> Electric cobalt, indigo & violet.</li>
                <li><strong>OLED Stealth:</strong> Pure pitch-black #000000 for battery saving.</li>
                <li><strong>Nordic Frost:</strong> Cool Scandinavian slate and frost cyan.</li>
                <li><strong>Matrix Terminal:</strong> Retro cyberpunk green & phosphor telemetry.</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-semibold text-cyan-300 text-xs block mb-1">🎵 Web Audio Soundscapes</span>
              <p className="text-[11px] text-slate-400">
                Real-time synthesized harmonic chimes provide acoustic feedback on vault unlock, lock, command execution, and Pomodoro cycles. Toggle on or off anytime with the volume button.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ], [copiedSnippet]);

  const faqs = [
    {
      q: 'What happens if I forget my master password?',
      a: 'Because Superapps OS uses zero-knowledge encryption, your password is never sent to or stored on any server. If you lose your password and do not have an unencrypted export or known backup password, your local vault cannot be recovered. We strongly recommend making a password-protected .vault backup right after creating your vault.',
    },
    {
      q: 'Does clearing my browser history or cookies delete my data?',
      a: 'Clearing ordinary browsing history or cache does not delete your database. However, selecting "Clear site data" or "Clear IndexedDB / offline storage" in your browser settings will remove the browser SQLite storage. Always keep a regular .vault backup file saved to your local drive.',
    },
    {
      q: 'Can I use Superapps OS offline without an internet connection?',
      a: 'Yes! Once loaded in your browser, the SQLite engine, cryptographic operations, Markdown editor, Pomodoro timer, and Dev Swiss Knife run 100% offline. Only public WebRTC signaling and Litterbox ephemeral uploads require network access.',
    },
    {
      q: 'How do I transfer my data from one computer or browser to another?',
      a: '1. On your current device, go to Backup & SQL Lab and export a password-protected .vault file.\n2. On your new device or browser, navigate to the site, go to Backup & Import, and select "Import Encrypted .vault". Enter the password you used during export to restore all your shortlinks, notes, expenses, and habits.',
    },
    {
      q: 'Is my data visible to GitHub or GitHub Pages?',
      a: 'No. GitHub Pages acts purely as a static web server delivering HTML, JS, and CSS files to your browser. All database writes, reads, and cryptographic keys occur strictly inside your device browser memory and IndexedDB.',
    },
  ];

  // Filtering
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const matchesTab = activeTab === 'all' || sec.category === activeTab;
      const matchesSearch =
        sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [sections, activeTab, searchQuery]);

  return (
    <div className={`space-y-8 ${standalone ? 'min-h-screen bg-slate-950 text-slate-100 p-6 max-w-5xl mx-auto' : ''}`}>
      {/* Standalone Header Bar if accessed as /guide */}
      {standalone && (
        <header className="flex items-center justify-between pb-6 border-b border-slate-800">
          <Link to="/" className="group">
            <SuperappsLogo size={32} showWordmark />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/app"
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>
      )}

      {/* Hero Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interactive Documentation & User Manual</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Superapps OS User Guide
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Everything you need to know about using your client-side SQLite database, zero-knowledge vault, P2P file transfers, personal shortlinks, and productivity utilities.
          </p>

          {/* Search Bar */}
          <div className="mt-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user guide (e.g. WebRTC, password, shortlink, backup)..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All Topics ({sections.length})
        </button>
        <button
          onClick={() => setActiveTab('core')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'core'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Security & Core
        </button>
        <button
          onClick={() => setActiveTab('apps')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'apps'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Mini-Apps
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'backup'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Backups & Database
        </button>
      </div>

      {/* Guide Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700/80 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="font-bold text-sm text-white">{sec.title}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${sec.badgeColor}`}>
                    {sec.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4">{sec.summary}</p>

                {sec.content}
              </div>

              {sec.routeLink && (
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-end">
                  <Link
                    to={sec.routeLink}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold group"
                  >
                    <span>{sec.routeLabel || 'Open Tool'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredSections.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs">
          No guide topics match your query "{searchQuery}". Try searching for "backup", "webrtc", or "password".
        </div>
      )}

      {/* Frequently Asked Questions (Accordion) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-2 pt-2">
          {faqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-slate-800/80 bg-slate-900/50 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : index)}
                  className="w-full p-3.5 text-left flex items-center justify-between text-xs font-semibold text-white hover:text-blue-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2 whitespace-pre-line">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Developer Docs Reference Footer Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <FileCode2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Looking for the Developer Guide?</div>
            <div className="text-[11px] text-slate-400">
              Detailed technical architecture, cryptographic specs, and DB schema are available in the <code className="text-slate-300">docs/</code> directory of the codebase.
            </div>
          </div>
        </div>

        <a
          href="https://github.com/krisna31/superapps/tree/main/docs"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors border border-slate-700"
        >
          <span>View docs/ on GitHub</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};

export default UserGuidePage;
