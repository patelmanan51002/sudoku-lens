import React, { useRef, useEffect } from 'react';
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
}) {
  const hiddenInputRef = useRef(null);

  // Focus hidden input on cell selection to trigger mobile system keyboard
  useEffect(() => {
    if (selectedCell && hiddenInputRef.current) {
      hiddenInputRef.current.focus({ preventScroll: true });
    }
  }, [selectedCell]);

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
  }, [selectedCell, onInputDigit, onErase, onUndo, onRedo, onToggleNotes, onSelectCell]);

  // Compute live conflicts if autoHighlight is enabled
  const conflicts = autoHighlight ? findConflicts(grid) : new Set();
  const selectedValue = selectedCell ? grid[selectedCell.r][selectedCell.c] : null;

  return (
    <div className="relative inline-block w-full max-w-[480px] mx-auto select-none">
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

      {/* 9x9 Board Frame */}
      <div
        className="grid grid-cols-9 grid-rows-9 border-2 border-slate-900 bg-white rounded-xl shadow-xl overflow-hidden"
        style={{ aspectRatio: '1 / 1' }}
      >
        {Array.from({ length: 9 }).map((_, r) =>
          Array.from({ length: 9 }).map((_, c) => {
            const isGiven = givenGrid ? givenGrid[r][c] > 0 : false;
            const value = grid[r][c];
            const isSelected = selectedCell?.r === r && selectedCell?.c === c;

            const isSameRow = selectedCell?.r === r;
            const isSameCol = selectedCell?.c === c;
            const isSameBox =
              selectedCell &&
              Math.floor(selectedCell.r / 3) === Math.floor(r / 3) &&
              Math.floor(selectedCell.c / 3) === Math.floor(c / 3);

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
                hasCheckerboard={hasCheckerboard}
                autoHighlight={autoHighlight}
                onClick={() => onSelectCell({ r, c })}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
