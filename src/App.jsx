import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import SudokuBoard from './components/SudokuBoard';
import ControlPanel from './components/ControlPanel';
import Keypad from './components/Keypad';
import DifficultyModal from './components/DifficultyModal';
import LibraryView from './components/LibraryView';
import WinModal from './components/WinModal';
import ManualCreator from './components/ManualCreator';
import AuthModal from './components/AuthModal';
import AccountModal from './components/AccountModal';
import { createRandomPuzzle, formatDifficulty } from './services/sudokuGenerator';
import { useAuth } from './contexts/AuthContext';
import { importAccountSyncPayload } from './services/firebase';
import {
  fetchUserPuzzles,
  syncUserPuzzle,
  removeUserPuzzle,
  subscribeToUserPuzzles,
  subscribeToUserTombstones,
  mergePuzzles
} from './services/cloudSync';
import {
  getSavedPuzzles,
  savePuzzle,
  deletePuzzle,
  updatePuzzleDateTime,
  getActivePuzzleId,
  setActivePuzzleId,
  getSettings,
  saveSettings,
  createSamplePuzzle,
  getDeletedPuzzleIds
} from './utils/storage';
import { validateSudoku, isBoardComplete } from './utils/sudokuSolver';
import { getSystemDateTimeISO } from './utils/dateUtils';

