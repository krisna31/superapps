import type { Database, SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { QueryResult } from '../types';

const IDB_NAME = 'SuperappsVaultDB';
const IDB_STORE = 'sqlite_storage';
const IDB_KEY = 'sqlite_binary';

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;
let saveDebounceTimer: any = null;

async function getInitSqlJs(): Promise<(config?: any) => Promise<SqlJsStatic>> {
  if (typeof (window as any).initSqlJs === 'function') {
    return (window as any).initSqlJs;
  }

  // Load sql-wasm.js script dynamically
  await new Promise<void>((resolve, reject) => {
    if (typeof (window as any).initSqlJs === 'function') {
      return resolve();
    }
    const baseUrl = import.meta.env.BASE_URL || './';
    const script = document.createElement('script');
    script.src = `${baseUrl.replace(/\/$/, '')}/sql-wasm.js`;
    script.onload = () => resolve();
    script.onerror = () => {
      // Fallback
      const script2 = document.createElement('script');
      script2.src = './sql-wasm.js';
      script2.onload = () => resolve();
      script2.onerror = reject;
      document.head.appendChild(script2);
    };
    document.head.appendChild(script);
  });

  if (typeof (window as any).initSqlJs === 'function') {
    return (window as any).initSqlJs;
  }
  throw new Error('Failed to load SQLite WebAssembly initialization script.');
}

// IndexedDB persistence helper
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadFromIDB(): Promise<Uint8Array | null> {
  try {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => resolve(req.result ? new Uint8Array(req.result) : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to read from IndexedDB', err);
    return null;
  }
}

async function saveToIDB(data: Uint8Array): Promise<void> {
  try {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(data.buffer, IDB_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save to IndexedDB', err);
  }
}

function schedulePersistence() {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(async () => {
    if (dbInstance) {
      const binary = dbInstance.export();
      await saveToIDB(binary);
    }
  }, 400);
}

export async function initSQLite(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!SQL) {
    const initSql = await getInitSqlJs();
    SQL = await initSql({
      locateFile: () => sqlWasmUrl,
    });
  }

  const savedData = await loadFromIDB();
  if (savedData && savedData.byteLength > 0) {
    try {
      dbInstance = new SQL.Database(savedData);
    } catch (e) {
      console.warn('Existing SQLite binary was corrupted, creating fresh database', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Create schema tables
  runMigrations(dbInstance);
  schedulePersistence();

  return dbInstance;
}

function runMigrations(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS shortlinks (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE,
      title TEXT,
      url TEXT,
      category TEXT,
      clicks INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT,
      category TEXT,
      isPinned INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT,
      amount REAL,
      type TEXT,
      category TEXT,
      date TEXT,
      notes TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      title TEXT,
      frequency TEXT,
      streak INTEGER DEFAULT 0,
      completedDates TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS local_stash (
      id TEXT PRIMARY KEY,
      name TEXT,
      size INTEGER,
      type TEXT,
      dataBase64 TEXT,
      createdAt TEXT,
      expiresAt TEXT,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS ephemeral_uploads (
      id TEXT PRIMARY KEY,
      name TEXT,
      size INTEGER,
      url TEXT,
      expiryHours INTEGER,
      uploadedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

export function executeQuery(sql: string, params: any[] = []): QueryResult {
  if (!dbInstance) {
    return { columns: [], values: [], error: 'Database not initialized' };
  }

  try {
    const res = dbInstance.exec(sql, params);
    if (res.length === 0) {
      return { columns: [], values: [] };
    }
    return {
      columns: res[0].columns,
      values: res[0].values,
    };
  } catch (err: any) {
    return { columns: [], values: [], error: err.message || 'SQL execution failed' };
  }
}

export function executeMutation(sql: string, params: any[] = []): void {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  schedulePersistence();
}

export function exportDatabaseBinary(): Uint8Array {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance.export();
}

export async function importDatabaseBinary(bytes: Uint8Array): Promise<void> {
  if (!SQL) {
    const initSql = await getInitSqlJs();
    SQL = await initSql({
      locateFile: () => sqlWasmUrl,
    });
  }

  if (dbInstance) {
    dbInstance.close();
  }

  dbInstance = new SQL.Database(bytes);
  runMigrations(dbInstance);
  await saveToIDB(bytes);
}

export function getTableNames(): string[] {
  if (!dbInstance) return [];
  const res = executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
  return res.values.map((v) => v[0] as string);
}

export async function resetDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
  }
  const idb = await openIDB();
  const tx = idb.transaction(IDB_STORE, 'readwrite');
  tx.objectStore(IDB_STORE).delete(IDB_KEY);

  if (!SQL) {
    const initSql = await getInitSqlJs();
    SQL = await initSql({ locateFile: () => sqlWasmUrl });
  }
  dbInstance = new SQL.Database();
  runMigrations(dbInstance);
  schedulePersistence();
}
