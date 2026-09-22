@echo off
title Push to GitHub - Sudoku Lens
echo ====================================================
echo           Pushing Sudoku Lens to GitHub
echo ====================================================
echo.
cd /d "%~dp0"
echo Running git push -u origin main...
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ====================================================
    echo   SUCCESS! All code has been pushed to GitHub!
    echo ====================================================
) else (
    echo.
    echo If prompted, click "Sign in with your browser" in the window.
)
echo.
pause
