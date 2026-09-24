import { getSystemDateTimeISO } from './dateUtils';
import { createInitialEasyPuzzle } from '../services/sudokuGenerator';

const STORAGE_KEY_PUZZLES = 'sudoku_app_puzzles_v2';
const STORAGE_KEY_ACTIVE = 'sudoku_app_active_id_v2';
const STORAGE_KEY_SETTINGS = 'sudoku_app_settings_v2';

export const SAMPLE_PUZZLE_ID = 'sample-puzzle-1';

/**
 * Creates default initial easy puzzle for first-time users
 */
export function createSamplePuzzle() {
  return createInitialEasyPuzzle();
}

/**
 * Calculates current status based on user input and completion
 */
export function determineStatus(givenGrid, currentGrid, isFinished = false, elapsedTime = 0, notes = {}) {
  if (isFinished) return 'Finished';
  if (!givenGrid || !currentGrid) return 'Untouched';

  let userEntriesCount = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (givenGrid[r][c] === 0 && currentGrid[r][c] !== 0) {
        userEntriesCount++;
      }
    }
  }

  const hasNotes = notes && typeof notes === 'object' && Object.values(notes).some(arr => Array.isArray(arr) && arr.length > 0);
  if (userEntriesCount > 0 || (elapsedTime && elapsedTime > 0) || hasNotes) {
    return 'In Progress';
  }

  return 'Untouched';
}

/**
 * Loads all puzzles from localStorage.
 * If empty or only contains legacy sample puzzle, initializes with a fresh Easy Sudoku.
 */
export function getSavedPuzzles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PUZZLES);
    if (!raw) {
      const initial = [createInitialEasyPuzzle()];
      localStorage.setItem(STORAGE_KEY_PUZZLES, JSON.stringify(initial));
      return initial;
    }
    let puzzles = JSON.parse(raw);
    // Remove the legacy Daily Newspaper Sudoku sample if present
    if (Array.isArray(puzzles)) {
      puzzles = puzzles.filter(
        (p) => p.id !== SAMPLE_PUZZLE_ID && p.title !== 'Daily Newspaper Sudoku'
      );
    }
    if (!Array.isArray(puzzles) || puzzles.length === 0) {
      const initial = [createInitialEasyPuzzle()];
      localStorage.setItem(STORAGE_KEY_PUZZLES, JSON.stringify(initial));
      return initial;
    }
    localStorage.setItem(STORAGE_KEY_PUZZLES, JSON.stringify(puzzles));
    return puzzles;
  } catch (err) {
    console.error('Failed to load puzzles from storage:', err);
    return [createInitialEasyPuzzle()];
  }
}

/**
 * Saves or updates a single puzzle in localStorage
 */
export function savePuzzle(puzzle) {
  if (!puzzle || !puzzle.id) return;
  try {
    const puzzles = getSavedPuzzles();
    const index = puzzles.findIndex(p => p.id === puzzle.id);
    const computedStatus = puzzle.status === 'Finished'
      ? 'Finished'
      : determineStatus(puzzle.givenGrid, puzzle.currentGrid, false, puzzle.elapsedTime, puzzle.notes);

    const updated = {
      ...puzzle,
      updatedAt: getSystemDateTimeISO(),
      status: computedStatus
    };

    if (index >= 0) {
      puzzles[index] = updated;
    } else {
      puzzles.unshift(updated);
    }

    localStorage.setItem(STORAGE_KEY_PUZZLES, JSON.stringify(puzzles));
    return updated;
  } catch (err) {
    console.error('Failed to save puzzle:', err);
  }
}

const STORAGE_KEY_DELETED = 'sudoku_app_deleted_ids';

/**
 * Retrieves set of deleted puzzle IDs to prevent resurrection during sync
 */
export function getDeletedPuzzleIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
}

/**
 * Records a deleted puzzle ID tombstone
 */
export function addDeletedPuzzleId(id) {
  if (!id) return;
  try {
    const set = getDeletedPuzzleIds();
    set.add(id);
    localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(Array.from(set)));
  } catch (e) {}
}

/**
 * Deletes a puzzle by id and records tombstone
 */
export function deletePuzzle(id) {
  if (!id) return [];
  addDeletedPuzzleId(id);
  try {
    const puzzles = getSavedPuzzles().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY_PUZZLES, JSON.stringify(puzzles));
    return puzzles;
  } catch (err) {
    console.error('Failed to delete puzzle:', err);
    return [];
  }
}

/**
 * Updates a puzzle's assigned datetime
 */
export function updatePuzzleDateTime(id, newDateTimeISO) {
  try {
    const puzzles = getSavedPuzzles();
    const p = puzzles.find(item => item.id === id);
    if (p) {
      p.imageDate = newDateTimeISO;
      p.updatedAt = getSystemDateTimeISO();
      localStorage.setItem(STORAGE_KEY_PUZZLES, JSON.stringify(puzzles));
      return p;
    }
  } catch (err) {
    console.error('Failed to update puzzle date:', err);
  }
  return null;
}

/**
 * Active puzzle ID storage
 */
export function getActivePuzzleId() {
  const active = localStorage.getItem(STORAGE_KEY_ACTIVE);
  if (active && active !== SAMPLE_PUZZLE_ID) {
    return active;
  }
  const puzzles = getSavedPuzzles();
  const firstId = puzzles[0]?.id || '';
  if (firstId) {
    localStorage.setItem(STORAGE_KEY_ACTIVE, firstId);
  }
  return firstId;
}

export function setActivePuzzleId(id) {
  localStorage.setItem(STORAGE_KEY_ACTIVE, id);
}

/**
 * Global User Settings (e.g. autoHighlighting toggle)
 */
export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        autoHighlight: parsed.autoHighlight ?? true,
        useNativeKeyboard: parsed.useNativeKeyboard ?? false,
        highlightMatching: parsed.highlightMatching ?? true,
        highlightCrosshair: parsed.highlightCrosshair ?? true,
        soundEffects: parsed.soundEffects ?? true
      };
    }
  } catch (e) {
    // fallback
  }
  return {
    autoHighlight: true, // Auto-highlighting toggle (Pen & Paper mode when false)
    useNativeKeyboard: false, // Mobile input preference: false = web keypad, true = native Android/system keyboard
    highlightMatching: true,
    highlightCrosshair: true,
    soundEffects: true
  };
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

/**
 * Export all puzzles to downloadable JSON string
 */
export function exportPuzzlesJSON() {
  const puzzles = getSavedPuzzles();
  return JSON.stringify(puzzles, null, 2);
}

/**
 * Import puzzles from JSON string
 */
export function importPuzzlesJSON(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      localStorage.setItem(STORAGE_KEY_PUZZLES, JSON.stringify(parsed));
      return parsed;
    }
  } catch (err) {
    console.error('Failed to import puzzles:', err);
  }
  return null;
}

