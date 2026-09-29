import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { exportEncryptedPayload, importEncryptedPayload } from '../services/cryptoService';
import {
  Database,
  Download,
  Upload,
  Lock,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  Play,
  Table,
  Sparkles,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const BackupCenterPage: React.FC = () => {
  const { exportBinary, importBinary, runQuery, getTables, clearDatabase } = useDb();

  // Encrypted Export State
  const [exportPassword, setExportPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Encrypted Import State
  const [importPassword, setImportPassword] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // SQL Console State
  const [sqlInput, setSqlInput] = useState('SELECT name FROM sqlite_master WHERE type="table";');
  const [queryColumns, setQueryColumns] = useState<string[]>([]);
  const [queryRows, setQueryRows] = useState<any[][]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');

  const tables = getTables();

  // Handle Encrypted Export (.vault)
  const handleExportEncrypted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportPassword) return;

    try {
      setIsExporting(true);
      const rawDbBytes = exportBinary();
      const encryptedJson = await exportEncryptedPayload(rawDbBytes, exportPassword);

      const blob = new Blob([encryptedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `superapps_vault_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.vault`;
      a.click();
      URL.revokeObjectURL(url);

      setIsExporting(false);
      setExportSuccess(true);
      confetti({ particleCount: 50, spread: 60 });
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err: any) {
      setIsExporting(false);
      alert('Export failed: ' + err.message);
    }
  };

  // Handle Encrypted Import (.vault)
  const handleImportEncrypted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile || !importPassword) return;

    try {
      setIsImporting(true);
      setImportStatus(null);

      const fileContent = await importFile.text();
      const decryptedBytes = await importEncryptedPayload(fileContent, importPassword);

      // Verify SQLite header: first 16 bytes is "SQLite format 3\0"
      const headerStr = new TextDecoder().decode(decryptedBytes.slice(0, 16));
      if (!headerStr.startsWith('SQLite format 3')) {
        throw new Error('Decrypted data is not a valid SQLite database.');
      }

      await importBinary(decryptedBytes);
      setIsImporting(false);
      setImportStatus({ success: true, msg: 'Vault imported & restored successfully!' });
      confetti({ particleCount: 70, spread: 70 });
    } catch (err: any) {
      setIsImporting(false);
      setImportStatus({
        success: false,
        msg: 'Import failed: ' + (err.message || 'Incorrect password or corrupted backup file.'),
      });
    }
  };

  // Handle Raw Unencrypted SQLite Download (.sqlite3)
  const handleRawExport = () => {
    const rawBytes = exportBinary();
    const blob = new Blob([rawBytes as unknown as BlobPart], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `superapps_raw_${new Date().toISOString().split('T')[0]}.sqlite3`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle Raw SQLite Upload
  const handleRawImport = async (file: File) => {
    if (!window.confirm('Replace current database with uploaded SQLite file?')) return;
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      await importBinary(bytes);
      confetti({ particleCount: 40 });
      alert('SQLite database imported successfully!');
    } catch (err: any) {
      alert('Raw import failed: ' + err.message);
    }
  };

  // Run Custom SQL Query
  const handleExecuteSql = () => {
    setQueryError(null);
    const res = runQuery(sqlInput);
    if (res.error) {
      setQueryError(res.error);
      setQueryColumns([]);
      setQueryRows([]);
    } else {
      setQueryColumns(res.columns);
      setQueryRows(res.values);
    }
  };

  const handleSelectTable = (tbl: string) => {
    setSelectedTable(tbl);
    const sql = `SELECT * FROM ${tbl} LIMIT 20;`;
    setSqlInput(sql);
    const res = runQuery(sql);
    if (res.error) {
      setQueryError(res.error);
    } else {
      setQueryColumns(res.columns);
      setQueryRows(res.values);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-emerald-400" />
          <span>Backup, Encrypted Migration & SQL Lab</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Export and import your complete SQLite database with AES-256-GCM password encryption, download raw .sqlite3 files, or inspect tables.
        </p>
      </div>

      {/* Two Columns: Password-Protected Export & Import */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EXPORT PANEL */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Password-Protected Export (.vault)
              </h2>
              <p className="text-[11px] text-slate-400">
                Encrypts the entire SQLite database with your custom password using AES-256-GCM.
              </p>
            </div>
          </div>

          <form onSubmit={handleExportEncrypted} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Set Backup Encryption Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  placeholder="Enter a password to protect this backup..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isExporting || !exportPassword}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isExporting ? 'Encrypting Database...' : 'Download Encrypted .vault Backup'}</span>
            </button>
          </form>

          {exportSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span>Encrypted backup downloaded successfully!</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-300">Raw SQLite Binary</div>
              <div className="text-[10px] text-slate-500">Unencrypted .sqlite3 for DBeaver/TablePlus</div>
            </div>
            <button
              onClick={handleRawExport}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
            >
              Export .sqlite3
            </button>
          </div>
        </div>

        {/* IMPORT PANEL */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Password-Protected Import (.vault)
              </h2>
              <p className="text-[11px] text-slate-400">
                Decrypt and restore your database from an existing .vault backup file.
              </p>
            </div>
          </div>

          <form onSubmit={handleImportEncrypted} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Select .vault Backup File
              </label>
              <input
                type="file"
                accept=".vault,.json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-purple-400 hover:file:bg-slate-700 cursor-pointer"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Backup Password
              </label>
              <input
                type="password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                placeholder="Enter password used during export..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isImporting || !importFile || !importPassword}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isImporting ? 'Decrypting & Restoring...' : 'Decrypt & Restore Vault'}</span>
            </button>
          </form>

          {importStatus && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                importStatus.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {importStatus.success ? <FileCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{importStatus.msg}</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-300">Import Raw .sqlite3</div>
              <div className="text-[10px] text-slate-500">Restore unencrypted SQLite binary</div>
            </div>
            <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 cursor-pointer">
              <span>Import .db</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleRawImport(f);
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* SQL CONSOLE & TABLE BROWSER */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Interactive In-Browser SQLite Console
            </h2>
          </div>

          {/* Quick Table Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[10px] text-slate-500 uppercase mr-1">Tables:</span>
            {tables.map((tbl) => (
              <button
                key={tbl}
                onClick={() => handleSelectTable(tbl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                  selectedTable === tbl
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tbl}
              </button>
            ))}
          </div>
        </div>

        {/* SQL Input Area */}
        <div className="space-y-2">
          <div className="relative">
            <textarea
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              placeholder="SELECT * FROM shortlinks..."
              className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleExecuteSql}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run SQL Query</span>
            </button>

            <span className="text-[11px] text-slate-500 font-mono">
              Running locally in SQLite WebAssembly VFS
            </span>
          </div>
        </div>

        {queryError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
            {queryError}
          </div>
        )}

        {/* Results Table */}
        {queryColumns.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800 font-mono">
                <tr>
                  {queryColumns.map((col, idx) => (
                    <th key={idx} className="p-2.5 font-bold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {queryRows.length === 0 ? (
                  <tr>
                    <td colSpan={queryColumns.length} className="p-4 text-center text-slate-500">
                      0 rows returned.
                    </td>
                  </tr>
                ) : (
                  queryRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40">
                      {row.map((val, cIdx) => (
                        <td key={cIdx} className="p-2.5 max-w-xs truncate">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val ?? 'NULL')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dangerous Zone */}
      <div className="glass-panel p-5 rounded-2xl border border-red-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-red-400 uppercase">Erase Database (Factory Reset)</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Permanently clear the SQLite database from your browser IndexedDB and rebuild fresh schema.
          </div>
        </div>
        <button
          onClick={async () => {
            if (window.confirm('Are you sure you want to completely erase your SQLite database?')) {
              await clearDatabase();
              alert('Database wiped.');
            }
          }}
          className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/40 text-xs font-semibold"
        >
          Reset Database
        </button>
      </div>
    </div>
  );
};
