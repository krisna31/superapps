import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Check if valid Firebase configuration is present
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'AIzaSyExampleKeyPlaceholder' &&
  firebaseConfig.projectId
);

let app = undefined as ReturnType<typeof initializeApp> | undefined;
let auth = undefined as ReturnType<typeof getAuth> | undefined;
let db = undefined as ReturnType<typeof initializeFirestore> | undefined;
let storage = undefined as ReturnType<typeof getStorage> | undefined;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    // Initialize Firestore with persistent multi-tab offline cache
    db = initializeFirestore(app, {
      // Pages send optional fields (description, dueDate, title...) as `undefined`.
      // Without this flag Firestore rejects the WHOLE write with
      // "Unsupported field value: undefined" (finding C2).
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
    storage = getStorage(app);
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
  }
}

export { app, auth, db, storage };
