import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Phrase } from '../types';

// ========== ИМПОРТ ==========

export interface ImportOptions {
  groupId?: string | null;
}

export interface ParsedData {
  phrases: Omit<Phrase, 'id' | 'createdAt'>[];
  errors: string[];
}

// Импорт из TXT (каждая строка = фраза)
export const importFromTXT = async (file: File, options: ImportOptions = {}): Promise<ParsedData> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      const phrases = lines.map(line => ({
        text: line.trim(),
        ws: 0,
        qws: 0,
        bws: 0,
        status: 'pending' as const,
        groupId: options.groupId || null,
      }));
      
      resolve({ phrases, errors: [] });
    };
    
    reader.onerror = () => {
      resolve({ phrases: [], errors: ['Ошибка чтения файла'] });
    };
    
    reader.readAsText(file, 'UTF-8');
  });
};

// Импорт из CSV
export const importFromCSV = async (file: File, options: ImportOptions = {}): Promise<ParsedData> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const phrases: Omit<Phrase, 'id' | 'createdAt'>[] = [];
        const errors: string[] = [];
        
        results.data.forEach((row: any, index) => {
          if (!row.text && !row['Фраза']) {
            errors.push(`Строка ${index + 1}: отсутствует текст фразы`);
            return;
          }
          
          phrases.push({
            text: (row.text || row['Фраза'] || '').trim(),
            ws: parseInt(row.ws || row['ws'] || '0', 10),
            qws: parseInt(row.qws || row['qws'] || '0', 10),
            bws: parseInt(row.bws || row['bws'] || '0', 10),
            status: 'pending',
            groupId: options.groupId || null,
          });
        });
        
        resolve({ phrases, errors });
      },
      error: (error) => {
        resolve({ phrases: [], errors: [error.message] });
      },
    });
  });
};

// Импорт из буфера обмена
export const importFromClipboard = async (text: string, options: ImportOptions = {}): Promise<ParsedData> => {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  
  const phrases = lines.map(line => ({
    text: line.trim(),
    ws: 0,
    qws: 0,
    bws: 0,
    status: 'pending' as const,
    groupId: options.groupId || null,
  }));
  
  return { phrases, errors: [] };
};

// ========== ЭКСПОРТ ==========

export interface ExportOptions {
  phrases: Phrase[];
  filename: string;
}

// Экспорт в CSV
export const exportToCSV = (options: ExportOptions): void => {
  const { phrases, filename } = options;
  
  const data = phrases.map(p => ({
    'Фраза': p.text,
    'ws': p.ws,
    'qws': p.qws,
    'bws': p.bws,
    'Статус': p.status,
  }));
  
  const csv = Papa.unparse(data, {
    delimiter: ',',
    header: true,
  });
  
  // Добавляем BOM для корректного отображения в Excel
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
};

// Экспорт в XLSX
export const exportToXLSX = (options: ExportOptions): void => {
  const { phrases, filename } = options;
  
  const data = phrases.map(p => ({
    'Фраза': p.text,
    'ws': p.ws,
    'qws': p.qws,
    'bws': p.bws,
    'Статус': p.status,
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Настройка ширины колонок
  const colWidths = [
    { wch: 50 }, // Фраза
    { wch: 10 }, // ws
    { wch: 10 }, // qws
    { wch: 10 }, // bws
    { wch: 12 }, // Статус
  ];
  worksheet['!cols'] = colWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Фразы');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  saveAs(blob, `${filename}.xlsx`);
};

// Экспорт в TXT
export const exportToTXT = (options: ExportOptions): void => {
  const { phrases, filename } = options;
  
  const text = phrases.map(p => p.text).join('\n');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  
  saveAs(blob, `${filename}.txt`);
};

// Копирование в буфер обмена
export const copyToClipboard = async (phrases: Phrase[]): Promise<boolean> => {
  try {
    const text = phrases.map(p => p.text).join('\n');
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Ошибка копирования в буфер:', error);
    return false;
  }
};
