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
  Database
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isFirebaseConfigured } from '@/firebase/config';
import { dataService } from '@/services/dataService';

export const SettingsPage: React.FC = () => {
  const { user, systemSettings, updateSystemSettings } = useAuth();
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Superadmin authorization guard check
  const isSuperadmin = user?.role === 'superadmin';
  const userId = user?.uid || 'vault-owner';

  const handleExportWorkspace = async () => {
    try {
      setIsExporting(true);
      const backup = await dataService.exportWorkspaceBackup(userId);
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `superapps-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSaveSuccessMessage('Workspace backup exported successfully.');
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

    try {
      setIsImporting(true);
      setErrorMessage(null);
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await dataService.importWorkspaceBackup(userId, parsed);
      if (res.success) {
        setSaveSuccessMessage(`Workspace backup restored: ${res.importedCount} items imported.`);
      } else {
        setErrorMessage(`Partial import completed (${res.importedCount} items). Errors: ${res.errors?.join(', ')}`);
      }
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid backup JSON file.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isSuperadmin) {
    return (
      <div className="p-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center max-w-xl mx-auto my-12">
        <div className="inline-flex p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Administrator Access Required
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Administration & Security
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure access controls, guest mode, registration policies, and workspace parameters
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Superadmin Session
          </span>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMessage && (
        <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
          <span className="font-medium">{saveSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Access Control Switches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Toggle 1: Guest Mode Access */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-md ${systemSettings.allowGuestAccess ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {systemSettings.allowGuestAccess ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Guest Mode Access
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Anonymous exploration
                  </span>
                </div>
              </div>

              {/* Accessible Toggle Button */}
              <button
                type="button"
                role="switch"
                aria-checked={systemSettings.allowGuestAccess}
                onClick={handleToggleGuestAccess}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  systemSettings.allowGuestAccess ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                title="Toggle Guest Mode"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    systemSettings.allowGuestAccess ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              When enabled, visitors can use tools and store data locally without logging in. When disabled, the entire workspace is locked behind an authentication wall.
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Policy status:</span>
            <span className={`font-semibold ${systemSettings.allowGuestAccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {systemSettings.allowGuestAccess ? 'Guest Allowed' : 'Strict Lock Screen Enforced'}
            </span>
          </div>
        </div>

        {/* Toggle 2: User Registration */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-md ${systemSettings.allowUserRegistration ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {systemSettings.allowUserRegistration ? <UserCheck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                    User Registration
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Self-service sign up
                  </span>
                </div>
              </div>

              {/* Accessible Toggle Button */}
              <button
                type="button"
                role="switch"
                aria-checked={systemSettings.allowUserRegistration}
                onClick={handleToggleUserRegistration}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  systemSettings.allowUserRegistration ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                title="Toggle User Registration"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    systemSettings.allowUserRegistration ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              When enabled, visitors can create their own accounts via the registration form. When disabled, the Sign Up tab is hidden and only existing accounts can authenticate.
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Policy status:</span>
            <span className={`font-semibold ${systemSettings.allowUserRegistration ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {systemSettings.allowUserRegistration ? 'Open Registration' : 'Registration Closed'}
            </span>
          </div>
        </div>
      </div>

      {/* Superadmin Account Configuration */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Mail className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-900 dark:text-white">
            Primary Superadmin Designation
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          The designated email receives full superadmin privileges across all devices and client sessions upon authentication.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1">
            <input
              type="email"
              value={systemSettings.superadminEmail}
              readOnly
              aria-readonly="true"
              placeholder="jelvinkrisnaputra31@gmail.com"
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono cursor-not-allowed select-all"
            />
          </div>
          <span className="inline-flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-mono border border-slate-200 dark:border-slate-700">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Enforced in Security Rules</span>
          </span>
        </div>

        <div className="mt-3 p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 flex items-start space-x-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
          <div className="leading-relaxed">
            <span className="font-semibold">Security Notice: </span>
            <span>The superadmin identity (jelvinkrisnaputra31@gmail.com) is hardcoded and cryptographically verified in firestore.rules.</span>
          </div>
        </div>
      </div>

      {/* Workspace Data Portability & Backup Center (Milestone 4) */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Database className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-900 dark:text-white">
            Workspace Data Portability & Backup
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-3.5">
          Full data snapshot export and migration across all 8 modules (Tasks, Notes, Habits, Expenses, Snippets, Shortlinks, Dropzone, and Settings).
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={handleExportWorkspace}
            disabled={isExporting}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export Workspace JSON'}</span>
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
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isImporting ? 'Importing...' : 'Import Workspace Backup'}</span>
          </button>
        </div>
      </div>

      {/* System Information & Architecture */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Server className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-900 dark:text-white">
            System Environment & Free-Tier Guardrails
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase mb-0.5">Architecture</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">GitHub Pages SPA + Firebase</span>
          </div>

          <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase mb-0.5">Database Mode</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {isFirebaseConfigured ? 'Firestore + Multi-tab Cache' : 'Local Storage Fallback'}
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase mb-0.5">Production Domain</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
              <Globe className="w-3 h-3 text-sky-500" />
              <span>apps.k31.my.id</span>
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase mb-0.5">Active Superadmin</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
              {systemSettings.superadminEmail}
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase mb-0.5">Current User Role</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
              {user?.role || 'user'}
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase mb-0.5">Release Version</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">v1.0.0 (Milestone 2)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
