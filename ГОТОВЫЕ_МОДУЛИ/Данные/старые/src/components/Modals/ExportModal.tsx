import React from 'react';
import { FileDown, FileText, FileSpreadsheet } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';
import { exportToCSV, exportToXLSX, exportToTXT } from '../../utils/export';

export const ExportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { phrases, selectedPhraseIds, selectedGroupId, groups } = useStore();
  const [scope, setScope] = React.useState<'all' | 'selected' | 'group'>('all');
  const [filename, setFilename] = React.useState('keyset_phrases');
  
  const getPhrasesToExport = () => {
    switch (scope) {
      case 'selected':
        return phrases.filter(p => selectedPhraseIds.has(p.id));
      case 'group':
        return selectedGroupId 
          ? phrases.filter(p => p.groupId === selectedGroupId)
          : phrases;
      default:
        return phrases;
    }
  };
  
  const handleExport = (format: 'csv' | 'xlsx' | 'txt') => {
    const phrasesToExport = getPhrasesToExport();
    
    if (phrasesToExport.length === 0) {
      alert('Нет фраз для экспорта');
      return;
    }
    
    const options = {
      phrases: phrasesToExport,
      filename,
    };
    
    switch (format) {
      case 'csv':
        exportToCSV(options);
        break;
      case 'xlsx':
        exportToXLSX(options);
        break;
      case 'txt':
        exportToTXT(options);
        break;
    }
    
    onClose();
  };
  
  const phrasesCount = getPhrasesToExport().length;
  const selectedGroup = selectedGroupId 
    ? groups.find(g => g.id === selectedGroupId)
    : null;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Экспорт фраз"
      size="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Выбор области экспорта */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Что экспортировать:
          </label>
          
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="scope"
                value="all"
                checked={scope === 'all'}
                onChange={(e) => setScope(e.target.value as any)}
                className="w-4 h-4 text-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">
                  Все фразы
                </div>
                <div className="text-xs text-gray-500">
                  {phrases.length} фраз
                </div>
              </div>
            </label>
            
            <label className={`flex items-center gap-3 p-3 border border-gray-200 rounded-md ${
              selectedPhraseIds.size === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
            }`}>
              <input
                type="radio"
                name="scope"
                value="selected"
                checked={scope === 'selected'}
                onChange={(e) => setScope(e.target.value as any)}
                disabled={selectedPhraseIds.size === 0}
                className="w-4 h-4 text-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">
                  Выделенные фразы
                </div>
                <div className="text-xs text-gray-500">
                  {selectedPhraseIds.size} фраз
                </div>
              </div>
            </label>
            
            <label className={`flex items-center gap-3 p-3 border border-gray-200 rounded-md ${
              !selectedGroupId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
            }`}>
              <input
                type="radio"
                name="scope"
                value="group"
                checked={scope === 'group'}
                onChange={(e) => setScope(e.target.value as any)}
                disabled={!selectedGroupId}
                className="w-4 h-4 text-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">
                  Текущая группа
                </div>
                <div className="text-xs text-gray-500">
                  {selectedGroup?.name || 'Группа не выбрана'} ({phrases.filter(p => p.groupId === selectedGroupId).length} фраз)
                </div>
              </div>
            </label>
          </div>
        </div>
        
        {/* Имя файла */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Имя файла:
          </label>
          
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
            placeholder="keyset_phrases"
          />
          
          <p className="mt-1 text-xs text-gray-500">
            Расширение будет добавлено автоматически
          </p>
        </div>
        
        {/* Формат экспорта */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Выберите формат:
          </label>
          
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="secondary"
              icon={<FileSpreadsheet className="w-5 h-5" />}
              onClick={() => handleExport('csv')}
              className="w-full flex flex-col items-center py-4 h-auto"
              disabled={phrasesCount === 0}
            >
              <span className="mt-2">CSV</span>
              <span className="text-xs text-gray-500 mt-1">
                Excel-совместимый
              </span>
            </Button>
            
            <Button
              variant="secondary"
              icon={<FileSpreadsheet className="w-5 h-5" />}
              onClick={() => handleExport('xlsx')}
              className="w-full flex flex-col items-center py-4 h-auto"
              disabled={phrasesCount === 0}
            >
              <span className="mt-2">XLSX</span>
              <span className="text-xs text-gray-500 mt-1">
                Microsoft Excel
              </span>
            </Button>
            
            <Button
              variant="secondary"
              icon={<FileText className="w-5 h-5" />}
              onClick={() => handleExport('txt')}
              className="w-full flex flex-col items-center py-4 h-auto"
              disabled={phrasesCount === 0}
            >
              <span className="mt-2">TXT</span>
              <span className="text-xs text-gray-500 mt-1">
                Построчный
              </span>
            </Button>
          </div>
        </div>
        
        {/* Инфо */}
        {phrasesCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              Будет экспортировано фраз: <span className="font-medium">{phrasesCount}</span>
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
