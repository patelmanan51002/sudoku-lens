import React, { useState } from 'react';
import { X, Sparkles, Zap, Shield, Flame, Trophy, Loader2 } from 'lucide-react';

const DIFFICULTIES = [
  {
    id: 'easy',
    name: 'Easy',
    icon: Zap,
    color: 'emerald',
    badge: 'Beginner',
    clues: '~44–48 clues',
    description: 'Relaxed and gentle. Perfect for beginners and casual solving.'
  },
  {
    id: 'medium',
    name: 'Medium',
    icon: Shield,
    color: 'blue',
    badge: 'Popular',
    clues: '~36–40 clues',
    description: 'Balanced challenge. Requires standard row, column, and block logic.'
  },
  {
    id: 'hard',
    name: 'Hard',
    icon: Flame,
    color: 'amber',
    badge: 'Challenging',
    clues: '~30–34 clues',
    description: 'Intense deduction. Pencil notes and candidate elimination recommended.'
  },
  {
    id: 'expert',
    name: 'Expert',
    icon: Trophy,
    color: 'rose',
    badge: 'Master',
    clues: '~24–28 clues',
    description: 'Minimal clues. For seasoned Sudoku veterans seeking the ultimate test.'
  }
];

export default function DifficultyModal({ isOpen, onClose, onSelectDifficulty, isGenerating = false }) {
  const [selected, setSelected] = useState('medium');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onSelectDifficulty && !isGenerating) {
      onSelectDifficulty(selected);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 animate-pop relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            New Random Sudoku
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Select your preferred difficulty level to generate a fresh puzzle
          </p>
        </div>

        {/* Difficulty Selection Cards */}
        <div className="space-y-2.5 mb-6">
          {DIFFICULTIES.map((diff) => {
            const Icon = diff.icon;
            const isChosen = selected === diff.id;

            const borderClass = isChosen
              ? diff.color === 'emerald'
                ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/30'
                : diff.color === 'blue'
                ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/30'
                : diff.color === 'amber'
                ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/30'
                : 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/30'
              : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80';

            const iconBgClass =
              diff.color === 'emerald'
                ? 'bg-emerald-100 text-emerald-700'
                : diff.color === 'blue'
                ? 'bg-blue-100 text-blue-700'
                : diff.color === 'amber'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700';

            return (
              <div
                key={diff.id}
                onClick={() => setSelected(diff.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 text-left ${borderClass}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconBgClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">{diff.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      {diff.clues}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    {diff.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleConfirm}
          disabled={isGenerating}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Puzzle...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Start {DIFFICULTIES.find((d) => d.id === selected)?.name} Puzzle</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
