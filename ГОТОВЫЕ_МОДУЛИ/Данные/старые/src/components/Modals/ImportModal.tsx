import React from 'react';
import { Upload, FileText, FileSpreadsheet, Clipboard } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';
import { importFromTXT, importFromCSV, importFromClipboard } from '../../utils/export';

export const ImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { addPhrases } = useStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let result;
      
      if (ext === 'txt') {
        result = await importFromTXT(file);
      } else if (ext === 'csv') {
        result = await importFromCSV(file);
      } else {
        throw new Error('Неподдерживаемый формат файла');
      }
      
      if (result.errors.length > 0) {
        setError(`Импортировано с ошибками: ${result.errors.join(', ')}`);
      }
      
      if (result.phrases.length > 0) {
        addPhrases(result.phrases);
        onClose();
      } else {
        setError('Файл не содержит данных');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка импорта');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasteFromClipboard = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const text = await navigator.clipboard.readText();
      
      if (!text.trim()) {
        throw new Error('Буфер обмена пуст');
      }
      
      const result = await importFromClipboard(text);
      
      if (result.phrases.length > 0) {
        addPhrases(result.phrases);
        onClose();
      } else {
        setError('Нет данных для импорта');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка вставки из буфера');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Импорт фраз"
      size="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Выбор файла */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          
          <p className="text-sm text-gray-600 mb-2">
            Перетащите файл сюда или кликните для выбора
          </p>
          
          <p className="text-xs text-gray-500">
            Поддерживаемые форматы: TXT, CSV
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />
        </div>
        
        {/* Кнопки действий */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            icon={<FileText className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full"
          >
            Выбрать TXT
          </Button>
          
          <Button
            variant="secondary"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full"
          >
            Выбрать CSV
          </Button>
          
          <Button
            variant="secondary"
            icon={<Clipboard className="w-4 h-4" />}
            onClick={handlePasteFromClipboard}
            disabled={isLoading}
            className="w-full col-span-2"
          >
            Вставить из буфера обмена
          </Button>
        </div>
        
        {/* Инструкции */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Формат файлов:
          </h4>
          
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• TXT: каждая строка = одна фраза</li>
            <li>• CSV: колонки Фраза, ws, qws, bws (опционально)</li>
            <li>• Буфер обмена: построчный список фраз</li>
          </ul>
        </div>
        
        {/* Ошибки */}
        {error && (
          <div className="bg-error-100 border border-error-300 rounded-md p-3">
            <p className="text-sm text-error-600">{error}</p>
          </div>
        )}
        
        {/* Loading */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <p className="text-sm text-gray-600 mt-2">Импорт...</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
