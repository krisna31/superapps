export interface VaultMeta {
  isInitialized: boolean;
  salt: string; // Base64 encoded PBKDF2 salt
  verifierCipher: string; // AES-GCM encrypted verification token
  verifierIv: string; // AES-GCM IV
  hasWebAuthn?: boolean;
  webAuthnCredentialId?: string;
  autoLockMinutes: number; // 0 for disabled, 5, 15, 30
  lastUnlockedAt?: number;
}

export interface Shortlink {
  id: string;
  key: string; // e.g. "gh"
  title: string;
  url: string;
  category: string;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocalStashFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataBase64?: string; // stored in IndexedDB or memory
  createdAt: string;
  expiresAt?: string;
  note?: string;
}

export interface EphemeralUploadRecord {
  id: string;
  name: string;
  size: number;
  url: string;
  expiryHours: number;
  uploadedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  completedDates: string[]; // ISO date strings ['2026-09-29', ...]
  createdAt: string;
}

export interface QueryResult {
  columns: string[];
  values: any[][];
  error?: string;
}
