import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

const STORAGE_KEY_FIREBASE_CONFIG = 'sudoku_app_firebase_config_v1';
const STORAGE_KEY_LOCAL_USERS = 'sudoku_app_local_users_v1';
const STORAGE_KEY_LOCAL_SESSION = 'sudoku_app_local_session_v1';

/**
 * Returns saved or environment Firebase configuration
 */
export function getFirebaseConfig() {
  try {
    const custom = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (custom) return JSON.parse(custom);
  } catch (e) {
    // ignore
  }

  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (envApiKey && envApiKey !== 'your_api_key_here') {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
  }

  return null;
}

export function saveFirebaseConfig(config) {
  if (!config) {
    localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
  } else {
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
  }
}

// Check if Firebase is configured with real keys
const config = getFirebaseConfig();
export const isFirebaseConfigured = Boolean(config && config.apiKey && config.projectId);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase init error, using local auth engine:', err);
  }
}

export { auth, db };

// -------------------------------------------------------------
// Unified Authentication Adapter (Firebase or Local Engine)
// -------------------------------------------------------------

function getLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_LOCAL_USERS) || '{}');
  } catch (e) {
    return {};
  }
}

function saveLocalUsers(users) {
  localStorage.setItem(STORAGE_KEY_LOCAL_USERS, JSON.stringify(users));
}

function getLocalSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_LOCAL_SESSION) || 'null');
  } catch (e) {
    return null;
  }
}

function saveLocalSession(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY_LOCAL_SESSION);
  } else {
    localStorage.setItem(STORAGE_KEY_LOCAL_SESSION, JSON.stringify(user));
  }
}

/**
 * Sign up a new user with email and password
 */
export async function appSignUp(email, password, displayName = '') {
  if (auth) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: displayName || email.split('@')[0]
    };
  }

  // Local engine fallback
  const cleanEmail = email.trim().toLowerCase();
  const users = getLocalUsers();
  if (users[cleanEmail]) {
    throw new Error('An account with this email/ID already exists.');
  }

  const userObj = {
    uid: 'user-' + Date.now(),
    email: cleanEmail,
    displayName: displayName || cleanEmail.split('@')[0],
    passwordHash: btoa(password), // basic local obfuscation
    createdAt: new Date().toISOString()
  };

  users[cleanEmail] = userObj;
  saveLocalUsers(users);

  const sessionUser = { uid: userObj.uid, email: userObj.email, displayName: userObj.displayName };
  saveLocalSession(sessionUser);
  return sessionUser;
}

/**
 * Sign in existing user with email and password
 */
export async function appSignIn(email, password) {
  if (auth) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName || email.split('@')[0]
    };
  }

  // Local engine fallback
  const cleanEmail = email.trim().toLowerCase();
  const users = getLocalUsers();
  const user = users[cleanEmail];
  if (!user || user.passwordHash !== btoa(password)) {
    throw new Error('Invalid email/ID or password.');
  }

  const sessionUser = { uid: user.uid, email: user.email, displayName: user.displayName };
  saveLocalSession(sessionUser);
  return sessionUser;
}

/**
 * Sign out current user
 */
export async function appSignOut() {
  if (auth) {
    await signOut(auth);
  }
  saveLocalSession(null);
}

/**
 * Reset password
 */
export async function appResetPassword(email) {
  if (auth) {
    await sendPasswordResetEmail(auth, email);
    return 'Password reset link sent to your email!';
  }
  return 'Password reset requested. (In offline mode, create a new ID or update password).';
}

/**
 * Subscribe to auth state changes
 */
export function onAppAuthStateChanged(callback) {
  if (auth) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0]
        });
      } else {
        callback(null);
      }
    });
  }

  // Local engine session check
  const localUser = getLocalSession();
  callback(localUser);
  return () => {};
}
