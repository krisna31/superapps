import React, { useState, useEffect } from 'react';
import { useAuth, DEFAULT_SUPERADMIN_CREDENTIALS } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Moon, 
  Sun, 
  Monitor, 
  KeyRound,
  ShieldAlert
} from 'lucide-react';

export const AuthLockPage: React.FC = () => {
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    isFirebaseConfigured, 
    systemSettings 
  } = useAuth();
  
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!systemSettings.allowUserRegistration && isSignUp) {
      setIsSignUp(false);
    }
  }, [systemSettings.allowUserRegistration, isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!systemSettings.allowUserRegistration) {
          throw new Error('Registration is closed by administrator.');
        }
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefaultAdmin = () => {
    setEmail(DEFAULT_SUPERADMIN_CREDENTIALS.email);
    setPassword(DEFAULT_SUPERADMIN_CREDENTIALS.password);
    setIsSignUp(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center text-white font-bold shadow-md">
            S
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Superapps</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md">
                OS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Private Enterprise Workspace</p>
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
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Lock Icon & Status Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Private Workspace Locked
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Public guest access is disabled on this workspace. Please sign in with an authorized account to continue.
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl backdrop-blur-md">
            {/* Offline default credentials helper */}
            <div className="mb-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-500 inline mr-1" />
                  Administrator Access
                </span>
                <button
                  type="button"
                  onClick={handleUseDefaultAdmin}
                  className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Autofill Default Superadmin
                </button>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono space-y-0.5">
                <div>Email: <span className="text-slate-800 dark:text-slate-200">{DEFAULT_SUPERADMIN_CREDENTIALS.email}</span></div>
                <div>Password: <span className="text-slate-800 dark:text-slate-200">{DEFAULT_SUPERADMIN_CREDENTIALS.password}</span></div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {isFirebaseConfigured && (
              <>
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium text-sm transition shadow-sm mb-4"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 absolute">or with credentials</span>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="lock-email" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Email address
                </label>
                <input
                  id="lock-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@k31.my.id"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="lock-password" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  id="lock-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-md mt-2"
              >
                {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>{isSignUp ? 'Create Account' : 'Authenticate & Unlock'}</span>
              </button>
            </form>

            <div className="mt-4 text-center">
              {systemSettings.allowUserRegistration ? (
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {isSignUp ? 'Already registered? Sign in' : "New team member? Register account"}
                </button>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Registration is closed by administrator.
                </span>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        apps.k31.my.id • Superapps Private Cloud
      </footer>
    </div>
  );
};
