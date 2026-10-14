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

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: Partial<SystemSettings>) => Promise<void>;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    // Check for saved local guest session
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

        // 1. Immediately set user profile so startup never freezes offline (C4)
        setUser(profile);
        setLoading(false);
        localStorage.removeItem('superapps_local_user');

        // 2. Guest migration trigger: migrate ONLY if superapps_local_guest actually exists (C3)
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

        // 3. One-time cleanup of legacy sample items in cloud account (Q3)
        if (!firebaseUser.isAnonymous) {
          dataService.cleanupLegacySamples(firebaseUser.uid);
        }
      } else {
        const localUser = localStorage.getItem('superapps_local_user');
        if (localUser) {
          try {
            setUser(JSON.parse(localUser));
          } catch {
            setUser(null);
          }
        } else {
          const localGuest = localStorage.getItem('superapps_local_guest');
          if (localGuest) {
            try {
              setUser(JSON.parse(localGuest));
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase configuration not set. Please add Firebase credentials to enable Google sign in.');
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase configuration not set. Cloud authentication requires Firebase configuration.');
    }

    await signInWithEmailAndPassword(auth, trimmedEmail, pass);
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

    // When Firebase is configured but current user is not anonymous
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

    // Local guest session adhering to 100% free-tier and single-backend persistence (localStorage)
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
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseConfigured,
        systemSettings,
        updateSystemSettings,
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
