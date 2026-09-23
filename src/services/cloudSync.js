import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { getDeletedPuzzleIds, addDeletedPuzzleId, deletePuzzle } from '../utils/storage';

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
  if (Array.isArray(clone.solutionGrid)) {
    clone.solutionGrid = JSON.stringify(clone.solutionGrid);
  } else if (clone.solutionGrid === undefined) {
    clone.solutionGrid = null;
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

  // Ensure no undefined values exist anywhere
  const clean = {};
  for (const [key, value] of Object.entries(clone)) {
    clean[key] = value === undefined ? null : value;
  }

  return clean;
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
  if (typeof puzzle.solutionGrid === 'string') {
    try {
      puzzle.solutionGrid = JSON.parse(puzzle.solutionGrid);
    } catch (e) {
      puzzle.solutionGrid = null;
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

  puzzle.notes = puzzle.notes || {};
  puzzle.history = puzzle.history || [];
  puzzle.redoStack = puzzle.redoStack || [];
  puzzle.elapsedTime = puzzle.elapsedTime || 0;

  return puzzle;
}

/**
 * Merges local and cloud puzzle lists intelligently with tombstone (deletion) awareness:
 * - Deleted puzzles are never resurrected.
 * - If puzzle only exists in one active list, it is kept.
 * - If puzzle exists in both, keeps newer updatedAt or higher progress.
 * - Returns { merged, toSyncToCloud }
 */
export function mergePuzzles(localList = [], cloudList = [], deletedIds = getDeletedPuzzleIds()) {
  const map = new Map();
  const toSyncToCloud = [];

  // Seed with cloud puzzles (filtering out deleted ones)
  for (const cp of cloudList) {
    if (cp && cp.id && !deletedIds.has(cp.id)) {
      map.set(cp.id, cp);
    }
  }

  // Compare with local puzzles
  for (const lp of localList) {
    if (!lp || !lp.id || deletedIds.has(lp.id)) continue;
    const existing = map.get(lp.id);
    if (!existing) {
      // Local puzzle not in cloud -> retain and sync to cloud
      map.set(lp.id, lp);
      toSyncToCloud.push(lp);
    } else {
      // Both exist -> compare timestamp and progress
      const localTime = new Date(lp.updatedAt || lp.createdAt || 0).getTime();
      const cloudTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();

      const localProgress = (lp.history?.length || 0) + (lp.elapsedTime || 0);
      const cloudProgress = (existing.history?.length || 0) + (existing.elapsedTime || 0);

      if (localTime > cloudTime || (localTime === cloudTime && localProgress > cloudProgress)) {
        map.set(lp.id, lp);
        toSyncToCloud.push(lp);
      }
    }
  }

  const merged = Array.from(map.values()).sort((a, b) => {
    const da = new Date(a.imageDate || a.createdAt || 0).getTime();
    const db = new Date(b.imageDate || b.createdAt || 0).getTime();
    return db - da;
  });

  return { merged, toSyncToCloud };
}

/**
 * Loads all puzzles belonging to a specific user and syncs tombstones
 */
export async function fetchUserPuzzles(userId) {
  if (!userId) return [];

  // If real Firestore is connected
  if (db) {
    try {
      // 1. Fetch remote tombstones first to purge any deleted puzzles
      try {
        const tombstoneCol = collection(db, 'users', userId, 'tombstones');
        const tombstoneSnap = await getDocs(tombstoneCol);
        tombstoneSnap.forEach((d) => {
          addDeletedPuzzleId(d.id);
          deletePuzzle(d.id);
        });
      } catch (te) {
        console.warn('Tombstone fetch notice:', te);
      }

      // 2. Fetch active puzzles
      const colRef = collection(db, 'users', userId, 'puzzles');
      const snap = await getDocs(colRef);
      const puzzles = [];
      const deletedIds = getDeletedPuzzleIds();

      snap.forEach((d) => {
        const raw = d.data();
        if (raw && !deletedIds.has(d.id)) {
          puzzles.push(deserializeFromFirestore(raw));
        }
      });

      // Cache to local user-isolated store
      try {
        const key = `sudoku_app_user_puzzles_${userId}`;
        localStorage.setItem(key, JSON.stringify(puzzles));
      } catch (e) {}
      return puzzles;
    } catch (err) {
      console.error('Firestore fetch failed:', err);
    }
  }

  // User-isolated local storage key fallback
  try {
    const key = `sudoku_app_user_puzzles_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const deletedIds = getDeletedPuzzleIds();
      return JSON.parse(raw).filter((p) => !deletedIds.has(p.id));
    }
  } catch (e) {
    // ignore
  }

  return [];
}

/**
 * Saves or updates a puzzle for a specific user in Firestore and local user store
 */
export async function syncUserPuzzle(userId, puzzle) {
  if (!userId || !puzzle || !puzzle.id) return;
  const deletedIds = getDeletedPuzzleIds();
  if (deletedIds.has(puzzle.id)) return; // Don't sync deleted puzzles

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
 * Deletes a puzzle for a specific user and records tombstones across devices
 */
export async function removeUserPuzzle(userId, puzzleId) {
  if (!userId || !puzzleId) return;

  // Record tombstone locally immediately
  addDeletedPuzzleId(puzzleId);
  deletePuzzle(puzzleId);

  if (db) {
    try {
      // 1. Delete document from puzzles collection
      const docRef = doc(db, 'users', userId, 'puzzles', puzzleId);
      await deleteDoc(docRef);

      // 2. Write tombstone to Firestore so all connected devices immediately catch deletion
      const tombstoneRef = doc(db, 'users', userId, 'tombstones', puzzleId);
      await setDoc(tombstoneRef, {
        id: puzzleId,
        deletedAt: new Date().toISOString()
      });
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
          const deletedIds = getDeletedPuzzleIds();
          snapshot.forEach((d) => {
            const raw = d.data();
            if (raw && !deletedIds.has(d.id)) {
              list.push(deserializeFromFirestore(raw));
            }
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

/**
 * Subscribes to remote deletions across devices in real time
 */
export function subscribeToUserTombstones(userId, onDeleted) {
  if (!userId || !db) return () => {};

  try {
    const colRef = collection(db, 'users', userId, 'tombstones');
    return onSnapshot(
      colRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const deletedId = change.doc.id;
            addDeletedPuzzleId(deletedId);
            deletePuzzle(deletedId);
            if (onDeleted) onDeleted(deletedId);
          }
        });
      },
      (error) => {
        console.warn('Real-time tombstone subscription notice:', error);
      }
    );
  } catch (err) {
    return () => {};
  }
}
