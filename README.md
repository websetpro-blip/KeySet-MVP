# KeySet MVP

Локальный контейнер для React-вкладок KeySet и LocalAgent на FastAPI. Проект собирается в один .exe (Eel + PyInstaller) и работает офлайн.

## Структура
- frontend/ — Vite + React + TypeScript + Tailwind, сюда копируем готовые вкладки (accounts, masks, data, analytics).
- backend/ — FastAPI (LocalAgent), раздаёт статику и хранит мок-эндпоинты.
- scripts/ — вспомогательные PowerShell-скрипты для запуска dev-режима.
- docs/ — инструкции и требования (например, выдержки из ГОТОВЫХ МОДУЛЕЙ).
- launcher_eel.py — Eel-точка входа, запускает backend и открывает UI в системном Chrome/Edge.

## Требования
- Node.js 20+, pnpm 9+
- Python 3.11+
- PowerShell 7 (для скриптов)

## Ближайшие шаги
1. Инициализировать Vite-проект в frontend/ (React-TS) и настроить Cardvance-токены.
2. Создать FastAPI каркас в backend/ с мок-эндпоинтами.
3. Реализовать launcher_eel.py + PyInstaller spec (Eel).
