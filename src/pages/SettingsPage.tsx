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
  Trash2,
  KeyRound,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { isFirebaseConfigured } from '@/firebase/config';
import { dataService } from '@/services/dataService';
import { cryptoService } from '@/services/cryptoService';

export const SettingsPage: React.FC = () => {
  const { user, systemSettings, updateSystemSettings } = useAuth();
  const { archetype, setArchetype, allArchetypes, polarity, setPolarity } = useTheme();
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
      <div className="ios-inset-grouped bg-surface shadow-sm border border-status-danger/30 p-8 text-center max-w-lg mx-auto my-12 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center mx-auto mb-4 border border-status-danger/20">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="text-[11px] font-semibold text-status-danger uppercase tracking-wider mb-1">
          Access Denied
        </div>
        <h2 className="text-xl font-display font-bold tracking-tight text-ink">
          Administrator Access Required
        </h2>
        <p className="text-xs text-ink-secondary mt-2 max-w-sm mx-auto leading-relaxed">
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
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div>
          <div className="flex items-center space-x-2 mb-0.5">
            <span className="text-xs font-semibold text-accent-primary uppercase tracking-wider">Security & Governance</span>
            <ShieldCheck className="w-4 h-4 text-accent-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight">
            System Administration & Security
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Configure access controls, guest mode, registration policies, and workspace parameters.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
            <span className="w-2 h-2 rounded-full bg-accent-primary mr-2 animate-pulse" />
            Superadmin Session
          </span>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMessage && (
        <div className="p-3.5 rounded-[12px] bg-status-success/10 border border-status-success/30 text-status-success text-xs font-medium flex items-center space-x-2.5 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-status-success" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-[12px] bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs font-medium flex items-center space-x-2.5 animate-fade-in shadow-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-status-danger" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Access Control Section: iOS Settings Grouped Table */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted px-1">
          Access Control Policies
        </div>

        <div className="ios-inset-grouped bg-surface shadow-sm divide-y divide-border-subtle overflow-hidden">
          {/* Row 1: Guest Mode Access */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-[10px] bg-subtle text-accent-primary mt-0.5">
                {systemSettings.allowGuestAccess ? <Unlock className="w-5 h-5 text-accent-primary" /> : <Lock className="w-5 h-5 text-ink-muted" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-ink">
                    Guest Mode Access
                  </h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    systemSettings.allowGuestAccess 
                      ? 'bg-status-success/15 text-status-success' 
                      : 'bg-status-danger/15 text-status-danger'
                  }`}>
                    {systemSettings.allowGuestAccess ? 'Guest Allowed' : 'Strict Lock Screen Enforced'}
                  </span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed max-w-xl">
                  When enabled, visitors can use tools and store data locally without logging in. When disabled, the entire workspace is locked behind an authentication wall.
                </p>
              </div>
            </div>

            {/* Apple Native Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={systemSettings.allowGuestAccess}
              onClick={handleToggleGuestAccess}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-primary/20 ${
                systemSettings.allowGuestAccess ? 'bg-[#34C759]' : 'bg-border-strong/70 dark:bg-border-strong'
              }`}
              title="Toggle Guest Mode"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-ios-md transition-transform duration-200 ease-in-out ${
                  systemSettings.allowGuestAccess ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Row 2: User Registration */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-[10px] bg-subtle text-accent-primary mt-0.5">
                {systemSettings.allowUserRegistration ? <UserCheck className="w-5 h-5 text-accent-primary" /> : <Users className="w-5 h-5 text-ink-muted" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-ink">
                    User Registration
                  </h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    systemSettings.allowUserRegistration 
                      ? 'bg-accent-primary/15 text-accent-primary' 
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}>
                    {systemSettings.allowUserRegistration ? 'Open Registration' : 'Registration Closed'}
                  </span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed max-w-xl">
                  When enabled, visitors can create their own accounts via the registration form. When disabled, the Sign Up tab is hidden and only existing accounts can authenticate.
                </p>
              </div>
            </div>

            {/* Apple Native Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={systemSettings.allowUserRegistration}
              onClick={handleToggleUserRegistration}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-primary/20 ${
                systemSettings.allowUserRegistration ? 'bg-[#34C759]' : 'bg-border-strong/70 dark:bg-border-strong'
              }`}
              title="Toggle User Registration"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-ios-md transition-transform duration-200 ease-in-out ${
                  systemSettings.allowUserRegistration ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Superadmin Account Configuration */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted px-1">
          Superadmin Governance
        </div>

        <div className="ios-inset-grouped bg-surface shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-accent-primary" />
            <h2 className="text-sm font-semibold text-ink">
              Primary Superadmin Designation
            </h2>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">
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
                className="w-full px-3.5 py-2 text-xs font-mono rounded-[10px] border border-border-subtle bg-canvas/80 text-ink cursor-not-allowed select-all focus:outline-none min-h-[40px]"
              />
            </div>
            <span className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-[10px] bg-subtle text-ink text-xs font-semibold border border-border-subtle min-h-[40px]">
              <Lock className="w-3.5 h-3.5 text-accent-primary" />
              <span>Enforced in Security Rules</span>
            </span>
          </div>

          <div className="p-3 rounded-[10px] bg-subtle/50 border border-border-subtle text-xs text-ink-secondary flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-accent-primary" />
            <div className="leading-relaxed">
              <span className="font-semibold text-ink">Security Notice: </span>
              <span>The superadmin identity (jelvinkrisnaputra31@gmail.com) is hardcoded and cryptographically verified in firestore.rules.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Workspace Data Portability & Backup Center */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted px-1">
          Data Portability & Vault Backup
        </div>

        <div className="ios-inset-grouped bg-surface shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-accent-primary" />
            <h2 className="text-sm font-semibold text-ink">
              Workspace Data Portability & Backup
            </h2>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Full data snapshot export and migration across all modules (Tasks, Notes, Habits, Expenses, Snippets, Shortlinks, Dropzone, Media History, and Settings). Optional client-side AES-GCM 256-bit encryption (PBKDF2-SHA256).
          </p>

          <div className="max-w-md space-y-1.5">
            <label htmlFor="backup-passphrase" className="block text-xs font-semibold text-ink">
              Backup Encryption Passphrase (Optional — AES-GCM 256-bit)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
              <input
                id="backup-passphrase"
                type="password"
                value={backupPassphrase}
                onChange={(e) => setBackupPassphrase(e.target.value)}
                placeholder="Leave blank for plain JSON, or enter passphrase to encrypt"
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-[10px] border border-border-subtle bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[40px]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={handleExportWorkspace}
              disabled={isExporting}
              className="ios-btn ios-btn-primary rounded-[10px] text-xs font-semibold px-4 min-h-[40px] flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
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
              className="ios-btn ios-btn-secondary rounded-[10px] text-xs font-medium px-4 min-h-[40px] flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isImporting ? 'Importing...' : 'Import Workspace Backup'}</span>
            </button>

            <button
              onClick={handleResetWorkspace}
              className="px-4 py-2 rounded-[10px] border border-status-danger/30 bg-status-danger/10 hover:bg-status-danger hover:text-white text-status-danger text-xs font-semibold transition-all min-h-[40px] flex items-center space-x-1.5 ml-auto"
              title="Wipe demo and custom data to start clean"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset All Workspace Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Workspace Appearance & Theme Studio */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Workspace Appearance & Theme Studio
          </div>
          <span className="text-[11px] text-ink-muted font-mono">
            {allArchetypes.length} Archetypes • 0-WCAG AA/AAA
          </span>
        </div>

        <div className="ios-inset-grouped bg-surface shadow-sm p-4 sm:p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-ink">Design Archetype Roster</h2>
                <p className="text-xs text-ink-secondary">
                  Dynamically shifts color palettes, typography axis, and corner geometries.
                </p>
              </div>
            </div>

            {/* Polarity Quick Switcher */}
            <div className="flex items-center p-1 bg-subtle rounded-lg border border-border-subtle self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPolarity('light')}
                className={`flex items-center space-x-1.5 py-1 px-2.5 rounded text-xs font-semibold transition-all ${
                  polarity === 'light'
                    ? 'bg-surface text-ink shadow-sm border border-border-subtle'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setPolarity('dark')}
                className={`flex items-center space-x-1.5 py-1 px-2.5 rounded text-xs font-semibold transition-all ${
                  polarity === 'dark'
                    ? 'bg-surface text-ink shadow-sm border border-border-subtle'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-accent-primary" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setPolarity('system')}
                className={`flex items-center space-x-1.5 py-1 px-2.5 rounded text-xs font-semibold transition-all ${
                  polarity === 'system'
                    ? 'bg-surface text-ink shadow-sm border border-border-subtle'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-ink-muted" />
                <span>Auto</span>
              </button>
            </div>
          </div>

          {/* Archetypes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allArchetypes.map((theme) => {
              const isSelected = archetype === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setArchetype(theme.id)}
                  className={`text-left p-3.5 rounded-lg border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-accent-primary bg-accent-tint/40 shadow-sm ring-1 ring-accent-primary'
                      : 'border-border-subtle hover:border-border-default bg-subtle/20 hover:bg-subtle/50'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <span className="font-display font-bold text-xs text-ink">{theme.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-surface border border-border-subtle text-ink-muted whitespace-nowrap">
                        {theme.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-secondary line-clamp-2 leading-relaxed mb-3">
                      {theme.tagline}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle/80 mt-1">
                      <span className="text-[10px] font-mono text-ink-muted truncate max-w-[130px]">
                        {theme.fontSample.display}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span
                          className="w-3 h-3 rounded-full border border-black/20"
                          style={{ backgroundColor: theme.previewColors.canvas }}
                          title="Canvas"
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-black/20"
                          style={{ backgroundColor: theme.previewColors.surface }}
                          title="Surface"
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-black/20"
                          style={{ backgroundColor: theme.previewColors.accent }}
                          title="Accent"
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-black/20"
                          style={{ backgroundColor: theme.previewColors.secondary }}
                          title="Secondary"
                        />
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent-primary text-white flex items-center justify-center shadow-sm">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. System Information & Architecture */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted px-1">
          System Environment & Telemetry
        </div>

        <div className="ios-inset-grouped bg-surface shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-accent-primary" />
            <h2 className="text-sm font-semibold text-ink">
              System Environment & Free-Tier Guardrails
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-[12px] bg-subtle/50 border border-border-subtle">
              <span className="text-ink-muted block text-[10px] uppercase font-semibold mb-1">Architecture</span>
              <span className="font-semibold text-ink">GitHub Pages SPA + Firebase</span>
            </div>

            <div className="p-3.5 rounded-[12px] bg-subtle/50 border border-border-subtle">
              <span className="text-ink-muted block text-[10px] uppercase font-semibold mb-1">Database Mode</span>
              <span className="font-semibold text-ink">
                {isFirebaseConfigured ? 'Firestore + Multi-tab Cache' : 'Local Storage Fallback'}
              </span>
            </div>

            <div className="p-3.5 rounded-[12px] bg-subtle/50 border border-border-subtle">
              <span className="text-ink-muted block text-[10px] uppercase font-semibold mb-1">Production Domain</span>
              <span className="font-semibold text-accent-primary flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-accent-primary" />
                <span>apps.k31.my.id</span>
              </span>
            </div>

            <div className="p-3.5 rounded-[12px] bg-subtle/50 border border-border-subtle">
              <span className="text-ink-muted block text-[10px] uppercase font-semibold mb-1">Active Superadmin</span>
              <span className="font-semibold text-ink truncate block">
                {systemSettings.superadminEmail}
              </span>
            </div>

            <div className="p-3.5 rounded-[12px] bg-subtle/50 border border-border-subtle">
              <span className="text-ink-muted block text-[10px] uppercase font-semibold mb-1">Current User Role</span>
              <span className="font-semibold text-accent-primary uppercase">
                {user?.role || 'user'}
              </span>
            </div>

            <div className="p-3.5 rounded-[12px] bg-subtle/50 border border-border-subtle">
              <span className="text-ink-muted block text-[10px] uppercase font-semibold mb-1">Release Version</span>
              <span className="font-semibold text-ink">v1.0.0 (Milestone 2)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
