import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Moon, 
  Sun, 
  Monitor, 
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export const AuthLockPage: React.FC = () => {
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    loginAsLocalAdmin,
    isFirebaseConfigured, 
    systemSettings 
  } = useAuth();
  
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!systemSettings.allowUserRegistration && isSignUp) {
      setIsSignUp(false);
    }
  }, [systemSettings.allowUserRegistration, isSignUp]);

  const formatAuthError = (err: any): string => {
    const msg = err?.message || '';
    if (msg.includes('auth/operation-not-allowed')) {
      return 'Google Sign-In is not enabled yet in Firebase Console. Please enable the Google provider in Firebase Authentication > Sign-in method.';
    }
    if (msg.includes('auth/unauthorized-domain')) {
      return 'Domain apps.k31.my.id is not authorized. Please add apps.k31.my.id under Firebase Authentication > Settings > Authorized domains.';
    }
    if (msg.includes('auth/popup-closed-by-user')) {
      return 'Sign-in popup was closed before completing authentication.';
    }
    if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
      return 'Invalid email or password. Please verify your credentials.';
    }
    return msg || 'Authentication failed. Please verify your credentials.';
  };

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
      setError(formatAuthError(err));
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
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLocalSuperadminUnlock = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginAsLocalAdmin('jelvinkrisnaputra31@gmail.com');
    } catch (err: any) {
      setError(err?.message || 'Local admin unlock failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors p-4 sm:p-6">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold text-xs font-mono">
            S
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Superapps</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded">
                Protected
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">Private Workspace</p>
          </div>
        </div>

        {/* Theme switcher */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
          className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          title={`Theme: ${theme}`}
        >
          {theme === 'system' ? (
            <Monitor className="w-3.5 h-3.5" />
          ) : resolvedTheme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-sky-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
        </button>
      </header>

      {/* Main Lock Card */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-sm space-y-4">
          {/* Lock Icon & Status Header */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-xs mb-1">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Private Workspace Locked
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Public guest access is disabled on this workspace by administrator policy. Please sign in with an authorized account to continue.
            </p>
          </div>

          <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            {error && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] font-mono leading-tight">{error}</span>
              </div>
            )}

            {/* Google Sign In (when Firebase configured) */}
            {isFirebaseConfigured && (
              <>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-mono text-xs transition shadow-xs"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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

                <div className="relative my-2 flex items-center justify-center">
                  <div className="border-t border-slate-100 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400 font-mono absolute">
                    OR CREDENTIALS
                  </span>
                </div>
              </>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full px-2.5 py-1.5 pr-8 text-xs font-mono rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-mono text-xs font-medium transition shadow-xs disabled:opacity-50"
              >
                {isSignUp ? <UserPlus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                <span>{isSignUp ? 'Create Account' : 'Authenticate & Unlock'}</span>
              </button>
            </form>

            {/* Offline / Local Admin Helper Button (when Firebase unconfigured) */}
            {!isFirebaseConfigured && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <span>Local Mode: Firebase is unconfigured. Workspace owner can authenticate locally as </span>
                  <strong className="text-slate-800 dark:text-slate-200">the designated workspace superadmin</strong>.
                </div>
                <button
                  type="button"
                  onClick={handleLocalSuperadminUnlock}
                  disabled={loading}
                  className="w-full py-1.5 px-3 rounded border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs transition"
                >
                  Unlock as Superadmin (Local)
                </button>
              </div>
            )}

            {/* Registration toggle */}
            <div className="pt-1 text-center font-mono text-[11px]">
              {systemSettings.allowUserRegistration ? (
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline"
                >
                  {isSignUp ? 'Already registered? Sign in' : 'New team member? Register account'}
                </button>
              ) : (
                <span className="text-slate-400">
                  Registration is closed by administrator.
                </span>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 text-center text-[10px] font-mono text-slate-400">
        apps.k31.my.id • Policy-Based Workspace Security
      </footer>
    </div>
  );
};
