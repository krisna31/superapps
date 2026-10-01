import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
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
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();

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
      setUser(profile);
      return;
    }

    // Firebase Online Registration
    await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
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
