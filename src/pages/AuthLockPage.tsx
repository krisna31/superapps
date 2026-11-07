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
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors p-4 sm:p-6 font-sans">
      {/* Top Header - Werkbund Subway Wayfinding Band */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between border-b-[1.5px] border-[var(--border-strong)] pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 bg-[var(--text-primary)] text-[var(--bg-canvas)] flex items-center justify-center font-black text-xs font-mono rounded-none">
            S
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-black text-[var(--text-primary)] text-base tracking-tight uppercase">Superapps</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-[var(--bg-subtle)] text-[var(--color-primary)] border-[1.5px] border-[var(--border-strong)] rounded-none">
                Protected
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider hidden sm:block">Private Workspace</p>
          </div>
        </div>

        {/* Theme switcher */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
          className="p-1.5 rounded-none border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] transition-colors duration-100 ease-linear shadow-none"
          title={`Theme: ${theme}`}
        >
          {theme === 'system' ? (
            <Monitor className="w-3.5 h-3.5" />
          ) : resolvedTheme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-[var(--color-primary)]" />
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
            <div className="inline-flex p-3 rounded-none bg-[var(--bg-surface)] border-[1.5px] border-[var(--border-strong)] text-[var(--color-primary)] mb-1 shadow-none">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="font-mono text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest">
              [ACCESS CONTROL ENFORCED]
            </div>
            <h1 className="text-2xl font-display font-black tracking-tight text-[var(--text-primary)] uppercase">
              Private Workspace Locked
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
              Public guest access is disabled on this workspace by administrator policy. Please sign in with an authorized account to continue.
            </p>
          </div>

          <div className="rounded-none bg-[var(--bg-surface)] border-[1.5px] border-[var(--border-strong)] p-5 shadow-none space-y-4">
            {error && (
              <div className="p-3 rounded-none bg-rose-500/10 border-[1.5px] border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight font-bold">{error}</span>
              </div>
            )}

            {/* Google Sign In (when Firebase configured) */}
            {isFirebaseConfigured && (
              <>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-none border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-canvas)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] text-[var(--text-primary)] font-mono text-xs font-bold uppercase tracking-wider transition-colors duration-100 ease-linear shadow-none disabled:opacity-50"
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

                <div className="relative my-2 flex items-center justify-center">
                  <div className="border-t-[1.5px] border-[var(--border-strong)] w-full" />
                  <span className="bg-[var(--bg-surface)] px-2 text-[10px] text-[var(--text-muted)] font-mono font-bold uppercase tracking-wider absolute">
                    OR CREDENTIALS
                  </span>
                </div>
              </>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="auth-lock-email" className="block text-[11px] font-mono font-bold uppercase text-[var(--text-primary)] mb-1">
                  Email Address
                </label>
                <input
                  id="auth-lock-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-xs font-mono rounded-none border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-canvas)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label htmlFor="auth-lock-password" className="block text-[11px] font-mono font-bold uppercase text-[var(--text-primary)] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-lock-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 pr-9 text-xs font-mono rounded-none border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-canvas)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] font-mono text-xs font-bold uppercase tracking-wider transition-colors duration-100 ease-linear shadow-none disabled:opacity-50"
              >
                {isSignUp ? <UserPlus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                <span>{isSignUp ? 'Create Account' : 'Authenticate & Unlock'}</span>
              </button>
            </form>

            {/* Offline / Local Admin Helper Button (only when Firebase unconfigured in dev/test) */}
            {!isFirebaseConfigured && !import.meta.env.PROD && (
              <div className="pt-2 border-t-[1.5px] border-[var(--border-strong)] space-y-2">
                <div className="p-2.5 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] text-[10px] font-mono text-[var(--text-muted)]">
                  <span>Local Dev Mode: Firebase is unconfigured. Workspace owner can authenticate locally as </span>
                  <strong className="text-[var(--text-primary)]">the designated workspace superadmin</strong>.
                </div>
                <button
                  type="button"
                  onClick={handleLocalSuperadminUnlock}
                  disabled={loading}
                  className="w-full py-2 px-3 rounded-none border-[1.5px] border-[var(--color-primary)] bg-[var(--bg-canvas)] hover:bg-[var(--color-primary)] hover:text-white text-[var(--color-primary)] font-mono text-xs font-bold uppercase tracking-wider transition-colors duration-100 ease-linear"
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
                  className="text-[var(--text-primary)] hover:underline uppercase font-bold"
                >
                  {isSignUp ? 'Already registered? Sign in' : 'New team member? Register account'}
                </button>
              ) : (
                <span className="text-[var(--text-muted)] uppercase tracking-wider">
                  Registration is closed by administrator.
                </span>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 text-center text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] border-t-[1.5px] border-[var(--border-strong)]">
        apps.k31.my.id • Policy-Based Workspace Security
      </footer>
    </div>
  );
};
