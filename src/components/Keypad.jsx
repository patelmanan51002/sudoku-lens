import React from 'react';
import { Delete, Pencil } from 'lucide-react';

export default function Keypad({
  grid,
  onInputDigit,
  onErase,
  isNotesMode,
  onToggleNotes,
  autoHighlight,
  isFinished
}) {
  if (isFinished) {
    return (
      <div className="w-full max-w-[480px] mx-auto mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-xs font-semibold text-emerald-800 flex items-center justify-center space-x-2 animate-pop">
        <span>🎉</span>
        <span>Puzzle is completed and verified!</span>
      </div>
    );
  }

  // Count how many times each digit 1-9 appears on the board
  const digitCounts = {};
  for (let i = 1; i <= 9; i++) digitCounts[i] = 0;

  if (grid) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = grid[r][c];
        if (val >= 1 && val <= 9) {
          digitCounts[val]++;
        }
      }
    }
  }

  return (
    <div className="w-full max-w-[min(100vw-1.5rem,480px,52vh)] mx-auto mt-2 sm:mt-3 select-none touch-manipulation">
      <div className="grid grid-cols-9 gap-1 sm:gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const count = digitCounts[num];
          const isComplete = count >= 9;

          return (
            <button
              key={num}
              onClick={() => onInputDigit(num)}
              className={`relative flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl border font-bold transition-all active:scale-90 shadow-xs touch-manipulation ${
                isComplete && autoHighlight
                  ? 'bg-slate-100 border-slate-200 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <span className="text-base sm:text-xl font-bold leading-none">{num}</span>
              {autoHighlight && (
                <span
                  className={`text-[8px] sm:text-[10px] font-semibold mt-0.5 leading-none ${
                    isComplete ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  {9 - count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Auxiliary Buttons below numpad: Notes Mode toggle & Erase */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
        <button
          onClick={onToggleNotes}
          className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2 sm:py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 shadow-xs touch-manipulation ${
            isNotesMode
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-500/20'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>{isNotesMode ? 'Notes Mode Active' : 'Enable Notes'}</span>
        </button>

        <button
          onClick={onErase}
          className="flex items-center justify-center space-x-1.5 sm:space-x-2 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-xs font-semibold transition-all active:scale-95 shadow-xs touch-manipulation"
        >
          <Delete className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Erase Cell</span>
        </button>
      </div>
    </div>
  );
}
