import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, KeyRound, Eye, EyeOff, Sparkles, AlertTriangle, Fingerprint } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SuperappsLogo } from '../components/brand/SuperappsLogo';

export const AuthLockPage: React.FC = () => {
  const { isConfigured, setupVault, unlockVault, resetVault, biometricsAvailable } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const ok = await setupVault(password, autoLockMinutes);
    setIsLoading(false);

    if (ok) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } else {
      setError('Failed to initialize cryptographic vault.');
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError('Please enter your master password.');
      return;
    }

    setIsLoading(true);
    const ok = await unlockVault(password);
    setIsLoading(false);

    if (!ok) {
      setError('Incorrect password. Please try again.');
    } else {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Glow backdrop */}
        <div className="relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-25 blur-xl"></div>

          <div className="relative glass-panel rounded-3xl p-8 border border-slate-700/80 shadow-2xl">
            {/* Header Icon */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-4">
                <SuperappsLogo size={64} variant="badge" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {isConfigured ? 'Unlock Superapps Vault' : 'Setup Zero-Knowledge Vault'}
              </h2>
              <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                {isConfigured
                  ? 'Your data is encrypted locally with AES-256-GCM. Enter your master password to unlock.'
                  : 'Create your master password. All local SQLite data and sensitive settings will be encrypted.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!isConfigured ? (
              /* Setup Form */
              <form onSubmit={handleSetup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Master Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a strong master password..."
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm Master Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your master password..."
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Inactivity Auto-Lock
                  </label>
                  <select
                    value={autoLockMinutes}
                    onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="5">Auto-lock after 5 minutes</option>
                    <option value="15">Auto-lock after 15 minutes (Recommended)</option>
                    <option value="30">Auto-lock after 30 minutes</option>
                    <option value="0">Never auto-lock</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 leading-relaxed">
                  💡 <strong>Zero-Knowledge Promise:</strong> Your password is never sent to any server. If you forget your password, your encrypted data cannot be recovered without a previously exported backup file.
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium text-sm shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isLoading ? 'Deriving Keys...' : 'Initialize Secure Vault'}</span>
                </button>
              </form>
            ) : (
              /* Unlock Form */
              <form onSubmit={handleUnlock} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Master Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter master password..."
                      autoFocus
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium text-sm shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isLoading ? 'Verifying...' : 'Unlock Vault'}</span>
                </button>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setShowResetWarning(true)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Reset or Forgot Password?
                  </button>
                </div>
              </form>
            )}

            {/* Reset Warning Modal */}
            {showResetWarning && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="glass-panel p-6 rounded-2xl max-w-sm w-full border border-red-500/40 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Reset Vault?</h3>
                  <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                    Resetting will clear the master password key from this browser. Any data stored in the local SQLite database that was not exported to a backup file will become inaccessible.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowResetWarning(false)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetVault();
                        setShowResetWarning(false);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium"
                    >
                      Reset Vault
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
