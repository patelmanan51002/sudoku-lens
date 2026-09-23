import { getSudoku } from 'sudoku-gen';
import { getSystemDateTimeISO } from '../utils/dateUtils';

/**
 * Converts an 81-character puzzle string to a 9x9 grid
 * '-' or '0' represents empty cells (0)
 */
export function stringToGrid(str) {
  const grid = [];
  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) {
      const char = str[r * 9 + c];
      row.push(char === '-' || char === '0' || char === '.' ? 0 : parseInt(char, 10));
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Counts the number of clues (given numbers) in a 9x9 grid
 */
export function countClues(grid) {
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== 0) count++;
    }
  }
  return count;
}

/**
 * Capitalizes difficulty level
 */
export function formatDifficulty(diff) {
  if (!diff) return 'Medium';
  return diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
}

/**
 * Fetches a random Sudoku from Dosuku API with a strict timeout
 */
async function fetchFromDosukuApi(difficulty = 'medium', timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const query = difficulty ? `?query={newboard(limit:1){grids{value,solution,difficulty}}}` : '';
    const res = await fetch(`https://sudoku-api.vercel.app/api/dosuku${query}`, {
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const gridObj = json?.newboard?.grids?.[0];
    if (gridObj && Array.isArray(gridObj.value)) {
      return {
        givenGrid: gridObj.value,
        solutionGrid: gridObj.solution || null,
        difficulty: (gridObj.difficulty || difficulty).toLowerCase(),
        source: 'Dosuku API'
      };
    }
  } catch (err) {
    // Timeout or network error - gracefully fall back
  } finally {
    clearTimeout(timer);
  }
  return null;
}

/**
 * Generates a random Sudoku puzzle using sudoku-gen (instant & offline)
 */
function generateLocalSudoku(difficulty = 'medium') {
  const validDiffs = ['easy', 'medium', 'hard', 'expert'];
  const normalized = validDiffs.includes(difficulty.toLowerCase())
    ? difficulty.toLowerCase()
    : 'medium';

  const raw = getSudoku(normalized);
  return {
    givenGrid: stringToGrid(raw.puzzle),
    solutionGrid: stringToGrid(raw.solution),
    difficulty: normalized,
    source: 'Sudoku-Gen Engine'
  };
}

/**
 * Generates a full puzzle object ready to be played, saved, and synced
 * @param {'easy' | 'medium' | 'hard' | 'expert'} difficulty
 * @param {boolean} tryApi Whether to attempt online API before local generator
 */
export async function createRandomPuzzle(difficulty = 'medium', tryApi = true) {
  let result = null;

  if (tryApi && typeof navigator !== 'undefined' && navigator.onLine) {
    result = await fetchFromDosukuApi(difficulty);
  }

  if (!result) {
    result = generateLocalSudoku(difficulty);
  }

  const now = getSystemDateTimeISO();
  const puzzleNum = Math.floor(1000 + Math.random() * 9000);
  const diffLabel = formatDifficulty(result.difficulty);

  const newId = `sudoku-${result.difficulty}-${Date.now()}`;
  const given = result.givenGrid.map((row) => [...row]);
  const current = result.givenGrid.map((row) => [...row]);

  return {
    id: newId,
    title: `${diffLabel} Sudoku #${puzzleNum}`,
    difficulty: result.difficulty,
    imageDate: now,
    createdAt: now,
    updatedAt: now,
    thumbnailUrl: null,
    givenGrid: given,
    currentGrid: current,
    solutionGrid: result.solutionGrid || null,
    notes: {},
    history: [],
    redoStack: [],
    status: 'Untouched',
    elapsedTime: 0,
    completionTime: null,
    hasCheckerboard: true,
    engineSource: result.source
  };
}
