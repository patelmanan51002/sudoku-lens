import {
  SAMPLE_PUZZLE_GIVEN,
  isBoardComplete,
  countFilled,
  findConflicts,
  validateSudoku,
  solveSudoku
} from './src/utils/sudokuSolver.js';

console.log('Testing Sudoku Solver & Validator...\n');

// 1. Initial sample puzzle tests
const filledInitial = countFilled(SAMPLE_PUZZLE_GIVEN);
console.log(`Initial filled cells: ${filledInitial} (Expected: 22)`);
console.assert(filledInitial === 22, `Expected 22, got ${filledInitial}`);

const initialConflicts = findConflicts(SAMPLE_PUZZLE_GIVEN);
console.log(`Initial conflicts: ${initialConflicts.size} (Expected: 0)`);
console.assert(initialConflicts.size === 0, `Expected 0 conflicts, got ${initialConflicts.size}`);

const completeInitial = isBoardComplete(SAMPLE_PUZZLE_GIVEN);
console.log(`Is initial board complete: ${completeInitial} (Expected: false)`);
console.assert(completeInitial === false, 'Initial board should not be complete');

// 2. Solve the sample puzzle
console.log('\nSolving sample puzzle...');
const solved = solveSudoku(SAMPLE_PUZZLE_GIVEN);
console.assert(solved !== null, 'Solver failed to find solution');

const filledSolved = countFilled(solved);
console.log(`Solved filled cells: ${filledSolved} (Expected: 81)`);
console.assert(filledSolved === 81, `Expected 81, got ${filledSolved}`);

const solvedConflicts = findConflicts(solved);
console.log(`Solved conflicts: ${solvedConflicts.size} (Expected: 0)`);
console.assert(solvedConflicts.size === 0, `Expected 0 conflicts, got ${solvedConflicts.size}`);

// 3. Validation tests
const validationResult = validateSudoku(solved);
console.log(`Validation result isValid: ${validationResult.isValid} (Expected: true)`);
console.assert(validationResult.isValid === true, 'Validation failed for solved board');

// 4. Test conflict detection with intentional mistake
const brokenBoard = solved.map(row => [...row]);
brokenBoard[0][0] = brokenBoard[0][1]; // Duplicate in row 0
const brokenConflicts = findConflicts(brokenBoard);
console.log(`Conflicts on duplicate test: ${brokenConflicts.size} (Expected: > 0)`);
console.assert(brokenConflicts.size > 0, 'Conflict detector should catch duplicate');

const brokenValidation = validateSudoku(brokenBoard);
console.log(`Broken validation isValid: ${brokenValidation.isValid} (Expected: false)`);
console.assert(brokenValidation.isValid === false, 'Validation should fail on broken board');

console.log('\nAll Sudoku Solver & Validator tests PASSED successfully! 🎉');
