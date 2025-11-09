import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { useStore } from '../../store/useStore';
import { Trash2, Plus, FileDown, FileUp, Check, X } from 'lucide-react';
import type { Stopword } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface StopwordsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StopwordsManagerModal: React.FC<StopwordsManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { 
    stopwords, 
    addStopword, 
    deleteStopword, 
    updateStopword,
    phrases,
    updatePhrase,
    selectedPhraseIds,
    addLog 
  } = useStore();

  const [activeTab, setActiveTab] = React.useState<'geo' | 'commercial' | 'info'>('geo');
  const [newWord, setNewWord] = React.useState('');
  const [matchType, setMatchType] = React.useState<'exact' | 'partial' | 'independent'>('partial');
  const [useMorphology, setUseMorphology] = React.useState(false);
  const [bulkInput, setBulkInput] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Фильтрация стоп-слов по категории
  const filteredStopwords = React.useMemo(() => {
    const categoryMap = {
      'geo': 'ГЕО',
      'commercial': 'КОММЕРЧЕСКИЕ',
      'info': 'ИНФОРМАЦИОННЫЕ',
    };
    return stopwords.filter(sw => sw.category === categoryMap[activeTab]);
  }, [stopwords, activeTab]);

  // Добавление одного стоп-слова
  const handleAddStopword = () => {
    if (!newWord.trim()) return;

    const categoryMap = {
      'geo': 'ГЕО' as const,
      'commercial': 'КОММЕРЧЕСКИЕ' as const,
      'info': 'ИНФОРМАЦИОННЫЕ' as const,
    };

    const stopword: Stopword = {
      id: uuidv4(),
      text: newWord.trim(),
      matchType,
      useMorphology,
      category: categoryMap[activeTab],
    };

    addStopword(stopword);
    setNewWord('');
  };

  // Массовое добавление
  const handleBulkAdd = () => {
    if (!bulkInput.trim()) return;

    const words = bulkInput.split('\n').filter(w => w.trim());
    const categoryMap = {
      'geo': 'ГЕО' as const,
      'commercial': 'КОММЕРЧЕСКИЕ' as const,
      'info': 'ИНФОРМАЦИОННЫЕ' as const,
    };

    words.forEach(word => {
      const stopword: Stopword = {
        id: uuidv4(),
        text: word.trim(),
        matchType,
        useMorphology,
        category: categoryMap[activeTab],
      };
      addStopword(stopword);
    });

    setBulkInput('');
    addLog('success', `Добавлено стоп-слов: ${words.length}`);
  };

  // Проверка фразы на стоп-слова (упрощенная версия морфологии)
  const checkStopword = (phrase: string, stopword: Stopword): boolean => {
    const phraseLower = phrase.toLowerCase();
    const wordLower = stopword.text.toLowerCase();

    switch (stopword.matchType) {
      case 'exact':
        // Точное вхождение как отдельное слово
        const words = phraseLower.split(/\s+/);
        return words.includes(wordLower);
      
      case 'partial':
        // Частичное вхождение (подстрока)
        return phraseLower.includes(wordLower);
      
      case 'independent':
        // Независимый от словоформы (упрощенная морфология)
        if (stopword.useMorphology) {
          // Проверяем корень слова (первые 4-5 символов)
          const root = wordLower.slice(0, Math.min(5, wordLower.length - 2));
          return phraseLower.includes(root);
        }
        return phraseLower.includes(wordLower);
      

      
      default:
        return phraseLower.includes(wordLower);
    }
  };

  // Отметить фразы со стоп-словами
  const handleMarkPhrases = () => {
    let count = 0;
    phrases.forEach(phrase => {
      const hasStopword = stopwords.some(sw => checkStopword(phrase.text, sw));
      if (hasStopword !== phrase.hasStopword) {
        updatePhrase(phrase.id, { hasStopword });
        if (hasStopword) count++;
      }
    });
    addLog('success', `Отмечено фраз со стоп-словами: ${count}`);
  };

  // Снять отметку
  const handleUnmarkPhrases = () => {
    phrases.forEach(phrase => {
      if (phrase.hasStopword) {
        updatePhrase(phrase.id, { hasStopword: false });
      }
    });
    addLog('info', 'Отметки сняты со всех фраз');
  };

  // Экспорт стоп-слов
  const handleExport = () => {
    const data = stopwords.map(sw => ({
      word: sw.text,
      matchType: sw.matchType,
      morphology: sw.useMorphology,
      category: sw.category,
    }));
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stopwords.json';
    a.click();
    URL.revokeObjectURL(url);
    addLog('success', 'Стоп-слова экспортированы');
  };

  // Импорт стоп-слов
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        data.forEach((item: any) => {
          const stopword: Stopword = {
            id: uuidv4(),
            text: item.word,
            matchType: item.matchType || 'partial',
            useMorphology: item.morphology || false,
            category: item.category || 'ГЕО',
          };
          addStopword(stopword);
        });
        addLog('success', `Импортировано стоп-слов: ${data.length}`);
      } catch (error) {
        addLog('error', 'Ошибка импорта стоп-слов');
      }
    };
    reader.readAsText(file);
  };

  // Получить описание типа вхождения
  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'exact': return 'Точное (как слово)';
      case 'partial': return 'Частичное (подстрока)';
      case 'independent': return 'Независимо от формы';
      default: return type;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Управление стоп-словами"
      size="lg"
    >
      <div className="space-y-4">
        {/* Вкладки категорий */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('geo')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'geo'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ГЕО ({stopwords.filter(sw => sw.category === 'ГЕО').length})
          </button>
          <button
            onClick={() => setActiveTab('commercial')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'commercial'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            КОММЕРЧЕСКИЕ ({stopwords.filter(sw => sw.category === 'КОММЕРЧЕСКИЕ').length})
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'info'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ИНФОРМАЦИОННЫЕ ({stopwords.filter(sw => sw.category === 'ИНФОРМАЦИОННЫЕ').length})
          </button>
        </div>

        {/* Добавление стоп-слова */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="flex gap-2">
            <Input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Введите стоп-слово..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddStopword()}
            />
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleAddStopword}>
              Добавить
            </Button>
          </div>

          <div className="flex gap-4 items-center text-sm">
            <label className="flex items-center gap-2">
              <span className="text-gray-700">Тип:</span>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as any)}
                className="px-2 py-1 border border-gray-300 rounded"
              >
                <option value="exact">Точное (слово)</option>
                <option value="partial">Частичное</option>
                <option value="independent">Независимо от формы</option>
              </select>
            </label>

            <Checkbox
              checked={useMorphology}
              onChange={() => setUseMorphology(!useMorphology)}
              label="Морфология"
            />
          </div>

          {/* Массовое добавление */}
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              Массовое добавление (по одному на строку)
            </summary>
            <div className="mt-2 space-y-2">
              <Textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="москва&#10;петербург&#10;новосибирск"
                rows={5}
              />
              <Button variant="secondary" onClick={handleBulkAdd}>
                Добавить всё
              </Button>
            </div>
          </details>
        </div>

        {/* Список стоп-слов */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredStopwords.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Нет стоп-слов в этой категории
            </div>
          ) : (
            filteredStopwords.map(sw => (
              <div
                key={sw.id}
                className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded hover:bg-gray-50"
              >
                <span className="flex-1 font-medium">{sw.text}</span>
                <span className="text-xs text-gray-500">{getMatchTypeLabel(sw.matchType)}</span>
                {sw.useMorphology && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Морфология
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="w-3 h-3" />}
                  onClick={() => deleteStopword(sw.id)}
                />
              </div>
            ))
          )}
        </div>

        {/* Действия */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <Button variant="primary" icon={<Check className="w-4 h-4" />} onClick={handleMarkPhrases}>
            Отметить фразы
          </Button>
          <Button variant="secondary" icon={<X className="w-4 h-4" />} onClick={handleUnmarkPhrases}>
            Снять отметки
          </Button>
          <div className="flex-1" />
          <Button variant="secondary" icon={<FileDown className="w-4 h-4" />} onClick={handleExport}>
            Экспорт
          </Button>
          <Button variant="secondary" icon={<FileUp className="w-4 h-4" />} onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = handleImport as any;
            input.click();
          }}>
            Импорт
          </Button>
        </div>

        {/* Статистика */}
        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
          <strong>Статистика:</strong> Всего стоп-слов: {stopwords.length} | 
          Фраз со стоп-словами: {phrases.filter(p => p.hasStopword).length}
        </div>
      </div>
    </Modal>
  );
};
