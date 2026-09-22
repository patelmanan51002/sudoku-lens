import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

/**
 * Loads all puzzles belonging to a specific user
 */
export async function fetchUserPuzzles(userId) {
  if (!userId) return [];

  // If real Firestore is connected
  if (db) {
    try {
      const colRef = collection(db, 'users', userId, 'puzzles');
      const snap = await getDocs(colRef);
      const puzzles = [];
      snap.forEach((d) => {
        puzzles.push(d.data());
      });
      if (puzzles.length > 0) return puzzles;
    } catch (err) {
      console.warn('Firestore fetch failed, falling back to local user store:', err);
    }
  }

  // User-isolated local storage key
  try {
    const key = `sudoku_app_user_puzzles_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }

  return [];
}

/**
 * Saves or updates a puzzle for a specific user
 */
export async function syncUserPuzzle(userId, puzzle) {
  if (!userId || !puzzle || !puzzle.id) return;

  // 1. Sync to Firestore if online & configured
  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'puzzles', puzzle.id);
      await setDoc(docRef, puzzle, { merge: true });
    } catch (err) {
      console.warn('Firestore sync failed, keeping local copy:', err);
    }
  }

  // 2. Persist in user-isolated local storage for offline resilience
  try {
    const key = `sudoku_app_user_puzzles_${userId}`;
    const current = await fetchUserPuzzles(userId);
    const idx = current.findIndex((p) => p.id === puzzle.id);
    if (idx >= 0) {
      current[idx] = puzzle;
    } else {
      current.unshift(puzzle);
    }
    localStorage.setItem(key, JSON.stringify(current));
  } catch (e) {
    console.error('Error saving local user puzzle:', e);
  }
}

/**
 * Deletes a puzzle for a specific user
 */
export async function removeUserPuzzle(userId, puzzleId) {
  if (!userId || !puzzleId) return;

  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'puzzles', puzzleId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore delete failed:', err);
    }
  }

  try {
    const key = `sudoku_app_user_puzzles_${userId}`;
    const current = await fetchUserPuzzles(userId);
    const updated = current.filter((p) => p.id !== puzzleId);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

/**
 * Subscribes to real-time updates for a user's puzzles
 */
export function subscribeToUserPuzzles(userId, callback) {
  if (!userId) return () => {};

  if (db) {
    try {
      const colRef = collection(db, 'users', userId, 'puzzles');
      return onSnapshot(colRef, (snapshot) => {
        const list = [];
        snapshot.forEach((d) => list.push(d.data()));
        if (list.length > 0) {
          callback(list);
        }
      });
    } catch (err) {
      console.warn('Real-time listener setup failed:', err);
    }
  }

  return () => {};
}
