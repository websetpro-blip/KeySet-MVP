// Zustand store для модуля Объявления
// Основано на требованиях из ГОТОВЫЕ_МОДУЛИ/Объявления

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AdRow,
  AnnouncementsState,
  GenerationSettings,
  RuleSet,
  AIGenerateOptions,
  AIGenerateResponse,
} from '../types';
import {
  generateAdsFromKeys,
  applyRuleSetsToRow,
  addDefaultQuickLinks,
  trimRowToLimits,
} from '../lib/generator';

interface AnnouncementsStore extends AnnouncementsState {
  // Действия с настройками
  updateSettings: (settings: Partial<GenerationSettings>) => void;

  // Действия с правилами подмены
  updateRuleSet: (index: number, ruleSet: Partial<RuleSet>) => void;
  toggleRuleSet: (index: number) => void;

  // Генерация объявлений (ручная)
  generateAds: (keys: string[]) => void;

  // Генерация с ИИ
  generateWithAI: (keys: string[]) => Promise<void>;

  // Действия со строками
  updateRow: (index: number, row: Partial<AdRow>) => void;
  deleteRows: (indices: number[]) => void;
  addQuickLinksToAll: () => void;
  trimAllToLimits: () => void;
  applyRulesToAll: () => void;

  // Выбор строк
  selectRow: (index: number) => void;
  deselectRow: (index: number) => void;
  selectAllRows: () => void;
  deselectAllRows: () => void;
  toggleRowSelection: (index: number) => void;

  // Очистка
  clearAll: () => void;
}

// Дефолтные настройки
const defaultSettings: GenerationSettings = {
  domain: '',
  utm: 'utm_source=yandex&utm_medium=cpc&utm_campaign={group}&utm_term={key}',
  h1Template: '{key}',
  h2Suffix: 'Скидки • Доставка сегодня',
  textVariants: ['Официальный дилер. Доставка за 1 день. Гарантия 2 года.'],
};

// Дефолтные правила подмены
const defaultRuleSets: RuleSet[] = [
  {
    name: 'Глобальные замены',
    enabled: true,
    rules: [],
  },
  {
    name: 'ГЕО/морфология',
    enabled: true,
    rules: [],
  },
];

