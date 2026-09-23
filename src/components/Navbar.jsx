import React from 'react';
import { Grid3X3, BookOpen, PenTool, Sparkles, User, LogOut, Cloud, PlusCircle, Smartphone, Keyboard } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  autoHighlight,
  setAutoHighlight,
  useNativeKeyboard = false,
  setUseNativeKeyboard,
  currentUser,
  onOpenAuth,
  onOpenAccount,
  onLogout,
  onOpenDifficulty
}) {
  const navItems = [
    { id: 'play', label: 'Play', icon: Grid3X3 },
    { id: 'new', label: 'New Game', shortLabel: 'New', icon: Sparkles, isAction: true },
    { id: 'create', label: 'Create Custom', shortLabel: 'Create', icon: PenTool },
    { id: 'library', label: 'Archive', shortLabel: 'Archive', icon: BookOpen }
  ];

  const handleNavClick = (item) => {
    if (item.isAction) {
      if (onOpenDifficulty) onOpenDifficulty();
    } else {
      setActiveTab(item.id);
    }
  };

  return (
    <>
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0"
            onClick={() => setActiveTab('play')}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Grid3X3 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                  Sudoku Lens
                </h1>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-0.5">
                  <Cloud className="w-2.5 h-2.5 inline text-blue-600 mr-0.5" />
                  <span>Cloud</span>
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                Interactive Sudoku & Cloud Solver
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Hidden on mobile < md) */}
          <nav className="hidden md:flex items-center p-1 bg-slate-100 rounded-xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    item.isAction
                      ? 'text-blue-700 hover:bg-blue-50'
                      : isActive
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.isAction ? 'text-blue-600' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Mode Toggle & Account */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Auto-Highlighting / Pen & Paper Toggle */}
            <button
              onClick={() => setAutoHighlight(!autoHighlight)}
              title={
                autoHighlight
                  ? 'Smart Hints: ON (Tap to switch to Pen & Paper mode)'
                  : 'Pen & Paper Mode: PURE (No assistance or warnings)'
              }
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                autoHighlight
                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 shadow-sm'
              }`}
            >
              {autoHighlight ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="hidden sm:inline">Smart Hints</span>
                  <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1 py-0.2 rounded font-bold">
                    ON
                  </span>
                </>
              ) : (
                <>
                  <PenTool className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="hidden sm:inline">Pen & Paper</span>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1 py-0.2 rounded font-bold">
                    PURE
                  </span>
                </>
              )}
            </button>

            {/* Mobile Keyboard / Web Keypad Mode Toggle */}
            <button
              onClick={() => setUseNativeKeyboard?.(!useNativeKeyboard)}
              title={
                useNativeKeyboard
                  ? 'Input Mode: Phone / Android Keyboard (Click to switch to Web Keypad)'
                  : 'Input Mode: Web Keypad (Click to switch to Phone / Android Keyboard)'
              }
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                useNativeKeyboard
                  ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
              }`}
            >
              {useNativeKeyboard ? (
                <>
                  <Keyboard className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="hidden md:inline">Phone Keys</span>
                  <span className="text-[10px] bg-purple-200/80 text-purple-900 px-1 py-0.2 rounded font-bold">
                    ON
                  </span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="hidden md:inline">Web Keypad</span>
                  <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1 py-0.2 rounded font-bold">
                    PAD
                  </span>
                </>
              )}
            </button>

            {/* User Account / Profile */}
            {currentUser ? (
              <div className="flex items-center space-x-1.5 bg-slate-100/90 pl-1.5 pr-1 py-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={onOpenAccount}
                  title="View Account Details & Mobile Sync"
                  className="flex items-center space-x-1.5 hover:opacity-80 transition-opacity text-left cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                  <div className="hidden lg:block text-left pr-1">
                    <div className="text-[11px] font-bold text-slate-800 leading-none truncate max-w-[80px]">
                      {currentUser.displayName || currentUser.email.split('@')[0]}
                    </div>
                    <div className="flex items-center space-x-0.5 text-[9px] text-emerald-600 font-semibold mt-0.5">
                      <Cloud className="w-2.5 h-2.5" />
                      <span>Account</span>
                    </div>
                  </div>
                </button>

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
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile screens < md) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg px-2 pt-1.5 pb-2 md:hidden"
      >
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  item.isAction
                    ? 'text-blue-600 font-bold active:scale-95'
                    : isActive
                    ? 'text-blue-600 bg-blue-50/80 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                <span className="text-[10px] leading-tight tracking-tight">
                  {item.shortLabel || item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
