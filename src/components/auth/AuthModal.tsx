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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/75"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-elevated border-1.5 border-border-strong p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-ink-muted hover:text-ink border-1.5 border-transparent hover:border-border-strong transition-colors duration-fast"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-5 pb-3 border-b-1.5 border-border-strong">
          <div className="w-8 h-8 bg-ink text-canvas border-1.5 border-border-strong flex items-center justify-center font-bold text-xs font-mono">
            S
          </div>
          <div>
            <h2 id="auth-modal-title" className="text-sm font-display font-bold uppercase tracking-wider text-ink">
              {isGuest ? 'Link & Sync Account' : isSignUp ? 'Create Superapps Account' : 'Sign in to Superapps'}
            </h2>
            <p className="werkbund-coord mt-0.5">
              {isGuest ? '[AUTH-LINK] MIGRATE TO CLOUD' : '[AUTH-SYS] CLOUD SYNCHRONIZATION'}
            </p>
          </div>
        </div>

        {isGuest && (
          <div className="mb-4 p-3 bg-subtle border-1.5 border-border-strong text-xs flex items-start space-x-2.5">
            <Cloud className="w-4 h-4 flex-shrink-0 mt-0.5 text-signal" />
            <div className="space-y-1">
              <p className="font-bold text-ink uppercase tracking-wider font-mono text-[11px]">
                Seamless Guest Data Migration
              </p>
              <p className="text-[11px] leading-relaxed text-ink-secondary">
                You are currently in Guest Mode. Linking your account will automatically migrate all your existing guest tasks, notes, habits, expenses, and snippets to Cloud Firestore without data loss.
              </p>
            </div>
          </div>
        )}

        {!isFirebaseConfigured && (
          <div className="mb-4 p-3 bg-surface border-1.5 border-status-warning text-status-warning text-xs flex flex-col space-y-1">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-status-warning" />
              <div>
                <p className="font-bold uppercase tracking-wider font-mono text-[11px]">Local / Guest Mode Active</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-secondary">
                  Firebase configuration not detected. Cloud synchronization and accounts require Firebase credentials. You can continue using all modules locally in Guest Mode.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-surface border-1.5 border-status-danger text-status-danger text-xs font-mono">
            {error}
          </div>
        )}

        {isFirebaseConfigured && (
          <>
            <button
              onClick={handleGoogle}
              disabled={loading}
              data-testid="link-with-google-btn"
              className="werkbund-btn werkbund-btn-outline w-full py-2 mb-3"
            >
              <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24">
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
              <div className="border-t-1.5 border-border-strong w-full" />
              <span className="bg-elevated px-2 text-[10px] text-ink-muted uppercase tracking-wider font-mono absolute">
                OR EMAIL CREDENTIALS
              </span>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="modal-email" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
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
              className="w-full px-3 py-2 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-0 focus:border-signal"
            />
          </div>

          <div>
            <label htmlFor="modal-password" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
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
              className="w-full px-3 py-2 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-0 focus:border-signal"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="link-with-email-btn"
            className="werkbund-btn werkbund-btn-signal w-full py-2 mt-2"
          >
            {isGuest ? <UserCheck className="w-3.5 h-3.5" /> : isSignUp ? <UserPlus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
            <span>{isGuest ? 'Link with Email' : isSignUp ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-4 text-center">
          {isGuest ? (
            <p className="werkbund-coord">
              ENTER CREDENTIALS TO LINK LOCAL VAULT TO CLOUD.
            </p>
          ) : systemSettings.allowUserRegistration ? (
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[11px] font-mono text-signal hover:underline uppercase tracking-wider"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          ) : (
            <span className="werkbund-coord">
              Registration is closed by administrator.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
