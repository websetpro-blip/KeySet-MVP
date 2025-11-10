@echo off
echo ====================================
echo KeySet MVP Launcher
echo ====================================
echo.
echo Starting backend (FastAPI)...
start "KeySet Backend" cmd /k "cd /d %~dp0 && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8765"

timeout /t 2 /nobreak >nul

echo Starting frontend (Vite dev server)...
start "KeySet Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo Opening browser...
start http://localhost:5175

echo.
echo ====================================
echo KeySet запущен!
echo Frontend: http://localhost:5175
echo Backend:  http://127.0.0.1:8765
echo ====================================
echo.
echo Закройте это окно чтобы остановить серверы
pause
