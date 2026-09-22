@echo off
title Sudoku Lens
echo ==============================================
echo        Starting Sudoku Lens Application
echo ==============================================
echo.
cd /d "%~dp0"
start http://localhost:3000
npm run dev
pause
