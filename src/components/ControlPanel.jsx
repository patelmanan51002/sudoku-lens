import React, { useState } from 'react';
import {
  RotateCcw,
  RotateCw,
  RefreshCw,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Pencil,
  Calendar,
  AlertCircle,
  Trophy
} from 'lucide-react';
import { formatSeconds, formatHumanDuration, formatDateTime, toInputDateTimeValue } from '../utils/dateUtils';
import { isBoardComplete, countFilled } from '../utils/sudokuSolver';

export default function ControlPanel({
  grid,
  elapsedTime,
  completionTime,
  isTimerRunning,
  onToggleTimer,
  onUndo,
  onRedo,
  onReset,
  onValidate,
  canUndo,
  canRedo,
  isNotesMode,
  onToggleNotes,
  puzzleDate,
  onUpdateDate,
  puzzleStatus,
  onNewScan,
  onNewCreate
}) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(toInputDateTimeValue(puzzleDate));
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const filledCount = countFilled(grid);
  const isComplete = isBoardComplete(grid);
  const remainingCount = 81 - filledCount;

  const handleSaveDate = (e) => {
    e.preventDefault();
    if (dateValue) {
      onUpdateDate(new Date(dateValue).toISOString());
      setShowDatePicker(false);
    }
  };

  return (
    <div className="w-full max-w-[min(100vw-1.5rem,480px,52vh)] mx-auto mt-2 sm:mt-3 space-y-2 sm:space-y-2.5">
      {/* Top Bar: Timer, Status, Date */}
      <div className="bg-white rounded-xl p-2 sm:p-2.5 border border-slate-200 shadow-xs flex items-center justify-between">
        {/* Timer or Completion Badge */}
        {puzzleStatus === 'Finished' ? (
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Completed In</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-emerald-700 tracking-wider">
                {formatHumanDuration(completionTime || elapsedTime)}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isTimerRunning ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                {isTimerRunning ? 'Time Elapsed' : elapsedTime > 0 ? 'Paused' : 'Timer Ready'}
              </div>
              <div className="text-xs sm:text-sm font-bold font-mono text-slate-800 tracking-wider">
                {formatSeconds(elapsedTime)}
              </div>
            </div>
            <button
              onClick={onToggleTimer}
              className={`px-2 py-1 rounded-lg border text-xs font-bold transition-all flex items-center space-x-1 touch-manipulation ${
                isTimerRunning
                  ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  : elapsedTime > 0
                  ? 'bg-amber-500 border-amber-500 text-white shadow-xs hover:bg-amber-600 active:scale-95'
                  : 'bg-emerald-600 border-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-95'
              }`}
              title={isTimerRunning ? 'Pause Timer' : elapsedTime > 0 ? 'Resume Timer' : 'Start Timer'}
            >
              {isTimerRunning ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span className="hidden xs:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-white" />
                  <span>{elapsedTime > 0 ? 'Resume' : 'Start'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Date Display with Edit Trigger */}
        <div className="text-right">
          <button
            onClick={() => {
              setDateValue(toInputDateTimeValue(puzzleDate));
              setShowDatePicker(true);
            }}
            className="group flex items-center space-x-1 text-[11px] sm:text-xs text-slate-500 hover:text-blue-600 transition-colors ml-auto"
            title="Click to change puzzle date"
          >
            <Calendar className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
            <span className="font-medium underline decoration-dotted underline-offset-2 truncate max-w-[120px] sm:max-w-none">
              {formatDateTime(puzzleDate)}
            </span>
          </button>
          <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5">
            Filled: <span className="text-blue-600 font-bold">{filledCount}</span> / 81
          </div>
        </div>
      </div>

      {/* Action Buttons: Undo, Redo, Notes, Reset */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all touch-manipulation ${
            canUndo
              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 shadow-xs'
              : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
          }`}
          title="Undo move (Ctrl+Z)"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
          <span>Undo</span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all touch-manipulation ${
            canRedo
              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 shadow-xs'
              : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
          }`}
          title="Redo move (Ctrl+Y)"
        >
          <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
          <span>Redo</span>
        </button>

        <button
          onClick={onToggleNotes}
          className={`flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all active:scale-95 shadow-xs touch-manipulation ${
            isNotesMode
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-500/20'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
          title="Toggle Pencil/Notes mode (N)"
        >
          <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
          <span>{isNotesMode ? 'Notes ON' : 'Pencil'}</span>
        </button>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-[11px] sm:text-xs font-semibold transition-all active:scale-95 shadow-xs touch-manipulation"
          title="Reset board to initial puzzle"
        >
          <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* If already finished, display Solved & Verified status instead of asking to validate */}
      {puzzleStatus === 'Finished' ? (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 text-white shadow-lg shadow-emerald-500/20 text-center animate-pop">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <Trophy className="w-5 h-5 text-amber-300" />
            <span className="font-black text-base tracking-tight">Puzzle Completed & Validated!</span>
          </div>
          <p className="text-xs text-emerald-100">
            Successfully solved in{' '}
            <span className="font-mono font-bold text-white underline">
              {formatHumanDuration(completionTime || elapsedTime)}
            </span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {onNewScan && (
              <button
                onClick={onNewScan}
                className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-700 font-bold text-xs hover:bg-emerald-50 transition-colors shadow-sm"
              >
                Scan New Image
              </button>
            )}
            {onNewCreate && (
              <button
                onClick={onNewCreate}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-800 text-white font-bold text-xs transition-colors border border-emerald-400/30"
              >
                Create Puzzle
              </button>
            )}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-800 text-white font-medium text-xs transition-colors border border-emerald-400/30"
            >
              Replay
            </button>
          </div>
        </div>
      ) : (
        /* Validate Sudoku Option (User Requirement: option after all empty places got filled) */
        <div className="pt-0.5">
          <button
            onClick={onValidate}
            disabled={!isComplete}
            className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all shadow-xs touch-manipulation ${
              isComplete
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 animate-pulse cursor-pointer active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
            title={
              isComplete
                ? 'Click to validate your completed Sudoku puzzle!'
                : `Fill all ${remainingCount} remaining cells to validate.`
            }
          >
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="truncate">
              {isComplete
                ? 'Validate Sudoku (All Filled!)'
                : `Validate (${remainingCount} empty ${remainingCount === 1 ? 'place' : 'places'} left)`}
            </span>
          </button>
        </div>
      )}

      {/* Date Edit Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 animate-pop">
            <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Change Puzzle Date</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Puzzles are sorted and archived date-wise. You can set this to any desired date and time.
            </p>

            <form onSubmit={handleSaveDate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex space-x-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  Save Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 animate-pop">
            <div className="flex items-center space-x-2 text-amber-600 mb-2">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Reset Sudoku?</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              This will clear all your entered numbers, notes, and reset the timer back to 00:00. This action cannot be undone.
            </p>
            <div className="flex space-x-2 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onReset();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Yes, Reset Board & Timer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
