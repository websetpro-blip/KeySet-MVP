import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Filter } from '../../types';

export const AdvancedFiltersModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { filters, setFilters, savedFilters, saveCurrentFilter, applyFilter, addLog } = useStore();
  const [activeTab, setActiveTab] = useState<'numbers' | 'text' | 'quick' | 'saved'>('numbers');
  const [filterName, setFilterName] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[700px] h-[650px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Расширенные фильтры</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black text-2xl leading-none">&times;</button>
        </div>

        {/* Вкладки */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('numbers')}
            className={`px-6 py-2 ${activeTab === 'numbers' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Числовые
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-6 py-2 ${activeTab === 'text' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Текстовые
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-6 py-2 ${activeTab === 'quick' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Быстрые
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-6 py-2 ${activeTab === 'saved' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Сохранённые
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'numbers' && (
            <div className="space-y-4">
              {/* ws */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">ws от:</label>
                  <input
                    type="number"
                    value={filters.wsMin || ''}
                    onChange={(e) => setFilters({ wsMin: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">ws до:</label>
                  <input
                    type="number"
                    value={filters.wsMax || ''}
                    onChange={(e) => setFilters({ wsMax: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              {/* qws */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">qws от:</label>
                  <input
                    type="number"
                    value={filters.qwsMin || ''}
                    onChange={(e) => setFilters({ qwsMin: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">qws до:</label>
                  <input
                    type="number"
                    value={filters.qwsMax || ''}
                    onChange={(e) => setFilters({ qwsMax: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              {/* bws */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">bws от:</label>
                  <input
                    type="number"
                    value={filters.bwsMin || ''}
                    onChange={(e) => setFilters({ bwsMin: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">bws до:</label>
                  <input
                    type="number"
                    value={filters.bwsMax || ''}
                    onChange={(e) => setFilters({ bwsMax: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              {/* Длина */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Длина фразы от:</label>
                  <input
                    type="number"
                    value={filters.lengthMin || ''}
                    onChange={(e) => setFilters({ lengthMin: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">до:</label>
                  <input
                    type="number"
                    value={filters.lengthMax || ''}
                    onChange={(e) => setFilters({ lengthMax: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              {/* Слова */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Слов от:</label>
                  <input
                    type="number"
                    value={filters.wordCountMin || ''}
                    onChange={(e) => setFilters({ wordCountMin: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">до:</label>
                  <input
                    type="number"
                    value={filters.wordCountMax || ''}
                    onChange={(e) => setFilters({ wordCountMax: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Содержит слово:</label>
                <input
                  type="text"
                  value={filters.contains || ''}
                  onChange={(e) => setFilters({ contains: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="text-sm font-medium">НЕ содержит:</label>
                <input
                  type="text"
                  value={filters.notContains || ''}
                  onChange={(e) => setFilters({ notContains: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Начинается с:</label>
                <input
                  type="text"
                  value={filters.startsWith || ''}
                  onChange={(e) => setFilters({ startsWith: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Заканчивается на:</label>
                <input
                  type="text"
                  value={filters.endsWith || ''}
                  onChange={(e) => setFilters({ endsWith: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
          )}

          {activeTab === 'quick' && (
            <div className="space-y-2">
              {[
                { key: 'showOnlyHighFreq', label: 'Только высокочастотные (ws > 1000)' },
                { key: 'showOnlyLowFreq', label: 'Только низкочастотные (ws < 100)' },
                { key: 'showOnlyZeroFreq', label: 'Не парсилось (ws = 0)' },
                { key: 'showOnlyDuplicates', label: 'Только дубли' },
                { key: 'showOnlyWithStopwords', label: 'Со стоп-словами' },
                { key: 'showOnlySelected', label: 'Только выделенные' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters[item.key as keyof Filter] === true}
                    onChange={(e) => setFilters({ [item.key]: e.target.checked })}
                    className="w-4 h-4"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-2">
              {savedFilters.length === 0 ? (
                <p className="text-gray-500">Сохранённых фильтров нет</p>
              ) : (
                savedFilters.map(sf => (
                  <button
                    key={sf.id}
                    onClick={() => {
                      applyFilter(sf.id);
                    }}
                    className="w-full px-3 py-2 border rounded hover:bg-blue-50 text-left"
                  >
                    {sf.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="border-t p-4 flex gap-2">
          <input
            type="text"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="Имя нового фильтра"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={() => {
              if (filterName.trim()) {
                saveCurrentFilter(filterName);
                setFilterName('');
              }
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Сохранить
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
