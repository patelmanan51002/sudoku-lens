import React from 'react';
import { Grid3X3, Image as ImageIcon, BookOpen, PenTool, Sparkles, User, LogOut, Cloud } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  autoHighlight,
  setAutoHighlight,
  currentUser,
  onOpenAuth,
  onLogout
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

        {/* Right Settings: Pen & Paper Mode Toggle + User Account Button */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setAutoHighlight(!autoHighlight)}
            title={
              autoHighlight
                ? 'Auto-Highlighting: ON (Click to switch to Pen & Paper mode)'
                : 'Pen & Paper Mode: ON (No automatic highlights or error warnings)'
            }
            className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              autoHighlight
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 shadow-sm'
            }`}
          >
            {autoHighlight ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">Smart Hints</span>
                <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1 py-0.2 rounded font-bold">ON</span>
              </>
            ) : (
              <>
                <PenTool className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden md:inline">Pen & Paper</span>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1 py-0.2 rounded font-bold">PURE</span>
              </>
            )}
          </button>

          {/* User Account / Cloud Sync Button */}
          {currentUser ? (
            <div className="flex items-center space-x-2 bg-slate-100/90 pl-2 pr-1 py-1 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-1.5">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-[11px] font-bold text-slate-800 leading-none truncate max-w-[90px]">
                    {currentUser.displayName || currentUser.email.split('@')[0]}
                  </div>
                  <div className="flex items-center space-x-0.5 text-[9px] text-emerald-600 font-semibold mt-0.5">
                    <Cloud className="w-2.5 h-2.5" />
                    <span>Synced</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
