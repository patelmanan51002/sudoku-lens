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

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sudoku-lens-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sudoku-lens-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sudoku-lens-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "414225244704",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:414225244704:web:57b13fde198249139c5245",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HHHN6ERN9V"
};

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
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sudoku-lens-app.firebaseapp.com",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sudoku-lens-app",
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sudoku-lens-app.firebasestorage.app",
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "414225244704",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:414225244704:web:57b13fde198249139c5245",
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HHHN6ERN9V"
    };
  }

  return DEFAULT_FIREBASE_CONFIG;
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

const localAuthListeners = new Set();

function notifyLocalAuth(user) {
  localAuthListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
}

function saveLocalSession(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY_LOCAL_SESSION);
  } else {
    localStorage.setItem(STORAGE_KEY_LOCAL_SESSION, JSON.stringify(user));
  }
  notifyLocalAuth(user);
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
 * Update user display name / profile
 */
export async function appUpdateProfile(displayName) {
  if (auth && auth.currentUser) {
    const { updateProfile } = await import('firebase/auth');
    await updateProfile(auth.currentUser, { displayName });
    return {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName
    };
  }

  const session = getLocalSession();
  if (!session) throw new Error('No user is currently signed in.');

  const users = getLocalUsers();
  const cleanEmail = session.email.toLowerCase();
  if (users[cleanEmail]) {
    users[cleanEmail].displayName = displayName;
    saveLocalUsers(users);
  }

  const updatedSession = { ...session, displayName };
  saveLocalSession(updatedSession);
  return updatedSession;
}

/**
 * Change account password
 */
export async function appChangePassword(currentPassword, newPassword) {
  if (auth && auth.currentUser) {
    const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth');
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
    return 'Password updated successfully.';
  }

  const session = getLocalSession();
  if (!session) throw new Error('No user is currently signed in.');

  const users = getLocalUsers();
  const cleanEmail = session.email.toLowerCase();
  const user = users[cleanEmail];
  if (!user || user.passwordHash !== btoa(currentPassword)) {
    throw new Error('Current password is incorrect.');
  }

  user.passwordHash = btoa(newPassword);
  saveLocalUsers(users);
  return 'Password updated successfully.';
}

/**
 * Delete entire user account and their cloud/local data
 */
export async function appDeleteAccount(password) {
  const session = getLocalSession();
  const userId = session?.uid;
  const userEmail = session?.email;

  if (auth && auth.currentUser) {
    const { EmailAuthProvider, reauthenticateWithCredential, deleteUser } = await import('firebase/auth');
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await deleteUser(auth.currentUser);
  } else {
    if (!session) throw new Error('No user is currently signed in.');
    const users = getLocalUsers();
    const cleanEmail = userEmail?.toLowerCase();
    const user = users[cleanEmail];
    if (!user || user.passwordHash !== btoa(password)) {
      throw new Error('Incorrect password. Account deletion cancelled.');
    }
    delete users[cleanEmail];
    saveLocalUsers(users);
  }

  // Purge isolated puzzles from device storage
  if (userId) {
    localStorage.removeItem(`sudoku_app_user_puzzles_${userId}`);
  }

  saveLocalSession(null);
  return true;
}

/**
 * Generates an encrypted/base64 sync payload to transfer account & puzzles to mobile
 */
export function generateAccountSyncPayload(currentUser, userPuzzles = []) {
  if (!currentUser) return null;
  const cleanEmail = currentUser.email?.toLowerCase();
  const users = getLocalUsers();
  const userRecord = users[cleanEmail] || {
    uid: currentUser.uid,
    email: cleanEmail,
    displayName: currentUser.displayName,
    passwordHash: '',
    createdAt: new Date().toISOString()
  };

  const payload = {
    v: 1,
    u: userRecord,
    p: userPuzzles,
    fb: getFirebaseConfig(),
    t: Date.now()
  };

  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

/**
 * Imports an account sync payload on mobile / another device
 */
export function importAccountSyncPayload(rawInput) {
  try {
    let clean = rawInput.trim();
    // If a full URL was pasted, extract the sync parameter
    if (clean.includes('sync=')) {
      const match = clean.match(/sync=([^&#]+)/);
      if (match && match[1]) {
        clean = decodeURIComponent(match[1]);
      }
    }

    const jsonStr = decodeURIComponent(atob(clean));
    const data = JSON.parse(jsonStr);

    const user = data.u || data.user;
    const puzzles = data.p || data.puzzles || [];

    if (!user || !user.email) {
      throw new Error('Invalid account data format.');
    }

    const cleanEmail = user.email.toLowerCase();

    // 1. Save user to this device's user store
    const users = getLocalUsers();
    users[cleanEmail] = user;
    saveLocalUsers(users);

    // 2. Set current session
    const session = {
      uid: user.uid,
      email: cleanEmail,
      displayName: user.displayName || cleanEmail.split('@')[0],
      createdAt: user.createdAt
    };
    saveLocalSession(session);

    // 3. If remote Firebase config was shared, apply it locally
    if (data.fb && data.fb.apiKey) {
      saveFirebaseConfig(data.fb);
    }

    // 4. Merge user puzzles smartly
    if (Array.isArray(puzzles) && puzzles.length > 0) {
      const key = `sudoku_app_user_puzzles_${user.uid}`;
      let existing = [];
      try {
        existing = JSON.parse(localStorage.getItem(key) || '[]');
      } catch (e) {
        existing = [];
      }

      const map = new Map();
      existing.forEach((p) => { if (p && p.id) map.set(p.id, p); });
      puzzles.forEach((p) => {
        if (!p || !p.id) return;
        if (!map.has(p.id)) {
          map.set(p.id, p);
        } else {
          // Keep the newer copy
          const existP = map.get(p.id);
          const existTime = new Date(existP.updatedAt || existP.createdAt || 0).getTime();
          const newTime = new Date(p.updatedAt || p.createdAt || 0).getTime();
          if (newTime >= existTime) {
            map.set(p.id, p);
          }
        }
      });

      localStorage.setItem(key, JSON.stringify(Array.from(map.values())));
    }

    return session;
  } catch (err) {
    throw new Error('Failed to import account: ' + err.message);
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAppAuthStateChanged(callback) {
  if (auth) {
    let initialFired = false;
    const fallbackTimer = setTimeout(() => {
      if (!initialFired) {
        initialFired = true;
        callback(getLocalSession());
      }
    }, 1500);

    try {
      const unsub = onAuthStateChanged(
        auth,
        (user) => {
          initialFired = true;
          clearTimeout(fallbackTimer);
          if (user) {
            callback({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0]
            });
          } else {
            callback(null);
          }
        },
        (error) => {
          console.warn('Firebase onAuthStateChanged error:', error);
          initialFired = true;
          clearTimeout(fallbackTimer);
          callback(getLocalSession());
        }
      );
      return () => {
        clearTimeout(fallbackTimer);
        if (typeof unsub === 'function') unsub();
      };
    } catch (e) {
      console.warn('Failed to attach Firebase auth listener:', e);
      clearTimeout(fallbackTimer);
    }
  }

  // Local engine session check with live listener subscription
  localAuthListeners.add(callback);
  callback(getLocalSession());
  return () => {
    localAuthListeners.delete(callback);
  };
}
