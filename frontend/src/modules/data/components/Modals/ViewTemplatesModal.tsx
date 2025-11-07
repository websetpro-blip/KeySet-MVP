import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useStore } from '../../store/useStore';

interface ViewTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ViewTemplatesModal: React.FC<ViewTemplatesModalProps> = ({ isOpen, onClose }) => {
  const {
    viewTemplates,
    columnVisibility,
    columnOrder,
    columnPinning,
    saveViewTemplate,
    loadViewTemplate,
    deleteViewTemplate,
    addLog,
  } = useStore();

  const [newTemplateName, setNewTemplateName] = React.useState('');
  const [isSaveMode, setIsSaveMode] = React.useState(false);

  const handleSave = () => {
    if (newTemplateName.trim()) {
      saveViewTemplate(newTemplateName.trim());
      setNewTemplateName('');
      setIsSaveMode(false);
    }
  };

  const handleLoad = (templateId: string) => {
    loadViewTemplate(templateId);
    onClose();
  };

  const handleDelete = (templateId: string) => {
    if (confirm('Удалить этот шаблон вида?')) {
      deleteViewTemplate(templateId);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Шаблоны видов таблицы" size="md">
      <div className="p-6">
        {/* Сохранить текущий вид */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="font-medium text-sm text-blue-900 mb-2">
            Текущая конфигурация:
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <div>Видимые колонки: {Object.entries(columnVisibility).filter(([_, v]) => v).length}</div>
            <div>Закреплено колонок: {(columnPinning.left?.length || 0) + (columnPinning.right?.length || 0)}</div>
            <div>Порядок колонок: {columnOrder.length > 0 ? 'Настроен' : 'По умолчанию'}</div>
          </div>

          {!isSaveMode ? (
            <Button
              onClick={() => setIsSaveMode(true)}
              variant="primary"
              className="mt-3 text-sm"
            >
              Сохранить как шаблон
            </Button>
          ) : (
            <div className="mt-3 flex gap-2">
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Название шаблона"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
                className="flex-1"
              />
              <Button onClick={handleSave} variant="primary">
                Сохранить
              </Button>
              <Button onClick={() => { setIsSaveMode(false); setNewTemplateName(''); }} variant="secondary">
                Отмена
              </Button>
            </div>
          )}
        </div>

        {/* Список сохраненных шаблонов */}
        <div>
          <h3 className="font-medium text-gray-800 mb-3">
            Сохраненные шаблоны ({viewTemplates.length})
          </h3>

          {viewTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Нет сохраненных шаблонов.
              <br />
              Настройте таблицу и сохраните текущий вид как шаблон.
            </div>
          ) : (
            <div className="space-y-2">
              {viewTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-800">
                      {template.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Object.entries(template.columnVisibility).filter(([_, v]) => v).length} видимых колонок
                      {(template.columnPinning.left?.length || 0) + (template.columnPinning.right?.length || 0) > 0 && 
                        ` • ${(template.columnPinning.left?.length || 0) + (template.columnPinning.right?.length || 0)} закреплено`
                      }
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleLoad(template.id)}
                      variant="secondary"
                      className="text-sm"
                    >
                      Загрузить
                    </Button>
                    <Button
                      onClick={() => handleDelete(template.id)}
                      variant="danger"
                      className="text-sm"
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Подсказка */}
        <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
          <strong>Подсказка:</strong> Шаблоны видов сохраняют конфигурацию колонок (видимость, порядок, закрепление).
          Используйте их для быстрого переключения между разными представлениями данных.
        </div>
      </div>
    </Modal>
  );
};
