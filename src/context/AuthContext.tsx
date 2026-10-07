import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  User
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/firebase/config';
import { UserProfile, SystemSettings } from '@/types';
import { dataService, getCachedSystemSettings, DEFAULT_SYSTEM_SETTINGS, SYSTEM_SETTINGS_KEY } from '@/services/dataService';

export const DEFAULT_SUPERADMIN_CREDENTIALS = {
  email: 'admin@k31.my.id',
  password: 'AdminSuperapps123!',
};

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
    // Check for saved local authenticated user first
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
  const [loading, setLoading] = useState<boolean>(!isFirebaseConfigured ? false : true);

  // Sync system settings on mount & listen to multi-tab storage updates
  useEffect(() => {
    let isCancelled = false;
    dataService.getSystemSettings().then((settings) => {
      if (isCancelled) return;
      setSystemSettings((prev) => {
        if (
          prev.superadminEmail !== DEFAULT_SYSTEM_SETTINGS.superadminEmail &&
          settings.superadminEmail === DEFAULT_SYSTEM_SETTINGS.superadminEmail
        ) {
          return prev;
        }
        return settings;
      });
      setUser((currentUser) => {
        if (!currentUser || currentUser.isAnonymous || !currentUser.email) return currentUser;
        const emailLower = currentUser.email.toLowerCase();
        const shouldBeSuperadmin = 
          emailLower === settings.superadminEmail.toLowerCase() ||
          emailLower === DEFAULT_SUPERADMIN_CREDENTIALS.email.toLowerCase();
        const newRole: 'superadmin' | 'user' = shouldBeSuperadmin ? 'superadmin' : 'user';
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
            const emailLower = currentUser.email.toLowerCase();
            const shouldBeSuperadmin = 
              emailLower === parsed.superadminEmail.toLowerCase() ||
              emailLower === DEFAULT_SUPERADMIN_CREDENTIALS.email.toLowerCase();
            const newRole: 'superadmin' | 'user' = shouldBeSuperadmin ? 'superadmin' : 'user';
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
    let nextSettings: SystemSettings = { ...systemSettings, ...partial };
    setSystemSettings((prev) => {
      nextSettings = { ...prev, ...partial };
      return nextSettings;
    });
    await dataService.saveSystemSettings(nextSettings);

    if (partial.superadminEmail) {
      const newAdminEmailLower = partial.superadminEmail.toLowerCase();
      setUser((currentUser) => {
        if (!currentUser || currentUser.isAnonymous || !currentUser.email) return currentUser;
        const emailLower = currentUser.email.toLowerCase();
        const shouldBeSuperadmin = 
          emailLower === newAdminEmailLower ||
          emailLower === DEFAULT_SUPERADMIN_CREDENTIALS.email.toLowerCase();
        const newRole: 'superadmin' | 'user' = shouldBeSuperadmin ? 'superadmin' : 'user';
        if (currentUser.role !== newRole) {
          const updatedUser: UserProfile = { ...currentUser, role: newRole };
          localStorage.setItem('superapps_local_user', JSON.stringify(updatedUser));
          return updatedUser;
        }
        return currentUser;
      });
    }
  };

  // Helper to gather all guest identifiers to guarantee zero data loss during migration
  const gatherGuestIds = (activeUid?: string | null): string[] => {
    const ids = new Set<string>();
    if (activeUid) ids.add(activeUid);
    if (user?.uid) ids.add(user.uid);
    ids.add('guest-default');
    const localGuestRaw = localStorage.getItem('superapps_local_guest');
    if (localGuestRaw) {
      try {
        const parsed = JSON.parse(localGuestRaw);
        if (parsed?.uid) ids.add(parsed.uid);
      } catch {
        // ignore parse error
      }
    }
    return Array.from(ids);
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const settings = await dataService.getSystemSettings();
        let userRole: 'superadmin' | 'user' = 'user';

        if (!firebaseUser.isAnonymous && firebaseUser.email) {
          const emailLower = firebaseUser.email.toLowerCase();
          if (emailLower === settings.superadminEmail.toLowerCase()) {
            userRole = 'superadmin';
          } else if (
            settings.superadminEmail.toLowerCase() === DEFAULT_SYSTEM_SETTINGS.superadminEmail.toLowerCase() &&
            localStorage.getItem('superapps_admin_claimed') !== 'true'
          ) {
            // First user who signs in / signs up automatically becomes superadmin
            userRole = 'superadmin';
            const newSettings: SystemSettings = { ...settings, superadminEmail: emailLower };
            await dataService.saveSystemSettings(newSettings);
            localStorage.setItem('superapps_admin_claimed', 'true');
            setSystemSettings(newSettings);
          }
        }

        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest User' : 'User'),
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
          role: userRole,
        };
        
        // Migrate data from previous guest session if transitioning to an authenticated account
        const localGuestRaw = localStorage.getItem('superapps_local_guest');
        const guestIds = new Set<string>(['guest-default']);
        if (localGuestRaw) {
          try {
            const guestObj = JSON.parse(localGuestRaw);
            if (guestObj?.uid) guestIds.add(guestObj.uid);
          } catch {
            // ignore
          }
        }
        if (!firebaseUser.isAnonymous) {
          const sourceIds = Array.from(guestIds).filter((id) => id !== firebaseUser.uid);
          if (sourceIds.length > 0) {
            await dataService.migrateGuestData(sourceIds, firebaseUser.uid);
          }
        }

        setUser(profile);
        localStorage.removeItem('superapps_local_user');
        localStorage.removeItem('superapps_local_guest');
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
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase configuration not set. Please add Firebase credentials to your .env or GitHub Secrets.');
    }
    const guestIds = gatherGuestIds(user?.uid);
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    if (result?.user?.uid) {
      const sourceIds = guestIds.filter((id) => id !== result.user.uid);
      if (sourceIds.length > 0) {
        await dataService.migrateGuestData(sourceIds, result.user.uid);
      }
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const prevGuestId = (user && (user.isAnonymous || user.uid.startsWith('guest-'))) ? user.uid : null;

    // Check offline default superadmin credentials
    if (
      trimmedEmail === DEFAULT_SUPERADMIN_CREDENTIALS.email.toLowerCase() &&
      pass === DEFAULT_SUPERADMIN_CREDENTIALS.password
    ) {
      const superadminUser: UserProfile = {
        uid: 'local-superadmin',
        email: trimmedEmail,
        displayName: 'Superadmin',
        photoURL: null,
        isAnonymous: false,
        role: 'superadmin',
      };
      localStorage.setItem('superapps_local_user', JSON.stringify(superadminUser));
      localStorage.removeItem('superapps_local_guest');
      localStorage.setItem('superapps_admin_claimed', 'true');
      if (prevGuestId && prevGuestId !== 'local-superadmin') {
        await dataService.migrateGuestData(prevGuestId, 'local-superadmin');
      }
      setUser(superadminUser);
      return;
    }

    if (!isFirebaseConfigured || !auth) {
      // Check offline registered users
      const rawStored = localStorage.getItem('superapps_local_registered_users');
      const registeredList: any[] = rawStored ? JSON.parse(rawStored) : [];
      const found = registeredList.find(
        (u) => u.email.toLowerCase() === trimmedEmail && u.password === pass
      );

      if (found) {
        const isSuperadmin =
          found.email.toLowerCase() === systemSettings.superadminEmail.toLowerCase() ||
          found.email.toLowerCase() === DEFAULT_SUPERADMIN_CREDENTIALS.email.toLowerCase() ||
          found.role === 'superadmin';
        const role: 'superadmin' | 'user' = isSuperadmin ? 'superadmin' : 'user';

        const profile: UserProfile = {
          uid: found.uid,
          email: found.email,
          displayName: found.displayName || 'User',
          photoURL: null,
          isAnonymous: false,
          role,
        };
        localStorage.setItem('superapps_local_user', JSON.stringify(profile));
        localStorage.removeItem('superapps_local_guest');
        if (prevGuestId && prevGuestId !== found.uid) {
          await dataService.migrateGuestData(prevGuestId, found.uid);
        }
        setUser(profile);
        return;
      }

      throw new Error('Invalid email or password.');
    }

    // Firebase Online Mode
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, pass);
    } catch (err: any) {
      // If default superadmin credential was attempted but not registered in Firebase, allow offline admin login fallback
      if (
        trimmedEmail === DEFAULT_SUPERADMIN_CREDENTIALS.email.toLowerCase() &&
        pass === DEFAULT_SUPERADMIN_CREDENTIALS.password
      ) {
        const superadminUser: UserProfile = {
          uid: 'local-superadmin',
          email: trimmedEmail,
          displayName: 'Superadmin',
          photoURL: null,
          isAnonymous: false,
          role: 'superadmin',
        };
        localStorage.setItem('superapps_local_user', JSON.stringify(superadminUser));
        localStorage.removeItem('superapps_local_guest');
        if (prevGuestId && prevGuestId !== 'local-superadmin') {
          await dataService.migrateGuestData(prevGuestId, 'local-superadmin');
        }
        setUser(superadminUser);
        return;
      }
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    // Check system settings: allowUserRegistration
    if (!systemSettings.allowUserRegistration) {
      throw new Error('Registration is closed by administrator.');
    }

    const trimmedEmail = email.trim().toLowerCase();
    const prevGuestId = (user && (user.isAnonymous || user.uid.startsWith('guest-'))) ? user.uid : null;

    if (!isFirebaseConfigured || !auth) {
      // Offline local registration
      const rawStored = localStorage.getItem('superapps_local_registered_users');
      const registeredList: any[] = rawStored ? JSON.parse(rawStored) : [];

      if (
        registeredList.some((u) => u.email.toLowerCase() === trimmedEmail) ||
        trimmedEmail === DEFAULT_SUPERADMIN_CREDENTIALS.email.toLowerCase()
      ) {
        throw new Error('This email is already registered.');
      }

      // Check if this is the first non-guest user
      const isFirstUser =
        registeredList.length === 0 &&
        localStorage.getItem('superapps_admin_claimed') !== 'true' &&
        systemSettings.superadminEmail.toLowerCase() === DEFAULT_SYSTEM_SETTINGS.superadminEmail.toLowerCase();
      const role: 'superadmin' | 'user' = isFirstUser ? 'superadmin' : 'user';

      if (isFirstUser) {
        await updateSystemSettings({ superadminEmail: trimmedEmail });
        localStorage.setItem('superapps_admin_claimed', 'true');
      }

      const newUserRecord = {
        uid: 'user-' + Math.random().toString(36).substring(2, 9),
        email: trimmedEmail,
        displayName: trimmedEmail.split('@')[0],
        password: pass,
        role,
      };

      registeredList.push(newUserRecord);
      localStorage.setItem('superapps_local_registered_users', JSON.stringify(registeredList));

      const profile: UserProfile = {
        uid: newUserRecord.uid,
        email: newUserRecord.email,
        displayName: newUserRecord.displayName,
        photoURL: null,
        isAnonymous: false,
        role,
      };

      localStorage.setItem('superapps_local_user', JSON.stringify(profile));
      localStorage.removeItem('superapps_local_guest');
      if (prevGuestId && prevGuestId !== newUserRecord.uid) {
        await dataService.migrateGuestData(prevGuestId, newUserRecord.uid);
      }
      setUser(profile);
      return;
    }

    // Firebase Online Registration
    const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
    if (prevGuestId && prevGuestId !== cred.user.uid) {
      await dataService.migrateGuestData(prevGuestId, cred.user.uid);
    }
  };

  const linkWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase configuration not set. Please add Firebase credentials to your .env or GitHub Secrets to enable Google account linking.');
    }
    const provider = new GoogleAuthProvider();
    const guestIds = gatherGuestIds(user?.uid);
    let targetUid: string | null = null;
    let targetProfile: UserProfile | null = null;

    if (auth.currentUser && auth.currentUser.isAnonymous) {
      // In-place linking for Firebase anonymous sessions
      try {
        const result = await linkWithPopup(auth.currentUser, provider);
        targetUid = result.user.uid;
        targetProfile = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || 'Google User',
          photoURL: result.user.photoURL,
          isAnonymous: false,
          role: 'user',
        };
      } catch (err: any) {
        // Handle auth/credential-already-in-use: catch, sign in with existing credential, and migrate guest items
        if (err?.code === 'auth/credential-already-in-use' || err?.code === 'auth/email-already-in-use') {
          const result = await signInWithPopup(auth, provider);
          targetUid = result.user.uid;
          targetProfile = {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName || 'Google User',
            photoURL: result.user.photoURL,
            isAnonymous: false,
            role: 'user',
          };
        } else {
          throw err;
        }
      }
    } else {
      // Fallback/offline guest sessions (when auth.currentUser is not anonymous or not configured):
      // Authenticate/sign-in and capture new UID
      const result = await signInWithPopup(auth, provider);
      targetUid = result.user.uid;
      targetProfile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || 'Google User',
        photoURL: result.user.photoURL,
        isAnonymous: false,
        role: 'user',
      };
    }

    if (targetUid) {
      const settings = await dataService.getSystemSettings();
      if (
        targetProfile &&
        targetProfile.email &&
        (targetProfile.email.toLowerCase() === settings.superadminEmail.toLowerCase() ||
         targetProfile.email.toLowerCase() === DEFAULT_SUPERADMIN_CREDENTIALS.email.toLowerCase())
      ) {
        targetProfile.role = 'superadmin';
      }

      // Automatically execute data migration for all gathered guest IDs
      const sourceIds = guestIds.filter((id) => id !== targetUid);
      if (sourceIds.length > 0) {
        await dataService.migrateGuestData(sourceIds, targetUid);
      }

      if (targetProfile) {
        setUser(targetProfile);
        localStorage.removeItem('superapps_local_guest');
      }
    }
  };

  const linkWithEmail = async (email: string, pass: string) => {
    if (!email || !pass) {
      throw new Error('Please provide both email and password to link your account.');
    }
    const trimmedEmail = email.trim().toLowerCase();
    const guestIds = gatherGuestIds(user?.uid);

    // In-place linking for Firebase anonymous sessions:
    // linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email, password))
    if (isFirebaseConfigured && auth && auth.currentUser && auth.currentUser.isAnonymous) {
      const credential = EmailAuthProvider.credential(trimmedEmail, pass);
      let targetUid: string | null = null;
      let targetProfile: UserProfile | null = null;

      try {
        const result = await linkWithCredential(auth.currentUser, credential);
        targetUid = result.user.uid;
        targetProfile = {
          uid: result.user.uid,
          email: result.user.email || trimmedEmail,
          displayName: result.user.displayName || trimmedEmail.split('@')[0],
          photoURL: result.user.photoURL,
          isAnonymous: false,
          role: 'user',
        };
      } catch (err: any) {
        // Handle auth/credential-already-in-use: catch, sign in with existing credential, and migrate guest items to that account
        if (err?.code === 'auth/credential-already-in-use' || err?.code === 'auth/email-already-in-use') {
          const result = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
          targetUid = result.user.uid;
          targetProfile = {
            uid: result.user.uid,
            email: result.user.email || trimmedEmail,
            displayName: result.user.displayName || trimmedEmail.split('@')[0],
            photoURL: result.user.photoURL,
            isAnonymous: false,
            role: 'user',
          };
        } else {
          throw err;
        }
      }

      if (targetUid) {
        const settings = await dataService.getSystemSettings();
        if (
          targetProfile &&
          (targetProfile.email?.toLowerCase() === settings.superadminEmail.toLowerCase() ||
           targetProfile.email?.toLowerCase() === DEFAULT_SUPERADMIN_CREDENTIALS.email.toLowerCase())
        ) {
          targetProfile.role = 'superadmin';
        }

        const sourceIds = guestIds.filter((id) => id !== targetUid);
        if (sourceIds.length > 0) {
          await dataService.migrateGuestData(sourceIds, targetUid);
        }

        if (targetProfile) {
          setUser(targetProfile);
          localStorage.removeItem('superapps_local_guest');
        }
      }
      return;
    }

    // Handle fallback/offline guest sessions when Firebase is configured (e.g. offline visitor promoted to cloud)
    if (isFirebaseConfigured && auth) {
      let targetUid: string | null = null;
      let targetProfile: UserProfile | null = null;

      try {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
        targetUid = cred.user.uid;
        targetProfile = {
          uid: cred.user.uid,
          email: cred.user.email || trimmedEmail,
          displayName: cred.user.displayName || trimmedEmail.split('@')[0],
          photoURL: cred.user.photoURL,
          isAnonymous: false,
          role: 'user',
        };
      } catch (err: any) {
        if (err?.code === 'auth/email-already-in-use' || err?.code === 'auth/credential-already-in-use') {
          const cred = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
          targetUid = cred.user.uid;
          targetProfile = {
            uid: cred.user.uid,
            email: cred.user.email || trimmedEmail,
            displayName: cred.user.displayName || trimmedEmail.split('@')[0],
            photoURL: cred.user.photoURL,
            isAnonymous: false,
            role: 'user',
          };
        } else {
          throw err;
        }
      }

      if (targetUid) {
        const settings = await dataService.getSystemSettings();
        if (
          targetProfile &&
          (targetProfile.email?.toLowerCase() === settings.superadminEmail.toLowerCase() ||
           targetProfile.email?.toLowerCase() === DEFAULT_SUPERADMIN_CREDENTIALS.email.toLowerCase())
        ) {
          targetProfile.role = 'superadmin';
        }

        const sourceIds = guestIds.filter((id) => id !== targetUid);
        if (sourceIds.length > 0) {
          await dataService.migrateGuestData(sourceIds, targetUid);
        }

        if (targetProfile) {
          setUser(targetProfile);
          localStorage.removeItem('superapps_local_guest');
        }
      }
      return;
    }

    // Offline / unconfigured mode
    try {
      await signUpWithEmail(trimmedEmail, pass);
    } catch (err: any) {
      if (err?.message === 'This email is already registered.') {
        await signInWithEmail(trimmedEmail, pass);
      } else {
        throw err;
      }
    }

    // Automatically execute data migration for all gathered guest IDs
    const currentStoredUser = localStorage.getItem('superapps_local_user');
    if (currentStoredUser) {
      try {
        const parsed = JSON.parse(currentStoredUser);
        if (parsed?.uid) {
          const sourceIds = guestIds.filter((id) => id !== parsed.uid);
          if (sourceIds.length > 0) {
            await dataService.migrateGuestData(sourceIds, parsed.uid);
          }
          setUser(parsed);
          localStorage.removeItem('superapps_local_guest');
        }
      } catch {
        // ignore
      }
    }
  };

  const continueAsGuest = async () => {
    // Check system settings: allowGuestAccess
    if (!systemSettings.allowGuestAccess) {
      throw new Error('Guest access is disabled by administrator.');
    }

    if (isFirebaseConfigured && auth) {
      try {
        await signInAnonymously(auth);
        return;
      } catch (err) {
        console.warn('Anonymous sign-in failed, falling back to local guest:', err);
      }
    }
    // Local offline guest fallback
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
