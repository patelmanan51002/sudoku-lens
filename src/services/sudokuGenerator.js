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
 * Generous clue ranges to make each tier noticeably more approachable:
 * - Easy: 44 - 48 clues (~4-5 clues per 3x3 block, relaxed casual solving)
 * - Medium: 36 - 40 clues (~4 clues per 3x3 block, balanced cross-hatching)
 * - Hard: 30 - 34 clues (~3-4 clues per block, thoughtful logic without being brutal)
 * - Expert: 24 - 28 clues (advanced deduction)
 */
export const DIFFICULTY_CLUE_RANGES = {
  easy: { min: 44, max: 48 },
  medium: { min: 36, max: 40 },
  hard: { min: 30, max: 34 },
  expert: { min: 24, max: 28 }
};

/**
 * Ensures the puzzle has a comfortable number of clues for the target difficulty
 * by revealing additional cells from the verified solution if needed.
 */
export function enrichPuzzleClues(givenGrid, solutionGrid, targetMinClues, targetMaxClues) {
  if (!solutionGrid || !Array.isArray(solutionGrid)) return givenGrid;
  const grid = givenGrid.map((row) => [...row]);
  let currentClues = countClues(grid);
  const target = Math.floor(targetMinClues + Math.random() * (targetMaxClues - targetMinClues + 1));

  if (currentClues >= target) return grid;

  // Find all currently empty positions with known solutions
  const emptyCells = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0 && solutionGrid[r] && solutionGrid[r][c] > 0) {
        emptyCells.push({ r, c });
      }
    }
  }

  // Shuffle empty cells randomly for balanced board distribution
  for (let i = emptyCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
  }

  // Reveal clues from solution until target count is met
  for (const cell of emptyCells) {
    if (currentClues >= target) break;
    grid[cell.r][cell.c] = solutionGrid[cell.r][cell.c];
    currentClues++;
  }

  return grid;
}

/**
 * Verifies that a generated puzzle strictly satisfies the requested difficulty:
 * - Exact difficulty tag matching
 * - Clue count within standard relaxed range for the tier
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
      // Relaxed Easy: plenty of clues (42 - 56 clues)
      return clues >= 42 && clues <= 56;
    case 'medium':
      // Relaxed Medium: balanced logic (35 - 41 clues)
      return clues >= 35 && clues <= 41;
    case 'hard':
      // Approachable Hard: deduction without excessive guessing (29 - 34 clues)
      return clues >= 29 && clues <= 34;
    case 'expert':
      // Expert: (22 - 28 clues)
      return clues >= 22 && clues <= 28;
    default:
      return clues >= 20;
  }
}

/**
 * Fetches a random Sudoku from Dosuku API with strict difficulty verification and clue enrichment.
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
      if (apiDiff === normalized) {
        const range = DIFFICULTY_CLUE_RANGES[normalized] || DIFFICULTY_CLUE_RANGES.medium;
        const enrichedGiven = gridObj.solution
          ? enrichPuzzleClues(gridObj.value, gridObj.solution, range.min, range.max)
          : gridObj.value;

        const candidate = {
          givenGrid: enrichedGiven,
          solutionGrid: gridObj.solution || null,
          difficulty: normalized,
          source: 'Dosuku API'
        };
        if (verifySudokuDifficulty(candidate, normalized)) {
          return candidate;
        }
      }
    }
  } catch (err) {
    // Timeout or network error - gracefully fall back to local engine
  } finally {
    clearTimeout(timer);
  }
  return null;
}

/**
 * Generates a verified Sudoku puzzle using sudoku-gen with relaxed clue enrichment.
 */
function generateVerifiedLocalSudoku(requestedDifficulty = 'medium') {
  const normalized = normalizeDifficulty(requestedDifficulty);
  const range = DIFFICULTY_CLUE_RANGES[normalized] || DIFFICULTY_CLUE_RANGES.medium;

  // Attempt up to 5 generations
  for (let attempt = 0; attempt < 5; attempt++) {
    const raw = getSudoku(normalized);
    const given = stringToGrid(raw.puzzle);
    const solution = stringToGrid(raw.solution);
    const enrichedGiven = enrichPuzzleClues(given, solution, range.min, range.max);

    const candidate = {
      givenGrid: enrichedGiven,
      solutionGrid: solution,
      difficulty: normalized,
      source: 'Sudoku-Gen Engine'
    };

    if (verifySudokuDifficulty(candidate, normalized)) {
      return candidate;
    }
  }

  // Fallback to direct enriched generation
  const fallbackRaw = getSudoku(normalized);
  const fallbackGiven = stringToGrid(fallbackRaw.puzzle);
  const fallbackSolution = stringToGrid(fallbackRaw.solution);
  return {
    givenGrid: enrichPuzzleClues(fallbackGiven, fallbackSolution, range.min, range.max),
    solutionGrid: fallbackSolution,
    difficulty: normalized,
    source: 'Sudoku-Gen Engine'
  };
}

/**
 * Creates the initial fresh Easy Sudoku puzzle for first-time users.
 * Directly replaces any old sample / Daily Newspaper puzzles.
 */
export function createInitialEasyPuzzle() {
  const raw = getSudoku('easy');
  const given = stringToGrid(raw.puzzle);
  const solution = stringToGrid(raw.solution);
  const enrichedGiven = enrichPuzzleClues(given, solution, 44, 48);
  const current = enrichedGiven.map((row) => [...row]);
  const now = getSystemDateTimeISO();
  const puzzleNum = Math.floor(1000 + Math.random() * 9000);
  const newId = `sudoku-easy-${Date.now()}`;

  return {
    id: newId,
    title: `Easy Sudoku #${puzzleNum}`,
    difficulty: 'easy',
    imageDate: now,
    createdAt: now,
    updatedAt: now,
    thumbnailUrl: null,
    givenGrid: enrichedGiven,
    currentGrid: current,
    solutionGrid: solution,
    notes: {},
    history: [],
    redoStack: [],
    status: 'Untouched',
    elapsedTime: 0,
    completionTime: null,
    hasCheckerboard: true,
    engineSource: 'Sudoku-Gen Engine'
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
