import React from 'react';
import { Grid3X3, Image as ImageIcon, BookOpen, PenTool, Sparkles, Calendar } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  autoHighlight,
  setAutoHighlight,
  currentPuzzleTitle,
  currentPuzzleDate,
  onEditDate
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('play')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Grid3X3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-none">Sudoku Lens</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                AI Vision
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Image Scanner & Interactive Solver</p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('play')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'play'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Play</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Scan Image</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'create'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Create Custom</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'library'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Archive</span>
          </button>
        </nav>

        {/* Right Settings: Pen & Paper Mode Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoHighlight(!autoHighlight)}
            title={
              autoHighlight
                ? 'Auto-Highlighting: ON (Click to switch to Pen & Paper mode)'
                : 'Pen & Paper Mode: ON (No automatic highlights or error warnings)'
            }
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              autoHighlight
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 shadow-sm'
            }`}
          >
            {autoHighlight ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Smart Hints</span>
                <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1 py-0.2 rounded font-bold">ON</span>
              </>
            ) : (
              <>
                <PenTool className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Pen & Paper</span>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1 py-0.2 rounded font-bold">PURE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
