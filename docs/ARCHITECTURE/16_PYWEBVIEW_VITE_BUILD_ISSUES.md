# 16. PyWebView + Vite: Проблемы совместимости

> **Критическая проблема: Vite code-splitting ломает инжекцию js_api bridge в PyWebView**

## Проблема

При запуске KeySet-MVP через `launcher.py` PyWebView окно падает с ошибкой:
```
webview.errors.WebViewException: Main window failed to start
```

### Симптомы

1. PyWebView окно открывается, но сразу крашится
2. Ошибка в `webview/dom/element.py` при попытке доступа к DOM.body
3. Все assets загружаются успешно (200 OK), но React не инициализируется
4. После загрузки vite.svg нет запросов к `/api/accounts`

## Корневая причина

**Vite code-splitting создаёт множество мелких chunks, которые ломают инициализацию js_api bridge в PyWebView**

### Технические детали

1. **Vite по умолчанию** разбивает код на chunks:
   - `vendor-BD-WZS7N.js`
   - `vendor-react-BeNjHMlV.js`
   - `tab-data-DC4rwfnn.js`
   - `index-eQ5cn-KO.js`

2. **PyWebView инициализация** требует готовый DOM:
   ```python
   bridge = WindowAPI(external_base_url, DEV_TOKEN)
   window = webview.create_window(
       "KeySet",
       BACKEND_URL,
       js_api=bridge,  # Инжекция API в JS контекст
       width=1400,
       height=900,
   )
   ```

3. **Race condition**: PyWebView пытается инжектить bridge до того, как все chunks загрузились и DOM.body готов

## Решение

### Долгосрочное решение (правильное)

**Настроить Vite для единого bundle без code-splitting:**

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, // Отключить code-splitting
      },
    },
  },
});
```

**Пересобрать фронтенд:**
```bash
cd frontend
npm run build
```

**Проверить результат:**
```bash
ls frontend/dist/assets/*.js | wc -l
# Ожидается: 1 (один файл ~1.3 MB)
```

### Краткосрочное решение (временное)

Скопировать рабочий dist из KeySet-MVP-claude:
```bash
rm -rf .venv
cp -r ../KeySet-MVP-claude/.venv .venv

rm -rf frontend/dist
cp -r ../KeySet-MVP-claude/frontend/dist frontend/dist
```

## Проверка корректности сборки

### Плохо (code-splitting):
```bash
ls frontend/dist/assets/
vendor-*.js       # несколько vendor файлов
index-*.js        # основной bundle
tab-data-*.js     # модуль data tab
```

### Хорошо (единый bundle):
```bash
ls frontend/dist/assets/
index-{hash}.js   # ОДИН файл (~1-2 MB)
index-{hash}.css  # стили
fa-*.woff2        # шрифты
```

## Что НЕ работает

- ❌ Смена версии Python (3.10, 3.12, 3.13)
- ❌ Обновление pythonnet (3.0.3 → 3.0.5)
- ❌ Переустановка FastAPI/uvicorn
- ❌ Пересборка `npm run build` (ухудшает проблему)
- ❌ Смена GUI backend (`gui="mshtml"`)

## Чек-лист применения

При каждой сборке frontend:

- [ ] `vite.config.ts` содержит `manualChunks: undefined`
- [ ] `npm run build` выполнен успешно
- [ ] В `frontend/dist/assets/` только ОДИН JS файл
- [ ] Размер bundle ~1-2 MB
- [ ] Запуск через `launcher.py` работает
- [ ] PyWebView окно открывается и показывает UI
- [ ] `/api/accounts` вызывается успешно
- [ ] React компоненты рендерятся корректно

## Связь с другими документами

- **[08_FRONTEND_STRUCTURE.md](./08_FRONTEND_STRUCTURE.md)** — добавить в секцию "Типовые ошибки"
- **[12_PRODUCTION_WINDOWS_BUILD.md](./12_PRODUCTION_WINDOWS_BUILD.md)** — добавить в "Процесс сборки"
- **[Проблемы-решения](../../Отчет/Проблемы-решения)** — детальный отчёт о проблеме

## TL;DR

- **Проблема:** Vite code-splitting → PyWebView падает
- **Решение:** `manualChunks: undefined` в vite.config.ts
- **Проверка:** Один bundle в dist/assets/
- **Результат:** React загружается и работает

---

**Дата:** 2024-11-11
**Критичность:** ВЫСОКАЯ
**Статус:** РЕШЕНО
