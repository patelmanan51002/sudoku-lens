import React from 'react';

export default function SudokuCell({
  r,
  c,
  value,
  isGiven,
  notes = [],
  isSelected,
  isSameRowOrColOrBox,
  isSameNumber,
  isConflict,
  isCheckerBlue,
  autoHighlight,
  selectedValue,
  onClick
}) {
  // Base background styling (checkerboard soft sky vs crisp white)
  let bgClass = isCheckerBlue ? 'bg-sky-100/70' : 'bg-white';
  let ringClass = '';

  if (autoHighlight) {
    if (isConflict) {
      // Red for conflicting/false values (preserved as requested)
      bgClass = 'bg-rose-100 text-rose-700';
    } else if (isSelected && isSameNumber) {
      // The selected cell itself containing the active number: vibrant amber
      bgClass = 'bg-amber-300 text-amber-950 font-black';
    } else if (isSelected) {
      // The selected cell (empty cell or without matching numbers)
      bgClass = 'bg-blue-100 text-blue-900 font-bold';
    } else if (isSameNumber) {
      // High-contrast warm golden amber highlight for all matching numbers
      bgClass = 'bg-amber-200 text-amber-950 font-black';
    } else if (isSameRowOrColOrBox) {
      // Gentle crosshair guide
      bgClass = isCheckerBlue ? 'bg-sky-200/40' : 'bg-slate-100/80';
    }

    // Border rings
    if (isSelected) {
      ringClass = isConflict
        ? 'z-10 ring-2 ring-rose-600 ring-inset shadow-inner'
        : 'z-10 ring-2 ring-blue-600 ring-inset shadow-inner';
    } else if (isSameNumber) {
      ringClass = 'z-[5] ring-1 ring-amber-400/80 shadow-xs';
    }
  } else {
    // Pen & Paper mode: pure view without assists
    if (isSelected) {
      bgClass = isCheckerBlue ? 'bg-sky-200/70' : 'bg-slate-200/70';
      ringClass = 'z-10 ring-2 ring-blue-600 ring-inset shadow-inner';
    }
  }

  return (
    <div
      onClick={onClick}
      role="gridcell"
      aria-selected={isSelected}
      className={`relative flex items-center justify-center cursor-pointer transition-colors duration-75 select-none touch-manipulation aspect-square w-full h-full
        ${ringClass}
        ${bgClass}
      `}
    >
      {value > 0 ? (
        <span
          className={`text-lg sm:text-xl md:text-2xl select-none leading-none transition-transform
            ${isGiven ? 'font-bold text-slate-800' : 'font-semibold text-blue-600'}
            ${autoHighlight && isConflict ? '!text-rose-600' : ''}
            ${autoHighlight && (isSameNumber || (isSelected && value > 0)) ? '!text-amber-950 font-black' : ''}
          `}
        >
          {value}
        </span>
      ) : notes && notes.length > 0 ? (
        // 3x3 Notes / Pencil marks grid
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 pointer-events-none">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
            const isNoteMatch = autoHighlight && selectedValue && selectedValue === num;
            return (
              <span
                key={num}
                className={`flex items-center justify-center text-[7px] xs:text-[8px] sm:text-[10px] font-bold leading-none ${
                  notes.includes(num)
                    ? isNoteMatch
                      ? 'bg-amber-400 text-amber-950 font-black rounded-xs shadow-xs px-0.5'
                      : 'text-slate-700'
                    : 'text-transparent'
                }`}
              >
                {num}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
