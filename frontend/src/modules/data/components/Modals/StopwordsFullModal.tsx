import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Stopword } from '../../types';

export const StopwordsFullModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { stopwords, addStopword, deleteStopword, updateStopword, markStopwordPhrases, deleteStopwordPhrases, addLog } = useStore();
  const [activeTab, setActiveTab] = useState<'list' | 'types' | 'actions'>('list');
  const [newWord, setNewWord] = useState('');
  const [category, setCategory] = useState<'ГЕО' | 'КОММЕРЧЕСКИЕ' | 'ИНФОРМАЦИОННЫЕ'>('ГЕО');

  const handleAddStopword = () => {
    if (!newWord.trim()) return;

    const stopword: Stopword = {
      id: Date.now().toString() + Math.random(),
      text: newWord.trim(),
      matchType: 'partial',
      useMorphology: false,
      category
    };

    addStopword(stopword);
    setNewWord('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Стоп-слова</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black text-2xl leading-none">&times;</button>
        </div>

        {/* Вкладки */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-2 ${activeTab === 'list' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          >
            Список
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`px-6 py-2 ${activeTab === 'types' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          >
            Типы вхождения
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-6 py-2 ${activeTab === 'actions' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          >
            Действия
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Новое стоп-слово"
                  className="flex-1 px-3 py-2 border rounded"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStopword()}
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="px-3 py-2 border rounded"
                >
                  <option>ГЕО</option>
                  <option>КОММЕРЧЕСКИЕ</option>
                  <option>ИНФОРМАЦИОННЫЕ</option>
                </select>
                <button
                  onClick={handleAddStopword}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  +
                </button>
              </div>

              {/* Список по категориям */}
              {(['ГЕО', 'КОММЕРЧЕСКИЕ', 'ИНФОРМАЦИОННЫЕ'] as const).map(cat => {
                const words = stopwords.filter(sw => sw.category === cat);
                if (words.length === 0) return null;

                return (
                  <div key={cat} className="border rounded p-3">
                    <h4 className="font-bold mb-2">{cat} ({words.length})</h4>
                    <div className="space-y-1">
                      {words.map(sw => (
                        <div key={sw.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <span>{sw.text}</span>
                          <button
                            onClick={() => deleteStopword(sw.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'types' && (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Стоп-слово</th>
                  <th className="border p-2 text-left">Тип вхождения</th>
                  <th className="border p-2 text-center">Морфология</th>
                </tr>
              </thead>
              <tbody>
                {stopwords.map(sw => (
                  <tr key={sw.id} className="hover:bg-gray-50">
                    <td className="border p-2">{sw.text}</td>
                    <td className="border p-2">
                      <select
                        value={sw.matchType}
                        onChange={(e) =>
                          updateStopword(sw.id, {
                            matchType: e.target.value as 'exact' | 'partial' | 'independent'
                          })
                        }
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option value="exact">Полное совпадение</option>
                        <option value="partial">Частичное</option>
                        <option value="independent">Независимое</option>
                      </select>
                    </td>
                    <td className="border p-2 text-center">
                      <input
                        type="checkbox"
                        checked={sw.useMorphology}
                        onChange={(e) =>
                          updateStopword(sw.id, { useMorphology: e.target.checked })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  const marked = markStopwordPhrases();
                  addLog('success', `Найдено фраз со стоп-словами: ${marked.length}`);
                }}
                className="w-full px-4 py-3 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Найти фразы со стоп-словами
              </button>
              <button
                onClick={() => {
                  if (!confirm('Удалить все фразы со стоп-словами?')) return;
                  deleteStopwordPhrases();
                }}
                className="w-full px-4 py-3 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Удалить фразы со стоп-словами
              </button>
            </div>
          )}
        </div>

        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
