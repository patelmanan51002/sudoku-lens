// Utilities for Sudoku Validation, Conflicts, and Solving

// Sample puzzle extracted from the uploaded image media_1790103309869.png
export const SAMPLE_PUZZLE_GIVEN = [
  [0, 0, 0, 1, 0, 0, 0, 0, 6],
  [0, 0, 3, 0, 0, 0, 0, 0, 0],
  [0, 6, 0, 4, 0, 7, 0, 9, 0],
  [0, 1, 8, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 4, 6, 0],
  [0, 0, 0, 0, 0, 8, 0, 7, 0],
  [1, 0, 0, 6, 0, 9, 0, 0, 0],
  [6, 0, 0, 0, 0, 5, 7, 0, 2],
  [0, 0, 0, 0, 0, 0, 0, 5, 0],
];

/**
 * Checks if a 9x9 grid has 81 cells filled (no 0s)
 */
export function isBoardComplete(grid) {
  if (!grid || grid.length !== 9) return false;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!grid[r][c] || grid[r][c] === 0) return false;
    }
  }
  return true;
}

/**
 * Counts the number of filled cells
 */
export function countFilled(grid) {
  if (!grid) return 0;
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] && grid[r][c] > 0) count++;
    }
  }
  return count;
}

/**
 * Finds all cell coordinates that have conflict with another cell
 * (same row, col, or 3x3 block sharing the same digit)
 * Returns a Set of keys: `${r},${c}`
 */
export function findConflicts(grid) {
  const conflicts = new Set();
  if (!grid) return conflicts;

  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Map();
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      if (val > 0) {
        if (seen.has(val)) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${r},${seen.get(val)}`);
        } else {
          seen.set(val, c);
        }
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Map();
    for (let r = 0; r < 9; r++) {
      const val = grid[r][c];
      if (val > 0) {
        if (seen.has(val)) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${seen.get(val)},${c}`);
        } else {
          seen.set(val, r);
        }
      }
    }
  }

  // Check 3x3 boxes
  for (let boxR = 0; boxR < 3; boxR++) {
    for (let boxC = 0; boxC < 3; boxC++) {
      const seen = new Map();
      for (let r = boxR * 3; r < boxR * 3 + 3; r++) {
        for (let c = boxC * 3; c < boxC * 3 + 3; c++) {
          const val = grid[r][c];
          if (val > 0) {
            if (seen.has(val)) {
              conflicts.add(`${r},${c}`);
              const [prevR, prevC] = seen.get(val);
              conflicts.add(`${prevR},${prevC}`);
            } else {
              seen.set(val, [r, c]);
            }
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Validates whether the complete 9x9 board is a valid, solved Sudoku
 */
export function validateSudoku(grid) {
  if (!isBoardComplete(grid)) {
    return {
      isValid: false,
      message: 'Board is not completely filled yet. Fill all cells to validate.'
    };
  }
  const conflicts = findConflicts(grid);
  if (conflicts.size > 0) {
    return {
      isValid: false,
      conflicts,
      message: `There are ${conflicts.size} conflicting numbers on the board.`
    };
  }
  return {
    isValid: true,
    conflicts: new Set(),
    message: 'Congratulations! The Sudoku puzzle is completely and correctly solved!'
  };
}

/**
 * Solve Sudoku using backtracking. Returns solved 9x9 copy or null if unsolvable.
 */
export function solveSudoku(grid) {
  const board = grid.map(row => [...row]);

  function isValidPlacement(b, r, c, val) {
    for (let i = 0; i < 9; i++) {
      if (b[r][i] === val) return false;
      if (b[i][c] === val) return false;
    }
    const startR = Math.floor(r / 3) * 3;
    const startC = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (b[startR + i][startC + j] === val) return false;
      }
    }
    return true;
  }

  function backtrack() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          for (let val = 1; val <= 9; val++) {
            if (isValidPlacement(board, r, c, val)) {
              board[r][c] = val;
              if (backtrack()) return true;
              board[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  return backtrack() ? board : null;
}
