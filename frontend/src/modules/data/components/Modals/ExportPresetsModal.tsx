import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { ExportPreset } from '../../types';
import { Modal } from '../ui/Modal';

interface ExportPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const availableColumns = [
  { id: 'text', label: 'Фраза' },
  { id: 'ws', label: 'Частота (ws)' },
  { id: 'qws', label: 'Частота в кавычках (qws)' },
  { id: 'bws', label: 'Частота с ! (bws)' },
  { id: 'group', label: 'Группа' },
  { id: 'groupPath', label: 'Путь группы' },
  { id: 'status', label: 'Статус' },
  { id: 'tags', label: 'Теги' },
  { id: 'minusTerms', label: 'Минус-слова' }
];

const defaultPresets: Omit<ExportPreset, 'id' | 'created'>[] = [
  {
    name: 'Для Яндекс.Директ',
    columns: ['text', 'ws', 'groupPath'],
    includeGroupPath: true,
    csvDelimiter: ';',
    encoding: 'utf-8'
  },
  {
    name: 'Для Google Ads',
    columns: ['text', 'ws', 'qws', 'group'],
    includeGroupPath: false,
    csvDelimiter: ',',
    encoding: 'utf-8'
  },
  {
    name: 'Для Excel (полный)',
    columns: ['text', 'ws', 'qws', 'bws', 'groupPath', 'status', 'tags'],
    includeGroupPath: true,
    csvDelimiter: ';',
    encoding: 'windows-1251'
  }
];

const ExportPresetsModal: React.FC<ExportPresetsModalProps> = ({ isOpen, onClose }) => {
  const { exportPresets, saveExportPreset, loadExportPreset, deleteExportPreset, addLog } = useStore();
  
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingPreset, setEditingPreset] = useState<ExportPreset | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    columns: ['text', 'ws'] as string[],
    includeGroupPath: false,
    csvDelimiter: ';' as ';' | ',' | '\t',
    encoding: 'utf-8' as 'utf-8' | 'windows-1251'
  });

  const handleCreateNew = () => {
    setFormData({
      name: '',
      columns: ['text', 'ws'],
      includeGroupPath: false,
      csvDelimiter: ';',
      encoding: 'utf-8'
    });
    setMode('create');
  };

  const handleEdit = (preset: ExportPreset) => {
    setEditingPreset(preset);
    setFormData({
      name: preset.name,
      columns: preset.columns,
      includeGroupPath: preset.includeGroupPath,
      csvDelimiter: preset.csvDelimiter,
      encoding: preset.encoding
    });
    setMode('edit');
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      addLog('warning', 'Введите название пресета');
      return;
    }

    if (formData.columns.length === 0) {
      addLog('warning', 'Выберите хотя бы одну колонку');
      return;
    }

    if (mode === 'edit' && editingPreset) {
      // Обновление существующего - удаляем старый и создаем новый
      deleteExportPreset(editingPreset.id);
    }

    saveExportPreset(formData);
    setMode('list');
    addLog('success', `Пресет сохранен: ${formData.name}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить пресет?')) {
      deleteExportPreset(id);
      addLog('success', 'Пресет удален');
    }
  };

  const handleApplyDefault = (preset: Omit<ExportPreset, 'id' | 'created'>) => {
    saveExportPreset(preset);
    addLog('success', `Добавлен стандартный пресет: ${preset.name}`);
  };

  const handleCancel = () => {
    setMode('list');
    setEditingPreset(null);
  };

  const toggleColumn = (columnId: string) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.includes(columnId)
        ? prev.columns.filter(id => id !== columnId)
        : [...prev.columns, columnId]
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Управление пресетами экспорта" size="lg">
      <div className="space-y-6">
        {mode === 'list' && (
          <>
            {/* Стандартные пресеты */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Стандартные пресеты
              </h3>
              <div className="space-y-2">
                {defaultPresets.map((preset, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{preset.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {preset.columns.length} колонок • {preset.encoding} • разделитель: {preset.csvDelimiter === ';' ? 'точка с запятой' : preset.csvDelimiter === ',' ? 'запятая' : 'табуляция'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyDefault(preset)}
                      className="ml-4 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Добавить
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Пользовательские пресеты */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Мои пресеты ({exportPresets.length})
                </h3>
                <button
                  onClick={handleCreateNew}
                  className="px-3 py-1.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Создать
                </button>
              </div>
              
              {exportPresets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">Нет сохраненных пресетов</div>
                  <div className="text-xs mt-1">Создайте новый или добавьте стандартный</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {exportPresets.map(preset => (
                    <div key={preset.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{preset.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {preset.columns.length} колонок • {preset.encoding} • разделитель: {preset.csvDelimiter === ';' ? 'точка с запятой' : preset.csvDelimiter === ',' ? 'запятая' : 'табуляция'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(preset)}
                          className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 font-medium"
                        >
                          Изменить
                        </button>
                        <button
                          onClick={() => handleDelete(preset.id)}
                          className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {(mode === 'create' || mode === 'edit') && (
          <div className="space-y-4">
            {/* Название */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название пресета
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Экспорт для рекламы"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Колонки */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите колонки для экспорта
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableColumns.map(col => (
                  <label key={col.id} className="flex items-center space-x-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.columns.includes(col.id)}
                      onChange={() => toggleColumn(col.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Путь группы */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeGroupPath}
                  onChange={(e) => setFormData({ ...formData, includeGroupPath: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Показывать иерархию групп (Главная → Подгруппа)</span>
              </label>
            </div>

            {/* CSV разделитель */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Разделитель CSV
              </label>
              <select
                value={formData.csvDelimiter}
                onChange={(e) => setFormData({ ...formData, csvDelimiter: e.target.value as ';' | ',' | '\t' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value=";">Точка с запятой (;)</option>
                <option value=",">Запятая (,)</option>
                <option value="\t">Табуляция (TAB)</option>
              </select>
            </div>

            {/* Кодировка */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Кодировка
              </label>
              <select
                value={formData.encoding}
                onChange={(e) => setFormData({ ...formData, encoding: e.target.value as 'utf-8' | 'windows-1251' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="utf-8">UTF-8 (рекомендуется)</option>
                <option value="windows-1251">Windows-1251 (для старых программ)</option>
              </select>
            </div>

            {/* Кнопки */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {mode === 'edit' ? 'Сохранить изменения' : 'Создать пресет'}
              </button>
            </div>
          </div>
        )}

        {mode === 'list' && (
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Закрыть
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ExportPresetsModal;
