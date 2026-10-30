import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle, UserCheck, Cloud } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isFirebaseConfigured } from '@/firebase/config';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithGoogle, linkAccountWithEmail, linkAccountWithGoogle, user, systemSettings } = useAuth();

  if (!isOpen) return null;

  const isGuest = Boolean(user && (user.isAnonymous || user.uid.startsWith('guest-')));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isGuest) {
        // Guest linking workflow
        await linkAccountWithEmail(email, password);
      } else if (isSignUp) {
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
      if (isGuest) {
        await linkAccountWithGoogle();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="relative w-full max-w-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2.5 mb-4">
          <div className="w-8 h-8 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold text-xs font-mono">
            S
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {isGuest ? 'Link & Sync Account' : isSignUp ? 'Create Superapps Account' : 'Sign in to Superapps'}
            </h2>
            <p className="text-[11px] text-slate-500">
              {isGuest ? 'Migrate local data to Cloud Firestore' : 'Sync tasks, notes, habits & files across devices'}
            </p>
          </div>
        </div>

        {isGuest && (
          <div className="mb-3.5 p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs flex items-start space-x-2">
            <Cloud className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Seamless Guest Data Migration
              </p>
              <p className="text-[11px] leading-relaxed text-slate-500">
                You are currently in Guest Mode. Linking your account will automatically migrate all your existing guest tasks, notes, habits, expenses, and snippets to Cloud Firestore without data loss.
              </p>
            </div>
          </div>
        )}

        {!isFirebaseConfigured && (
          <div className="mb-3.5 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex flex-col space-y-1">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Local / Guest Mode Active</p>
                <p className="mt-0.5 text-[11px]">Firebase configuration not detected. Cloud synchronization and accounts require Firebase credentials. You can continue using all modules locally in Guest Mode.</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3.5 p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        {isFirebaseConfigured && (
          <>
            <button
              onClick={handleGoogle}
              disabled={loading}
              data-testid="link-with-google-btn"
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium text-xs transition"
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
              <span>{isGuest ? 'Link with Google' : 'Continue with Google'}</span>
            </button>

            <div className="relative my-3 flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400 absolute uppercase tracking-wider font-mono">or email</span>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <label htmlFor="modal-email" className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Email address
            </label>
            <input
              id="modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@domain.com"
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label htmlFor="modal-password" className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
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
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="link-with-email-btn"
            className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs transition mt-2"
          >
            {isGuest ? <UserCheck className="w-3.5 h-3.5" /> : isSignUp ? <UserPlus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
            <span>{isGuest ? 'Link with Email' : isSignUp ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-2.5 text-center">
          {isGuest ? (
            <p className="text-[10px] text-slate-500">
              Enter your email and password to link your guest tasks, notes, habits, and expenses.
            </p>
          ) : systemSettings.allowUserRegistration ? (
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">
              Registration is closed by administrator.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