export default function App() {
  const { currentUser, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [authToast, setAuthToast] = useState(null);

  // Handle cross-device mobile sync link (?sync=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const syncData = params.get('sync');
      if (syncData) {
        const user = importAccountSyncPayload(syncData);
        if (user) {
          const name = user.displayName || user.email.split('@')[0];
          setAuthToast({
            type: 'success',
            message: `🎉 Account & puzzles synchronized on this device! Welcome, ${name}!`
          });
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    } catch (e) {
      console.warn('Sync link import error:', e);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setAuthToast({ type: 'info', message: 'Logged out successfully.' });
      setTimeout(() => setAuthToast(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const [puzzles, setPuzzles] = useState(() => getSavedPuzzles());
  const [activeId, setActiveId] = useState(() => getActivePuzzleId());
  const [activeTab, setActiveTab] = useState('play'); // 'play', 'upload', 'create', 'library'

  // Settings: Auto-Highlighting (Pen & Paper mode when false) & Mobile Input Preference
  const [settings, setSettingsState] = useState(() => getSettings());
  const autoHighlight = settings.autoHighlight;
  const useNativeKeyboard = settings.useNativeKeyboard ?? false;

  const setAutoHighlight = (val) => {
    const updated = { ...settings, autoHighlight: val };
    setSettingsState(updated);
    saveSettings(updated);
  };

  const setUseNativeKeyboard = (val) => {
    const updated = { ...settings, useNativeKeyboard: val };
    setSettingsState(updated);
    saveSettings(updated);
  };

  // Synchronize with user account on login or refresh
  useEffect(() => {
    if (!currentUser) {
      const local = getSavedPuzzles();
      setPuzzles(local);
      return;
    }

    let unsubPuzzles = () => {};
    let unsubTombstones = () => {};
    let isMounted = true;

    (async () => {
      try {
        const localList = getSavedPuzzles();
        const cloudList = await fetchUserPuzzles(currentUser.uid);
        if (!isMounted) return;

        const deletedIds = getDeletedPuzzleIds();
        // Merge local puzzles with Firestore puzzles without data loss and respecting deletions
        const { merged, toSyncToCloud } = mergePuzzles(localList, cloudList, deletedIds);

        setPuzzles(merged);
        try {
          localStorage.setItem('sudoku_app_puzzles_v2', JSON.stringify(merged));
        } catch (e) {}

        const currentActiveId = getActivePuzzleId();
        if (merged.some((p) => p.id === currentActiveId)) {
          setActiveId(currentActiveId);
        } else if (merged.length > 0) {
          setActiveId(merged[0].id);
          setActivePuzzleId(merged[0].id);
        }

        // Push local-only or newer puzzles up to cloud
        for (const p of toSyncToCloud) {
          await syncUserPuzzle(currentUser.uid, p);
        }

        // Real-time listener for cross-device puzzle updates
        unsubPuzzles = subscribeToUserPuzzles(currentUser.uid, (remoteList) => {
          if (!isMounted) return;
          setPuzzles((prevList) => {
            const currentDeleted = getDeletedPuzzleIds();
            const { merged: updatedMerged } = mergePuzzles(prevList, remoteList, currentDeleted);
            try {
              localStorage.setItem('sudoku_app_puzzles_v2', JSON.stringify(updatedMerged));
            } catch (e) {}
            return updatedMerged;
          });
        });

        // Real-time listener for cross-device deletions (tombstones)
        unsubTombstones = subscribeToUserTombstones(currentUser.uid, (deletedId) => {
          if (!isMounted) return;
          setPuzzles((prevList) => {
            const updated = prevList.filter((p) => p.id !== deletedId);
            try {
              localStorage.setItem('sudoku_app_puzzles_v2', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        });
      } catch (err) {
        console.error('Cloud sync error:', err);
      }
    })();

    return () => {
      isMounted = false;
      unsubPuzzles();
      unsubTombstones();
    };
  }, [currentUser]);

  // Find active puzzle
  const currentPuzzle = puzzles.find((p) => p.id === activeId) || puzzles[0] || createSamplePuzzle();

  // Selected cell on board
  const [selectedCell, setSelectedCell] = useState(null);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [validationAlert, setValidationAlert] = useState(null);
  const [showWinModal, setShowWinModal] = useState(false);

  // Difficulty modal & generator state
  const [isDifficultyModalOpen, setIsDifficultyModalOpen] = useState(false);
  const [isGeneratingPuzzle, setIsGeneratingPuzzle] = useState(false);

  // Active puzzle shorthand refs
  const grid = currentPuzzle.currentGrid;
  const givenGrid = currentPuzzle.givenGrid;
  const notes = currentPuzzle.notes || {};
  const history = currentPuzzle.history || [];
  const redoStack = currentPuzzle.redoStack || [];
  const isFinished = currentPuzzle.status === 'Finished';

  // Auto-save helper: updates active puzzle state, localStorage, and fires event sync
  const updateCurrentPuzzle = useCallback((patch, forceImmediateSync = false) => {
    const updatedTime = getSystemDateTimeISO();
    const targetPuzzle = puzzles.find((p) => p.id === activeId) || currentPuzzle;
    if (!targetPuzzle) return;

    const prevStatus = targetPuzzle.status;
    const candidate = {
      ...targetPuzzle,
      ...patch,
      updatedAt: updatedTime
    };

    const saved = savePuzzle(candidate);
    if (!saved) return;

    setPuzzles((prevList) => {
      const idx = prevList.findIndex((p) => p.id === saved.id);
      if (idx === -1) return [saved, ...prevList];
      const copy = [...prevList];
      copy[idx] = saved;
      return copy;
    });

    if (currentUser) {
      const statusChanged = prevStatus !== saved.status;
      const isFinished = saved.status === 'Finished';

      syncUserPuzzle(currentUser.uid, saved).catch((err) => {
        console.warn('Event cloud sync failed:', err);
      });

      if (statusChanged || isFinished || forceImmediateSync) {
        console.log(`[Event Sync] Priority sync fired: id=${saved.id}, prevStatus=${prevStatus}, status=${saved.status}, force=${forceImmediateSync}`);
      }
    }
  }, [activeId, currentPuzzle, currentUser, puzzles]);

  // Start timer explicitly with status transition & immediate event sync
  const handleStartTimer = () => {
    setIsTimerRunning(true);
    if (currentPuzzle) {
      const newStatus = currentPuzzle.status === 'Finished' ? 'Finished' : 'In Progress';
      updateCurrentPuzzle({
        status: newStatus,
        elapsedTime: currentPuzzle.elapsedTime || 0
      }, true);
    }
  };

  // Toggle timer (Start / Pause / Resume) with prioritized event sync
  const handleToggleTimer = () => {
    const nextRunning = !isTimerRunning;
    setIsTimerRunning(nextRunning);

    if (currentPuzzle) {
      const newStatus = currentPuzzle.status === 'Finished'
        ? 'Finished'
        : nextRunning
        ? 'In Progress'
        : currentPuzzle.status;

      updateCurrentPuzzle({
        elapsedTime: currentPuzzle.elapsedTime || 0,
        status: newStatus
      }, true);
    }
  };

  // Live Timer
  useEffect(() => {
    if (isFinished || !isTimerRunning || activeTab !== 'play') return;

    const timer = setInterval(() => {
      setPuzzles((prevList) => {
        const idx = prevList.findIndex((p) => p.id === activeId);
        if (idx === -1) return prevList;
        const p = prevList[idx];
        if (p.status === 'Finished') return prevList;

        const updatedTime = (p.elapsedTime || 0) + 1;
        const updated = { ...p, elapsedTime: updatedTime };
        // Save to storage every 3 seconds to keep progress updated
        if (updatedTime % 3 === 0) {
          savePuzzle(updated);
        }
        // Periodic sync to cloud every 15 seconds
        if (currentUser && updatedTime % 15 === 0) {
          syncUserPuzzle(currentUser.uid, updated);
        }
        const copy = [...prevList];
        copy[idx] = updated;
        return copy;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeId, isFinished, isTimerRunning, activeTab, currentUser]);

  // Pause timer when tab is hidden and save current time
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsTimerRunning(false);
        if (currentPuzzle) {
          updateCurrentPuzzle({ elapsedTime: currentPuzzle.elapsedTime || 0 });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [currentPuzzle, updateCurrentPuzzle]);

  // Cell Selection
  const handleSelectCell = (cell) => {
    setSelectedCell(cell);
    setValidationAlert(null);
  };

  // Input Digit (1-9)
  const handleInputDigit = (digit) => {
    if (!selectedCell || isFinished) return;
    if (!isTimerRunning) {
      setValidationAlert({
        type: 'warning',
        message: 'Timer is paused or not started. Click "Start Timer" or "Resume" to play!'
      });
      return;
    }
    const { r, c } = selectedCell;

    // Cannot modify initial given numbers
    if (givenGrid[r][c] > 0) return;

    const cellKey = `${r},${c}`;

    if (isNotesMode) {
      // Toggle note
      const currentNotes = notes[cellKey] ? [...notes[cellKey]] : [];
      const noteIdx = currentNotes.indexOf(digit);
      let newNotes;
      if (noteIdx >= 0) {
        newNotes = currentNotes.filter((n) => n !== digit);
      } else {
        newNotes = [...currentNotes, digit].sort();
      }

      const newNotesObj = { ...notes, [cellKey]: newNotes };
      const move = {
        type: 'notes',
        r,
        c,
        prevNotes: currentNotes,
        newNotes
      };

      updateCurrentPuzzle({
        notes: newNotesObj,
        history: [...history, move],
        redoStack: []
      });
    } else {
      // Normal digit input
      const prevVal = grid[r][c];
      if (prevVal === digit) return; // already set

      const newGrid = grid.map((row) => [...row]);
      newGrid[r][c] = digit;

      // Also clean up notes for this cell and related peers if auto-clearing
      const prevCellNotes = notes[cellKey] ? [...notes[cellKey]] : [];
      const newNotesObj = { ...notes };
      delete newNotesObj[cellKey];

      const move = {
        type: 'cell',
        r,
        c,
        prevVal,
        newVal: digit,
        prevNotes: prevCellNotes
      };

      updateCurrentPuzzle({
        currentGrid: newGrid,
        notes: newNotesObj,
        history: [...history, move],
        redoStack: []
      });
    }
  };

  // Erase Cell
  const handleErase = () => {
    if (!selectedCell || isFinished) return;
    if (!isTimerRunning) {
      setValidationAlert({
        type: 'warning',
        message: 'Timer is paused or not started. Click "Start Timer" or "Resume" to play!'
      });
      return;
    }
    const { r, c } = selectedCell;
    if (givenGrid[r][c] > 0) return;

    const cellKey = `${r},${c}`;
    const prevVal = grid[r][c];
    const prevCellNotes = notes[cellKey] ? [...notes[cellKey]] : [];

    if (prevVal === 0 && prevCellNotes.length === 0) return;

    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = 0;

    const newNotesObj = { ...notes };
    delete newNotesObj[cellKey];

    const move = {
      type: 'erase',
      r,
      c,
      prevVal,
      newVal: 0,
      prevNotes: prevCellNotes
    };

    updateCurrentPuzzle({
      currentGrid: newGrid,
      notes: newNotesObj,
      history: [...history, move],
      redoStack: []
    });
  };

  // Undo
  const handleUndo = () => {
    if (history.length === 0 || isFinished) return;
    if (!isTimerRunning) {
      setValidationAlert({
        type: 'warning',
        message: 'Timer is paused or not started. Click "Start Timer" or "Resume" to play!'
      });
      return;
    }
    const lastMove = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    const { r, c, type } = lastMove;
    const cellKey = `${r},${c}`;

    if (type === 'notes') {
      const newNotesObj = { ...notes, [cellKey]: lastMove.prevNotes || [] };
      updateCurrentPuzzle({
        notes: newNotesObj,
        history: newHistory,
        redoStack: [...redoStack, lastMove]
      });
    } else {
      const newGrid = grid.map((row) => [...row]);
      newGrid[r][c] = lastMove.prevVal;

      const newNotesObj = { ...notes };
      if (lastMove.prevNotes && lastMove.prevNotes.length > 0) {
        newNotesObj[cellKey] = lastMove.prevNotes;
      }

      updateCurrentPuzzle({
        currentGrid: newGrid,
        notes: newNotesObj,
        history: newHistory,
        redoStack: [...redoStack, lastMove]
      });
    }
    setSelectedCell({ r, c });
  };

  // Redo
  const handleRedo = () => {
    if (redoStack.length === 0 || isFinished) return;
    if (!isTimerRunning) {
      setValidationAlert({
        type: 'warning',
        message: 'Timer is paused or not started. Click "Start Timer" or "Resume" to play!'
      });
      return;
    }
    const nextMove = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);

    const { r, c, type } = nextMove;
    const cellKey = `${r},${c}`;

    if (type === 'notes') {
      const newNotesObj = { ...notes, [cellKey]: nextMove.newNotes || [] };
      updateCurrentPuzzle({
        notes: newNotesObj,
        history: [...history, nextMove],
        redoStack: newRedo
      });
    } else {
      const newGrid = grid.map((row) => [...row]);
      newGrid[r][c] = nextMove.newVal;

      const newNotesObj = { ...notes };
      delete newNotesObj[cellKey];

      updateCurrentPuzzle({
        currentGrid: newGrid,
        notes: newNotesObj,
        history: [...history, nextMove],
        redoStack: newRedo
      });
    }
    setSelectedCell({ r, c });
  };

  // Reset Board to initial given digits and reset timer
  const handleReset = () => {
    setIsTimerRunning(false);
    const initialGrid = givenGrid.map((row) => [...row]);
    updateCurrentPuzzle({
      currentGrid: initialGrid,
      elapsedTime: 0,
      notes: {},
      history: [],
      redoStack: [],
      status: 'Untouched',
      completionTime: null
    }, true);
    setValidationAlert({
      type: 'info',
      message: 'Puzzle and timer have been reset. Click "Start Timer" when you are ready to play!'
    });
  };

  // Validate Sudoku (called manually or automatically when board is completely filled)
  const handleValidate = useCallback((boardToValidate = grid) => {
    const res = validateSudoku(boardToValidate);
    if (res.isValid) {
      const finalTime = currentPuzzle.elapsedTime || 1;
      setIsTimerRunning(false);
      updateCurrentPuzzle({
        status: 'Finished',
        completionTime: finalTime,
        elapsedTime: finalTime
      }, true);
      setShowWinModal(true);
      setValidationAlert({ type: 'success', message: res.message });
    } else {
      setValidationAlert({ type: 'error', message: res.message });
    }
  }, [grid, currentPuzzle.elapsedTime, updateCurrentPuzzle]);

  // Auto-validate Sudoku when all the cells are filled (no need to press button externally)
  const lastAutoValidatedGridRef = useRef(null);

  useEffect(() => {
    lastAutoValidatedGridRef.current = null;
  }, [activeId]);

  useEffect(() => {
    if (isFinished || !grid) return;

    if (isBoardComplete(grid)) {
      const gridKey = grid.map((r) => r.join('')).join('');
      if (lastAutoValidatedGridRef.current !== gridKey) {
        lastAutoValidatedGridRef.current = gridKey;
        handleValidate(grid);
      }
    } else {
      lastAutoValidatedGridRef.current = null;
    }
  }, [grid, isFinished, handleValidate]);

  // Select puzzle from library
  const handleSelectPuzzle = (id) => {
    setActiveId(id);
    setActivePuzzleId(id);
    setActiveTab('play');
    setSelectedCell(null);
    setValidationAlert(null);
    setIsTimerRunning(false);
  };

  // Delete puzzle with cross-device sync
  const handleDeletePuzzle = async (id) => {
    const updated = deletePuzzle(id);
    setPuzzles(updated);
    if (activeId === id) {
      const nextId = updated[0]?.id || '';
      setActiveId(nextId);
      setActivePuzzleId(nextId);
      setIsTimerRunning(false);
    }
    if (currentUser) {
      await removeUserPuzzle(currentUser.uid, id);
    }
  };

  // Regenerate puzzle: Discards current untouched puzzle and generates a fresh one of the same difficulty
  const handleRegeneratePuzzle = async () => {
    if (isGeneratingPuzzle) return;
    const previousId = currentPuzzle.id;
    const diff = currentPuzzle.difficulty || 'medium';

    setIsGeneratingPuzzle(true);
    try {
      // 1. Generate a new puzzle of the same difficulty
      const newPuzzle = await createRandomPuzzle(diff);

      // 2. Discard previous untouched puzzle from storage, Firestore, and state
      deletePuzzle(previousId);
      if (currentUser) {
        await removeUserPuzzle(currentUser.uid, previousId);
      }

      // 3. Save new puzzle
      const saved = savePuzzle(newPuzzle);
      setPuzzles((prevList) => [
        saved,
        ...prevList.filter((p) => p.id !== previousId && p.id !== saved.id)
      ]);
      setActiveId(newPuzzle.id);
      setActivePuzzleId(newPuzzle.id);
      setSelectedCell(null);
      setIsTimerRunning(false);

      if (currentUser && saved) {
        await syncUserPuzzle(currentUser.uid, saved);
      }

      setValidationAlert({
        type: 'info',
        message: `🔄 Re-rolled a fresh ${formatDifficulty(diff)} Sudoku! Previous untouched puzzle discarded.`
      });
      setTimeout(() => setValidationAlert(null), 3500);
    } catch (err) {
      console.error('Failed to regenerate puzzle:', err);
      setValidationAlert({
        type: 'error',
        message: 'Failed to re-roll puzzle. Please try again.'
      });
    } finally {
      setIsGeneratingPuzzle(false);
    }
  };

  // Update puzzle date
  const handleUpdatePuzzleDate = async (id, newDateISO) => {
    const updated = updatePuzzleDateTime(id, newDateISO);
    if (updated) {
      setPuzzles(getSavedPuzzles());
      if (currentUser) {
        await syncUserPuzzle(currentUser.uid, updated);
      }
    }
  };

  // Generate random Sudoku by difficulty (Easy, Medium, Hard, Expert)
  const handleGenerateNewPuzzle = async (difficulty = 'medium') => {
    setIsGeneratingPuzzle(true);
    try {
      const newPuzzle = await createRandomPuzzle(difficulty);
      const saved = savePuzzle(newPuzzle);
      setPuzzles((prev) => [saved, ...prev]);
      setActiveId(newPuzzle.id);
      setActivePuzzleId(newPuzzle.id);
      setActiveTab('play');
      setSelectedCell(null);
      setValidationAlert(null);
      setIsTimerRunning(false);
      setIsDifficultyModalOpen(false);

      if (currentUser && saved) {
        await syncUserPuzzle(currentUser.uid, saved);
      }
    } catch (err) {
      console.error('Failed to generate puzzle:', err);
      setValidationAlert({
        type: 'error',
        message: 'Failed to generate a new puzzle. Please try again.'
      });
    } finally {
      setIsGeneratingPuzzle(false);
    }
  };

  // Create custom Sudoku manually
  const handleCreateCustomPuzzle = async (customData) => {
    const newId = 'sudoku-custom-' + Date.now();
    const newPuzzle = {
      id: newId,
      title: customData.title || 'My Custom Sudoku',
      imageDate: customData.imageDate || getSystemDateTimeISO(),
      createdAt: getSystemDateTimeISO(),
      updatedAt: getSystemDateTimeISO(),
      thumbnailUrl: null,
      givenGrid: customData.givenGrid,
      currentGrid: customData.givenGrid.map((r) => [...r]),
      solutionGrid: null,
      notes: {},
      history: [],
      redoStack: [],
      status: 'Untouched',
      elapsedTime: 0,
      completionTime: null,
      hasCheckerboard: customData.hasCheckerboard ?? true
    };

    const saved = savePuzzle(newPuzzle);
    setPuzzles((prev) => [saved, ...prev]);
    setActiveId(newId);
    setActivePuzzleId(newId);
    setActiveTab('play');
    setSelectedCell(null);
    setIsTimerRunning(false);

    if (currentUser && saved) {
      await syncUserPuzzle(currentUser.uid, saved);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        autoHighlight={autoHighlight}
        setAutoHighlight={setAutoHighlight}
        useNativeKeyboard={useNativeKeyboard}
        setUseNativeKeyboard={setUseNativeKeyboard}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAccount={() => setIsAccountModalOpen(true)}
        onLogout={handleLogout}
        onOpenDifficulty={() => setIsDifficultyModalOpen(true)}
      />

      {/* Auth Floating Toast Notification */}
      {authToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-pop px-4">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-xl border flex items-center space-x-2 text-xs font-bold ${
              authToast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                : 'bg-slate-900 text-white border-slate-700 shadow-slate-900/40'
            }`}
          >
            <span>{authToast.message}</span>
            <button
              onClick={() => setAuthToast(null)}
              className="ml-2 text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pt-2 sm:pt-6 pb-24 md:pb-8 px-2 sm:px-6">
        {activeTab === 'play' && (
          <div className="max-w-2xl mx-auto flex flex-col items-center">
            {/* Validation Banner if error or feedback */}
            {validationAlert && (
              <div
                className={`w-full max-w-[480px] mb-3 p-3 rounded-xl border text-xs font-semibold flex items-center justify-between animate-pop ${
                  validationAlert.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : validationAlert.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : validationAlert.type === 'info'
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <span>{validationAlert.message}</span>
                <button
                  onClick={() => setValidationAlert(null)}
                  className="ml-2 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Active Puzzle Header: Title, Level Badge, and Regenerate button */}
            <div className="w-full max-w-[min(100vw-1.5rem,480px,52vh)] mx-auto mb-2 flex items-center justify-between px-1">
              <div className="flex items-center space-x-2 truncate">
                <span className="font-extrabold text-sm sm:text-base text-slate-800 truncate">
                  {currentPuzzle.title || 'Sudoku Puzzle'}
                </span>
                {currentPuzzle.difficulty && (
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shrink-0 ${
                      currentPuzzle.difficulty === 'easy'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentPuzzle.difficulty === 'medium'
                        ? 'bg-blue-100 text-blue-800'
                        : currentPuzzle.difficulty === 'hard'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {formatDifficulty(currentPuzzle.difficulty)}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                {currentPuzzle.status === 'Untouched' && (
                  <button
                    onClick={handleRegeneratePuzzle}
                    disabled={isGeneratingPuzzle}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all active:scale-95 shadow-2xs group"
                    title="Don't like this puzzle? Re-roll another! The untouched puzzle won't be saved."
                  >
                    <span className="text-xs group-hover:rotate-180 transition-transform duration-300">🎲</span>
                    <span className="hidden xs:inline">Re-roll</span>
                  </button>
                )}
                <button
                  onClick={() => setIsDifficultyModalOpen(true)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all active:scale-95"
                  title="Choose difficulty level"
                >
                  <span>Level</span>
                </button>
              </div>
            </div>

            {/* 9x9 Sudoku Board */}
            <SudokuBoard
              grid={grid}
              givenGrid={givenGrid}
              notes={notes}
              selectedCell={selectedCell}
              onSelectCell={handleSelectCell}
              onInputDigit={handleInputDigit}
              onErase={handleErase}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onToggleNotes={() => setIsNotesMode(!isNotesMode)}
              isNotesMode={isNotesMode}
              hasCheckerboard={currentPuzzle.hasCheckerboard ?? true}
              autoHighlight={autoHighlight}
              useNativeKeyboard={useNativeKeyboard}
              isTimerRunning={isTimerRunning}
              elapsedTime={currentPuzzle.elapsedTime || 0}
              onStartTimer={handleStartTimer}
              isFinished={isFinished}
            />

            {/* Control Panel: Undo, Redo, Reset, Validate, Timer, Date */}
            <ControlPanel
              grid={grid}
              elapsedTime={currentPuzzle.elapsedTime || 0}
              completionTime={currentPuzzle.completionTime}
              isTimerRunning={isTimerRunning}
              onToggleTimer={handleToggleTimer}
              onStartTimer={handleStartTimer}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onReset={handleReset}
              onValidate={handleValidate}
              canUndo={history.length > 0 && !isFinished && isTimerRunning}
              canRedo={redoStack.length > 0 && !isFinished && isTimerRunning}
              isNotesMode={isNotesMode}
              onToggleNotes={() => setIsNotesMode(!isNotesMode)}
              puzzleDate={currentPuzzle.imageDate || currentPuzzle.createdAt}
              onUpdateDate={(newDate) => handleUpdatePuzzleDate(currentPuzzle.id, newDate)}
              puzzleStatus={currentPuzzle.status}
              onNewRandom={() => setIsDifficultyModalOpen(true)}
              onNewCreate={() => setActiveTab('create')}
              onRegenerate={handleRegeneratePuzzle}
              isUntouched={currentPuzzle.status === 'Untouched'}
            />

            {/* On-Screen Keypad with remaining counts and erase button */}
            <Keypad
              grid={grid}
              onInputDigit={handleInputDigit}
              onErase={handleErase}
              isNotesMode={isNotesMode}
              onToggleNotes={() => setIsNotesMode(!isNotesMode)}
              autoHighlight={autoHighlight}
              isFinished={isFinished}
              isTimerRunning={isTimerRunning}
              onStartTimer={handleStartTimer}
              useNativeKeyboard={useNativeKeyboard}
              onToggleNativeKeyboard={setUseNativeKeyboard}
              selectedDigit={selectedCell ? grid?.[selectedCell.r]?.[selectedCell.c] : null}
            />
          </div>
        )}

        {activeTab === 'create' && (
          <ManualCreator
            onCreatePuzzle={handleCreateCustomPuzzle}
            onCancel={() => setActiveTab('play')}
          />
        )}

        {activeTab === 'library' && (
          <LibraryView
            puzzles={puzzles}
            activePuzzleId={activeId}
            onSelectPuzzle={handleSelectPuzzle}
            onDeletePuzzle={handleDeletePuzzle}
            onUpdatePuzzleDate={handleUpdatePuzzleDate}
            onNewRandom={() => setIsDifficultyModalOpen(true)}
            onNewCreate={() => setActiveTab('create')}
          />
        )}
      </main>

      {/* Difficulty Selection & Random Puzzle Generator Modal */}
      <DifficultyModal
        isOpen={isDifficultyModalOpen}
        onClose={() => setIsDifficultyModalOpen(false)}
        onSelectDifficulty={handleGenerateNewPuzzle}
        isGenerating={isGeneratingPuzzle}
      />

      {/* Win Celebration Modal */}
      {showWinModal && (
        <WinModal
          puzzle={currentPuzzle}
          onClose={() => setShowWinModal(false)}
          onGoToLibrary={() => {
            setShowWinModal(false);
            setActiveTab('library');
          }}
          onNewRandom={() => {
            setShowWinModal(false);
            setIsDifficultyModalOpen(true);
          }}
        />
      )}

      {/* User Authentication & Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(msg) => {
          setAuthToast({ type: 'success', message: msg });
          setTimeout(() => setAuthToast(null), 4000);
        }}
      />

      {/* Account Details & Management Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        puzzles={puzzles}
        onAccountDeleted={() => {
          setPuzzles([]);
          setActiveId('');
          setAuthToast({
            type: 'info',
            message: 'Your account and all saved puzzles have been permanently deleted.'
          });
        }}
        onToast={(t) => {
          setAuthToast(t);
          setTimeout(() => setAuthToast(null), 4000);
        }}
      />
    </div>
  );
}
