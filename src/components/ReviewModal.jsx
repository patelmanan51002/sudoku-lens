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
  const [mobileTab, setMobileTab] = useState('grid'); // 'grid' or 'image' for mobile view

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-4 sm:p-7 max-w-4xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Review Scanned Sudoku</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify detected numbers. Tap any cell to adjust before playing.
            </p>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date and Title config bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 my-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Puzzle Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-blue-600" />
              <span>Assigned Date</span>
            </label>
            <input
              type="datetime-local"
              value={assignedDate}
              onChange={(e) => setAssignedDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Mobile segmented toggle (Only on screens < md) */}
        <div className="flex md:hidden p-1 bg-slate-100 rounded-xl mb-3">
          <button
            type="button"
            onClick={() => setMobileTab('grid')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            Scanned Grid (Edit)
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('image')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'image' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            Original Image
          </button>
        </div>

        {/* Side-by-side on desktop/tablet, tabbed on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">
          {/* Original Image Preview */}
          <div className={`flex flex-col items-center ${mobileTab === 'image' ? 'block' : 'hidden md:flex'}`}>
            <div className="text-xs font-bold text-slate-600 mb-2 flex items-center space-x-1.5">
              <ImageIcon className="w-4 h-4 text-slate-400" />
              <span>Original Uploaded Image</span>
            </div>
            <div className="w-full max-w-[min(100%,320px)] aspect-square bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-2 shadow-inner">
              <img
                src={data.thumbnailUrl}
                alt="Original Sudoku"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
          </div>

          {/* Scanned Interactive 9x9 Grid */}
          <div className={`flex flex-col items-center ${mobileTab === 'grid' ? 'block' : 'hidden md:flex'}`}>
            <div className="text-xs font-bold text-slate-600 mb-2">
              Scanned Digits <span className="font-normal text-slate-400">(Tap cell to edit)</span>
            </div>

            <div
              className="w-full max-w-[min(100%,320px)] aspect-square grid grid-cols-3 grid-rows-3 gap-[2px] bg-slate-700 border-2 border-slate-700 rounded-xl shadow-md overflow-hidden select-none touch-manipulation"
            >
              {[0, 1, 2].map((blockRow) =>
                [0, 1, 2].map((blockCol) => {
                  const blockIndex = blockRow * 3 + blockCol;
                  const isCheckerBox = data.hasCheckerboard && (blockIndex % 2 === 0);

                  return (
                    <div
                      key={`block-${blockRow}-${blockCol}`}
                      className="grid grid-cols-3 grid-rows-3 gap-[1px] bg-slate-300"
                    >
                      {[0, 1, 2].map((subRow) =>
                        [0, 1, 2].map((subCol) => {
                          const r = blockRow * 3 + subRow;
                          const c = blockCol * 3 + subCol;
                          const val = grid[r][c];
                          const isSelected = selectedCell?.r === r && selectedCell?.c === c;

                          return (
                            <div
                              key={`${r},${c}`}
                              onClick={() => handleCellClick(r, c)}
                              className={`flex items-center justify-center cursor-pointer font-bold text-sm sm:text-base transition-colors ${
                                isSelected
                                  ? 'ring-2 ring-blue-600 bg-blue-100'
                                  : isCheckerBox
                                  ? 'bg-sky-100/70'
                                  : 'bg-white'
                              }`}
                            >
                              {val > 0 ? (
                                <span className="text-slate-800">{val}</span>
                              ) : (
                                <span className="text-slate-300 font-normal">·</span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Keypad for Reviewing */}
            <div className="grid grid-cols-10 gap-1 mt-3 w-full max-w-[min(100%,320px)]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => handleSetNumber(n)}
                  className="h-8 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white font-bold text-xs text-slate-700 transition-colors shadow-xs active:scale-95 touch-manipulation"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => handleSetNumber(0)}
                className="h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-[10px] transition-colors active:scale-95 touch-manipulation"
                title="Clear cell"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors text-center"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 text-center"
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Start Solving</span>
          </button>
        </div>
      </div>
    </div>
  );
}
