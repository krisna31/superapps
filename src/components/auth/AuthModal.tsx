import React, { useState, useEffect } from 'react';
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

  // Dismiss AuthModal with Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isGuest = Boolean(user && (user.isAnonymous || user.uid.startsWith('guest-')));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isGuest) {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-elevated/95 backdrop-blur-2xl border border-border-subtle rounded-[20px] p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-ink-muted hover:text-ink rounded-full hover:bg-subtle transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-5 pb-3 border-b border-border-subtle">
          <div className="w-9 h-9 rounded-[10px] bg-accent-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
            S
          </div>
          <div>
            <h2 id="auth-modal-title" className="text-base font-display font-bold text-ink">
              {isGuest ? 'Link & Sync Account' : isSignUp ? 'Create Superapps Account' : 'Sign in to Superapps'}
            </h2>
            <p className="text-[11px] text-ink-muted font-medium">
              {isGuest ? 'Migrate to Cloud Firestore' : 'Cloud Synchronization'}
            </p>
          </div>
        </div>

        {isGuest && (
          <div className="mb-4 p-3 bg-subtle/70 rounded-[12px] border border-border-subtle text-xs flex items-start space-x-2.5">
            <Cloud className="w-4 h-4 flex-shrink-0 mt-0.5 text-accent-primary" />
            <div className="space-y-1">
              <p className="font-semibold text-ink text-[12px]">
                Seamless Guest Data Migration
              </p>
              <p className="text-[11px] leading-relaxed text-ink-secondary">
                You are currently in Guest Mode. Linking your account will automatically migrate all your existing guest tasks, notes, habits, expenses, and snippets to Cloud Firestore without data loss.
              </p>
            </div>
          </div>
        )}

        {!isFirebaseConfigured && (
          <div className="mb-4 p-3 bg-status-warning/10 rounded-[12px] border border-status-warning/30 text-status-warning text-xs flex flex-col space-y-1">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-status-warning" />
              <div>
                <p className="font-semibold text-[12px]">Local / Guest Mode Active</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-secondary">
                  Firebase configuration not detected. Cloud synchronization and accounts require Firebase credentials. You can continue using all modules locally in Guest Mode.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-status-danger/10 rounded-[12px] border border-status-danger/30 text-status-danger text-xs font-medium">
            {error}
          </div>
        )}

        {isFirebaseConfigured && (
          <>
            <button
              onClick={handleGoogle}
              disabled={loading}
              data-testid="link-with-google-btn"
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-[10px] border border-border-default bg-surface hover:bg-subtle text-ink font-medium text-xs transition-all duration-fast shadow-sm disabled:opacity-50 min-h-[44px]"
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

            <div className="relative my-3.5 flex items-center justify-center">
              <div className="border-t border-border-subtle w-full" />
              <span className="bg-elevated px-2.5 text-[11px] text-ink-muted uppercase tracking-wider font-medium absolute">
                or email credentials
              </span>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="modal-email" className="block text-xs font-medium text-ink-secondary mb-1">
              Email address
            </label>
            <input
              id="modal-email"
              type="email"
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@domain.com"
              className="w-full px-3 py-2.5 text-xs rounded-[10px] border border-border-default bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="modal-password" className="block text-xs font-medium text-ink-secondary mb-1">
              Password
            </label>
            <input
              id="modal-password"
              type="password"
              autoComplete={isSignUp || isGuest ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-xs rounded-[10px] border border-border-default bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[44px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="link-with-email-btn"
            className="ios-btn ios-btn-primary w-full py-2.5 mt-2 rounded-[10px] text-xs font-semibold shadow-sm min-h-[44px]"
          >
            {isGuest ? <UserCheck className="w-4 h-4" /> : isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{isGuest ? 'Link with Email' : isSignUp ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-4 text-center">
          {isGuest ? (
            <p className="text-[11px] text-ink-muted">
              Enter credentials to link local vault to cloud.
            </p>
          ) : systemSettings.allowUserRegistration ? (
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-medium text-accent-primary hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          ) : (
            <span className="text-[11px] text-ink-muted">
              Registration is closed by administrator.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
