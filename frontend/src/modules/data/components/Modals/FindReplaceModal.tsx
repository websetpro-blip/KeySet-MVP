import React from 'react';
import { Modal } from '../ui/Modal';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({ isOpen, onClose }) => {
  const { phrases, selectedPhraseIds, updatePhrase, addLog } = useStore();
  
  const [findText, setFindText] = React.useState('');
  const [replaceText, setReplaceText] = React.useState('');
  const [caseSensitive, setCaseSensitive] = React.useState(false);
  const [wholeWords, setWholeWords] = React.useState(false);
  const [selectedOnly, setSelectedOnly] = React.useState(false);
  
  const phrasesToProcess = selectedOnly && selectedPhraseIds.size > 0
    ? phrases.filter(p => selectedPhraseIds.has(p.id))
    : phrases;

  const handleReplace = () => {
    if (!findText.trim()) {
      alert('Введите текст для поиска');
      return;
    }

    let count = 0;
    
    phrasesToProcess.forEach(phrase => {
      let newText = phrase.text;
      
      if (wholeWords) {
        // Заменять только целые слова
        const regex = new RegExp(
          `\\b${findText}\\b`, 
          caseSensitive ? 'g' : 'gi'
        );
        const replaced = newText.replace(regex, replaceText);
        if (replaced !== newText) {
          newText = replaced;
          count++;
        }
      } else {
        // Обычная замена
        const searchText = caseSensitive ? findText : findText.toLowerCase();
        const targetText = caseSensitive ? newText : newText.toLowerCase();
        
        if (targetText.includes(searchText)) {
          const regex = new RegExp(
            findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
            caseSensitive ? 'g' : 'gi'
          );
          newText = newText.replace(regex, replaceText);
          count++;
        }
      }
      
      if (newText !== phrase.text) {
        updatePhrase(phrase.id, { text: newText });
      }
    });

    addLog('success', `Замена выполнена: обработано ${count} фраз`);
    onClose();
  };

  const handleReplaceAll = () => {
    if (!findText.trim()) {
      alert('Введите текст для поиска');
      return;
    }

    const confirmed = window.confirm(
      `Заменить "${findText}" на "${replaceText}" во всех фразах${selectedOnly ? ' (выделенных)' : ''}?`
    );
    
    if (!confirmed) return;

    handleReplace();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔍 Поиск и замена"
      size="md"
    >
      <div className="p-6">
        <div className="space-y-4">
          {/* Найти */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Найти:
            </label>
            <Input
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Введите текст для поиска"
              autoFocus
            />
          </div>

          {/* Заменить на */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заменить на:
            </label>
            <Input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Введите текст для замены"
            />
          </div>

          {/* Опции */}
          <div className="space-y-2 border-t pt-4">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={caseSensitive}
                onChange={() => setCaseSensitive(!caseSensitive)}
              />
              <span className="text-sm text-gray-700">Учитывать регистр</span>
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={wholeWords}
                onChange={() => setWholeWords(!wholeWords)}
              />
              <span className="text-sm text-gray-700">Только целые слова</span>
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={selectedOnly}
                onChange={() => setSelectedOnly(!selectedOnly)}
              />
              <span className="text-sm text-gray-700">
                Только выделенные фразы {selectedPhraseIds.size > 0 && `(${selectedPhraseIds.size})`}
              </span>
            </label>
          </div>

          {/* Предпросмотр */}
          {findText && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="text-xs text-blue-700 font-medium mb-1">Предпросмотр:</div>
              <div className="text-sm text-gray-700">
                Будет обработано фраз: <strong>{phrasesToProcess.filter(p => {
                  const text = caseSensitive ? p.text : p.text.toLowerCase();
                  const search = caseSensitive ? findText : findText.toLowerCase();
                  return text.includes(search);
                }).length}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button onClick={onClose} variant="secondary">
            Отмена
          </Button>
          <Button onClick={handleReplaceAll} variant="primary">
            Заменить всё
          </Button>
        </div>
      </div>
    </Modal>
  );
};
