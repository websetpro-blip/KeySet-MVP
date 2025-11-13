@echo off
setlocal
cd /d "%~dp0"

set VENV_PY=.\.venv\Scripts\python.exe

if not exist %VENV_PY% (
  echo [ERROR] Virtual environment not found: %VENV_PY%
  echo Create it with "python -m venv .venv" and install backend/requirements.txt
  pause
  exit /b 1
)

echo ======================================
echo   KeySet Launcher (Eel + Chrome/Edge)
echo ======================================
echo.
echo Starting backend + UI via launcher_eel.py...
start "KeySet" cmd /k "%VENV_PY%" launcher_eel.py
echo.
echo Launcher started in a separate window. Close it to stop KeySet.
echo ======================================
endlocal
