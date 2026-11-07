import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Users, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Server, 
  Globe, 
  Mail, 
  ShieldAlert,
  Download,
  Upload,
  Database,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isFirebaseConfigured } from '@/firebase/config';
import { dataService } from '@/services/dataService';
import { cryptoService } from '@/services/cryptoService';

export const SettingsPage: React.FC = () => {
  const { user, systemSettings, updateSystemSettings } = useAuth();
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Superadmin authorization guard check
  const isSuperadmin = user?.role === 'superadmin';
  const userId = user?.uid || 'guest-default';

  const handleExportWorkspace = async () => {
    try {
      setIsExporting(true);
      setErrorMessage(null);
      const backup = await dataService.exportWorkspaceBackup(userId);
      const rawJson = JSON.stringify(backup, null, 2);
      const pass = backupPassphrase.trim();
      const dateStamp = new Date().toISOString().split('T')[0];

      let outputPayload = rawJson;
      let filename = `superapps-backup-${dateStamp}.json`;

      if (pass) {
        const envelope = await cryptoService.encryptPayload(rawJson, pass);
        outputPayload = JSON.stringify(envelope, null, 2);
        filename = `superapps-backup-${dateStamp}.enc.json`;
      }

      const blob = new Blob([outputPayload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSaveSuccessMessage(
        pass
          ? 'Encrypted (AES-GCM 256-bit) workspace backup exported successfully.'
          : 'Workspace backup exported successfully.'
      );
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to export workspace backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportWorkspace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Backup file exceeds the 25 MB safety limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsImporting(true);
      setErrorMessage(null);
      const text = await file.text();
      let parsed = JSON.parse(text);

      if (cryptoService.isEncryptedEnvelope(parsed)) {
        const pass = backupPassphrase.trim();
        if (!pass) {
          const passInput = document.getElementById('backup-passphrase') as HTMLInputElement | null;
          passInput?.focus();
          throw new Error(
            'Encrypted backup detected (AES-GCM 256-bit). Please enter your decryption passphrase in the field below and import again.'
          );
        }
        const decryptedText = await cryptoService.decryptPayload(parsed, pass);
        parsed = JSON.parse(decryptedText);
      }

      const res = await dataService.importWorkspaceBackup(userId, parsed);
      if (res.success) {
        setSaveSuccessMessage(`Workspace backup restored: ${res.importedCount} items imported.`);
      } else {
        setErrorMessage(`Partial import completed (${res.importedCount} items). Errors: ${res.errors?.join(', ')}`);
      }
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid or corrupted backup JSON file.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetWorkspace = async () => {
    if (confirm('Are you sure you want to reset all workspace data? This will clear all tasks, notes, habits, expenses, snippets, shortlinks, dropzone files, and media history for this private vault.')) {
      await dataService.resetWorkspaceData(userId);
      setSaveSuccessMessage('Workspace data successfully reset to clean state.');
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    }
  };

  if (!isSuperadmin) {
    return (
      <div className="p-8 rounded-none bg-[var(--bg-surface)] border-[1.5px] border-rose-500/40 text-center max-w-xl mx-auto my-12 shadow-none">
        <div className="inline-flex p-3 rounded-none bg-rose-500/10 border-[1.5px] border-rose-500/30 text-rose-600 dark:text-rose-400 mb-3">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">
          [ERR-403 / RESTRICTED]
        </div>
        <h2 className="text-xl font-display font-black tracking-tight text-[var(--text-primary)] uppercase">
          Administrator Access Required
        </h2>
        <p className="text-xs font-mono text-[var(--text-muted)] mt-2 max-w-md mx-auto leading-relaxed">
          The settings dashboard contains sensitive security policies and workspace access controls restricted exclusively to the workspace Superadmin.
        </p>
      </div>
    );
  }

  const handleToggleGuestAccess = async () => {
    try {
      setErrorMessage(null);
      const nextVal = !systemSettings.allowGuestAccess;
      await updateSystemSettings({ allowGuestAccess: nextVal });
      setSaveSuccessMessage(`Guest mode access ${nextVal ? 'enabled' : 'restricted'}.`);
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update guest access policy.');
    }
  };

  const handleToggleUserRegistration = async () => {
    try {
      setErrorMessage(null);
      const nextVal = !systemSettings.allowUserRegistration;
      await updateSystemSettings({ allowUserRegistration: nextVal });
      setSaveSuccessMessage(`User registration ${nextVal ? 'opened' : 'closed'}.`);
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update user registration policy.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header - Werkbund Subway Wayfinding Band */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-[1.5px] border-[var(--border-strong)] pb-3.5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-[var(--text-primary)] text-[var(--bg-canvas)] rounded-none">
              [SEC-CONFIG]
            </span>
            <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-display font-black tracking-tight text-[var(--text-primary)] uppercase">
              System Administration & Security
            </h1>
          </div>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1 uppercase tracking-wide">
            Configure access controls, guest mode, registration policies, and workspace parameters
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-[var(--bg-subtle)] text-[var(--color-primary)] border-[1.5px] border-[var(--border-strong)] rounded-none">
            <span className="w-2 h-2 bg-[var(--color-primary)] mr-2" />
            Superadmin Session
          </span>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMessage && (
        <div className="p-3 rounded-none bg-[var(--bg-surface)] border-[1.5px] border-[var(--color-primary)] text-[var(--text-primary)] text-xs font-mono flex items-center space-x-2 shadow-none">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[var(--color-primary)]" />
          <span className="font-bold">{saveSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-none bg-rose-500/10 border-[1.5px] border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center space-x-2 shadow-none">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
          <span className="font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Access Control Switches - Werkbund Grid Cells */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Toggle 1: Guest Mode Access */}
        <div className="rounded-none border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between shadow-none">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-[var(--border-subtle)] pb-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] text-[var(--text-primary)]">
                  {systemSettings.allowGuestAccess ? <Unlock className="w-4 h-4 text-[var(--color-primary)]" /> : <Lock className="w-4 h-4 text-[var(--text-muted)]" />}
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Guest Mode Access
                  </h3>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                    Anonymous exploration
                  </span>
                </div>
              </div>

              {/* Accessible Toggle Button (Square Werkbund Switch) */}
              <button
                type="button"
                role="switch"
                aria-checked={systemSettings.allowGuestAccess}
                onClick={handleToggleGuestAccess}
                className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-none border-[1.5px] border-[var(--border-strong)] p-0.5 transition-colors duration-100 ease-linear focus:outline-none ${
                  systemSettings.allowGuestAccess ? 'bg-[var(--color-primary)]' : 'bg-[var(--bg-canvas)]'
                }`}
                title="Toggle Guest Mode"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-5 transform rounded-none border border-[var(--border-strong)] bg-white shadow-none transition duration-100 ease-linear ${
                    systemSettings.allowGuestAccess ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs font-mono text-[var(--text-muted)] leading-relaxed">
              When enabled, visitors can use tools and store data locally without logging in. When disabled, the entire workspace is locked behind an authentication wall.
            </p>
          </div>

          <div className="mt-4 pt-2.5 border-t-[1.5px] border-[var(--border-strong)] flex items-center justify-between text-[11px] font-mono">
            <span className="text-[var(--text-muted)] uppercase">Policy status:</span>
            <span className={`font-bold uppercase tracking-wider ${systemSettings.allowGuestAccess ? 'text-[var(--color-primary)]' : 'text-rose-600 dark:text-rose-400'}`}>
              {systemSettings.allowGuestAccess ? 'Guest Allowed' : 'Strict Lock Screen Enforced'}
            </span>
          </div>
        </div>

        {/* Toggle 2: User Registration */}
        <div className="rounded-none border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between shadow-none">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-[var(--border-subtle)] pb-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] text-[var(--text-primary)]">
                  {systemSettings.allowUserRegistration ? <UserCheck className="w-4 h-4 text-[var(--color-primary)]" /> : <Users className="w-4 h-4 text-[var(--text-muted)]" />}
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    User Registration
                  </h3>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                    Self-service sign up
                  </span>
                </div>
              </div>

              {/* Accessible Toggle Button (Square Werkbund Switch) */}
              <button
                type="button"
                role="switch"
                aria-checked={systemSettings.allowUserRegistration}
                onClick={handleToggleUserRegistration}
                className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-none border-[1.5px] border-[var(--border-strong)] p-0.5 transition-colors duration-100 ease-linear focus:outline-none ${
                  systemSettings.allowUserRegistration ? 'bg-[var(--color-primary)]' : 'bg-[var(--bg-canvas)]'
                }`}
                title="Toggle User Registration"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-5 transform rounded-none border border-[var(--border-strong)] bg-white shadow-none transition duration-100 ease-linear ${
                    systemSettings.allowUserRegistration ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs font-mono text-[var(--text-muted)] leading-relaxed">
              When enabled, visitors can create their own accounts via the registration form. When disabled, the Sign Up tab is hidden and only existing accounts can authenticate.
            </p>
          </div>

          <div className="mt-4 pt-2.5 border-t-[1.5px] border-[var(--border-strong)] flex items-center justify-between text-[11px] font-mono">
            <span className="text-[var(--text-muted)] uppercase">Policy status:</span>
            <span className={`font-bold uppercase tracking-wider ${systemSettings.allowUserRegistration ? 'text-[var(--color-primary)]' : 'text-amber-600 dark:text-amber-400'}`}>
              {systemSettings.allowUserRegistration ? 'Open Registration' : 'Registration Closed'}
            </span>
          </div>
        </div>
      </div>

      {/* Superadmin Account Configuration */}
      <div className="rounded-none border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 shadow-none">
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-mono text-xs font-bold text-[var(--color-primary)]">[SEC-02]</span>
          <Mail className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Primary Superadmin Designation
          </h2>
        </div>
        <p className="text-xs font-mono text-[var(--text-muted)] mb-3 leading-relaxed">
          The designated email receives full superadmin privileges across all devices and client sessions upon authentication.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1">
            <input
              type="email"
              value={systemSettings.superadminEmail}
              readOnly
              aria-readonly="true"
              placeholder="name@example.com"
              className="w-full px-3 py-2 text-xs rounded-none border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-canvas)] text-[var(--text-primary)] font-mono cursor-not-allowed select-all"
            />
          </div>
          <span className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-none bg-[var(--bg-subtle)] text-[var(--text-primary)] text-xs font-mono font-bold uppercase border-[1.5px] border-[var(--border-strong)]">
            <Lock className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>Enforced in Security Rules</span>
          </span>
        </div>

        <div className="mt-3 p-3 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] text-[11px] font-mono text-[var(--text-muted)] flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--color-primary)]" />
          <div className="leading-relaxed">
            <span className="font-bold text-[var(--text-primary)] uppercase">Security Notice: </span>
            <span>The superadmin identity (jelvinkrisnaputra31@gmail.com) is hardcoded and cryptographically verified in firestore.rules.</span>
          </div>
        </div>
      </div>

      {/* Workspace Data Portability & Backup Center */}
      <div className="rounded-none border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 shadow-none">
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-mono text-xs font-bold text-[var(--color-primary)]">[SEC-03]</span>
          <Database className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Workspace Data Portability & Backup
          </h2>
        </div>
        <p className="text-xs font-mono text-[var(--text-muted)] mb-3.5 leading-relaxed">
          Full data snapshot export and migration across all modules (Tasks, Notes, Habits, Expenses, Snippets, Shortlinks, Dropzone, Media History, and Settings). Optional client-side AES-GCM 256-bit encryption (PBKDF2-SHA256).
        </p>

        <div className="mb-3.5 max-w-md space-y-1">
          <label htmlFor="backup-passphrase" className="block text-[11px] font-mono font-bold text-[var(--text-primary)] uppercase">
            Backup Encryption Passphrase (Optional — AES-GCM 256-bit)
          </label>
          <input
            id="backup-passphrase"
            type="password"
            value={backupPassphrase}
            onChange={(e) => setBackupPassphrase(e.target.value)}
            placeholder="Leave blank for plain JSON, or enter passphrase to encrypt/decrypt"
            className="w-full px-3 py-2 text-xs font-mono rounded-none border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-canvas)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={handleExportWorkspace}
            disabled={isExporting}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-none bg-[var(--color-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors duration-100 ease-linear disabled:opacity-50 shadow-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isExporting
                ? 'Exporting...'
                : backupPassphrase.trim()
                ? 'Export Encrypted Backup'
                : 'Export Workspace JSON'}
            </span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleImportWorkspace}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-none border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] text-[var(--text-primary)] text-xs font-mono font-bold uppercase tracking-wider transition-colors duration-100 ease-linear disabled:opacity-50 shadow-none"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isImporting ? 'Importing...' : 'Import Workspace Backup'}</span>
          </button>

          <button
            onClick={handleResetWorkspace}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-none border-[1.5px] border-rose-500/50 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 text-xs font-mono font-bold uppercase tracking-wider transition-colors duration-100 ease-linear shadow-none"
            title="Wipe demo and custom data to start clean"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset All Workspace Data</span>
          </button>
        </div>
      </div>

      {/* System Information & Architecture - Werkbund Exposed Grid */}
      <div className="rounded-none border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 shadow-none">
        <div className="flex items-center space-x-2 mb-3 border-b border-[var(--border-subtle)] pb-2.5">
          <span className="font-mono text-xs font-bold text-[var(--color-primary)]">[TELEMETRY]</span>
          <Server className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
            System Environment & Free-Tier Guardrails
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="p-3 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)]">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold mb-0.5">Architecture</span>
            <span className="font-bold text-[var(--text-primary)]">GitHub Pages SPA + Firebase</span>
          </div>

          <div className="p-3 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)]">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold mb-0.5">Database Mode</span>
            <span className="font-bold text-[var(--text-primary)]">
              {isFirebaseConfigured ? 'Firestore + Multi-tab Cache' : 'Local Storage Fallback'}
            </span>
          </div>

          <div className="p-3 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)]">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold mb-0.5">Production Domain</span>
            <span className="font-bold text-[var(--text-primary)] flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>apps.k31.my.id</span>
            </span>
          </div>

          <div className="p-3 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)]">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold mb-0.5">Active Superadmin</span>
            <span className="font-bold text-[var(--text-primary)] truncate block">
              {systemSettings.superadminEmail}
            </span>
          </div>

          <div className="p-3 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)]">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold mb-0.5">Current User Role</span>
            <span className="font-bold text-[var(--color-primary)] uppercase">
              {user?.role || 'user'}
            </span>
          </div>

          <div className="p-3 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)]">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold mb-0.5">Release Version</span>
            <span className="font-bold text-[var(--text-primary)]">v1.0.0 (Milestone 2)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
