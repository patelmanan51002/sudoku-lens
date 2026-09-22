import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { loadImage, extractCells } from '../utils/imageProcessor';
import { recognizeSudokuGrid } from '../utils/ocrService';
import { getSystemDateTimeISO, toInputDateTimeValue } from '../utils/dateUtils';
import sampleImageSrc from '../assets/sample_puzzle.png';
import { SAMPLE_PUZZLE_GIVEN } from '../utils/sudokuSolver';

export default function ImageUploader({ onPuzzleExtracted, onSelectSample, onSwitchToManual }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [puzzleDate, setPuzzleDate] = useState(toInputDateTimeValue(getSystemDateTimeISO()));
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [puzzleDate]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageFile(e.target.files[0]);
    }
  };

  const handleImageFile = async (file) => {
    try {
      setErrorMsg(null);
      setIsProcessing(true);
      setStatusText('Loading and parsing image...');
      setProgressPercent(10);

      const img = await loadImage(file);
      setStatusText('Detecting grid boundary & lines...');
      setProgressPercent(25);

      const extracted = await extractCells(img);
      setStatusText('Slicing 81 cells & optimizing contrast...');
      setProgressPercent(40);

      // OCR digit recognition with live progress
      const recognizedGrid = await recognizeSudokuGrid(extracted, (pct) => {
        setProgressPercent(40 + Math.round(pct * 0.55));
        setStatusText(`Recognizing digits via OCR (${pct}%)...`);
      });

      setProgressPercent(100);
      setStatusText('Ready for review!');

      const assignedDate = puzzleDate
        ? new Date(puzzleDate).toISOString()
        : getSystemDateTimeISO();

      // Send to review modal
      onPuzzleExtracted({
        title: file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Scanned Sudoku',
        imageDate: assignedDate,
        thumbnailUrl: extracted.originalCanvas.toDataURL(),
        extractedGrid: recognizedGrid,
        hasCheckerboard: extracted.hasCheckerboard,
        rawImage: img
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process image. Please try a clearer Sudoku image or adjust manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = () => {
    const assignedDate = puzzleDate
      ? new Date(puzzleDate).toISOString()
      : getSystemDateTimeISO();

    onSelectSample({
      title: 'Daily Newspaper Sudoku',
      imageDate: assignedDate,
      thumbnailUrl: sampleImageSrc,
      extractedGrid: SAMPLE_PUZZLE_GIVEN.map(row => [...row]),
      hasCheckerboard: true
    });
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Upload Sudoku Image</h2>
        <p className="text-sm text-slate-500 mt-1">
          Take a photo, screenshot, or paste any newspaper or app Sudoku puzzle
        </p>
      </div>

      {/* Date Setting (System Time default, user editable) */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Assigned Date & Time</span>
          </div>
          <span className="text-[10px] text-slate-400">Defaults to current system time</span>
        </div>
        <div className="mt-2">
          <input
            type="datetime-local"
            value={puzzleDate}
            onChange={(e) => setPuzzleDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/50'
        } shadow-sm`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />

        {isProcessing ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <div>
              <div className="text-sm font-bold text-slate-800">{statusText}</div>
              <div className="text-xs text-slate-400 mt-1">{progressPercent}% complete</div>
            </div>
            {/* Progress bar */}
            <div className="w-48 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className="bg-blue-600 h-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                Click to browse, drag & drop, or paste (Ctrl+V)
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Supports PNG, JPG, JPEG, WebP, Screenshots
              </p>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Or Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-slate-50 px-3 text-slate-400 font-medium">Or test immediately</span>
        </div>
      </div>

      {/* Action Cards: Sample Puzzle & Create Manually */}
      <div className="space-y-3">
        {/* Sample Puzzle Action Button */}
        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors">
          <div className="flex items-center space-x-3">
            <img
              src={sampleImageSrc}
              alt="Sample Sudoku"
              className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-xs"
            />
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <span>Attached Newspaper Puzzle</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              </div>
              <p className="text-xs text-slate-500">
                The exact puzzle from your uploaded image
              </p>
            </div>
          </div>

          <button
            onClick={handleLoadSample}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
          >
            Load & Play
          </button>
        </div>

        {/* Manual Creation Option (No Image) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg">
              ✏️
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">
                Create Sudoku Manually
              </div>
              <p className="text-xs text-slate-500">
                Don't have an image? Fill in your own clues and solve!
              </p>
            </div>
          </div>

          <button
            onClick={onSwitchToManual}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 shadow-xs active:scale-95 transition-all"
          >
            Create Board
          </button>
        </div>
      </div>
    </div>
  );
}
