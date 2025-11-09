import React from 'react';
import { AlertTriangle, Trash2, GitMerge } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';
import { findExactDuplicates, findMorphologicalDuplicates } from '../../utils/duplicates';
import type { DuplicateGroup, Phrase } from '../../types';

export const DuplicatesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { phrases, deletePhrases, addLog } = useStore();
  const [duplicates, setDuplicates] = React.useState<{
    exact: Phrase[][];
    morphological: Phrase[][];
    totalDuplicates: number;
  } | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  
  const handleSearch = React.useCallback(() => {
    setIsSearching(true);
    
    // Имитация асинхронной работы для UI
    setTimeout(() => {
      const exactGroups = findExactDuplicates(phrases);
      const morphGroups = findMorphologicalDuplicates(phrases);
      
      const totalDuplicates = 
        exactGroups.reduce((sum, group) => sum + group.length - 1, 0) +
        morphGroups.reduce((sum, group) => sum + group.length - 1, 0);
      
      setDuplicates({
        exact: exactGroups,
        morphological: morphGroups,
        totalDuplicates
      });
      setIsSearching(false);
      
      addLog('info', `Найдено дублей: ${totalDuplicates} (точных: ${exactGroups.length}, морфологических: ${morphGroups.length})`);
    }, 300);
  }, [phrases, addLog]);
  
  const handleRemoveDuplicates = React.useCallback((type: 'exact' | 'morphological' | 'all') => {
    if (!duplicates) return;
    
    const idsToDelete: string[] = [];
    
    if (type === 'exact' || type === 'all') {
      duplicates.exact.forEach(group => {
        // Удаляем все, кроме первой (сильнейшей по ws)
        group.slice(1).forEach(phrase => idsToDelete.push(phrase.id));
      });
    }
    
    if (type === 'morphological' || type === 'all') {
      duplicates.morphological.forEach(group => {
        // Удаляем все, кроме первой (сильнейшей по ws)
        group.slice(1).forEach(phrase => idsToDelete.push(phrase.id));
      });
    }
    
    const confirmed = window.confirm(
      `Удалить ${idsToDelete.length} дублей (оставить оригиналы)?`
    );
    
    if (confirmed) {
      deletePhrases(idsToDelete);
      addLog('success', `Удалено дублей: ${idsToDelete.length}`);
      
      // Обновить результаты поиска
      handleSearch();
    }
  }, [duplicates, deletePhrases, addLog, handleSearch]);
  
  // Поиск при открытии модалки
  React.useEffect(() => {
    if (isOpen && !duplicates) {
      handleSearch();
    }
  }, [isOpen, duplicates, handleSearch]);
  
  // Сброс при закрытии
  React.useEffect(() => {
    if (!isOpen) {
      setDuplicates(null);
    }
  }, [isOpen]);
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Поиск дублей"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
          
          {duplicates && duplicates.totalDuplicates > 0 && (
            <>
              <Button
                variant="secondary"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => handleRemoveDuplicates('exact')}
              >
                Удалить точные дубли
              </Button>
              <Button
                variant="secondary"
                icon={<GitMerge className="w-4 h-4" />}
                onClick={() => handleRemoveDuplicates('morphological')}
              >
                Удалить морфологические дубли
              </Button>
              <Button
                variant="danger"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => handleRemoveDuplicates('all')}
              >
                Удалить все дубли
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Статус поиска */}
        {isSearching && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3" />
            <p className="text-sm text-gray-600">Поиск дублей...</p>
          </div>
        )}
        
        {/* Результаты */}
        {duplicates && !isSearching && (
          <>
            {/* Статистика */}
            <div className={`p-4 rounded-md border ${
              duplicates.totalDuplicates > 0 
                ? 'bg-warning-100 border-warning-300' 
                : 'bg-success-100 border-success-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`w-5 h-5 ${
                  duplicates.totalDuplicates > 0 ? 'text-warning-500' : 'text-success-500'
                }`} />
                <span className="font-medium text-gray-800">
                  {duplicates.totalDuplicates === 0 
                    ? 'Дубли не найдены' 
                    : `Найдено дублей: ${duplicates.totalDuplicates}`}
                </span>
              </div>
              
              {duplicates.totalDuplicates > 0 && (
                <div className="text-sm text-gray-700 space-y-1">
                  <div>• Точных дублей: {duplicates.exact.reduce((sum, group) => sum + group.length - 1, 0)}</div>
                  <div>• Морфологических дублей: {duplicates.morphological.reduce((sum, group) => sum + group.length - 1, 0)}</div>
                </div>
              )}
            </div>
            
            {/* Точные дубли */}
            {duplicates.exact.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">
                    Точные дубли ({duplicates.exact.length} групп)
                  </h4>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRemoveDuplicates('exact')}
                  >
                    Удалить точные
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {duplicates.exact.map((group, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                      <div className="text-sm">
                        <div className="font-medium text-gray-800 mb-2">
                          Оригинал: "{group[0].text}" (WS: {group[0].ws})
                        </div>
                        <div className="text-gray-600 space-y-1">
                          {group.slice(1).map((dup, dupIndex) => (
                            <div key={dupIndex} className="pl-4 border-l-2 border-error-300">
                              Дубль {dupIndex + 1}: "{dup.text}" (WS: {dup.ws})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Морфологические дубли */}
            {duplicates.morphological.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">
                    Морфологические дубли ({duplicates.morphological.length} групп)
                  </h4>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRemoveDuplicates('morphological')}
                  >
                    Удалить морфологические
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {duplicates.morphological.map((group, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                      <div className="text-sm">
                        <div className="font-medium text-gray-800 mb-2">
                          Оригинал: "{group[0].text}" (WS: {group[0].ws})
                        </div>
                        <div className="text-gray-600 space-y-1">
                          {group.slice(1).map((dup, dupIndex) => (
                            <div key={dupIndex} className="pl-4 border-l-2 border-warning-300">
                              Морфологический дубль {dupIndex + 1}: "{dup.text}" (WS: {dup.ws})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Инструкция */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-800">
                <strong>Точные дубли:</strong> полностью идентичные фразы (регистр не учитывается)
                <br />
                <strong>Морфологические дубли:</strong> фразы с одинаковым смыслом, но разными словоформами
                <br />
                При удалении сохраняется первая найденная фраза (оригинал), остальные удаляются.
              </p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
