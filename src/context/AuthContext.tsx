import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  User
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/firebase/config';
import { UserProfile, SystemSettings } from '@/types';
import { 
  dataService, 
  getCachedSystemSettings, 
  SYSTEM_SETTINGS_KEY 
} from '@/services/dataService';
import { seedGuestSamples } from '@/services/samples';
import {
  isPlatformBiometricsSupported,
  isBiometricsEnrolled,
  enrollBiometrics,
  authenticateWithBiometrics,
  clearBiometricsEnrollment
} from '@/services/webAuthnService';

export const VAULT_OWNER_PROFILE: UserProfile = {
  uid: 'vault-owner',
  email: 'owner@local.vault',
  displayName: 'Workspace Owner',
  photoURL: null,
  isAnonymous: false,
  role: 'superadmin',
};

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isUnlocked: boolean;
  isPasswordConfigured: boolean;
  isBiometricsSupported: boolean;
  isBiometricsEnrolled: boolean;
  isFirebaseConfigured: boolean;
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  unlockWithPassword: (password: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => void;
  lockVault: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  linkWithGoogle: () => Promise<void>;
  linkAccountWithGoogle: () => Promise<void>;
  linkWithEmail: (email: string, pass: string) => Promise<void>;
  linkAccountWithEmail: (email: string, pass: string) => Promise<void>;
}

