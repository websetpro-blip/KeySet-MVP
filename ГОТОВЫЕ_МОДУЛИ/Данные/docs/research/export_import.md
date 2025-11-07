# Исследование библиотек экспорта/импорта файлов в браузере

**Дата исследования:** 31 октября 2025  
**Автор:** MiniMax Agent  
**Контекст:** Веб-версия проекта KeySet (аналог Key Collector)

---

## Содержание

1. [Резюме](#резюме)
2. [Библиотеки для экспорта](#библиотеки-для-экспорта)
3. [Библиотеки для импорта](#библиотеки-для-импорта)
4. [Сравнительная таблица](#сравнительная-таблица)
5. [Рекомендации](#рекомендации)
6. [Примеры кода](#примеры-кода)
7. [Источники](#источники)

---

## Резюме

Исследование охватывает актуальные JavaScript библиотеки для работы с файлами в браузере по состоянию на 2025 год. Основной фокус — экспорт таблиц фраз в форматах CSV/XLSX и импорт данных из TXT/CSV файлов с полной поддержкой кириллицы (UTF-8). Все решения работают исключительно на стороне клиента без необходимости бэкенда.

**Ключевые выводы:**
- **papaparse** остается лучшим выбором для работы с CSV благодаря малому размеру (6.8 КБ gzip) и богатому функционалу
- **SheetJS** (xlsx) — надежное решение для Excel файлов, но имеет значительный размер bundle (~800 КБ minified) и ограничения в бесплатной версии
- **file-saver** — легковесная библиотека (1.5 КБ gzip) для сохранения файлов, совместимая со всеми современными браузерами
- **FileReader API** — встроенный браузерный API, не требующий зависимостей и полностью поддерживающий UTF-8

---

## Библиотеки для экспорта

### 1. papaparse

**Описание:** Быстрый и мощный парсер CSV для JavaScript, работающий как в браузере, так и в Node.js. Поддерживает преобразование данных из JSON в CSV и обратно.

#### Технические характеристики

| Параметр | Значение |
|----------|----------|
| **Текущая версия** | 5.5.3 |
| **Размер bundle** | 19.0 КБ (minified), 6.8 КБ (gzip) |
| **Зависимости** | 0 |
| **Последнее обновление** | Активно поддерживается (2025) |
| **Еженедельные загрузки** | >1.8M |
| **GitHub звезды** | >11,000 |

#### Простота использования

**Оценка: ⭐⭐⭐⭐⭐ (5/5)**

papaparse предлагает интуитивно понятный API с автоматическим определением разделителей и детальной обработкой ошибок. Экспорт данных в CSV выполняется одной строкой кода.

```javascript
import Papa from 'papaparse';

// Экспорт в CSV
const csv = Papa.unparse(data, {
  delimiter: ',',
  header: true,
  encoding: 'utf-8'
});
```

#### Поддержка кириллицы (UTF-8)

**Оценка: ⭐⭐⭐⭐⭐ (5/5)**

Полная поддержка UTF-8 с возможностью добавления BOM (Byte Order Mark) для корректного отображения кириллицы в Microsoft Excel. При экспорте рекомендуется добавлять BOM в начало файла: `const csvWithBOM = '\uFEFF' + csv;`

#### Дополнительные возможности

- Автоматическое определение разделителей
- Потоковая обработка больших файлов (гигабайты) без зависаний
- Многопоточность через Web Workers
- Парсинг локальных и удаленных файлов
- Преобразование типов данных (числа, булевы значения)
- Обработка комментированных строк
- Детальная отчетность об ошибках

#### Недостатки

- Не поддерживает форматы кроме CSV (нет XLSX)
- Требует дополнительную библиотеку (file-saver) для сохранения файлов

---

### 2. SheetJS (xlsx)

**Описание:** Комплексная библиотека для чтения и записи электронных таблиц различных форматов. Community Edition предоставляет открытое решение для работы с Excel файлами.

#### Технические характеристики

| Параметр | Значение |
|----------|----------|
| **Текущая версия** | 0.20.3 (CDN), 0.18.5 (npm) |
| **Размер bundle** | ~800 КБ (xlsx.full.min.js), 7.5 МБ (unpacked npm) |
| **Зависимости** | 0 |
| **Последнее обновление** | Июнь 2025 (CDN), 4 года назад (npm 0.18.5) |
| **Еженедельные загрузки** | >4M |
| **Лицензия** | Apache-2.0 (Community), платная (Pro) |

#### Простота использования

**Оценка: ⭐⭐⭐⭐ (4/5)**

API достаточно прямолинеен для базовых операций чтения и записи, но требует понимания внутренней структуры данных (объекты листов, ячеек) для продвинутых сценариев. Документация подробная, но может быть избыточной для простых задач.

```javascript
import * as XLSX from 'xlsx';

// Экспорт в XLSX
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Фразы');
XLSX.writeFile(workbook, 'export.xlsx');
```

#### Поддержка форматирования (стили ячеек)

**Оценка: ⭐⭐ (2/5)**

**Критическое ограничение:** Community Edition не поддерживает стили ячеек, форматирование текста, цвета фона и другие визуальные эффекты. Эти функции доступны только в платной Pro версии. Для бесплатного форматирования необходимо использовать альтернативы, такие как exceljs или xlsx-js-style.

Доступно в бесплатной версии:
- Настройка ширины колонок (`!cols`)
- Объединение ячеек (`!merges`)
- Закрепление строк/столбцов (`!freeze`)
- Установка формул

Недоступно без Pro лицензии:
- Цвета фона и текста
- Шрифты (размер, жирность, курсив)
- Границы ячеек
- Выравнивание текста
- Условное форматирование

#### Поддержка кириллицы (UTF-8)

**Оценка: ⭐⭐⭐⭐⭐ (5/5)**

Формат XLSX по умолчанию использует UTF-8, кириллица отображается корректно во всех версиях Excel и других табличных редакторах без дополнительных настроек.

#### Поддерживаемые форматы

Полная поддержка чтения и записи: XLSX, XLSM, XLSB, XLS (BIFF2-8), CSV, TXT, DIF, SYLK, PRN, ODS, FODS, HTML, RTF, Numbers (iWork 2013+), DBF, WK1/WK3, и многие другие.

#### Размер bundle и оптимизация

SheetJS имеет большой размер bundle, что может быть проблемой для веб-приложений. Рекомендации по оптимизации:

1. **Использование mini версии:** `xlsx.mini.min.js` исключает редкие форматы (XLSB, XLS, Lotus 1-2-3) и уменьшает размер
2. **Tree shaking:** Новые версии поддерживают tree shaking при использовании современных бандлеров
3. **Специализированные методы:** Использование `writeFileXLSX` вместо универсального `writeFile` уменьшает размер итогового bundle
4. **Динамический импорт:** Загрузка библиотеки только при необходимости через `import()`

#### Недостатки

- Значительный размер bundle (800 КБ+)
- Отсутствие стилей в Community Edition
- Разрыв версий между npm (0.18.5) и CDN (0.20.3)
- Community Edition давно не обновлялась на npm (4 года)

---

### 3. file-saver

**Описание:** Легковесная библиотека для сохранения файлов на стороне клиента, реализующая функционал saveAs() для браузеров.

#### Технические характеристики

| Параметр | Значение |
|----------|----------|
| **Текущая версия** | 2.0.5 |
| **Размер bundle** | ~3.3 КБ (minified), 1.5 КБ (gzip) |
| **Зависимости** | 0 |
| **Последнее обновление** | 5 лет назад |
| **Еженедельные загрузки** | >4.3M |
| **Количество зависимых проектов** | 5,655 |

#### Простота использования

**Оценка: ⭐⭐⭐⭐⭐ (5/5)**

Чрезвычайно простой API — одна функция `saveAs(blob, filename)` покрывает все потребности. Работает с Blob, File и URL объектами.

```javascript
import { saveAs } from 'file-saver';

const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
saveAs(blob, 'export.csv');
```

#### Поддержка браузеров

Широкая совместимость со всеми современными браузерами:
- **Chrome/Edge:** Полная поддержка, до 2GB
- **Firefox 20+:** Полная поддержка, до 800 МБ
- **Safari 10.1+:** Полная поддержка с именами файлов
- **Opera 15+:** Полная поддержка, до 500 МБ
- **IE 10+:** Полная поддержка, до 600 МБ

Для старых браузеров (Firefox <20, Safari <10.1) используется fallback на data: URI с ограничениями.

#### Поддержка кириллицы (UTF-8)

**Оценка: ⭐⭐⭐⭐⭐ (5/5)**

При правильном создании Blob с указанием charset=utf-8 кириллица сохраняется корректно. Поддерживает автоматическое добавление BOM для текстовых файлов.

#### Современная альтернатива: File System Access API

Для Chromium-based браузеров (Chrome, Edge) доступен современный File System Access API (`showSaveFilePicker`), который предоставляет нативный диалог сохранения файла с выбором места и имени. file-saver может использоваться как fallback для браузеров без этой поддержки.

```javascript
if ('showSaveFilePicker' in window) {
  // Современный API
  const handle = await window.showSaveFilePicker({ suggestedName: 'export.csv' });
} else {
  // Fallback на file-saver
  saveAs(blob, 'export.csv');
}
```

#### Недостатки

- Давно не обновлялась (5 лет)
- Не добавляет новые функции (зрелая библиотека)
- Safari 6.1-10.0 не поддерживает указание имени файла

---

## Библиотеки для импорта

### 1. FileReader API (встроенный)

**Описание:** Встроенный браузерный API для чтения содержимого файлов, выбранных пользователем через `<input type="file">` или Drag & Drop.

#### Технические характеристики

| Параметр | Значение |
|----------|----------|
| **Тип** | Встроенный Web API |
| **Размер bundle** | 0 (нативный) |
| **Зависимости** | 0 |
| **Поддержка браузеров** | Chrome 6+, Firefox 3.6+, Safari 6+, Edge 12+, Opera 11+ |

#### Простота использования

**Оценка: ⭐⭐⭐⭐ (4/5)**

Требует понимания асинхронной работы (колбэки или промисы), но API достаточно прост. Для типичных задач чтения текста достаточно 5-10 строк кода.

```javascript
const reader = new FileReader();
reader.onload = (event) => {
  const text = event.target.result;
  const lines = text.split(/\r?\n/);
};
reader.readAsText(file, 'UTF-8');
```

#### Методы чтения

- `readAsText(file, encoding)` — читает файл как текст с указанной кодировкой (по умолчанию UTF-8)
- `readAsArrayBuffer(file)` — читает как массив байтов (для бинарных файлов, XLSX)
- `readAsDataURL(file)` — читает как Data URL (для изображений)
- `readAsBinaryString(file)` — читает как бинарную строку (устарел)

#### Поддержка кодировок

FileReader поддерживает все стандартные кодировки (UTF-8, UTF-16, Windows-1251, KOI8-R и др.), но по умолчанию использует UTF-8, что оптимально для современных веб-приложений. Важно явно указывать кодировку при чтении файлов с кириллицей, созданных в старых системах.

#### Поддержка кириллицы (UTF-8)

**Оценка: ⭐⭐⭐⭐⭐ (5/5)**

При использовании `readAsText(file, 'UTF-8')` кириллица читается корректно. Если файл сохранен с BOM, он автоматически удаляется из результата.

#### Преимущества

- Нулевой размер bundle (встроенный API)
- Нет зависимостей
- Полный контроль над процессом чтения
- Поддержка всех кодировок
- Универсальная поддержка браузеров

#### Недостатки

- Низкоуровневый API (требует ручной обработки данных)
- Нет автоматического парсинга CSV или XLSX
- Нужна обработка ошибок вручную
- Только асинхронное чтение

---

### 2. papaparse (для CSV)

Описание см. в разделе "Библиотеки для экспорта". papaparse одинаково хорошо подходит как для экспорта, так и для импорта CSV файлов.

#### Импорт CSV

```javascript
Papa.parse(file, {
  header: true,           // Первая строка - заголовки
  encoding: 'UTF-8',
  skipEmptyLines: true,
  dynamicTyping: true,    // Автоматическое преобразование типов
  complete: (results) => {
    console.log(results.data);
  }
});
```

#### Дополнительные возможности при импорте

- **Автоматическое определение разделителя:** Не нужно указывать, запятая это или точка с запятой
- **Потоковая обработка:** Обработка строк по мере чтения для больших файлов
- **Web Workers:** Парсинг в фоновом потоке для сохранения отзывчивости UI
- **Обработка ошибок:** Детальная информация о проблемных строках
- **Трансформация заголовков:** Возможность обработки имен колонок (удаление BOM, нормализация)

---

### 3. SheetJS (для XLSX)

Описание см. в разделе "Библиотеки для экспорта". SheetJS также используется для чтения Excel файлов.

#### Импорт XLSX

```javascript
const reader = new FileReader();
reader.onload = (event) => {
  const data = new Uint8Array(event.target.result);
  const workbook = XLSX.read(data, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
};
reader.readAsArrayBuffer(file);
```

#### Поддержка чтения форматов

SheetJS читает все основные форматы электронных таблиц:
- XLSX/XLSM (Excel 2007+)
- XLS (Excel 97-2004)
- XLSB (Excel Binary)
- ODS (OpenDocument)
- CSV, TXT
- Numbers (Apple iWork)
- И многие другие

#### Дополнительные возможности при импорте

- Чтение формул и вычисленных значений
- Чтение стилей (только в Pro версии)
- Работа с несколькими листами
- Чтение комментариев к ячейкам
- Чтение объединенных ячеек
- Поддержка защищенных паролем файлов

---

## Сравнительная таблица

### Экспорт

| Критерий | papaparse | SheetJS (xlsx) | file-saver |
|----------|-----------|----------------|------------|
| **Размер (gzip)** | 6.8 КБ | ~300 КБ+ | 1.5 КБ |
| **Форматы** | CSV | XLSX, XLS, CSV, ODS, и др. | Любые (Blob) |
| **Простота** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Стили Excel** | ❌ Нет | ⚠️ Только Pro | N/A |
| **UTF-8/Кириллица** | ⭐⭐⭐⭐⭐ (с BOM) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Актуальность** | ✅ 2025 | ⚠️ npm устарел | ⚠️ 5 лет без обновлений |
| **Зависимости** | 0 | 0 | 0 |
| **Поддержка браузеров** | Все современные | Все современные | Все (вкл. IE10+) |

### Импорт

| Критерий | FileReader API | papaparse | SheetJS (xlsx) |
|----------|----------------|-----------|----------------|
| **Размер (gzip)** | 0 (встроенный) | 6.8 КБ | ~300 КБ+ |
| **Форматы** | Любые (сырые) | CSV | XLSX, XLS, CSV, и др. |
| **Простота** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Парсинг CSV** | ❌ Ручной | ✅ Автоматический | ✅ Поддерживается |
| **UTF-8/Кириллица** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Авто-типы** | ❌ Нет | ✅ Да | ✅ Да |
| **Большие файлы** | ⚠️ Ограничено памятью | ✅ Streaming | ⚠️ Ограничено памятью |
| **Актуальность** | ✅ Стандарт | ✅ 2025 | ⚠️ npm устарел |

### Альтернативы

| Библиотека | Назначение | Размер (gzip) | Особенности |
|------------|------------|---------------|-------------|
| **exceljs** | Работа с XLSX | ~400 КБ | ✅ Бесплатные стили, активно поддерживается |
| **xlsx-populate** | Работа с XLSX | 95.1 КБ | Меньше SheetJS, но меньше функций |
| **xlsx-js-style** | Форк SheetJS | ~300 КБ | Добавляет стили к SheetJS бесплатно |
| **modern-file-saver** | Сохранение файлов | ~2 КБ | Использует File System Access API с fallback |

---

## Рекомендации

### Для проекта KeySet

Исходя из требований проекта KeySet (экспорт/импорт таблицы фраз с колонками №, Фраза, ws, qws, bws, Статус), рекомендуется следующий стек:

#### Рекомендуемая конфигурация

```bash
npm install papaparse file-saver xlsx
```

**Размер итогового bundle:** ~310 КБ (gzip)

#### Разделение ответственности

1. **CSV экспорт/импорт:** papaparse
   - Малый размер (6.8 КБ)
   - Идеален для базовой работы с данными
   - Полная поддержка кириллицы

2. **XLSX экспорт/импорт:** SheetJS (xlsx)
   - Необходим для совместимости с Excel
   - Базового функционала достаточно без стилей
   - Можно использовать для чтения Excel файлов

3. **Сохранение файлов:** file-saver
   - Универсальное решение для всех браузеров
   - Минимальный размер (1.5 КБ)

4. **Чтение TXT:** FileReader API
   - Встроенный, без зависимостей
   - Достаточно для построчного чтения

#### Альтернативная конфигурация (с форматированием Excel)

Если требуется форматирование ячеек Excel (цвета, шрифты, границы):

```bash
npm install papaparse file-saver exceljs
```

**Преимущества:**
- exceljs предоставляет бесплатное форматирование
- Активно поддерживается (в отличие от SheetJS npm)
- Более современный API

**Недостатки:**
- Больший размер bundle (~400 КБ)
- Немного сложнее API

### Оптимизация размера bundle

#### 1. Динамический импорт

Загружайте тяжелые библиотеки только при необходимости:

```javascript
// Ленивая загрузка SheetJS
async function exportToXLSX(data) {
  const XLSX = await import('xlsx');
  // ... экспорт
}
```

#### 2. Использование mini версий

Для SheetJS используйте `xlsx.mini.min.js` через CDN, если не нужны экзотические форматы:

```html
<script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.mini.min.js"></script>
```

#### 3. Tree shaking

Убедитесь, что ваш бандлер (Vite, Webpack) настроен на tree shaking:

```javascript
// Импортируйте только необходимое
import { unparse } from 'papaparse';
```

### Обработка кириллицы

#### CSV экспорт с BOM

Обязательно добавляйте BOM для корректного отображения в Excel:

```javascript
const csv = Papa.unparse(data);
const BOM = '\uFEFF';
const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
saveAs(blob, 'export.csv');
```

#### XLSX экспорт

Кириллица работает автоматически, дополнительных действий не требуется.

#### TXT импорт

Явно указывайте UTF-8:

```javascript
reader.readAsText(file, 'UTF-8');
```

#### CSV импорт с обработкой BOM

```javascript
Papa.parse(file, {
  encoding: 'UTF-8',
  transformHeader: (header) => header.replace(/^\uFEFF/, '')
});
```

### Производительность

#### Работа с большими файлами

Для файлов >10,000 строк используйте потоковую обработку papaparse:

```javascript
Papa.parse(file, {
  worker: true,        // Web Worker
  step: (row) => {     // Обработка по строкам
    processRow(row.data);
  },
  complete: () => {
    console.log('Готово');
  }
});
```

#### Прогресс импорта

Отображайте прогресс для лучшего UX:

```javascript
let processedRows = 0;
Papa.parse(file, {
  step: (row) => {
    processedRows++;
    updateProgress((processedRows / totalRows) * 100);
  }
});
```

---

## Примеры кода

Полные рабочие примеры представлены в файле `code_examples.js`:

### 1. Экспорт в CSV (papaparse + file-saver)

```javascript
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

function exportToCSV(data, filename = 'export.csv') {
  const csv = Papa.unparse(data, {
    delimiter: ',',
    header: true,
    encoding: 'utf-8'
  });
  
  // Добавляем BOM для Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

// Использование
const data = [
  { №: 1, Фраза: "купить iPhone", ws: 1000, qws: 500, bws: 200, Статус: "Активна" },
  { №: 2, Фраза: "смартфон цена", ws: 800, qws: 400, bws: 150, Статус: "Пауза" }
];
exportToCSV(data, 'phrases.csv');
```

### 2. Экспорт в XLSX (SheetJS)

```javascript
import * as XLSX from 'xlsx';

function exportToXLSX(data, filename = 'export.xlsx') {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Настройка ширины колонок
  worksheet['!cols'] = [
    { wch: 5 },   // № 
    { wch: 30 },  // Фраза
    { wch: 10 },  // ws
    { wch: 10 },  // qws
    { wch: 10 },  // bws
    { wch: 15 }   // Статус
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Фразы');
  XLSX.writeFile(workbook, filename);
}
```

### 3. Импорт из TXT (FileReader API)

```javascript
function importFromTXT(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      resolve(lines);
    };
    
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file, 'UTF-8');
  });
}

// Использование
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  const phrases = await importFromTXT(file);
  console.log(phrases); // ["фраза 1", "фраза 2", ...]
});
```

### 4. Импорт из CSV (papaparse)

```javascript
import Papa from 'papaparse';

function importFromCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      encoding: 'UTF-8',
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('Ошибки парсинга:', results.errors);
        }
        resolve(results.data);
      },
      error: reject
    });
  });
}
```

### 5. Импорт из XLSX (SheetJS)

```javascript
import * as XLSX from 'xlsx';

function importFromXLSX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsArrayBuffer(file);
  });
}
```

### 6. React компонент (полный пример)

```jsx
import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const FileImportExport = () => {
  const [data, setData] = useState([
    { №: 1, Фраза: "купить iPhone", ws: 1000, qws: 500, bws: 200, Статус: "Активна" }
  ]);

  const handleExportCSV = () => {
    const csv = Papa.unparse(data);
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'phrases.csv');
  };

  const handleExportXLSX = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Фразы');
    XLSX.writeFile(wb, 'phrases.xlsx');
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    
    try {
      let importedData;
      
      if (ext === 'csv') {
        importedData = await new Promise((resolve) => {
          Papa.parse(file, {
            header: true,
            encoding: 'UTF-8',
            complete: (results) => resolve(results.data)
          });
        });
      } else if (ext === 'xlsx' || ext === 'xls') {
        importedData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            resolve(XLSX.utils.sheet_to_json(ws));
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
      } else if (ext === 'txt') {
        const lines = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target.result;
            resolve(text.split(/\r?\n/).filter(line => line.trim()));
          };
          reader.onerror = reject;
          reader.readAsText(file, 'UTF-8');
        });
        
        // Преобразуем строки в объекты
        importedData = lines.map((phrase, index) => ({
          №: index + 1,
          Фраза: phrase,
          ws: 0,
          qws: 0,
          bws: 0,
          Статус: "Новая"
        }));
      }
      
      setData(importedData);
      alert(`Импортировано ${importedData.length} записей`);
    } catch (error) {
      console.error('Ошибка импорта:', error);
      alert('Ошибка при импорте файла');
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 space-x-2">
        <button 
          onClick={handleExportCSV}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Экспорт в CSV
        </button>
        <button 
          onClick={handleExportXLSX}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Экспорт в XLSX
        </button>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2 font-medium">
          Импорт файла (TXT/CSV/XLSX):
        </label>
        <input 
          type="file" 
          accept=".txt,.csv,.xlsx,.xls"
          onChange={handleImport}
          className="border p-2 rounded"
        />
      </div>
      
      <div className="text-sm text-gray-600">
        Количество записей: {data.length}
      </div>
    </div>
  );
};

export default FileImportExport;
```

Дополнительные примеры и варианты использования доступны в файле <filepath>docs/research/code_examples.js</filepath>.

---

## Источники

### Официальная документация

[1] [Papa Parse - Official Website](https://www.papaparse.com/) - High Reliability - Официальный сайт библиотеки papaparse с документацией и примерами  
[2] [SheetJS Community Edition - Installation](https://docs.sheetjs.com/docs/getting-started/installation/standalone/) - High Reliability - Официальная документация SheetJS по установке и использованию  
[3] [FileReader API - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/FileReader) - High Reliability - Техническая документация FileReader API от Mozilla  
[4] [File System Access API - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) - High Reliability - Документация современного File System Access API

### NPM пакеты и статистика

[5] [papaparse v5.5.3 - Bundlephobia](https://bundlephobia.com/package/papaparse) - High Reliability - Детальная информация о размере bundle papaparse  
[6] [xlsx - NPM](https://www.npmjs.com/package/xlsx) - High Reliability - NPM страница пакета xlsx с версией, статистикой загрузок  
[7] [file-saver - NPM](https://www.npmjs.com/package/file-saver) - High Reliability - NPM страница пакета file-saver  
[8] [xlsx-populate v1.21.0 - Bundlephobia](https://bundlephobia.com/package/xlsx-populate) - Medium Reliability - Информация о размере альтернативной библиотеки

### Сравнения и обзоры

[9] [JavaScript CSV Parsers Comparison - LeanyLabs](https://leanylabs.com/blog/js-csv-parsers-benchmarks/) - Medium Reliability - Сравнительный бенчмарк CSV парсеров  
[10] [Top Spreadsheet Libraries for React/Next.js in 2025 - Medium](https://medium.com/front-end-world/top-spreadsheet-libraries-for-react-next-js-in-2025-6f7a02ffc3ca) - Medium Reliability - Обзор современных библиотек для работы с таблицами  
[11] [SheetJS Alternatives: Best Tools for CSV Import - CSVBox Blog](https://blog.csvbox.io/sheetjs-alternatives-best-tools-for-csv-import/) - Medium Reliability - Обзор альтернатив SheetJS для 2025 года  
[12] [Exceljs vs SheetJS - Stack Overflow](https://stackoverflow.com/questions/71643468/exceljs-vs-sheetjs) - Medium Reliability - Сравнение exceljs и SheetJS от разработчиков

### Техническая информация и решения проблем

[13] [XLSX bundle size using Webpack - GitHub Issue #694](https://github.com/SheetJS/sheetjs/issues/694) - Medium Reliability - Обсуждение оптимизации размера bundle SheetJS  
[14] [FileReader: readAsText() method - MDN](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsText) - High Reliability - Детальная документация метода readAsText  
[15] [10 Browser APIs You Should Use in 2025](https://rizqimulki.com/10-browser-apis-you-should-use-in-2025-idle-view-transitions-etc-025ecd4127c2) - Medium Reliability - Обзор актуальных браузерных API на 2025 год

---

**Версия отчета:** 1.0  
**Дата последнего обновления:** 31 октября 2025  
**Автор:** MiniMax Agent
