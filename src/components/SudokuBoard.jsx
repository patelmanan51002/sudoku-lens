import React, { useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import SudokuCell from './SudokuCell';
import { findConflicts } from '../utils/sudokuSolver';

export default function SudokuBoard({
  grid,
  givenGrid,
  notes,
  selectedCell,
  onSelectCell,
  onInputDigit,
  onErase,
  onUndo,
  onRedo,
  onToggleNotes,
  isNotesMode,
  hasCheckerboard = true,
  autoHighlight = true,
  isTimerRunning = false,
  isFinished = false,
  elapsedTime = 0,
  onStartTimer
}) {
  const hiddenInputRef = useRef(null);

  // Focus hidden input on cell selection to trigger mobile system keyboard
  useEffect(() => {
    if (selectedCell && hiddenInputRef.current && isTimerRunning) {
      hiddenInputRef.current.focus({ preventScroll: true });
    }
  }, [selectedCell, isTimerRunning]);

  // Global & board keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input or modal
      if (e.target.tagName === 'INPUT' && e.target !== hiddenInputRef.current) return;
      if (e.target.tagName === 'TEXTAREA') return;

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        onRedo();
        return;
      }

      // Toggle notes mode with 'n'
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onToggleNotes();
        return;
      }

      // Arrow navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd'].includes(e.key)) {
        if (!selectedCell) {
          onSelectCell({ r: 0, c: 0 });
          return;
        }
        e.preventDefault();
        let { r, c } = selectedCell;
        if (e.key === 'ArrowUp' || e.key === 'w') r = (r - 1 + 9) % 9;
        if (e.key === 'ArrowDown' || e.key === 's') r = (r + 1) % 9;
        if (e.key === 'ArrowLeft' || e.key === 'a') c = (c - 1 + 9) % 9;
        if (e.key === 'ArrowRight' || e.key === 'd') c = (c + 1) % 9;
        onSelectCell({ r, c });
        return;
      }

      // If timer is not running, block direct digit typing unless started
      if (!isTimerRunning && !isFinished) {
        if (/^[1-9]$/.test(e.key) || ['Backspace', 'Delete', '0'].includes(e.key)) {
          e.preventDefault();
          onStartTimer?.();
          return;
        }
      }

      // Digits 1-9
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        onInputDigit(parseInt(e.key, 10));
        return;
      }

      // Erase with Backspace or Delete or 0
      if (['Backspace', 'Delete', '0'].includes(e.key)) {
        e.preventDefault();
        onErase();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, onInputDigit, onErase, onUndo, onRedo, onToggleNotes, onSelectCell, isTimerRunning, isFinished, onStartTimer]);

  // Compute live conflicts if autoHighlight is enabled
  const conflicts = autoHighlight ? findConflicts(grid) : new Set();
  const selectedValue = selectedCell ? grid[selectedCell.r][selectedCell.c] : null;

  return (
    <div className="relative w-full max-w-[min(100vw-1.5rem,480px,52vh)] mx-auto select-none touch-manipulation">
      {/* Hidden input to bring up mobile native number keyboard */}
      <input
        ref={hiddenInputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="opacity-0 absolute -top-10 left-0 w-1 h-1 pointer-events-none"
        aria-hidden="true"
        onChange={(e) => {
          const val = e.target.value;
          if (val) {
            const lastChar = val[val.length - 1];
            if (/^[1-9]$/.test(lastChar)) {
              onInputDigit(parseInt(lastChar, 10));
            } else if (lastChar === '0') {
              onErase();
            }
          }
          e.target.value = '';
        }}
      />

      {/* 9x9 Board Frame: 3x3 Grid of 3x3 Blocks with Gap Dividers for Crisp Unbroken Lines */}
      <div
        className="grid grid-cols-3 grid-rows-3 border-[3px] sm:border-[4px] border-slate-900 bg-slate-900 gap-[2px] sm:gap-[3px] rounded-2xl shadow-xl overflow-hidden aspect-square w-full select-none"
      >
        {Array.from({ length: 9 }).map((_, boxIdx) => {
          const boxR = Math.floor(boxIdx / 3);
          const boxC = boxIdx % 3;
          const isCheckerBlue = hasCheckerboard && (boxIdx % 2 === 0);

          return (
            <div
              key={boxIdx}
              className="grid grid-cols-3 grid-rows-3 gap-[1px] bg-slate-300"
            >
              {Array.from({ length: 9 }).map((_, innerIdx) => {
                const innerR = Math.floor(innerIdx / 3);
                const innerC = innerIdx % 3;
                const r = boxR * 3 + innerR;
                const c = boxC * 3 + innerC;

                const isGiven = givenGrid ? givenGrid[r][c] > 0 : false;
                const value = grid[r][c];
                const isSelected = selectedCell?.r === r && selectedCell?.c === c;

                const isSameRow = selectedCell?.r === r;
                const isSameCol = selectedCell?.c === c;
                const isSameBox =
                  selectedCell &&
                  Math.floor(selectedCell.r / 3) === boxR &&
                  Math.floor(selectedCell.c / 3) === boxC;

                const isSameRowOrColOrBox = isSameRow || isSameCol || isSameBox;
                const isSameNumber =
                  selectedValue && selectedValue > 0 && value === selectedValue;
                const isConflict = conflicts.has(`${r},${c}`);

                const cellKey = `${r},${c}`;
                const cellNotes = notes ? notes[cellKey] || [] : [];

                return (
                  <SudokuCell
                    key={cellKey}
                    r={r}
                    c={c}
                    value={value}
                    isGiven={isGiven}
                    notes={cellNotes}
                    isSelected={isSelected}
                    isSameRowOrColOrBox={isSameRowOrColOrBox}
                    isSameNumber={isSameNumber}
                    isConflict={isConflict}
                    isCheckerBlue={isCheckerBlue}
                    autoHighlight={autoHighlight}
                    onClick={() => {
                      if (!isTimerRunning && !isFinished) {
                        onStartTimer?.();
                      }
                      onSelectCell({ r, c });
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Tap-to-Start / Resume Overlay when Timer is not running */}
      {!isTimerRunning && !isFinished && (
        <div
          onClick={onStartTimer}
          className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-900/50 group touch-manipulation animate-pop"
          title="Click to start timer and play"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-blue-600 shadow-2xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-blue-600" />
          </div>
          <span className="bg-white text-slate-900 font-extrabold text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-lg border border-slate-100">
            {elapsedTime > 0 ? 'Tap to Resume Game' : 'Tap to Start Timer & Play'}
          </span>
        </div>
      )}
    </div>
  );
}
