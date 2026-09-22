import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import SudokuBoard from './components/SudokuBoard';
import ControlPanel from './components/ControlPanel';
import Keypad from './components/Keypad';
import ImageUploader from './components/ImageUploader';
import ReviewModal from './components/ReviewModal';
import LibraryView from './components/LibraryView';
import WinModal from './components/WinModal';
import ManualCreator from './components/ManualCreator';
import {
  getSavedPuzzles,
  savePuzzle,
  deletePuzzle,
  updatePuzzleDateTime,
  getActivePuzzleId,
  setActivePuzzleId,
  getSettings,
  saveSettings,
  createSamplePuzzle
} from './utils/storage';
import { validateSudoku, isBoardComplete } from './utils/sudokuSolver';
import { getSystemDateTimeISO } from './utils/dateUtils';

export default function App() {
  const [puzzles, setPuzzles] = useState(() => getSavedPuzzles());
  const [activeId, setActiveId] = useState(() => getActivePuzzleId());
  const [activeTab, setActiveTab] = useState('play'); // 'play', 'upload', 'library'

  // Settings: Auto-Highlighting (Pen & Paper mode when false)
  const [settings, setSettingsState] = useState(() => getSettings());
  const autoHighlight = settings.autoHighlight;

  const setAutoHighlight = (val) => {
    const updated = { ...settings, autoHighlight: val };
    setSettingsState(updated);
    saveSettings(updated);
  };

  // Find active puzzle
  const currentPuzzle = puzzles.find((p) => p.id === activeId) || puzzles[0] || createSamplePuzzle();

  // Selected cell on board
  const [selectedCell, setSelectedCell] = useState(null);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [validationAlert, setValidationAlert] = useState(null);
  const [showWinModal, setShowWinModal] = useState(false);

  // Review modal state for newly scanned image
  const [reviewData, setReviewData] = useState(null);

  // Active puzzle shorthand refs
  const grid = currentPuzzle.currentGrid;
  const givenGrid = currentPuzzle.givenGrid;
  const notes = currentPuzzle.notes || {};
  const history = currentPuzzle.history || [];
  const redoStack = currentPuzzle.redoStack || [];
  const isFinished = currentPuzzle.status === 'Finished';

  // Auto-save helper: updates active puzzle state and localStorage
  const updateCurrentPuzzle = useCallback((patch) => {
    setPuzzles((prevList) => {
      const idx = prevList.findIndex((p) => p.id === currentPuzzle.id);
      if (idx === -1) return prevList;
      const updated = {
        ...prevList[idx],
        ...patch,
        updatedAt: getSystemDateTimeISO()
      };
      const saved = savePuzzle(updated);
      const copy = [...prevList];
      copy[idx] = saved;
      return copy;
    });
  }, [currentPuzzle.id]);

  // Live Timer
  useEffect(() => {
    if (isFinished || isPaused || activeTab !== 'play') return;

    const timer = setInterval(() => {
      setPuzzles((prevList) => {
        const idx = prevList.findIndex((p) => p.id === activeId);
        if (idx === -1) return prevList;
        const p = prevList[idx];
        if (p.status === 'Finished') return prevList;

        const updatedTime = (p.elapsedTime || 0) + 1;
        const updated = { ...p, elapsedTime: updatedTime };
        // Save to storage every 5 seconds to reduce write frequency while keeping live state
        if (updatedTime % 5 === 0) {
          savePuzzle(updated);
        }
        const copy = [...prevList];
        copy[idx] = updated;
        return copy;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeId, isFinished, isPaused, activeTab]);

  // Pause timer when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsPaused(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Cell Selection
  const handleSelectCell = (cell) => {
    setSelectedCell(cell);
    setValidationAlert(null);
  };

  // Input Digit (1-9)
  const handleInputDigit = (digit) => {
    if (!selectedCell || isFinished) return;
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

  // Reset Board to initial given digits
  const handleReset = () => {
    const initialGrid = givenGrid.map((row) => [...row]);
    updateCurrentPuzzle({
      currentGrid: initialGrid,
      notes: {},
      history: [],
      redoStack: [],
      status: 'Untouched',
      completionTime: null
    });
    setValidationAlert(null);
  };

  // Validate Sudoku (User requirement: option after all empty places got filled)
  const handleValidate = () => {
    const res = validateSudoku(grid);
    if (res.isValid) {
      const finalTime = currentPuzzle.elapsedTime || 1;
      updateCurrentPuzzle({
        status: 'Finished',
        completionTime: finalTime
      });
      setShowWinModal(true);
      setValidationAlert({ type: 'success', message: res.message });
    } else {
      setValidationAlert({ type: 'error', message: res.message });
    }
  };

  // Select puzzle from library
  const handleSelectPuzzle = (id) => {
    setActiveId(id);
    setActivePuzzleId(id);
    setActiveTab('play');
    setSelectedCell(null);
    setValidationAlert(null);
  };

  // Delete puzzle
  const handleDeletePuzzle = (id) => {
    const updated = deletePuzzle(id);
    setPuzzles(updated);
    if (activeId === id) {
      const nextId = updated[0]?.id || '';
      setActiveId(nextId);
      setActivePuzzleId(nextId);
    }
  };

  // Update puzzle date
  const handleUpdatePuzzleDate = (id, newDateISO) => {
    const updated = updatePuzzleDateTime(id, newDateISO);
    if (updated) {
      setPuzzles(getSavedPuzzles());
    }
  };

  // OCR finished -> show review modal
  const handlePuzzleExtracted = (extractedInfo) => {
    setReviewData(extractedInfo);
  };

  // Sample puzzle selected -> directly load or review
  const handleSelectSample = (sampleData) => {
    setReviewData(sampleData);
  };

  // Confirm review modal -> creates new active puzzle and starts game
  const handleConfirmReview = (confirmed) => {
    const newId = 'sudoku-' + Date.now();
    const newPuzzle = {
      id: newId,
      title: confirmed.title || 'Scanned Sudoku',
      imageDate: confirmed.imageDate || getSystemDateTimeISO(),
      createdAt: getSystemDateTimeISO(),
      updatedAt: getSystemDateTimeISO(),
      thumbnailUrl: confirmed.thumbnailUrl,
      givenGrid: confirmed.givenGrid,
      currentGrid: confirmed.givenGrid.map((r) => [...r]),
      notes: {},
      history: [],
      redoStack: [],
      status: 'Untouched',
      elapsedTime: 0,
      completionTime: null,
      hasCheckerboard: confirmed.hasCheckerboard ?? true
    };

    const saved = savePuzzle(newPuzzle);
    setPuzzles((prev) => [saved, ...prev]);
    setActiveId(newId);
    setActivePuzzleId(newId);
    setReviewData(null);
    setActiveTab('play');
    setSelectedCell(null);
  };

  // Create custom Sudoku manually
  const handleCreateCustomPuzzle = (customData) => {
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
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        autoHighlight={autoHighlight}
        setAutoHighlight={setAutoHighlight}
        currentPuzzleTitle={currentPuzzle.title}
        currentPuzzleDate={currentPuzzle.imageDate || currentPuzzle.createdAt}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-4 sm:py-6 px-3 sm:px-6">
        {activeTab === 'play' && (
          <div className="max-w-2xl mx-auto flex flex-col items-center">
            {/* Validation Banner if error or feedback */}
            {validationAlert && (
              <div
                className={`w-full max-w-[480px] mb-3 p-3 rounded-xl border text-xs font-semibold flex items-center justify-between animate-pop ${
                  validationAlert.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
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
            />

            {/* Control Panel: Undo, Redo, Reset, Validate, Timer, Date */}
            <ControlPanel
              grid={grid}
              elapsedTime={currentPuzzle.elapsedTime || 0}
              completionTime={currentPuzzle.completionTime}
              isPaused={isPaused}
              onTogglePause={() => setIsPaused(!isPaused)}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onReset={handleReset}
              onValidate={handleValidate}
              canUndo={history.length > 0 && !isFinished}
              canRedo={redoStack.length > 0 && !isFinished}
              isNotesMode={isNotesMode}
              onToggleNotes={() => setIsNotesMode(!isNotesMode)}
              puzzleDate={currentPuzzle.imageDate || currentPuzzle.createdAt}
              onUpdateDate={(newDate) => handleUpdatePuzzleDate(currentPuzzle.id, newDate)}
              puzzleStatus={currentPuzzle.status}
              onNewScan={() => setActiveTab('upload')}
              onNewCreate={() => setActiveTab('create')}
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
            />
          </div>
        )}

        {activeTab === 'upload' && (
          <ImageUploader
            onPuzzleExtracted={handlePuzzleExtracted}
            onSelectSample={handleSelectSample}
            onSwitchToManual={() => setActiveTab('create')}
          />
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
            onNewScan={() => setActiveTab('upload')}
            onNewCreate={() => setActiveTab('create')}
          />
        )}
      </main>

      {/* OCR Review & Confirm Modal */}
      {reviewData && (
        <ReviewModal
          data={reviewData}
          onConfirm={handleConfirmReview}
          onCancel={() => setReviewData(null)}
        />
      )}

      {/* Win Celebration Modal */}
      {showWinModal && (
        <WinModal
          puzzle={currentPuzzle}
          onClose={() => setShowWinModal(false)}
          onGoToLibrary={() => {
            setShowWinModal(false);
            setActiveTab('library');
          }}
          onNewScan={() => {
            setShowWinModal(false);
            setActiveTab('upload');
          }}
        />
      )}
    </div>
  );
}
