import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { X, Clock, Play, Pause } from 'lucide-react';

interface ScheduledTask {
  id: string;
  name: string;
  action: 'parse' | 'stopwords' | 'duplicates' | 'backup';
  interval: number; // в часах
  enabled: boolean;
  lastRun?: number;
  nextRun: number;
}

export const AutomationSchedulerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addLog } = useStore();
  
  const [tasks, setTasks] = useState<ScheduledTask[]>([
    {
      id: '1',
      name: 'Автоматический парсинг частот',
      action: 'parse',
      interval: 24,
      enabled: false,
      nextRun: Date.now() + 24 * 60 * 60 * 1000,
    },
    {
      id: '2',
      name: 'Применение стоп-слов после импорта',
      action: 'stopwords',
      interval: 0, // триггер
      enabled: true,
      nextRun: 0,
    },
    {
      id: '3',
      name: 'Удаление дублей',
      action: 'duplicates',
      interval: 168, // раз в неделю
      enabled: false,
      nextRun: Date.now() + 168 * 60 * 60 * 1000,
    },
    {
      id: '4',
      name: 'Создание резервной копии',
      action: 'backup',
      interval: 24,
      enabled: false,
      nextRun: Date.now() + 24 * 60 * 60 * 1000,
    },
  ]);

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      parse: '⚡ Парсинг частот',
      stopwords: '🚫 Применение стоп-слов',
      duplicates: '🔄 Удаление дублей',
      backup: '💾 Резервное копирование',
    };
    return labels[action] || action;
  };

  const formatNextRun = (timestamp: number): string => {
    if (timestamp === 0) return 'При импорте';
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, enabled: !task.enabled } : task
      )
    );
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      addLog(
        task.enabled ? 'warning' : 'success',
        `${task.enabled ? 'Отключена' : 'Включена'} задача: ${task.name}`
      );
    }
  };

  const handleUpdateInterval = (taskId: string, interval: number) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              interval,
              nextRun: Date.now() + interval * 60 * 60 * 1000,
            }
          : task
      )
    );
  };

  const handleSave = () => {
    addLog('success', 'Настройки автоматизации сохранены');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[700px] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Планировщик задач
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Список задач */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`border rounded-lg p-4 ${
                  task.enabled ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className={`p-2 rounded transition ${
                        task.enabled
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                      }`}
                    >
                      {task.enabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="font-semibold">{getActionLabel(task.action)}</div>
                      <div className="text-sm text-gray-600">{task.name}</div>
                    </div>
                  </div>

                  {task.interval > 0 && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Интервал:</label>
                      <input
                        type="number"
                        min="1"
                        max="720"
                        value={task.interval}
                        onChange={(e) =>
                          handleUpdateInterval(task.id, parseInt(e.target.value) || 1)
                        }
                        disabled={!task.enabled}
                        className="w-20 px-2 py-1 border rounded text-center disabled:bg-gray-100"
                      />
                      <span className="text-sm text-gray-600">ч</span>
                    </div>
                  )}
                </div>

                {task.enabled && (
                  <div className="text-sm text-gray-600 pl-11">
                    Следующий запуск: {formatNextRun(task.nextRun)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Информационный блок */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <div className="font-semibold mb-2">ℹ️ Обратите внимание:</div>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Задачи выполняются только когда приложение открыто</li>
              <li>Для полноценной автоматизации рекомендуется бэкенд-сервис</li>
              <li>Настройки сохраняются в браузере (localStorage)</li>
            </ul>
          </div>
        </div>

        {/* Футер */}
        <div className="border-t p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Активных задач: {tasks.filter(t => t.enabled).length} из {tasks.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100 transition"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
