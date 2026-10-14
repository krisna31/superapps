import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, LogIn, UserPlus, Sparkles, AlertCircle, UserCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    user,
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    linkWithGoogle,
    linkWithEmail,
    continueAsGuest,
    isFirebaseConfigured,
    systemSettings
  } = useAuth();

  const isGuest = Boolean(user && (user.isAnonymous || user.uid.startsWith('guest-')));
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If registration is disabled, ensure isSignUp cannot remain active
  useEffect(() => {
    if (!systemSettings.allowUserRegistration && isSignUp) {
      setIsSignUp(false);
    }
  }, [systemSettings.allowUserRegistration, isSignUp]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isGuest && typeof linkWithEmail === 'function') {
        await linkWithEmail(email, password);
      } else if (isSignUp) {
        if (!systemSettings.allowUserRegistration) {
          throw new Error('Registration is closed by administrator.');
        }
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isGuest && typeof linkWithGoogle === 'function') {
        await linkWithGoogle();
      } else {
        await signInWithGoogle();
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    if (!systemSettings.allowGuestAccess) {
      setError('Guest access is disabled by administrator.');
      return;
    }
    setLoading(true);
    try {
      await continueAsGuest();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to start guest session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center text-white font-bold shadow-md">
            S
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {isGuest ? 'Link & Sync Account' : isSignUp ? 'Create Superapps Account' : 'Sign in to Superapps'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isGuest ? 'Migrate local data to Cloud Firestore' : 'Sync tasks, notes, habits & files across devices'}
            </p>
          </div>
        </div>

        {isGuest && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-start space-x-2.5 shadow-sm">
            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Seamless Guest Data Migration
              </p>
              <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300/90">
                You are currently in Guest Mode. Linking your account will automatically migrate all your existing guest tasks, notes, habits, expenses, and snippets to Cloud Firestore without data loss.
              </p>
            </div>
          </div>
        )}

        {!isFirebaseConfigured && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex flex-col space-y-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Local / Guest Mode Active</p>
                <p className="mt-0.5">Firebase configuration not detected. Cloud synchronization and accounts require Firebase credentials. You can continue using all modules locally in Guest Mode.</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        {isFirebaseConfigured && (
          <>
            <button
              onClick={handleGoogle}
              disabled={loading}
              data-testid="link-with-google-btn"
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium text-sm transition shadow-sm"
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
              <span>{isGuest ? 'Link with Google' : 'Continue with Google'}</span>
            </button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 absolute">or email</span>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="modal-email" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Email address
            </label>
            <input
              id="modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@domain.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="modal-password" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              id="modal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="link-with-email-btn"
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-md mt-2"
          >
            {isGuest ? <UserCheck className="w-4 h-4" /> : isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{isGuest ? 'Link with Email' : isSignUp ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-3 text-center">
          {isGuest ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Enter your email and password to link your guest tasks, notes, habits, and expenses.
            </p>
          ) : systemSettings.allowUserRegistration ? (
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Registration is closed by administrator.
            </span>
          )}
        </div>

        {/* Guest Access Option (hidden if already guest or allowGuestAccess is false) */}
        {!isGuest && systemSettings.allowGuestAccess && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleGuest}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Continue as Guest (Instant Access)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
