import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  KeyRound, 
  ShieldAlert, 
  Fingerprint, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Lock,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';

export const AuthLockPage: React.FC = () => {
  const { 
    isPasswordConfigured,
    isBiometricsSupported,
    isBiometricsEnrolled,
    unlockWithPassword,
    unlockWithBiometrics,
  } = useAuth();
  
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError('Please enter your master password.');
      return;
    }

    setLoading(true);
    const success = unlockWithPassword(password);
    setLoading(false);

    if (!success) {
      setError('Incorrect master password. Please verify your credentials.');
    }
  };

  const handleBiometricUnlock = async () => {
    setError(null);
    setLoading(true);
    try {
      const success = await unlockWithBiometrics();
      if (!success) {
        setError('Biometric authentication cancelled or not recognized.');
      }
    } catch {
      setError('Biometric authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // If master password is not set in environment
  if (!isPasswordConfigured) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-6 transition-colors">
        <header className="w-full max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <img src="/logo.svg" alt="Superapps Logo" className="w-9 h-9 rounded-xl shadow-md" />
            <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Superapps Private</span>
          </div>
        </header>

        <main className="w-full max-w-md mx-auto my-auto py-12">
          <div className="p-8 rounded-3xl border border-rose-200 dark:border-rose-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Master Password Not Configured
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              This workspace is configured for strict private use. To unlock and access your tools, you must define the master password in your environment configuration:
            </p>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-left mb-6 text-slate-700 dark:text-slate-300">
              <p className="text-slate-400 mb-1"># .env or GitHub Secrets</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold">VITE_MASTER_PASSWORD=your_secure_password</p>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-500">
              Set this secret and rebuild the project to restore workspace access.
            </p>
          </div>
        </main>

        <footer className="w-full text-center py-4 text-xs text-slate-400">
          Superapps Private OS &bull; Strict Access Control
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-6 transition-colors">
      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <img src="/logo.svg" alt="Superapps Logo" className="w-9 h-9 rounded-xl shadow-md" />
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Superapps</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md">
                Private Vault
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Encrypted Single-User Workspace</p>
          </div>
        </div>

        {/* Theme switcher */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
          title={`Theme: ${theme}`}
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
      <main className="w-full max-w-md mx-auto my-auto py-8">
        <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Private Workspace Locked
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Authorized Authentication Required. Public guest access is disabled on this workspace. Enter your master password or scan your fingerprint to continue.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Biometrics Unlock Button (when enrolled) */}
          {isBiometricsSupported && isBiometricsEnrolled && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleBiometricUnlock}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
              >
                <Fingerprint className="w-5 h-5" />
                <span>Unlock with Fingerprint / Passkey</span>
              </button>

              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Or Enter Password
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>
            </div>
          )}

          {/* Master Password Input Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter master password..."
                  autoFocus={!isBiometricsEnrolled}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-md transition disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Unlock Vault'}</span>
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-slate-500 dark:text-slate-500">
        Superapps Private OS &bull; Session locks on tab reload
      </footer>
    </div>
  );
};
