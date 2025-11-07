# Setup Notes

- Проект в UTF-8, строки LF.
- Перед работой:
  1. `scripts/dev_frontend.ps1` — поднимает Vite dev server.
  2. `scripts/dev_backend.ps1` — создаёт venv и стартует FastAPI.
- После сборки фронта (`pnpm build`) скопируй `frontend/dist` — FastAPI начнёт раздавать статику.
- Launcher использует PyWebView; для dev-режима достаточно `python launcher.py`.
