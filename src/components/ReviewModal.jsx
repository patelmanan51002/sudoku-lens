import React, { useState } from 'react';
import { Check, X, Calendar, Edit3, Image as ImageIcon } from 'lucide-react';
import { toInputDateTimeValue } from '../utils/dateUtils';

export default function ReviewModal({
  data,
  onConfirm,
  onCancel
}) {
  const [grid, setGrid] = useState(() => data.extractedGrid.map(row => [...row]));
  const [selectedCell, setSelectedCell] = useState({ r: 0, c: 0 });
  const [assignedDate, setAssignedDate] = useState(() => toInputDateTimeValue(data.imageDate));
  const [title, setTitle] = useState(data.title || 'New Sudoku');

  const handleCellClick = (r, c) => {
    setSelectedCell({ r, c });
  };

  const handleSetNumber = (num) => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    const updated = grid.map(row => [...row]);
    updated[r][c] = num;
    setGrid(updated);
  };

  const handleConfirm = () => {
    onConfirm({
      title,
      imageDate: new Date(assignedDate).toISOString(),
      thumbnailUrl: data.thumbnailUrl,
      givenGrid: grid,
      hasCheckerboard: data.hasCheckerboard ?? true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl border border-slate-100 animate-pop my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              <span>Review Extracted Sudoku</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify the numbers detected by OCR. Click any cell below to adjust if needed before playing.
            </p>
          </div>

          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date and Title config bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Puzzle Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-blue-600" />
              <span>Assigned Date (System Time)</span>
            </label>
            <input
              type="datetime-local"
              value={assignedDate}
              onChange={(e) => setAssignedDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Side-by-side or stacked view: Original Image vs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Original Image Preview */}
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-slate-600 mb-2 flex items-center space-x-1.5">
              <ImageIcon className="w-4 h-4 text-slate-400" />
              <span>Original Uploaded Image</span>
            </div>
            <div className="w-full max-w-[320px] aspect-square bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-2 shadow-inner">
              <img
                src={data.thumbnailUrl}
                alt="Original Sudoku"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
          </div>

          {/* Scanned Interactive 9x9 Grid */}
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-slate-600 mb-2">
              Scanned Digits <span className="font-normal text-slate-400">(Click to edit)</span>
            </div>

            <div
              className="w-full max-w-[320px] aspect-square grid grid-cols-9 grid-rows-9 border-2 border-slate-900 bg-white rounded-xl shadow-md overflow-hidden select-none"
            >
              {grid.map((row, r) =>
                row.map((val, c) => {
                  const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                  const isRightThick = (c + 1) % 3 === 0 && c !== 8;
                  const isBottomThick = (r + 1) % 3 === 0 && r !== 8;
                  const boxIndex = Math.floor(r / 3) * 3 + Math.floor(c / 3);
                  const isChecker = data.hasCheckerboard && (boxIndex % 2 === 0);

                  return (
                    <div
                      key={`${r},${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`flex items-center justify-center cursor-pointer border-r border-b border-slate-300 font-bold text-base transition-colors ${
                        isRightThick ? 'border-r-2 border-r-slate-800' : ''
                      } ${isBottomThick ? 'border-b-2 border-b-slate-800' : ''} ${
                        isSelected
                          ? 'ring-2 ring-blue-600 bg-blue-100'
                          : isChecker
                          ? 'bg-sky-100/70'
                          : 'bg-white'
                      }`}
                    >
                      {val > 0 ? (
                        <span className="text-slate-900">{val}</span>
                      ) : (
                        <span className="text-slate-200 font-normal">·</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Keypad for Reviewing */}
            <div className="flex items-center space-x-1 mt-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => handleSetNumber(n)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white font-bold text-xs text-slate-700 transition-colors shadow-xs"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => handleSetNumber(0)}
                className="px-2 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-colors"
                title="Clear cell"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end space-x-3 pt-5 mt-5 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Start Solving</span>
          </button>
        </div>
      </div>
    </div>
  );
}
