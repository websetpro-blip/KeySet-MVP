// ============================================
// ПРИМЕРЫ КОДА: Экспорт/Импорт файлов в браузере
// ============================================

// ============================================
// 1. ЭКСПОРТ В CSV (используя papaparse)
// ============================================

import Papa from 'papaparse';
import { saveAs } from 'file-saver';

/**
 * Экспорт таблицы фраз в CSV
 * @param {Array} data - Массив объектов с данными
 * @param {string} filename - Имя файла для сохранения
 */
export function exportToCSV(data, filename = 'export.csv') {
  // Пример данных:
  // [
  //   { №: 1, Фраза: "купить iPhone", ws: 1000, qws: 500, bws: 200, Статус: "Активна" },
  //   { №: 2, Фраза: "смартфон цена", ws: 800, qws: 400, bws: 150, Статус: "Пауза" }
  // ]
  
  // Конвертируем данные в CSV с поддержкой UTF-8
  const csv = Papa.unparse(data, {
    delimiter: ',',
    header: true,
    encoding: 'utf-8'
  });
  
  // Добавляем BOM (Byte Order Mark) для корректного отображения кириллицы в Excel
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csv;
  
  // Создаем Blob с правильной кодировкой
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  
  // Сохраняем файл
  saveAs(blob, filename);
}

// ============================================
// 2. ЭКСПОРТ В XLSX (используя SheetJS)
// ============================================

import * as XLSX from 'xlsx';

/**
 * Экспорт таблицы фраз в XLSX с форматированием
 * @param {Array} data - Массив объектов с данными
 * @param {string} filename - Имя файла для сохранения
 */
export function exportToXLSX(data, filename = 'export.xlsx') {
  // Создаем новую рабочую книгу
  const workbook = XLSX.utils.book_new();
  
  // Конвертируем данные в лист
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Настройка ширины колонок
  const columnWidths = [
    { wch: 5 },   // № 
    { wch: 30 },  // Фраза
    { wch: 10 },  // ws
    { wch: 10 },  // qws
    { wch: 10 },  // bws
    { wch: 15 }   // Статус
  ];
  worksheet['!cols'] = columnWidths;
  
  // Добавляем лист в книгу
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Фразы');
  
  // Генерируем файл
  XLSX.writeFile(workbook, filename);
}

/**
 * Экспорт с дополнительным форматированием (требует xlsx-style или xlsx-js-style)
 * Примечание: Community Edition SheetJS не поддерживает стили
 * Для стилей нужна либо Pro версия, либо альтернативы (exceljs, xlsx-js-style)
 */
export function exportToXLSXStyled(data, filename = 'export.xlsx') {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Настройка ширины колонок
  worksheet['!cols'] = [
    { wch: 5 }, { wch: 30 }, { wch: 10 }, 
    { wch: 10 }, { wch: 10 }, { wch: 15 }
  ];
  
  // Закрепляем первую строку (заголовки)
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Фразы');
  XLSX.writeFile(workbook, filename);
}

// ============================================
// 3. ИМПОРТ ИЗ TXT (построчно)
// ============================================

/**
 * Импорт фраз из TXT файла (построчно)
 * @param {File} file - Объект File из input[type="file"]
 * @returns {Promise<Array<string>>} - Массив фраз
 */
export function importFromTXT(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        // Читаем содержимое как текст с UTF-8
        const text = event.target.result;
        
        // Разбиваем на строки и фильтруем пустые
        const lines = text
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        resolve(lines);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'));
    };
    
    // Читаем файл как текст с явным указанием UTF-8
    reader.readAsText(file, 'UTF-8');
  });
}

// Пример использования:
// const fileInput = document.getElementById('txt-file-input');
// fileInput.addEventListener('change', async (event) => {
//   const file = event.target.files[0];
//   if (file) {
//     const phrases = await importFromTXT(file);
//     console.log('Импортированные фразы:', phrases);
//   }
// });

// ============================================
// 4. ИМПОРТ ИЗ CSV (используя papaparse)
// ============================================

