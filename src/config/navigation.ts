import {
  LayoutDashboard,
  KanbanSquare,
  FileText,
  Code2,
  CheckCircle2,
  Link2,
  Share2,
  Wrench,
  Wallet,
  Database,
  BookOpen,
} from 'lucide-react';

export interface NavItemConfig {
  id: string;
  to: string;
  label: string;
  shortLabel?: string;
  description: string;
  icon: any;
  exact?: boolean;
  badgeType?: 'tasks';
  tags: string[];
}

export interface NavGroupConfig {
  id: string;
  title: string;
  description?: string;
  items: NavItemConfig[];
}

export const NAVIGATION_GROUPS: NavGroupConfig[] = [
  {
    id: 'core',
    title: 'Overview',
    description: 'System control room & high-level telemetry',
    items: [
      {
        id: 'dashboard',
        to: '/app',
        label: 'Dashboard',
        shortLabel: 'Overview',
        description: 'System telemetry, recent activity & stats',
        icon: LayoutDashboard,
        exact: true,
        tags: ['home', 'overview', 'stats', 'metrics'],
      },
    ],
  },
  {
    id: 'productivity',
    title: 'Productivity Suite',
    description: 'Task management, notes, code snippets, and focus',
    items: [
      {
        id: 'tasks',
        to: '/app/tasks',
        label: 'Kanban & Tasks',
        shortLabel: 'Tasks',
        description: 'Eisenhower & Kanban task matrix with checklists',
        icon: KanbanSquare,
        badgeType: 'tasks',
        tags: ['todo', 'kanban', 'matrix', 'tasks', 'agile', 'checklist'],
      },
      {
        id: 'notes',
        to: '/app/notes',
        label: 'Encrypted Notes',
        shortLabel: 'Notes',
        description: 'Distraction-free Markdown editor with categories',
        icon: FileText,
        tags: ['notes', 'markdown', 'editor', 'docs', 'writing'],
      },
      {
        id: 'snippets',
        to: '/app/snippets',
        label: 'Snippets Vault',
        shortLabel: 'Snippets',
        description: 'Reusable code blocks, shell scripts & templates',
        icon: Code2,
        tags: ['code', 'snippets', 'scripts', 'prompts', 'templates'],
      },
      {
        id: 'habits',
        to: '/app/habits',
        label: 'Focus & Habits',
        shortLabel: 'Habits',
        description: 'Pomodoro timer with audio chimes & daily streaks',
        icon: CheckCircle2,
        tags: ['pomodoro', 'habits', 'streaks', 'timer', 'focus'],
      },
    ],
  },
  {
    id: 'connectivity',
    title: 'Connect & Share',
    description: 'Personal link shortcuts and zero-server file sharing',
    items: [
      {
        id: 'shortlinks',
        to: '/app/shortlinks',
        label: 'Shortlinks & Hub',
        shortLabel: 'Shortlinks',
        description: 'Personal go/xxx shortcuts & stateless redirector',
        icon: Link2,
        tags: ['links', 'shortlinks', 'redirect', 'bookmarks', 'urls'],
      },
      {
        id: 'dropzone',
        to: '/app/dropzone',
        label: 'DropZone (Files & P2P)',
        shortLabel: 'DropZone',
        description: 'WebRTC P2P direct stream & ephemeral uploads',
        icon: Share2,
        tags: ['files', 'transfer', 'webrtc', 'p2p', 'ephemeral', 'upload'],
      },
    ],
  },
  {
    id: 'utilities',
    title: 'Tools & Finance',
    description: 'Developer utility toolkit and personal expense ledger',
    items: [
      {
        id: 'tools',
        to: '/app/tools',
        label: 'Swiss Knife',
        shortLabel: 'Dev Tools',
        description: 'Password generator, JSON, JWT, Hashes, UUID, Regex',
        icon: Wrench,
        tags: ['tools', 'passwords', 'jwt', 'json', 'hashes', 'regex', 'uuid'],
      },
      {
        id: 'expenses',
        to: '/app/expenses',
        label: 'Expense & Budget',
        shortLabel: 'Expenses',
        description: 'Financial ledger, category breakdown & CSV export',
        icon: Wallet,
        tags: ['finance', 'budget', 'expenses', 'money', 'ledger', 'csv'],
      },
    ],
  },
  {
    id: 'system',
    title: 'System & Security',
    description: 'Encrypted database operations and documentation',
    items: [
      {
        id: 'backup',
        to: '/app/backup',
        label: 'Backup & SQL Lab',
        shortLabel: 'Backups',
        description: 'Encrypted .vault exports, raw SQLite & SQL runner',
        icon: Database,
        tags: ['backup', 'sql', 'export', 'import', 'restore', 'database'],
      },
      {
        id: 'guide',
        to: '/app/guide',
        label: 'User Guide',
        shortLabel: 'Guide',
        description: 'Manual, cryptographic explanations & FAQs',
        icon: BookOpen,
        tags: ['help', 'guide', 'docs', 'manual', 'faqs'],
      },
    ],
  },
];