export async function computeSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toLowerCase();
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const configuredMasterPasswordHash = (import.meta.env.VITE_MASTER_PASSWORD_HASH || '').trim().toLowerCase();
  const isPasswordConfigured = Boolean(configuredMasterPasswordHash);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => getCachedSystemSettings());
  
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    // Check for saved local authenticated session
    const savedUser = localStorage.getItem('superapps_local_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        // ignore parse error
      }
    }
    // Check for saved local guest session (legacy)
    const savedLocalUser = localStorage.getItem('superapps_local_guest');
    if (savedLocalUser) {
      try {
        return JSON.parse(savedLocalUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Strict session lock: resets on tab reload / close unless explicitly authenticated via savedUser in test harness
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('superapps_local_user') || localStorage.getItem('superapps_local_guest')) {
        return true;
      }
      const rawSettings = localStorage.getItem(SYSTEM_SETTINGS_KEY);
      if (rawSettings) {
        try {
          const parsed = JSON.parse(rawSettings);
          if (parsed.allowGuestAccess === true) {
            return true;
          }
        } catch {
          // ignore
        }
      }
    }
    return false;
  });

  const [isBiometricsSupported, setIsBiometricsSupported] = useState<boolean>(false);
  const [isBioEnrolled, setIsBioEnrolled] = useState<boolean>(() => isBiometricsEnrolled());
  const [loading, setLoading] = useState<boolean>(Boolean(isFirebaseConfigured));

  // Determine user role strictly from verified superadmin email (jelvinkrisnaputra31@gmail.com) or designated admin
  const computeRole = (
    email: string | null | undefined,
    adminEmail: string
  ): 'superadmin' | 'user' => {
    if (!email) return 'user';
    const emailLower = email.trim().toLowerCase();
    const adminEmailLower = adminEmail.trim().toLowerCase();
    return emailLower === 'jelvinkrisnaputra31@gmail.com' || emailLower === adminEmailLower
      ? 'superadmin'
      : 'user';
  };

  useEffect(() => {
    isPlatformBiometricsSupported().then(setIsBiometricsSupported);
    setIsBioEnrolled(isBiometricsEnrolled());
    if (user?.uid === 'vault-owner') {
      dataService.cleanLocalSamples('vault-owner');
    }
  }, [user?.uid]);

  // Sync system settings on mount & listen to multi-tab storage updates
  useEffect(() => {
    let isCancelled = false;
    dataService.getSystemSettings().then((settings) => {
      if (isCancelled) return;
      setSystemSettings(settings);
      setUser((currentUser) => {
        if (!currentUser || currentUser.isAnonymous || !currentUser.email) return currentUser;
        const newRole = computeRole(currentUser.email, settings.superadminEmail);
        if (currentUser.role !== newRole) {
          const updatedUser: UserProfile = { ...currentUser, role: newRole };
          localStorage.setItem('superapps_local_user', JSON.stringify(updatedUser));
          return updatedUser;
        }
        return currentUser;
      });
    });

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SYSTEM_SETTINGS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as SystemSettings;
          setSystemSettings(parsed);
          setUser((currentUser) => {
            if (!currentUser || currentUser.isAnonymous || !currentUser.email) return currentUser;
            const newRole = computeRole(currentUser.email, parsed.superadminEmail);
            if (currentUser.role !== newRole) {
              const updatedUser: UserProfile = { ...currentUser, role: newRole };
              localStorage.setItem('superapps_local_user', JSON.stringify(updatedUser));
              return updatedUser;
            }
            return currentUser;
          });
        } catch {
          // ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      isCancelled = true;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateSystemSettings = async (partial: Partial<SystemSettings>) => {
    const nextSettings: SystemSettings = { ...systemSettings, ...partial };
    setSystemSettings(nextSettings);
    await dataService.saveSystemSettings(nextSettings);

    if (partial.superadminEmail) {
      setUser((currentUser) => {
        if (!currentUser || currentUser.isAnonymous || !currentUser.email) return currentUser;
        const newRole = computeRole(currentUser.email, partial.superadminEmail!);
        if (currentUser.role !== newRole) {
          const updatedUser: UserProfile = { ...currentUser, role: newRole };
          localStorage.setItem('superapps_local_user', JSON.stringify(updatedUser));
          return updatedUser;
        }
        return currentUser;
      });
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const settings = await dataService.getSystemSettings();
        const userRole = computeRole(
          firebaseUser.email,
          settings.superadminEmail
        );

        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest User' : 'User'),
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
          role: userRole,
        };

        // Immediately set user profile and unlock workspace
        setUser(profile);
        setIsUnlocked(true);
        setLoading(false);
        localStorage.removeItem('superapps_local_user');

        // Legacy Guest migration trigger
        const localGuestRaw = localStorage.getItem('superapps_local_guest');
        if (localGuestRaw && !firebaseUser.isAnonymous) {
          try {
            const guestObj = JSON.parse(localGuestRaw);
            const guestUid = guestObj?.uid;
            if (guestUid && guestUid !== firebaseUser.uid) {
              dataService.migrateGuestData(guestUid, firebaseUser.uid).then((res) => {
                if (res.success) {
                  localStorage.removeItem('superapps_local_guest');
                }
              });
            } else {
              localStorage.removeItem('superapps_local_guest');
            }
          } catch {
            localStorage.removeItem('superapps_local_guest');
          }
        }

        if (!firebaseUser.isAnonymous) {
          dataService.cleanupLegacySamples(firebaseUser.uid);
        }
      } else {
        const localUser = localStorage.getItem('superapps_local_user');
        if (localUser) {
          try {
            setUser(JSON.parse(localUser));
            setIsUnlocked(true);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const unlockWithPassword = async (password: string): Promise<boolean> => {
    if (!isPasswordConfigured) return false;
    try {
      const computedHash = await computeSHA256(password);
      if (computedHash === configuredMasterPasswordHash) {
        setIsUnlocked(true);
        setUser((curr) => curr || VAULT_OWNER_PROFILE);
        dataService.cleanLocalSamples('vault-owner');
        return true;
      }
    } catch (err) {
      console.warn('Password hash verification failed:', err);
    }
    return false;
  };

  const unlockWithBiometrics = async (): Promise<boolean> => {
    if (!isPasswordConfigured) return false;
    try {
      const unwrapped = await authenticateWithBiometrics();
      if (unwrapped && unwrapped.toLowerCase() === configuredMasterPasswordHash) {
        setIsUnlocked(true);
        setUser((curr) => curr || VAULT_OWNER_PROFILE);
        dataService.cleanLocalSamples('vault-owner');
        return true;
      }
    } catch (err) {
      console.warn('Biometric unlock failed:', err);
    }
    return false;
  };

  const enableBiometrics = async (): Promise<boolean> => {
    if (!isPasswordConfigured) return false;
    const ok = await enrollBiometrics(configuredMasterPasswordHash);
    if (ok) {
      setIsBioEnrolled(true);
    }
    return ok;
  };

  const disableBiometrics = () => {
    clearBiometricsEnrollment();
    setIsBioEnrolled(false);
  };

  const lockVault = () => {
    setIsUnlocked(false);
    setUser(null);
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase configuration not set. Please add Firebase credentials to enable Google sign in.');
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    setIsUnlocked(true);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase configuration not set. Cloud authentication requires Firebase configuration.');
    }

    await signInWithEmailAndPassword(auth, trimmedEmail, pass);
    setIsUnlocked(true);
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    if (!systemSettings.allowUserRegistration) {
      throw new Error('Registration is closed by administrator.');
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase configuration not set. Cloud registration requires Firebase configuration.');
    }

    await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
    setIsUnlocked(true);
  };

  const linkWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase configuration not set. Please add Firebase credentials to your .env or GitHub Secrets to enable Google account linking.');
    }
    const provider = new GoogleAuthProvider();
    const guestRaw = localStorage.getItem('superapps_local_guest');
    const guestUid = guestRaw ? JSON.parse(guestRaw)?.uid : user?.uid;

    if (auth.currentUser && auth.currentUser.isAnonymous) {
      try {
        await linkWithPopup(auth.currentUser, provider);
      } catch (err: unknown) {
        const e = err as { code?: string };
        if (e?.code === 'auth/credential-already-in-use' || e?.code === 'auth/email-already-in-use') {
          const result = await signInWithPopup(auth, provider);
          if (guestUid && result.user.uid !== guestUid) {
            await dataService.migrateGuestData(guestUid, result.user.uid);
            localStorage.removeItem('superapps_local_guest');
          }
        } else {
          throw err;
        }
      }
    } else {
      const result = await signInWithPopup(auth, provider);
      if (guestUid && result.user.uid !== guestUid) {
        await dataService.migrateGuestData(guestUid, result.user.uid);
        localStorage.removeItem('superapps_local_guest');
      }
    }
  };

  const linkWithEmail = async (email: string, pass: string) => {
    if (!email || !pass) {
      throw new Error('Please provide both email and password to link your account.');
    }
    const trimmedEmail = email.trim().toLowerCase();
    const guestRaw = localStorage.getItem('superapps_local_guest');
    const guestUid = guestRaw ? JSON.parse(guestRaw)?.uid : user?.uid;

    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase configuration not set. Cloud account linking requires Firebase configuration.');
    }

    if (auth.currentUser && auth.currentUser.isAnonymous) {
      const credential = EmailAuthProvider.credential(trimmedEmail, pass);
      try {
        await linkWithCredential(auth.currentUser, credential);
      } catch (err: unknown) {
        const e = err as { code?: string };
        if (e?.code === 'auth/credential-already-in-use' || e?.code === 'auth/email-already-in-use') {
          const result = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
          if (guestUid && result.user.uid !== guestUid) {
            await dataService.migrateGuestData(guestUid, result.user.uid);
            localStorage.removeItem('superapps_local_guest');
          }
        } else {
          throw err;
        }
      }
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
      if (guestUid && cred.user.uid !== guestUid) {
        await dataService.migrateGuestData(guestUid, cred.user.uid);
        localStorage.removeItem('superapps_local_guest');
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === 'auth/email-already-in-use' || e?.code === 'auth/credential-already-in-use') {
        const cred = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
        if (guestUid && cred.user.uid !== guestUid) {
          await dataService.migrateGuestData(guestUid, cred.user.uid);
          localStorage.removeItem('superapps_local_guest');
        }
      } else {
        throw err;
      }
    }
  };

  const continueAsGuest = async () => {
    if (!systemSettings.allowGuestAccess) {
      throw new Error('Guest access is disabled by administrator.');
    }

    const guestUser: UserProfile = {
      uid: 'guest-' + Math.random().toString(36).substring(2, 9),
      email: null,
      displayName: 'Guest Explorer',
      photoURL: null,
      isAnonymous: true,
      role: 'user',
    };
    localStorage.setItem('superapps_local_guest', JSON.stringify(guestUser));
    localStorage.removeItem('superapps_local_user');
    seedGuestSamples(guestUser.uid);
    setUser(guestUser);
    setIsUnlocked(true);
  };

  const signOut = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn('Firebase signOut error:', err);
      }
    }
    localStorage.removeItem('superapps_local_guest');
    localStorage.removeItem('superapps_local_user');
    setUser(null);
    setIsUnlocked(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isUnlocked,
        isPasswordConfigured,
        isBiometricsSupported,
        isBiometricsEnrolled: isBioEnrolled,
        isFirebaseConfigured,
        systemSettings,
        updateSystemSettings,
        unlockWithPassword,
        unlockWithBiometrics,
        enableBiometrics,
        disableBiometrics,
        lockVault,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        continueAsGuest,
        signOut,
        linkWithGoogle,
        linkAccountWithGoogle: linkWithGoogle,
        linkWithEmail,
        linkAccountWithEmail: linkWithEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
