import React from 'react';
import { Modal } from '../ui/Modal';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({ isOpen, onClose }) => {
  const { phrases, groups } = useStore();

  const stats = React.useMemo(() => {
    const total = phrases.length;
    const parsed = phrases.filter(p => p.status === 'success' || p.status === 'done').length;
    const pending = phrases.filter(p => p.status === 'pending').length;
    const errors = phrases.filter(p => p.status === 'error').length;
    
    const wsValues = phrases.map(p => p.ws).filter(ws => ws > 0);
    const sumWs = wsValues.reduce((sum, ws) => sum + ws, 0);
    const avgWs = wsValues.length > 0 ? Math.round(sumWs / wsValues.length) : 0;
    const maxWs = wsValues.length > 0 ? Math.max(...wsValues) : 0;
    const minWs = wsValues.length > 0 ? Math.min(...wsValues) : 0;
    
    const ungrouped = phrases.filter(p => !p.groupId).length;
    
    // Дубли
    const seen = new Set<string>();
    const duplicates = phrases.filter(p => {
      const key = p.text.toLowerCase();
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    }).length;
    
    const withStopwords = phrases.filter(p => p.hasStopword).length;
    
    return {
      total,
      parsed,
      pending,
      errors,
      sumWs,
      avgWs,
      maxWs,
      minWs,
      groups: groups.length,
      ungrouped,
      duplicates,
      withStopwords,
    };
  }, [phrases, groups]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📊 Статистика проекта"
      size="lg"
    >
      <div className="p-6">
        {/* Общая статистика */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Всего фраз</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.parsed}</div>
            <div className="text-sm text-gray-600 mt-1">Спарсено</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? Math.round((stats.parsed / stats.total) * 100) : 0}%
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-gray-600 mt-1">Не спарсено</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
            </div>
          </div>
        </div>

        {stats.errors > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <div className="text-sm text-red-800">
              ⚠️ Ошибок при парсинге: <strong>{stats.errors}</strong>
            </div>
          </div>
        )}

        {/* Частоты */}
        <div className="border-t pt-4 mb-6">
          <h3 className="font-bold text-lg mb-3">📈 Частоты (ws):</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm text-gray-600">Сумма</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.sumWs.toLocaleString('ru-RU')}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm text-gray-600">Средняя</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.avgWs.toLocaleString('ru-RU')}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm text-gray-600">Максимальная</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.maxWs.toLocaleString('ru-RU')}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm text-gray-600">Минимальная</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.minWs.toLocaleString('ru-RU')}
              </div>
            </div>
          </div>
        </div>

        {/* Группы и прочее */}
        <div className="border-t pt-4">
          <h3 className="font-bold text-lg mb-3">📁 Группировка:</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Всего групп:</span>
              <span className="font-semibold text-gray-900">{stats.groups}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Фраз без группы:</span>
              <span className="font-semibold text-orange-600">{stats.ungrouped}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Дублей:</span>
              <span className="font-semibold text-red-600">{stats.duplicates}</span>
            </div>
            {stats.withStopwords > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Фраз со стоп-словами:</span>
                <span className="font-semibold text-red-600">{stats.withStopwords}</span>
              </div>
            )}
          </div>
        </div>

        {/* Кнопка закрытия */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button onClick={onClose} variant="primary">
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};
