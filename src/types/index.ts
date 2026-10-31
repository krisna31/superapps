export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  role: 'superadmin' | 'user';
}

export interface SystemSettings {
  allowGuestAccess: boolean;
  allowUserRegistration: boolean;
  superadminEmail: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: number;
  updatedAt: number;
}

export interface NoteItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface HabitItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  completedDates: string[]; // YYYY-MM-DD
  streak: number;
  createdAt: number;
}

export interface ExpenseItem {
  id: string;
  userId: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export interface SnippetItem {
  id: string;
  userId: string;
  title: string;
  code: string;
  language: string;
  tags: string[];
  description?: string;
  createdAt: number;
}

export interface ShortlinkClickLog {
  timestamp: number;
  ip?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  device?: string; // Desktop, Mobile, Tablet
  os?: string; // Windows, macOS, Linux, iOS, Android, Other
  browser?: string; // Chrome, Safari, Firefox, Edge, Other
  referrer?: string;
  userAgent?: string;
}

export interface ShortlinkItem {
  id: string;
  userId: string;
  slug: string;
  originalUrl: string;
  title?: string;
  clicks: number;
  recentClicks?: ShortlinkClickLog[];
  createdAt: number;
  updatedAt: number;
}

export interface DropzoneItem {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
  storagePath: string;
  uploadedAt: number;
}

export type MediaPlatform = 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'youtube' | 'generic';

export interface MediaDownloadItem {
  id: string;
  userId: string;
  originalUrl: string;
  title: string;
  platform: MediaPlatform;
  format: 'video' | 'audio' | 'picker';
  quality?: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  filename?: string;
  createdAt: number;
}

export interface PickerMediaItem {
  type: 'photo' | 'video' | 'gif';
  url: string;
  thumb?: string;
}

export interface ExternalDownloadPortal {
  name: string;
  url: string;
  description: string;
}

export interface MediaExtractionResult {
  status: 'single' | 'picker' | 'direct' | 'fallback_portal';
  platform: MediaPlatform;
  title?: string;
  url?: string;
  filename?: string;
  audioUrl?: string;
  audioFilename?: string;
  picker?: PickerMediaItem[];
  fallbackPortals?: ExternalDownloadPortal[];
  errorMessage?: string;
}

export type UploadProgressCallback = (progress: {
  loaded: number;
  total: number;
  percent: number;
}) => void;

export interface WorkspaceBackup {
  version: string;
  exportedAt: number;
  userId: string;
  data: {
    tasks: TaskItem[];
    notes: NoteItem[];
    habits: HabitItem[];
    expenses: ExpenseItem[];
    snippets: SnippetItem[];
    shortlinks: ShortlinkItem[];
    dropzone: DropzoneItem[];
    mediaHistory?: MediaDownloadItem[];
    systemSettings?: SystemSettings;
  };
}
