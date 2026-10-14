import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  ShieldCheck, 
  Users, 
  UserCheck, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  Globe, 
  Server, 
  Mail,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { user, systemSettings, updateSystemSettings, isFirebaseConfigured } = useAuth();

  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showSuccessFeedback = (msg: string) => {
    setSaveSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 4000);
  };

  // Guard: Superadmin role check
  if (user?.role !== 'superadmin') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 mb-4 shadow-sm">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Administrator Access Required
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          This settings module is restricted exclusively to the workspace Superadmin.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Workspace</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleToggleGuestAccess = async () => {
    try {
      const nextValue = !systemSettings.allowGuestAccess;
      await updateSystemSettings({ allowGuestAccess: nextValue });
      showSuccessFeedback(
        nextValue
          ? 'Guest access enabled. Unauthenticated visitors can explore via guest mode.'
          : 'Guest access disabled. Unauthenticated users are now gated behind the lock screen.'
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update guest access setting.');
    }
  };

  const handleToggleUserRegistration = async () => {
    try {
      const nextValue = !systemSettings.allowUserRegistration;
      await updateSystemSettings({ allowUserRegistration: nextValue });
      showSuccessFeedback(
        nextValue
          ? 'User registration opened. New accounts can sign up.'
          : 'User registration closed. Only existing accounts can sign in.'
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update user registration setting.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Administration & Security
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure access controls, guest mode, registration policies, and workspace parameters.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Superadmin Session
          </span>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2.5 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
          <span className="font-medium">{saveSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2.5 animate-fade-in shadow-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Access Control Switches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Toggle 1: Guest Mode Access */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl ${systemSettings.allowGuestAccess ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {systemSettings.allowGuestAccess ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Guest Mode Access
                  </h3>
                  <span className="text-[11px] font-medium text-slate-400">
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
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  systemSettings.allowGuestAccess ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                title="Toggle Guest Mode"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    systemSettings.allowGuestAccess ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              When enabled, visitors can use tools and store data locally without logging in. When disabled, the entire workspace is locked behind an authentication wall.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Policy status:</span>
            <span className={`font-semibold ${systemSettings.allowGuestAccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {systemSettings.allowGuestAccess ? 'Guest Allowed' : 'Strict Lock Screen Enforced'}
            </span>
          </div>
        </div>

        {/* Toggle 2: User Registration */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl ${systemSettings.allowUserRegistration ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {systemSettings.allowUserRegistration ? <UserCheck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    User Registration
                  </h3>
                  <span className="text-[11px] font-medium text-slate-400">
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
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  systemSettings.allowUserRegistration ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                title="Toggle User Registration"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    systemSettings.allowUserRegistration ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              When enabled, visitors can create their own accounts via the registration form. When disabled, the Sign Up tab is hidden and only existing accounts can authenticate.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Policy status:</span>
            <span className={`font-semibold ${systemSettings.allowUserRegistration ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {systemSettings.allowUserRegistration ? 'Open Registration' : 'Registration Closed'}
            </span>
          </div>
        </div>
      </div>

      {/* Superadmin Account Configuration */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-3">
          <Mail className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Primary Superadmin Designation
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          The designated email receives full superadmin privileges across all devices and client sessions upon authentication.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <input
              type="email"
              value={systemSettings.superadminEmail}
              readOnly
              aria-readonly="true"
              placeholder="jelvinkrisnaputra31@gmail.com"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-mono cursor-not-allowed select-all"
            />
          </div>
          <span className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-slate-700">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Enforced in Security Rules</span>
          </span>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
          <div className="leading-relaxed">
            <span className="font-semibold block">Security Notice: </span>
            <span>The superadmin identity (<span className="font-mono">jelvinkrisnaputra31@gmail.com</span>) is hardcoded and cryptographically verified in <span className="font-mono">firestore.rules</span>. The policy switches above are client-side UX controls.</span>
          </div>
        </div>
      </div>

      {/* System Information & Architecture */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-4">
          <Server className="w-5 h-5 text-sky-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            System Environment & Free-Tier Guardrails
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Architecture</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">GitHub Pages SPA + Firebase</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Database Mode</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {isFirebaseConfigured ? 'Firestore + Multi-tab Cache' : 'Local Storage Fallback'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Production Domain</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-sky-500" />
              <span>apps.k31.my.id</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Active Superadmin</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono truncate block">
              {systemSettings.superadminEmail}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Current User Role</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono uppercase">
              {user?.role || 'user'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Release Version</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">v1.0.0 (Milestone 2)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
