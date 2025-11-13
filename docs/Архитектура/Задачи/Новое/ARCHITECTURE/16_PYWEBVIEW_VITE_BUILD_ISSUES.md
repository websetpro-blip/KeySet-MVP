# 16. UI Layer: Edge --app режим (архивный документ)

> **Историческая справка: Переход с PyWebView на Edge --app mode**

## Текущее решение (с ноября 2024)

KeySet-MVP больше **НЕ использует PyWebView**. Вместо этого применяется Edge в режиме приложения (`--app`).

### Почему отказались от PyWebView

1. **Проблемы совместимости** с Vite code-splitting
2. **Дополнительная зависимость** (~50 MB к размеру сборки)
3. **Проблемы с js_api bridge** при сложной структуре chunks

### Текущая архитектура

```python
# launcher.py
import subprocess
from pathlib import Path

# Запуск Edge в app-режиме (окно БЕЗ адресной строки)
edge_paths = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]

for edge_path in edge_paths:
    if Path(edge_path).exists():
        subprocess.Popen([
            edge_path,
            f"--app=http://127.0.0.1:{port}",
            f"--user-data-dir={temp_dir}"
        ])
        break
```

### Преимущества Edge --app

✅ **Нативный вид** - окно без адресной строки, выглядит как desktop приложение
✅ **Быстрый запуск** - Edge уже установлен в Windows 10/11
✅ **Меньший размер** .exe - не нужно упаковывать WebView библиотеки
✅ **Нет проблем** с Vite chunks - браузер загружает все как обычно
✅ **Современный движок** - Chromium с полной поддержкой стандартов

### Vite конфигурация

Теперь **НЕ требуется** отключать code-splitting:

```typescript
// frontend/vite.config.ts
export default defineConfig({
  plugins: [react()],
  // manualChunks больше НЕ нужен!
  // Code-splitting работает корректно с Edge
});
```

## Связь с другими документами

- **[12_PRODUCTION_WINDOWS_BUILD.md](./12_PRODUCTION_WINDOWS_BUILD.md)** — актуальный процесс сборки
- **[08_FRONTEND_STRUCTURE.md](./08_FRONTEND_STRUCTURE.md)** — frontend архитектура

## TL;DR

- **PyWebView УДАЛЕН** из проекта (ноябрь 2024)
- **Текущее решение:** Edge в --app режиме
- **Проблемы Vite:** больше не актуальны
- **Размер .exe:** уменьшился на ~50 MB

---

**Дата архивирования:** 2024-11-11
**Статус:** АРХИВНЫЙ ДОКУМЕНТ
