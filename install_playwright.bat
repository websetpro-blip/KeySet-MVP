@echo off
cd /d C:\AI\yandex\KeySet-MVP
set PLAYWRIGHT_BROWSERS_PATH=C:\AI\yandex\KeySet-MVP\runtime\browsers
.venv\Scripts\python.exe -m playwright install chromium
echo.
echo Playwright установлен в: %PLAYWRIGHT_BROWSERS_PATH%
pause
