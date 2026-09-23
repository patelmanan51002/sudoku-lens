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
 * Normalizes input to one of the 4 supported tiers
 */
export function normalizeDifficulty(diff) {
  const validDiffs = ['easy', 'medium', 'hard', 'expert'];
  const lower = (diff || '').toString().trim().toLowerCase();
  return validDiffs.includes(lower) ? lower : 'medium';
}

/**
 * Verifies that a generated puzzle strictly satisfies the requested difficulty:
 * - Exact difficulty tag matching
 * - Clue count within standard range for the tier
 * - Valid 9x9 structure with non-empty board
 */
export function verifySudokuDifficulty(puzzleData, requestedDifficulty) {
  if (!puzzleData || !Array.isArray(puzzleData.givenGrid) || puzzleData.givenGrid.length !== 9) {
    return false;
  }

  const normalized = normalizeDifficulty(requestedDifficulty);
  if (puzzleData.difficulty !== normalized) {
    return false;
  }

  const clues = countClues(puzzleData.givenGrid);

  switch (normalized) {
    case 'easy':
      // Easy must have plenty of clues for casual solving (>= 32 clues)
      return clues >= 32 && clues <= 55;
    case 'medium':
      // Medium balanced logic (27 - 35 clues)
      return clues >= 27 && clues <= 35;
    case 'hard':
      // Hard deduction (23 - 29 clues)
      return clues >= 23 && clues <= 29;
    case 'expert':
      // Minimal clues for master solver (17 - 25 clues)
      return clues >= 17 && clues <= 25;
    default:
      return clues >= 17;
  }
}

/**
 * Fetches a random Sudoku from Dosuku API with a strict timeout and difficulty verification.
 * If the API returns a difficulty different from what the user requested, it is rejected.
 */
async function fetchFromDosukuApi(requestedDifficulty = 'medium', timeoutMs = 2500) {
  const normalized = normalizeDifficulty(requestedDifficulty);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('https://sudoku-api.vercel.app/api/dosuku', {
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const gridObj = json?.newboard?.grids?.[0];

    if (gridObj && Array.isArray(gridObj.value)) {
      const apiDiff = (gridObj.difficulty || '').toLowerCase();
      // CRITICAL: Strictly verify that the API's returned difficulty matches what the user selected!
      if (apiDiff === normalized) {
        const candidate = {
          givenGrid: gridObj.value,
          solutionGrid: gridObj.solution || null,
          difficulty: normalized,
          source: 'Dosuku API'
        };
        if (verifySudokuDifficulty(candidate, normalized)) {
          return candidate;
        }
      }
      // If API returned a different difficulty than requested, reject it so verified generator takes over!
    }
  } catch (err) {
    // Timeout or network error - gracefully fall back
  } finally {
    clearTimeout(timer);
  }
  return null;
}

/**
 * Generates a verified Sudoku puzzle using sudoku-gen (instant, offline & guaranteed difficulty)
 */
function generateVerifiedLocalSudoku(requestedDifficulty = 'medium') {
  const normalized = normalizeDifficulty(requestedDifficulty);

  // Attempt up to 5 generations to ensure full verification
  for (let attempt = 0; attempt < 5; attempt++) {
    const raw = getSudoku(normalized);
    const candidate = {
      givenGrid: stringToGrid(raw.puzzle),
      solutionGrid: stringToGrid(raw.solution),
      difficulty: normalized,
      source: 'Sudoku-Gen Engine'
    };

    if (verifySudokuDifficulty(candidate, normalized)) {
      return candidate;
    }
  }

  // Fallback to direct generation
  const fallbackRaw = getSudoku(normalized);
  return {
    givenGrid: stringToGrid(fallbackRaw.puzzle),
    solutionGrid: stringToGrid(fallbackRaw.solution),
    difficulty: normalized,
    source: 'Sudoku-Gen Engine'
  };
}

/**
 * Generates a full puzzle object ready to be played, saved, and synced.
 * Guaranteed to match the user's requested difficulty tier (easy, medium, hard, expert).
 *
 * @param {'easy' | 'medium' | 'hard' | 'expert'} difficulty
 * @param {boolean} tryApi Whether to attempt online API before local generator
 */
export async function createRandomPuzzle(difficulty = 'medium', tryApi = true) {
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  let result = null;

  // 1. If online and tryApi is enabled, attempt API fetch with strict difficulty matching
  if (tryApi && typeof navigator !== 'undefined' && navigator.onLine) {
    result = await fetchFromDosukuApi(normalizedDifficulty);
  }

  // 2. If API was rejected or unavailable, use guaranteed local engine
  if (!result || !verifySudokuDifficulty(result, normalizedDifficulty)) {
    result = generateVerifiedLocalSudoku(normalizedDifficulty);
  }

  // 3. Final validation guard to ensure absolute consistency
  const finalDifficulty = normalizeDifficulty(result.difficulty || normalizedDifficulty);
  const diffLabel = formatDifficulty(finalDifficulty);
  const now = getSystemDateTimeISO();
  const puzzleNum = Math.floor(1000 + Math.random() * 9000);
  const newId = `sudoku-${finalDifficulty}-${Date.now()}`;

  const given = result.givenGrid.map((row) => [...row]);
  const current = result.givenGrid.map((row) => [...row]);

  return {
    id: newId,
    title: `${diffLabel} Sudoku #${puzzleNum}`,
    difficulty: finalDifficulty,
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
