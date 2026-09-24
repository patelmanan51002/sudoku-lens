import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Calendar, Check, BookOpen, Sparkles, X, Lightbulb } from 'lucide-react';
import { formatHumanDuration, formatDateTime } from '../utils/dateUtils';

export default function WinModal({
  puzzle,
  onClose,
  onGoToLibrary,
  onNewRandom
}) {
  useEffect(() => {
    // Launch celebratory confetti bursts
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#2563eb', '#10b981', '#f59e0b', '#ec4899']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#2563eb', '#10b981', '#f59e0b', '#ec4899']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const totalTime = puzzle?.completionTime || puzzle?.elapsedTime || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 animate-pop text-center relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-amber-900 shadow-xl shadow-amber-400/30 mb-3 sm:mb-4 animate-bounce">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Sudoku Solved!</h2>
        <p className="text-xs text-slate-500 mt-1">
          Every row, column, and 3x3 block is mathematically verified and correct!
        </p>

        {/* Completion Statistics Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 my-6 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Completion Time:</span>
            </span>
            <span className="font-mono font-bold text-sm text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              {formatHumanDuration(totalTime)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Date Completed:</span>
            </span>
            <span className="font-semibold text-slate-800">
              {formatDateTime(puzzle?.imageDate || puzzle?.createdAt)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Hints Used:</span>
            </span>
            <span className="font-semibold text-slate-800">
              {puzzle?.hintsUsed || 0} / 3
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Review Solved Board</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onGoToLibrary}
              className="py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>View Library</span>
            </button>

            <button
              onClick={onNewRandom}
              className="py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>New Puzzle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