export const useStore = create<AnnouncementsStore>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      rows: [],
      settings: defaultSettings,
      ruleSets: defaultRuleSets,
      isGenerating: false,
      isAIGenerating: false,
      selectedRowIndices: new Set<number>(),

      // Обновить настройки
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // Обновить набор правил
      updateRuleSet: (index, ruleSet) => {
        set((state) => {
          const newRuleSets = [...state.ruleSets];
          newRuleSets[index] = { ...newRuleSets[index], ...ruleSet };
          return { ruleSets: newRuleSets };
        });
      },

      // Включить/выключить набор правил
      toggleRuleSet: (index) => {
        set((state) => {
          const newRuleSets = [...state.ruleSets];
          newRuleSets[index] = {
            ...newRuleSets[index],
            enabled: !newRuleSets[index].enabled,
          };
          return { ruleSets: newRuleSets };
        });
      },

      // Генерировать объявления вручную
      generateAds: (keys) => {
        const { settings } = get();

        if (keys.length === 0) {
          alert('Нет ключевых фраз для генерации');
          return;
        }

        if (!settings.domain.trim()) {
          alert('Укажите домен');
          return;
        }

        set({ isGenerating: true });

        try {
          const newRows = generateAdsFromKeys(
            keys,
            settings,
            (current, total) => {
              // Прогресс можно показать в UI
              console.log(`Генерация: ${current}/${total}`);
            }
          );

          set({ rows: newRows, isGenerating: false });
        } catch (error) {
          console.error('Ошибка генерации:', error);
          alert('Ошибка при генерации объявлений');
          set({ isGenerating: false });
        }
      },

      // Генерировать с ИИ (через API)
      generateWithAI: async (keys) => {
        const { settings } = get();

        if (keys.length === 0) {
          alert('Нет ключевых фраз для генерации');
          return;
        }

        if (!settings.domain.trim()) {
          alert('Укажите домен');
          return;
        }

        set({ isAIGenerating: true });

        try {
          const payload: AIGenerateOptions = {
            keys,
            domain: settings.domain,
            utm: settings.utm,
            locale: 'ru',
            mode: 'serp', // Анализ SERP
            limits: {
              H1: 56,
              H2: 56,
              TEXT: 81,
              DISPLAY_URL: 20,
              CLARIFICATION: 66,
              QUICKLINK_TEXT: 30,
              QUICKLINK_DESC: 60,
            },
          };

          const response = await fetch('/api/ai/ads/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data: AIGenerateResponse = await response.json();

          if (!data.rows || data.rows.length === 0) {
            throw new Error('ИИ вернул пустой результат');
          }

          set({ rows: data.rows, isAIGenerating: false });
        } catch (error) {
          console.error('Ошибка AI генерации:', error);
          alert('ИИ недоступен или не настроен. Используйте ручную генерацию.');
          set({ isAIGenerating: false });
        }
      },

      // Обновить строку
      updateRow: (index, partialRow) => {
        set((state) => {
          const newRows = [...state.rows];
          newRows[index] = { ...newRows[index], ...partialRow };
          return { rows: newRows };
        });
      },

      // Удалить строки
      deleteRows: (indices) => {
        set((state) => {
          const newRows = state.rows.filter((_, i) => !indices.includes(i));
          const newSelected = new Set<number>();

          // Пересчитываем индексы выбранных строк
          state.selectedRowIndices.forEach((oldIndex) => {
            const deletedBefore = indices.filter((i) => i < oldIndex).length;
            if (!indices.includes(oldIndex)) {
              newSelected.add(oldIndex - deletedBefore);
            }
          });

          return { rows: newRows, selectedRowIndices: newSelected };
        });
      },

      // Добавить быстрые ссылки ко всем
      addQuickLinksToAll: () => {
        const { rows, settings } = get();
        const newRows = rows.map((row) => addDefaultQuickLinks(row, settings.domain));
        set({ rows: newRows });
      },

      // Обрезать все по лимитам
      trimAllToLimits: () => {
        const { rows } = get();
        const newRows = rows.map((row) => trimRowToLimits(row));
        set({ rows: newRows });
      },

      // Применить правила подмены ко всем
      applyRulesToAll: () => {
        const { rows, ruleSets } = get();
        const newRows = rows.map((row) => applyRuleSetsToRow(row, ruleSets));
        set({ rows: newRows });
      },

      // Выбрать строку
      selectRow: (index) => {
        set((state) => {
          const newSelected = new Set(state.selectedRowIndices);
          newSelected.add(index);
          return { selectedRowIndices: newSelected };
        });
      },

      // Снять выбор строки
      deselectRow: (index) => {
        set((state) => {
          const newSelected = new Set(state.selectedRowIndices);
          newSelected.delete(index);
          return { selectedRowIndices: newSelected };
        });
      },

      // Выбрать все строки
      selectAllRows: () => {
        const { rows } = get();
        const allIndices = new Set(rows.map((_, i) => i));
        set({ selectedRowIndices: allIndices });
      },

      // Снять выбор всех строк
      deselectAllRows: () => {
        set({ selectedRowIndices: new Set<number>() });
      },

      // Переключить выбор строки
      toggleRowSelection: (index) => {
        set((state) => {
          const newSelected = new Set(state.selectedRowIndices);
          if (newSelected.has(index)) {
            newSelected.delete(index);
          } else {
            newSelected.add(index);
          }
          return { selectedRowIndices: newSelected };
        });
      },

      // Очистить всё
      clearAll: () => {
        set({
          rows: [],
          selectedRowIndices: new Set<number>(),
        });
      },
    }),
    {
      name: 'announcements-storage', // Имя в localStorage
      partialize: (state) => ({
        // Сохраняем только настройки и правила, не сохраняем сгенерированные объявления
        settings: state.settings,
        ruleSets: state.ruleSets,
      }),
    }
  )
);
