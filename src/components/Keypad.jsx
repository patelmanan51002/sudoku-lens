import React from 'react';
import { Delete, Pencil, Smartphone, Keyboard, Lightbulb } from 'lucide-react';

export default function Keypad({
  grid,
  onInputDigit,
  onErase,
  isNotesMode,
  onToggleNotes,
  hintsUsed = 0,
  onUseHint,
  autoHighlight,
  isFinished,
  isTimerRunning = false,
  onStartTimer,
  useNativeKeyboard = false,
  onToggleNativeKeyboard,
  selectedDigit = null
}) {
  if (isFinished) {
    return (
      <div className="w-full max-w-[min(100vw-1.5rem,480px,52vh)] mx-auto mt-2 sm:mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-xs font-semibold text-emerald-800 flex items-center justify-center space-x-2 animate-pop">
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
          const isSelectedMatch = autoHighlight && selectedDigit === num;

          return (
            <button
              key={num}
              onClick={() => {
                if (!isTimerRunning && !isFinished) {
                  onStartTimer?.();
                  return;
                }
                onInputDigit(num);
              }}
              className={`relative flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl border font-bold transition-all active:scale-90 shadow-xs touch-manipulation ${
                !isTimerRunning && !isFinished
                  ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-80'
                  : isSelectedMatch
                  ? 'bg-amber-100 border-amber-400 text-amber-950 ring-2 ring-amber-400 font-black shadow-sm'
                  : isComplete && autoHighlight
                  ? 'bg-slate-100 border-slate-200 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <span className="text-base sm:text-xl font-bold leading-none">{num}</span>
              {autoHighlight && (
                <span
                  className={`text-[8px] sm:text-[10px] font-semibold mt-0.5 leading-none ${
                    isSelectedMatch
                      ? 'text-amber-800 font-bold'
                      : isComplete
                      ? 'text-slate-300'
                      : 'text-slate-400'
                  }`}
                >
                  {9 - count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Auxiliary Buttons below numpad: Notes Mode toggle, Hint, and Erase */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
        <button
          onClick={onToggleNotes}
          className={`flex items-center justify-center space-x-1 sm:space-x-1.5 py-2 sm:py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 shadow-xs touch-manipulation ${
            isNotesMode
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-500/20'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
          title="Toggle Notes / Pencil mode"
        >
          <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">{isNotesMode ? 'Notes ON' : 'Pencil'}</span>
        </button>

        <button
          onClick={onUseHint}
          disabled={hintsUsed >= 3 || isFinished}
          className={`flex items-center justify-center space-x-1 sm:space-x-1.5 py-2 sm:py-2.5 rounded-xl border text-xs font-semibold transition-all touch-manipulation ${
            hintsUsed < 3 && !isFinished
              ? 'bg-amber-50/80 border-amber-200 text-amber-800 hover:bg-amber-100 hover:border-amber-300 active:scale-95 shadow-xs'
              : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
          }`}
          title={hintsUsed >= 3 ? 'All 3 hints used' : `Use Hint (${3 - hintsUsed} left)`}
        >
          <Lightbulb
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
              hintsUsed < 3 && !isFinished ? 'text-amber-500 fill-amber-300' : 'text-slate-300'
            }`}
          />
          <span>Hint ({Math.max(0, 3 - hintsUsed)})</span>
        </button>

        <button
          onClick={() => {
            if (!isTimerRunning && !isFinished) {
              onStartTimer?.();
              return;
            }
            onErase();
          }}
          className="flex items-center justify-center space-x-1 sm:space-x-1.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-xs font-semibold transition-all active:scale-95 shadow-xs touch-manipulation"
          title="Erase cell contents"
        >
          <Delete className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Erase</span>
        </button>
      </div>

      {/* Mobile Input Mode Selector (On-screen keypad vs Native Android / Phone keyboard) */}
      <div className="flex items-center justify-between mt-2.5 px-1 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
        <span className="text-[11px] font-semibold text-slate-600 flex items-center space-x-1.5 pl-1">
          <span>Grid Input Mode:</span>
        </span>
        <div className="flex items-center space-x-1 bg-slate-200/70 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => onToggleNativeKeyboard?.(false)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              !useNativeKeyboard
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Use on-screen Web Keypad (tapping grid cells will not open phone keyboard)"
          >
            <Smartphone className="w-3 h-3 text-blue-500" />
            <span>Web Keypad</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleNativeKeyboard?.(true)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              useNativeKeyboard
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Use Phone / Android Keyboard (tapping grid cells opens native numeric keyboard)"
          >
            <Keyboard className="w-3 h-3 text-purple-500" />
            <span>Phone Keyboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
