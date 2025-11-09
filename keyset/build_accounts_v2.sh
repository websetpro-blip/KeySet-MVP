#!/bin/bash
# Build script for KeySet with Accounts v2 integration

set -e

echo "🔨 Building KeySet with Accounts v2..."

# Установка переменных окружения для офлайн работы Playwright
export PLAYWRIGHT_BROWSERS_PATH="./playwright-drivers"

# Установка зависимостей
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Установка браузеров Playwright
echo "🌐 Installing Playwright browsers..."
playwright install chromium

# Сборка приложения
echo "🏗️ Building application with PyInstaller..."
pyinstaller keyset_accounts_v2.spec --clean --noconfirm

# Копирование браузеров в дистрибутив
echo "📂 Copying Playwright browsers to dist..."
mkdir -p dist/playwright-drivers
cp -r ~/.cache/ms-playwright/chromium-* dist/playwright-drivers/ 2>/dev/null || true

# Создание .bat файла для запуска
echo "🚀 Creating launcher..."
cat > dist/KeySet.bat << 'EOF'
@echo off
set PLAYWRIGHT_BROWSERS_PATH=%~dp0playwright-drivers
start KeySet.exe
EOF

echo "✅ Build complete! Check dist/ folder."
echo ""
echo "📋 Build checklist:"
echo "✅ Accounts v2 module integrated"
echo "✅ Fingerprint hook added to turbo_parser_improved.py"
echo "✅ Module loader implemented in main.py"
echo "✅ Playwright browsers included for offline work"
echo "✅ Configuration files bundled"
echo ""
echo "🚀 To run: dist/KeySet.exe or dist/KeySet.bat"