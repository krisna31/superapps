import { vi } from 'vitest';

export interface FakeUserOptions {
  uid?: string;
  email?: string | null;
  displayName?: string | null;
  isAnonymous?: boolean;
  emailVerified?: boolean;
}

export function createFakeFirebaseUser(opts: FakeUserOptions = {}) {
  return {
    uid: opts.uid || 'fake-user-' + Math.random().toString(36).substring(2, 8),
    email: opts.email ?? null,
    displayName: opts.displayName || (opts.email ? opts.email.split('@')[0] : 'Guest User'),
    photoURL: null,
    isAnonymous: Boolean(opts.isAnonymous),
    emailVerified: opts.emailVerified ?? true,
  };
}

export function createFakeAuth() {
  let currentUser: any = null;
  const listeners: Array<(user: any) => void> = [];

  const triggerAuthChange = () => {
    listeners.forEach((l) => {
      try {
        l(currentUser);
      } catch {
        // ignore
      }
    });
  };

  return {
    get currentUser() {
      return currentUser;
    },
    setCurrentUser(user: any) {
      currentUser = user;
      triggerAuthChange();
    },
    triggerAuthChange,
    signInAnonymously: vi.fn(async () => {
      currentUser = createFakeFirebaseUser({ isAnonymous: true });
      triggerAuthChange();
      return { user: currentUser };
    }),
    signInWithEmailAndPassword: vi.fn(async (_auth: unknown, email: string) => {
      currentUser = createFakeFirebaseUser({ email, isAnonymous: false, emailVerified: true });
      triggerAuthChange();
      return { user: currentUser };
    }),
    createUserWithEmailAndPassword: vi.fn(async (_auth: unknown, email: string) => {
      currentUser = createFakeFirebaseUser({ email, isAnonymous: false, emailVerified: true });
      triggerAuthChange();
      return { user: currentUser };
    }),
    signInWithPopup: vi.fn(async () => {
      currentUser = createFakeFirebaseUser({
        email: 'google-user@k31.my.id',
        displayName: 'Google User',
        isAnonymous: false,
      });
      triggerAuthChange();
      return { user: currentUser };
    }),
    linkWithCredential: vi.fn(async (_user: unknown, credential: { email?: string }) => {
      currentUser = createFakeFirebaseUser({
        uid: currentUser?.uid || 'linked-uid',
        email: credential?.email || 'linked@k31.my.id',
        isAnonymous: false,
      });
      triggerAuthChange();
      return { user: currentUser };
    }),
    linkWithPopup: vi.fn(async () => {
      currentUser = createFakeFirebaseUser({
        uid: currentUser?.uid || 'linked-uid',
        email: 'google-linked@k31.my.id',
        displayName: 'Google User',
        isAnonymous: false,
      });
      triggerAuthChange();
      return { user: currentUser };
    }),
    signOut: vi.fn(async () => {
      currentUser = null;
      triggerAuthChange();
    }),
    onAuthStateChanged: vi.fn((_auth: unknown, cb: (user: any) => void) => {
      listeners.push(cb);
      // Synchronously notify with initial user state
      cb(currentUser);
      return () => {
        const idx = listeners.indexOf(cb);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    }),
  };
}