/**
 * Импорт данных из CSV файла
 * @param {File} file - Объект File из input[type="file"]
 * @returns {Promise<Array<Object>>} - Массив объектов с данными
 */
export function importFromCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,           // Первая строка - заголовки
      encoding: 'UTF-8',      // Кодировка
      skipEmptyLines: true,   // Пропускать пустые строки
      dynamicTyping: true,    // Автоматическое преобразование типов (числа, булевы)
      transformHeader: (header) => {
        // Удаляем BOM если есть
        return header.replace(/^\uFEFF/, '').trim();
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('Ошибки при парсинге CSV:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

// Пример использования:
// const fileInput = document.getElementById('csv-file-input');
// fileInput.addEventListener('change', async (event) => {
//   const file = event.target.files[0];
//   if (file) {
//     try {
//       const data = await importFromCSV(file);
//       console.log('Импортированные данные:', data);
//     } catch (error) {
//       console.error('Ошибка импорта:', error);
//     }
//   }
// });

// ============================================
// 5. ИМПОРТ ИЗ XLSX (используя SheetJS)
// ============================================

/**
 * Импорт данных из XLSX файла
 * @param {File} file - Объект File из input[type="file"]
 * @returns {Promise<Array<Object>>} - Массив объектов с данными
 */
export function importFromXLSX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Берем первый лист
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Конвертируем в JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// ============================================
// 6. УНИВЕРСАЛЬНЫЙ КОМПОНЕНТ ДЛЯ ИМПОРТА
// ============================================

/**
 * Универсальная функция импорта (автоматически определяет формат)
 * @param {File} file - Объект File из input[type="file"]
 * @returns {Promise<Array>} - Массив данных (строки для TXT, объекты для CSV/XLSX)
 */
export async function importFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'txt':
      return await importFromTXT(file);
    case 'csv':
      return await importFromCSV(file);
    case 'xlsx':
    case 'xls':
      return await importFromXLSX(file);
    default:
      throw new Error(`Неподдерживаемый формат файла: ${extension}`);
  }
}

// ============================================
// 7. REACT КОМПОНЕНТ (пример использования)
// ============================================

/*
import React, { useState } from 'react';

const FileImportExport = () => {
  const [data, setData] = useState([
    { №: 1, Фраза: "купить iPhone", ws: 1000, qws: 500, bws: 200, Статус: "Активна" },
    { №: 2, Фраза: "смартфон цена", ws: 800, qws: 400, bws: 150, Статус: "Пауза" }
  ]);

  const handleExportCSV = () => {
    exportToCSV(data, 'phrases.csv');
  };

  const handleExportXLSX = () => {
    exportToXLSX(data, 'phrases.xlsx');
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const importedData = await importFile(file);
        console.log('Импортировано:', importedData);
        // Обработка импортированных данных...
      } catch (error) {
        console.error('Ошибка импорта:', error);
      }
    }
  };

  return (
    <div>
      <div>
        <button onClick={handleExportCSV}>Экспорт в CSV</button>
        <button onClick={handleExportXLSX}>Экспорт в XLSX</button>
      </div>
      <div>
        <input 
          type="file" 
          accept=".txt,.csv,.xlsx,.xls"
          onChange={handleImport}
        />
      </div>
    </div>
  );
};

export default FileImportExport;
*/

// ============================================
// 8. СОВРЕМЕННАЯ АЛЬТЕРНАТИВА: File System Access API
// ============================================

/**
 * Сохранение файла используя современный File System Access API
 * (работает только в Chromium-based браузерах: Chrome, Edge)
 * Fallback на file-saver для других браузеров
 */
export async function saveFileModern(blob, suggestedName) {
  // Проверяем поддержку File System Access API
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'Files',
            accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
          }
        ]
      });
      
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        // Пользователь отменил
        return false;
      }
      throw error;
    }
  } else {
    // Fallback на file-saver
    saveAs(blob, suggestedName);
    return true;
  }
}
