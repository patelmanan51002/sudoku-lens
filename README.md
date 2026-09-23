# 🧩 Sudoku Lens - Interactive Cloud Sudoku & Solver

A modern, responsive web application offering instant random Sudoku generation across 4 verified difficulty tiers, custom board creation, and real-time cross-device cloud synchronization powered by **Firebase**.

🔗 **Live Web App**: [https://sudoku-lens-app.web.app](https://sudoku-lens-app.web.app)

---

## ✨ Features

### 🎲 Multi-Difficulty Random Sudoku Generator
- **4 Verified Tiers**:
  - ⚡ **Easy**: ~35–42 clues (Gentle & casual)
  - 🛡️ **Medium**: ~28–34 clues (Balanced standard logic)
  - 🔥 **Hard**: ~24–28 clues (Intense deduction & elimination)
  - 🏆 **Expert**: ~20–24 clues (Minimal clues master challenge)
- **Strict Difficulty Verification**: Every generated board is verified for clue count constraints and mathematically unique solvability.
- **🔄 Instant Re-roll / Regenerate**:
  - Don't like the generated puzzle? Click **Re-roll (🎲)** while the puzzle is untouched.
  - Generates a fresh board of the same level and **automatically discards the previous untouched board** so your library stays clean!

### ✏️ Custom Sudoku Builder
- Build and solve any puzzle from physical newspapers, books, or magazines.
- Real-time row, column, and 3×3 block conflict detection while placing starting clues.
- 1-click lock & solve transition.

### ☁️ Cross-Device Cloud Sync & Authentication
- **Firebase Authentication**: Create an account or sign in securely across mobile, tablet, and desktop devices.
- **Cloud Firestore Real-Time Sync**:
  - Automatically syncs all saved puzzles, move history, pencil notes, and elapsed solving times.
- **Prioritized Event-Based Sync**:
  - **Validation & Win**: Completing and validating a board immediately records `completionTime` and syncs the Finished status.
  - **State Transitions**: Real-time transition between `Untouched`, `In Progress`, and `Finished` reflects immediately on all devices.
  - **Pause & Resume**: Pausing or resuming the timer instantly flushes time and board state to the cloud.
  - **Cross-Device Deletion Sync**: Deleting a puzzle from your library on one device deletes it across all devices without accidental resurrection.
  - **Continuous Safety Net**: Background periodic sync every 15 seconds during active play.

### 🎮 Solving Controls & Experience
- **Undo (`Ctrl+Z`)** & **Redo (`Ctrl+Y`)** with full move history.
- **Pencil / Notes Mode (`N`)**: Enter candidate digits inside any empty cell.
- **Auto-Highlighting ("Pen & Paper" Toggle)**: Toggle number and cell highlights on/off for a pure, distraction-free pen-and-paper experience.
- **Validate Sudoku**: Activated when all 81 cells are filled, with celebratory confetti on successful completion.
- **Live Timer**: Tracks elapsed time with Pause, Resume, and background tab auto-pause.

### 📚 Date-Wise Archive & Library
- Puzzles grouped by date (defaults to creation time, fully editable).
- Filter by status: **All**, **Finished**, **In Progress**, **Untouched**.
- **JSON Export & Import**: Backup and restore your puzzle archive anytime.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally in development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

Or on Windows, simply double-click **`run.bat`**!

### 3. Build for production
```bash
npm run build
```

### 4. Deploy to Firebase
```bash
npx firebase-tools deploy
```

---

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Sudoku Engine**: `sudoku-gen` (mathematical offline generator with verification)
- **Backend / Cloud**: Firebase Authentication & Cloud Firestore
- **Hosting**: Firebase Hosting ([sudoku-lens-app.web.app](https://sudoku-lens-app.web.app))
