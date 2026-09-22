import React, { useState, useEffect } from 'react';
import { PlusCircle, Calendar, Trash2, Check, AlertCircle, Sparkles, Layers } from 'lucide-react';
import { getSystemDateTimeISO, toInputDateTimeValue } from '../utils/dateUtils';
import { findConflicts, countFilled } from '../utils/sudokuSolver';

export default function ManualCreator({ onCreatePuzzle, onCancel }) {
  const [grid, setGrid] = useState(() => Array.from({ length: 9 }, () => Array(9).fill(0)));
  const [selectedCell, setSelectedCell] = useState({ r: 0, c: 0 });
  const [title, setTitle] = useState('My Custom Sudoku');
  const [puzzleDate, setPuzzleDate] = useState(() => toInputDateTimeValue(getSystemDateTimeISO()));
  const [hasCheckerboard, setHasCheckerboard] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const conflicts = findConflicts(grid);
  const clueCount = countFilled(grid);

  // Keyboard navigation and typing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;

      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        handleSetNumber(parseInt(e.key, 10));
        return;
      }

      if (['Backspace', 'Delete', '0'].includes(e.key)) {
        e.preventDefault();
        handleSetNumber(0);
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd'].includes(e.key)) {
        if (!selectedCell) {
          setSelectedCell({ r: 0, c: 0 });
          return;
        }
        e.preventDefault();
        let { r, c } = selectedCell;
        if (e.key === 'ArrowUp' || e.key === 'w') r = (r - 1 + 9) % 9;
        if (e.key === 'ArrowDown' || e.key === 's') r = (r + 1) % 9;
        if (e.key === 'ArrowLeft' || e.key === 'a') c = (c - 1 + 9) % 9;
        if (e.key === 'ArrowRight' || e.key === 'd') c = (c + 1) % 9;
        setSelectedCell({ r, c });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, grid]);

  const handleSetNumber = (num) => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = num;
    setGrid(newGrid);
    setErrorMsg(null);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all numbers on this board?')) {
      setGrid(Array.from({ length: 9 }, () => Array(9).fill(0)));
      setErrorMsg(null);
    }
  };

  const handleStartSolving = () => {
    if (clueCount === 0) {
      setErrorMsg('Please enter at least a few initial clue numbers to create a puzzle.');
      return;
    }

    if (conflicts.size > 0) {
      setErrorMsg('Cannot create puzzle with conflicting numbers in the same row, column, or 3×3 box.');
      return;
    }

    const assignedDate = puzzleDate
      ? new Date(puzzleDate).toISOString()
      : getSystemDateTimeISO();

    onCreatePuzzle({
      title: title.trim() || 'My Custom Sudoku',
      imageDate: assignedDate,
      givenGrid: grid.map((r) => [...r]),
      hasCheckerboard
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center space-x-2">
          <span>Create Custom Sudoku</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Fill in the starting clues you want. When you're ready, click "Start Solving" to play!
        </p>
      </div>

      {/* Configuration bar: Title, Date, Theme */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Puzzle Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Daily Puzzle #42"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Assigned Date (System Time)</span>
            </label>
            <input
              type="datetime-local"
              value={puzzleDate}
              onChange={(e) => setPuzzleDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Checkerboard toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">Light Blue Checkerboard Shading</span>
          </div>
          <button
            type="button"
            onClick={() => setHasCheckerboard(!hasCheckerboard)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              hasCheckerboard ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                hasCheckerboard ? 'translate-x-4' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 9x9 Creation Board */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-[420px] aspect-square grid grid-cols-9 grid-rows-9 border-2 border-slate-900 bg-white rounded-xl shadow-xl overflow-hidden select-none mb-3">
          {grid.map((row, r) =>
            row.map((val, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const isRightThick = (c + 1) % 3 === 0 && c !== 8;
              const isBottomThick = (r + 1) % 3 === 0 && r !== 8;
              const boxIndex = Math.floor(r / 3) * 3 + Math.floor(c / 3);
              const isChecker = hasCheckerboard && (boxIndex % 2 === 0);
              const isConflict = conflicts.has(`${r},${c}`);

              let bgClass = isChecker ? 'bg-sky-100/70' : 'bg-white';
              if (isConflict) {
                bgClass = 'bg-rose-100 text-rose-700 font-bold';
              } else if (isSelected) {
                bgClass = 'bg-blue-200 ring-2 ring-blue-600 ring-inset';
              }

              return (
                <div
                  key={`${r},${c}`}
                  onClick={() => setSelectedCell({ r, c })}
                  className={`flex items-center justify-center cursor-pointer border-r border-b border-slate-300 text-lg sm:text-xl font-bold transition-colors ${
                    isRightThick ? 'border-r-2 border-r-slate-800' : ''
                  } ${isBottomThick ? 'border-b-2 border-b-slate-800' : ''} ${bgClass}`}
                >
                  {val > 0 ? (
                    <span className={isConflict ? 'text-rose-600' : 'text-slate-900'}>{val}</span>
                  ) : (
                    <span className="text-slate-200 font-normal">·</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Clue status and conflict alert */}
        <div className="w-full max-w-[420px] flex items-center justify-between text-xs px-1 mb-3">
          <span className="font-semibold text-slate-600">
            Clues entered: <span className="text-blue-600 font-bold">{clueCount}</span> / 81
          </span>
          {conflicts.size > 0 && (
            <span className="text-rose-600 font-bold flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{conflicts.size} conflicts detected!</span>
            </span>
          )}
        </div>

        {/* Creation Keypad (1-9, Clear) */}
        <div className="w-full max-w-[420px] grid grid-cols-10 gap-1.5 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleSetNumber(n)}
              className="py-2.5 rounded-xl bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 border border-slate-200 font-bold text-base text-slate-800 shadow-sm active:scale-95 transition-all"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => handleSetNumber(0)}
            className="py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center"
            title="Clear cell"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="w-full max-w-[420px] mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Actions Footer */}
        <div className="w-full max-w-[420px] flex items-center justify-between gap-3">
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Grid</span>
          </button>

          <button
            onClick={handleStartSolving}
            disabled={clueCount === 0 || conflicts.size > 0}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-5 rounded-xl text-xs font-bold transition-all shadow-md ${
              clueCount > 0 && conflicts.size === 0
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 active:scale-95 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Start Solving</span>
          </button>
        </div>
      </div>
    </div>
  );
}
