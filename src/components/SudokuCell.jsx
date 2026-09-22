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
  hasCheckerboard,
  autoHighlight,
  onClick
}) {
  const boxR = Math.floor(r / 3);
  const boxC = Math.floor(c / 3);
  const boxIndex = boxR * 3 + boxC;
  // Blocks 0, 2, 4, 6, 8 have light blue background like the sample image
  const isCheckerBlue = hasCheckerboard && (boxIndex % 2 === 0);

  // Border logic
  const isRightThick = (c + 1) % 3 === 0 && c !== 8;
  const isBottomThick = (r + 1) % 3 === 0 && r !== 8;

  // Background styling
  let bgClass = isCheckerBlue ? 'bg-sky-100/70' : 'bg-white';

  if (autoHighlight) {
    if (isConflict) {
      bgClass = 'bg-rose-100 text-rose-700';
    } else if (isSelected) {
      bgClass = 'bg-blue-200/90 text-blue-950 font-bold';
    } else if (isSameNumber) {
      bgClass = 'bg-sky-200/90';
    } else if (isSameRowOrColOrBox) {
      bgClass = isCheckerBlue ? 'bg-sky-200/40' : 'bg-slate-100/80';
    }
  } else {
    // Pen & Paper mode: pure view without assists
    if (isSelected) {
      bgClass = isCheckerBlue ? 'bg-sky-200' : 'bg-slate-200';
    }
  }

  return (
    <div
      onClick={onClick}
      role="gridcell"
      aria-selected={isSelected}
      className={`relative flex items-center justify-center cursor-pointer transition-colors duration-75 select-none
        border-r border-b border-slate-300
        ${isRightThick ? 'border-r-2 border-r-slate-800' : ''}
        ${isBottomThick ? 'border-b-2 border-b-slate-800' : ''}
        ${isSelected ? 'z-10 ring-2 ring-blue-600 ring-inset shadow-inner' : ''}
        ${bgClass}
      `}
      style={{ aspectRatio: '1 / 1' }}
    >
      {value > 0 ? (
        <span
          className={`text-lg sm:text-2xl md:text-3xl select-none leading-none transition-transform
            ${isGiven ? 'font-bold text-slate-900' : 'font-semibold text-blue-600'}
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
              className={`flex items-center justify-center text-[9px] sm:text-[11px] font-semibold leading-none ${
                notes.includes(num) ? 'text-slate-600' : 'text-transparent'
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
