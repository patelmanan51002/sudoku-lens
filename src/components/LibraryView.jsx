import React, { useState, useRef } from 'react';
import {
  Calendar,
  Clock,
  Play,
  Trash2,
  CheckCircle2,
  Hourglass,
  Circle,
  PlusCircle,
  Edit2,
  Download,
  Upload
} from 'lucide-react';
import { exportPuzzlesJSON, importPuzzlesJSON } from '../utils/storage';
import {
  formatDateHeader,
  formatDateTime,
  formatSeconds,
  formatHumanDuration,
  getDateKey,
  toInputDateTimeValue
} from '../utils/dateUtils';
import { countFilled } from '../utils/sudokuSolver';

export default function LibraryView({
  puzzles,
  activePuzzleId,
  onSelectPuzzle,
  onDeletePuzzle,
  onUpdatePuzzleDate,
  onNewScan,
  onNewCreate
}) {
  const [filter, setFilter] = useState('all'); // 'all', 'Finished', 'In Progress', 'Untouched'
  const [editingDateId, setEditingDateId] = useState(null);
  const [newDateValue, setNewDateValue] = useState('');

  // Filter puzzles
  const filtered = puzzles.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  // Group date-wise (sorted newest first)
  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.imageDate || a.createdAt).getTime();
    const db = new Date(b.imageDate || b.createdAt).getTime();
    return db - da;
  });

  const dateGroups = {};
  sorted.forEach((p) => {
    const dateKey = getDateKey(p.imageDate || p.createdAt);
    if (!dateGroups[dateKey]) {
      dateGroups[dateKey] = {
        label: formatDateHeader(p.imageDate || p.createdAt),
        puzzles: []
      };
    }
    dateGroups[dateKey].puzzles.push(p);
  });

  // Counts for tabs
  const counts = {
    all: puzzles.length,
    Finished: puzzles.filter((p) => p.status === 'Finished').length,
    'In Progress': puzzles.filter((p) => p.status === 'In Progress').length,
    Untouched: puzzles.filter((p) => p.status === 'Untouched').length
  };

  const handleOpenDateEdit = (e, puzzle) => {
    e.stopPropagation();
    setEditingDateId(puzzle.id);
    setNewDateValue(toInputDateTimeValue(puzzle.imageDate || puzzle.createdAt));
  };

  const handleSaveDate = (e) => {
    e.preventDefault();
    if (editingDateId && newDateValue) {
      onUpdatePuzzleDate(editingDateId, new Date(newDateValue).toISOString());
      setEditingDateId(null);
    }
  };

  const fileImportRef = useRef(null);

  const handleExportBackup = () => {
    const jsonStr = exportPuzzlesJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sudoku_library_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const imported = importPuzzlesJSON(content);
        if (imported) {
          window.location.reload();
        } else {
          alert('Invalid backup JSON file.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Hidden file input for backup restore */}
      <input
        ref={fileImportRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Puzzle Library & Archive</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organized date-wise using system timestamps. Filter by status or resume anytime.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Export Backup */}
          <button
            onClick={handleExportBackup}
            title="Download full backup of all puzzles as JSON"
            className="flex items-center space-x-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Import Backup */}
          <button
            onClick={() => fileImportRef.current?.click()}
            title="Restore puzzles from backup JSON"
            className="flex items-center space-x-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* Create Custom */}
          <button
            onClick={onNewCreate}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <span>✏️ Create</span>
          </button>

          {/* Scan New Image */}
          <button
            onClick={onNewScan}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Scan Image</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl mb-6 overflow-x-auto">
        {[
          { key: 'all', label: 'All Puzzles', count: counts.all },
          { key: 'Finished', label: 'Finished', count: counts.Finished },
          { key: 'In Progress', label: 'In Progress', count: counts['In Progress'] },
          { key: 'Untouched', label: 'Untouched', count: counts.Untouched }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filter === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filter === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Date Groups */}
      {Object.keys(dateGroups).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">No puzzles found in this category</h3>
          <p className="text-xs text-slate-400 mt-1">Upload a new Sudoku image or choose another filter.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(dateGroups).map(([dateKey, group]) => (
            <div key={dateKey} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-center space-x-2 px-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  {group.label}
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">
                  ({group.puzzles.length} {group.puzzles.length === 1 ? 'puzzle' : 'puzzles'})
                </span>
              </div>

              {/* Puzzle Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {group.puzzles.map((puzzle) => {
                  const filled = countFilled(puzzle.currentGrid);
                  const isCurrentActive = puzzle.id === activePuzzleId;

                  // Status badge colors
                  let badge = (
                    <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      <Circle className="w-2.5 h-2.5 fill-slate-400 text-slate-400" />
                      <span>Untouched</span>
                    </span>
                  );

                  if (puzzle.status === 'Finished') {
                    badge = (
                      <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Finished</span>
                      </span>
                    );
                  } else if (puzzle.status === 'In Progress') {
                    badge = (
                      <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Hourglass className="w-3 h-3 text-amber-600" />
                        <span>In Progress</span>
                      </span>
                    );
                  }

                  return (
                    <div
                      key={puzzle.id}
                      onClick={() => onSelectPuzzle(puzzle.id)}
                      className={`group relative bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                        isCurrentActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Row: Thumbnail + Title & Status */}
                      <div>
                        <div className="flex items-start space-x-3 mb-3">
                          {/* Mini Board / Thumbnail */}
                          <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5 shadow-xs">
                            {puzzle.thumbnailUrl ? (
                              <img
                                src={puzzle.thumbnailUrl}
                                alt="Thumbnail"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-1 bg-sky-50">
                                {Array.from({ length: 9 }).map((_, i) => (
                                  <div key={i} className="border border-sky-200 bg-white" />
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-sm text-slate-900 truncate">
                                {puzzle.title || 'Sudoku Puzzle'}
                              </h4>
                            </div>
                            <div className="mt-1 flex items-center space-x-2">
                              {badge}
                            </div>
                          </div>
                        </div>

                        {/* Date and Time info with edit action */}
                        <div className="flex items-center justify-between text-xs text-slate-500 py-1.5 px-2 bg-slate-50 rounded-lg mb-3">
                          <span className="truncate">{formatDateTime(puzzle.imageDate || puzzle.createdAt)}</span>
                          <button
                            onClick={(e) => handleOpenDateEdit(e, puzzle)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
                            title="Edit date & time"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Progress or Completion Time */}
                        <div className="space-y-1.5 mb-3">
                          {puzzle.status === 'Finished' ? (
                            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
                              <span>Completed Time:</span>
                              <span className="font-mono">
                                {formatHumanDuration(puzzle.completionTime || puzzle.elapsedTime)}
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                                <span>Progress:</span>
                                <span>{filled} / 81 cells</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full transition-all"
                                  style={{ width: `${Math.round((filled / 81) * 100)}%` }}
                                />
                              </div>
                            </>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Time spent:</span>
                            </span>
                            <span className="font-mono font-medium text-slate-600">
                              {formatSeconds(puzzle.elapsedTime || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPuzzle(puzzle.id);
                          }}
                          className={`flex items-center space-x-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                            isCurrentActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >
                          <Play className="w-3 h-3" />
                          <span>{puzzle.status === 'Finished' ? 'View' : 'Play'}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this puzzle?')) {
                              onDeletePuzzle(puzzle.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete puzzle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Date Edit Modal for Library */}
      {editingDateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 animate-pop">
            <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Change Puzzle Date</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Update the assigned date and time for this puzzle.
            </p>

            <form onSubmit={handleSaveDate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={newDateValue}
                  onChange={(e) => setNewDateValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex space-x-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDateId(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Save Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
