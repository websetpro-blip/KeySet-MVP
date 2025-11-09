@echo off
REM Build script for KeySet with Accounts v2 integration (Windows)

echo 🔨 Building KeySet with Accounts v2...

REM Установка переменных окружения для офлайн работы Playwright
set PLAYWRIGHT_BROWSERS_PATH=.\playwright-drivers

REM Установка зависимостей
echo 📦 Installing dependencies...
pip install -r requirements.txt

REM Установка браузеров Playwright
echo 🌐 Installing Playwright browsers...
playwright install chromium

REM Сборка приложения
echo 🏗️ Building application with PyInstaller...
pyinstaller keyset_accounts_v2.spec --clean --noconfirm

REM Копирование браузеров в дистрибутив
echo 📂 Copying Playwright browsers to dist...
if not exist "dist\playwright-drivers" mkdir "dist\playwright-drivers"
xcopy "%LOCALAPPDATA%\ms-playwright\chromium-*" "dist\playwright-drivers\" /E /I /Y 2>nul

REM Создание .bat файла для запуска
echo 🚀 Creating launcher...
echo @echo off > dist\KeySet.bat
echo set PLAYWRIGHT_BROWSERS_PATH=%%~dp0playwright-drivers >> dist\KeySet.bat
echo start KeySet.exe >> dist\KeySet.bat

echo ✅ Build complete! Check dist\ folder.
echo.
echo 📋 Build checklist:
echo ✅ Accounts v2 module integrated
echo ✅ Fingerprint hook added to turbo_parser_improved.py
echo ✅ Module loader implemented in main.py
echo ✅ Playwright browsers included for offline work
echo ✅ Configuration files bundled
echo.
echo 🚀 To run: dist\KeySet.exe or dist\KeySet.bat
pause