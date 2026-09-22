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
  onClick
}) {
  // Background styling
  let bgClass = isCheckerBlue ? 'bg-sky-100/70' : 'bg-white';

  if (autoHighlight) {
    if (isConflict) {
      bgClass = 'bg-rose-100 text-rose-700';
    } else if (isSelected) {
      bgClass = 'bg-blue-100 text-blue-900 font-bold';
    } else if (isSameNumber) {
      bgClass = 'bg-sky-100/90';
    } else if (isSameRowOrColOrBox) {
      bgClass = isCheckerBlue ? 'bg-sky-100/50' : 'bg-slate-50/80';
    }
  } else {
    // Pen & Paper mode: pure view without assists
    if (isSelected) {
      bgClass = isCheckerBlue ? 'bg-sky-200/70' : 'bg-slate-200/70';
    }
  }

  return (
    <div
      onClick={onClick}
      role="gridcell"
      aria-selected={isSelected}
      className={`relative flex items-center justify-center cursor-pointer transition-colors duration-75 select-none touch-manipulation aspect-square w-full h-full
        ${isSelected ? 'z-10 ring-2 ring-blue-600 ring-inset shadow-inner' : ''}
        ${bgClass}
      `}
    >
      {value > 0 ? (
        <span
          className={`text-lg sm:text-xl md:text-2xl select-none leading-none transition-transform
            ${isGiven ? 'font-bold text-slate-800' : 'font-semibold text-blue-600'}
            ${autoHighlight && isConflict ? '!text-rose-600' : ''}
          `}
        >
          {value}
        </span>
      ) : notes && notes.length > 0 ? (
        // 3x3 Notes / Pencil marks grid
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 pointer-events-none">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <span
              key={num}
              className={`flex items-center justify-center text-[7px] xs:text-[8px] sm:text-[10px] font-bold leading-none ${
                notes.includes(num) ? 'text-slate-700' : 'text-transparent'
              }`}
            >
              {num}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
