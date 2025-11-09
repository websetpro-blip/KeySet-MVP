import React, { useState } from 'react';
import { useStore } from '../../store/useStore';

export const ColumnSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { columnVisibility, setColumnVisibility, addLog } = useStore();
  const [columns, setColumns] = useState(columnVisibility || {
    phrase: true,
    ws: true,
    qws: true,
    bws: true,
    status: true,
    dateAdded: false,
  });

  const handleToggle = (col: string) => {
    const updated = { ...columns, [col]: !columns[col as keyof typeof columns] };
    setColumns(updated);
    setColumnVisibility(updated);
  };

  const handleSave = () => {
    addLog('success', 'Настройки столбцов сохранены');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[400px]">
        <h2 className="text-xl font-bold mb-4">Настройка столбцов</h2>

        <div className="space-y-2 mb-6">
          {[
            { key: 'phrase', label: 'Фраза' },
            { key: 'ws', label: 'ws (базовая частота)' },
            { key: 'qws', label: 'qws (в кавычках)' },
            { key: 'bws', label: 'bws (с восклицательным)' },
            { key: 'status', label: 'Статус парсинга' },
            { key: 'dateAdded', label: 'Дата добавления' },
          ].map(col => (
            <label key={col.key} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={columns[col.key as keyof typeof columns] === true}
                onChange={() => handleToggle(col.key)}
                className="w-4 h-4"
              />
              {col.label}
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Сохранить
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};
