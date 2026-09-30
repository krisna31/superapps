export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
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

export interface ShortlinkItem {
  id: string;
  userId: string;
  slug: string;
  originalUrl: string;
  title?: string;
  clicks: number;
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
