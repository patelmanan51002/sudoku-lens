import { SAMPLE_PUZZLE_GIVEN } from './sudokuSolver';
import { getSystemDateTimeISO } from './dateUtils';
import sampleImageSrc from '../assets/sample_puzzle.png';

const STORAGE_KEY_PUZZLES = 'sudoku_app_puzzles_v2';
const STORAGE_KEY_ACTIVE = 'sudoku_app_active_id_v2';
const STORAGE_KEY_SETTINGS = 'sudoku_app_settings_v2';

export const SAMPLE_PUZZLE_ID = 'sample-puzzle-1';

/**
 * Creates default sample puzzle initialized with the uploaded image
 */
export function createSamplePuzzle() {
  const given = SAMPLE_PUZZLE_GIVEN.map(row => [...row]);
  const current = SAMPLE_PUZZLE_GIVEN.map(row => [...row]);
  const now = getSystemDateTimeISO();

  return {
    id: SAMPLE_PUZZLE_ID,
    title: 'Daily Newspaper Sudoku',
    imageDate: now,
    createdAt: now,
    updatedAt: now,
    thumbnailUrl: sampleImageSrc,
    givenGrid: given,
    currentGrid: current,
    notes: {},
    history: [],
    redoStack: [],
    status: 'Untouched',
    elapsedTime: 0,
    completionTime: null,
    hasCheckerboard: true
  };
}

/**
 * Calculates current status based on user input and completion
 */
export function determineStatus(givenGrid, currentGrid, isFinished = false) {
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

  return userEntriesCount > 0 ? 'In Progress' : 'Untouched';
}

/**
 * Loads all puzzles from localStorage
 */
export function getSavedPuzzles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PUZZLES);
    if (!raw) {
      const initial = [createSamplePuzzle()];
      localStorage.setItem(STORAGE_KEY_PUZZLES, JSON.stringify(initial));
      return initial;
    }
    const puzzles = JSON.parse(raw);
    if (!Array.isArray(puzzles) || puzzles.length === 0) {
      const initial = [createSamplePuzzle()];
      localStorage.setItem(STORAGE_KEY_PUZZLES, JSON.stringify(initial));
      return initial;
    }
    return puzzles;
  } catch (err) {
    console.error('Failed to load puzzles from storage:', err);
    return [createSamplePuzzle()];
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
    const updated = {
      ...puzzle,
      updatedAt: getSystemDateTimeISO(),
      status: determineStatus(puzzle.givenGrid, puzzle.currentGrid, puzzle.status === 'Finished')
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

/**
 * Deletes a puzzle by id
 */
export function deletePuzzle(id) {
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
  return localStorage.getItem(STORAGE_KEY_ACTIVE) || SAMPLE_PUZZLE_ID;
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
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return {
    autoHighlight: true, // Auto-highlighting toggle (Pen & Paper mode when false)
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

