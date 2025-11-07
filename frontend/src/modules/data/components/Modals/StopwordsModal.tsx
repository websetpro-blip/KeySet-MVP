import React from 'react';
import { Plus, Trash2, Upload, Download, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useStore } from '../../store/useStore';
import { filterPhrasesByStopwords, parseStopwords } from '../../utils/analysis';

export const StopwordsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { 
    phrases, 
    stopwords, 
    addStopwords, 
    removeStopword, 
    clearStopwords,
    deletePhrases,
    addLog 
  } = useStore();
  
  const [newWord, setNewWord] = React.useState('');
  const [stats, setStats] = React.useState({ withStopwords: 0, withoutStopwords: 0 });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Обновление статистики
  React.useEffect(() => {
    if (isOpen) {
      const stopwordTexts = stopwords.map(sw => sw.text);
      const result = filterPhrasesByStopwords(phrases, stopwordTexts);
      setStats({
        withStopwords: result.withStopwords.length,
        withoutStopwords: result.withoutStopwords.length,
      });
    }
  }, [isOpen, phrases, stopwords]);
  
  const handleAddWord = () => {
    const words = newWord.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length > 0) {
      addStopwords(words);
      setNewWord('');
    }
  };
  
  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const words = parseStopwords(text);
      
      if (words.length > 0) {
        addStopwords(words);
        addLog('success', `Импортировано стоп-слов: ${words.length}`);
      }
    } catch (error) {
      addLog('error', 'Ошибка импорта стоп-слов');
    }
  };
  
  const handleExportStopwords = () => {
    const text = stopwords.map(sw => sw.text).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stopwords.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    addLog('success', `Экспортировано стоп-слов: ${stopwords.length}`);
  };
  
  const handleMarkPhrases = () => {
    addLog('info', `Отмечено фраз со стоп-словами: ${stats.withStopwords}`);
    // TODO: Добавить визуальную отметку в таблице (красный фон)
  };
  
  const handleDeletePhrases = () => {
    const stopwordTexts = stopwords.map(sw => sw.text);
    const result = filterPhrasesByStopwords(phrases, stopwordTexts);
    const idsToDelete = result.withStopwords.map(p => p.id);
    
    const confirmed = window.confirm(
      `Удалить ${idsToDelete.length} фраз со стоп-словами?`
    );
    
    if (confirmed) {
      deletePhrases(idsToDelete);
      onClose();
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Управление стоп-словами"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
          
          {stats.withStopwords > 0 && (
            <Button
              variant="danger"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleDeletePhrases}
            >
              Удалить фразы ({stats.withStopwords})
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        {/* Статистика */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-error-100 border border-error-300 rounded-md p-3">
            <div className="text-xs text-error-600 mb-1">Со стоп-словами</div>
            <div className="text-2xl font-semibold text-error-700">
              {stats.withStopwords}
            </div>
          </div>
          
          <div className="bg-success-100 border border-success-300 rounded-md p-3">
            <div className="text-xs text-success-600 mb-1">Без стоп-слов</div>
            <div className="text-2xl font-semibold text-success-700">
              {stats.withoutStopwords}
            </div>
          </div>
        </div>
        
        {/* Добавление стоп-слова */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Добавить стоп-слово
          </label>
          
          <div className="flex gap-2">
            <Input
              placeholder="Введите слово или несколько через пробел"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddWord();
              }}
            />
            <Button
              icon={<Plus className="w-4 h-4" />}
              onClick={handleAddWord}
              disabled={!newWord.trim()}
            >
              Добавить
            </Button>
          </div>
        </div>
        
        {/* Импорт/Экспорт */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Импорт/Экспорт
          </label>
          
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              Импорт из TXT
            </Button>
            
            <Button
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportStopwords}
              disabled={stopwords.length === 0}
              className="flex-1"
            >
              Экспорт в TXT
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
              }}
              className="hidden"
            />
          </div>
        </div>
        
        {/* Список стоп-слов */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Список стоп-слов ({stopwords.length})
            </label>
            
            {stopwords.length > 0 && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  const confirmed = window.confirm('Очистить все стоп-слова?');
                  if (confirmed) clearStopwords();
                }}
              >
                Очистить
              </Button>
            )}
          </div>
          
          {stopwords.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm border border-gray-200 rounded-md">
              Нет стоп-слов. Добавьте первое слово.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
              <div className="p-2 space-y-1">
                {stopwords.map((word, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors group"
                  >
                    <span className="text-sm text-gray-700">{word.text}</span>
                    
                    <button
                      onClick={() => removeStopword(word.text)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-error-500 transition-all p-1 rounded hover:bg-white"
                      title="Удалить"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Инструкция */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs text-blue-800 space-y-1">
            <strong>Стоп-слова</strong> - нежелательные слова, которые нужно исключить из списка фраз.
            <br />
            • Добавьте стоп-слова вручную или импортируйте из файла
            <br />
            • Фразы, содержащие стоп-слова, можно удалить массово
            <br />
            • Поиск стоп-слов регистронезависимый
          </p>
        </div>
      </div>
    </Modal>
  );
};
