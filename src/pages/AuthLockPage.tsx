import React, { useState } from 'react';
import { Lock, KeyRound, Fingerprint, AlertTriangle, ShieldAlert, Eye, EyeOff, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export const AuthLockPage: React.FC = () => {
  const { 
    unlockWithPassword, 
    unlockWithBiometrics, 
    isPasswordConfigured, 
    isBiometricsSupported, 
    isBiometricsEnrolled 
  } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const success = unlockWithPassword(password);
      if (!success) {
        setError('Incorrect master password. Access denied.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setError(null);
    setLoading(true);

    try {
      const success = await unlockWithBiometrics();
      if (!success) {
        setError('Biometric authentication failed or was cancelled.');
      }
    } catch (err: any) {
      setError(err?.message || 'Biometric verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // If master password is not set in environment
  if (!isPasswordConfigured) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-5 transition-colors">
        <header className="w-full max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/logo.svg" alt="Superapps Logo" className="w-7 h-7 rounded-md" />
            <span className="font-semibold text-slate-900 dark:text-white text-sm tracking-tight">Superapps Private</span>
          </div>
        </header>

        <main className="w-full max-w-sm mx-auto my-auto py-8">
          <div className="p-6 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-900 shadow-md text-center">
            <div className="w-10 h-10 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-5 h-5" />
            </div>

            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">
              Master Password Not Configured
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              This workspace is configured for strict private use. To unlock and access your tools, you must define the master password in your environment configuration:
            </p>

            <div className="p-2.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-left mb-4 text-slate-700 dark:text-slate-300">
              <p className="text-slate-400 mb-0.5"># .env or GitHub Secrets</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold">VITE_MASTER_PASSWORD=your_secure_password</p>
            </div>

            <p className="text-[10px] text-slate-500 font-mono">
              Set this secret and rebuild the project to restore workspace access.
            </p>
          </div>
        </main>

        <footer className="w-full max-w-4xl mx-auto text-center text-[10px] text-slate-400 font-mono">
          apps.k31.my.id • Private Cloud Workspace
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-5 transition-colors">
      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src="/logo.svg" alt="Superapps Logo" className="w-7 h-7 rounded-md" />
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-900 dark:text-white text-sm tracking-tight">Superapps Private</span>
            <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-750 rounded">
              Locked
            </span>
          </div>
        </div>

        {/* Theme mode toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Toggle theme"
        >
          {theme === 'system' ? (
            <Monitor className="w-4 h-4" />
          ) : resolvedTheme === 'dark' ? (
            <Moon className="w-4 h-4 text-sky-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>
      </header>

      {/* Main Lock Card */}
      <main className="w-full max-w-sm mx-auto my-auto py-6">
        <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
          <div className="text-center mb-5">
            <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-2.5">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Private Workspace Locked
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Authorized Authentication Required. Public guest access is disabled on this workspace. Enter your master password or scan your fingerprint to continue.
            </p>
          </div>

          {error && (
            <div className="mb-3.5 p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Biometrics Unlock Button (when enrolled) */}
          {isBiometricsSupported && isBiometricsEnrolled && (
            <div className="mb-4">
              <button
                type="button"
                onClick={handleBiometricUnlock}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs transition disabled:opacity-50"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Unlock with Fingerprint / Passkey</span>
              </button>

              <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-2 text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                  Or Password
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>
            </div>
          )}

          {/* Master Password Input Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter master password..."
                  autoFocus={!isBiometricsEnrolled}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs transition pr-8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{loading ? 'Verifying...' : 'Unlock Vault'}</span>
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-400 font-mono">
              Zero public access • Private instance
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 font-mono gap-1">
        <span>Protected Private Vault</span>
        <span>apps.k31.my.id</span>
      </footer>
    </div>
  );
};
