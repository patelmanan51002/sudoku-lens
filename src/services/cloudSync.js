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
 * Firestore does NOT support nested arrays (like number[][]).
 * Serialize 2D grids and complex nested history stacks into JSON strings,
 * and strip undefined values.
 */
function serializeForFirestore(puzzle) {
  if (!puzzle) return null;
  const clone = { ...puzzle };

  if (Array.isArray(clone.givenGrid)) {
    clone.givenGrid = JSON.stringify(clone.givenGrid);
  }
  if (Array.isArray(clone.currentGrid)) {
    clone.currentGrid = JSON.stringify(clone.currentGrid);
  }
  if (Array.isArray(clone.history)) {
    clone.history = JSON.stringify(clone.history);
  }
  if (Array.isArray(clone.redoStack)) {
    clone.redoStack = JSON.stringify(clone.redoStack);
  }
  if (clone.notes && typeof clone.notes === 'object') {
    clone.notes = JSON.stringify(clone.notes);
  }

  // Ensure no undefined values exist
  return JSON.parse(JSON.stringify(clone));
}

/**
 * Deserializes puzzle documents received from Firestore back into standard objects
 */
function deserializeFromFirestore(data) {
  if (!data) return null;
  const puzzle = { ...data };

  if (typeof puzzle.givenGrid === 'string') {
    try {
      puzzle.givenGrid = JSON.parse(puzzle.givenGrid);
    } catch (e) {
      console.warn('Failed to parse givenGrid JSON:', e);
    }
  }
  if (typeof puzzle.currentGrid === 'string') {
    try {
      puzzle.currentGrid = JSON.parse(puzzle.currentGrid);
    } catch (e) {
      console.warn('Failed to parse currentGrid JSON:', e);
    }
  }
  if (typeof puzzle.history === 'string') {
    try {
      puzzle.history = JSON.parse(puzzle.history);
    } catch (e) {
      puzzle.history = [];
    }
  }
  if (typeof puzzle.redoStack === 'string') {
    try {
      puzzle.redoStack = JSON.parse(puzzle.redoStack);
    } catch (e) {
      puzzle.redoStack = [];
    }
  }
  if (typeof puzzle.notes === 'string') {
    try {
      puzzle.notes = JSON.parse(puzzle.notes);
    } catch (e) {
      puzzle.notes = {};
    }
  }

  return puzzle;
}

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
        const raw = d.data();
        if (raw) {
          puzzles.push(deserializeFromFirestore(raw));
        }
      });
      if (puzzles.length > 0) {
        // Cache to local user-isolated store
        try {
          const key = `sudoku_app_user_puzzles_${userId}`;
          localStorage.setItem(key, JSON.stringify(puzzles));
        } catch (e) {}
        return puzzles;
      }
    } catch (err) {
      console.error('Firestore fetch failed:', err);
    }
  }

  // User-isolated local storage key fallback
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
      const payload = serializeForFirestore(puzzle);
      await setDoc(docRef, payload, { merge: true });
    } catch (err) {
      console.error('Firestore sync failed for puzzle ' + puzzle.id + ':', err);
    }
  }

  // 2. Persist in user-isolated local storage for offline resilience
  try {
    const key = `sudoku_app_user_puzzles_${userId}`;
    const raw = localStorage.getItem(key);
    const current = raw ? JSON.parse(raw) : [];
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
      console.error('Firestore delete failed:', err);
    }
  }

  try {
    const key = `sudoku_app_user_puzzles_${userId}`;
    const raw = localStorage.getItem(key);
    const current = raw ? JSON.parse(raw) : [];
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
      return onSnapshot(
        colRef,
        (snapshot) => {
          const list = [];
          snapshot.forEach((d) => {
            const raw = d.data();
            if (raw) list.push(deserializeFromFirestore(raw));
          });
          callback(list);
        },
        (error) => {
          console.error('Firestore real-time subscription error:', error);
        }
      );
    } catch (err) {
      console.error('Real-time listener setup failed:', err);
    }
  }

  return () => {};
}
