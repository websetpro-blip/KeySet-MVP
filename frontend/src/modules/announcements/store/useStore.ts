import { create } from 'zustand';
import type {
  AdTemplate,
  GeneratedAd,
  AnnouncementsState,
  GenerateOptions,
  QuickLink,
} from '../types';
import {
  buildDisplayUrl,
  buildTitle1FromPhrase,
  buildTitle2FromAddons,
  buildUrl,
  generateAdsFromPhrases,
  sanitizeBodyText,
  transliteratePath,
} from '../lib/generator';

interface AnnouncementsStore extends AnnouncementsState {
  // Действия для шаблонов
  addTemplate: (template: Omit<AdTemplate, 'id' | 'createdAt'>) => void;
  updateTemplate: (id: string, template: Partial<AdTemplate>) => void;
  deleteTemplate: (id: string) => void;
  selectTemplate: (id: string | null) => void;

  // Действия для генерации объявлений
  generateAds: (
    phrases: Array<{ id: string; text: string }>,
    options: GenerateOptions
  ) => Promise<void>;
  deleteAd: (id: string) => void;
  deleteAds: (ids: string[]) => void;
  updateAd: (id: string, ad: Partial<GeneratedAd>) => void;
  selectAds: (ids: string[]) => void;
  selectAllAds: () => void;
  deselectAllAds: () => void;
  applyCommonSettings: (settings: { clarifications?: string; quickLinks?: QuickLink[] }) => void;
  applyDisplaySettings: (settings: { useDynamicDisplayUrl: boolean; customDisplayPath?: string }) => void;

  // Утилиты
  clearAll: () => void;
  getAdsByTemplate: (templateId: string) => GeneratedAd[];
  getAdsByPhrase: (phraseId: string) => GeneratedAd[];
}

// Шаблон по умолчанию
const DEFAULT_TEMPLATE: Omit<AdTemplate, 'id' | 'createdAt'> = {
  name: 'Шаблон по умолчанию',
  title1: '{Phrase} - купить в Москве',
  title2: 'Низкие цены, быстрая доставка',
  text: 'Большой выбор {phrase}. Гарантия качества. Доставка по всей России. Звоните!',
  displayUrl: 'site.ru/{phrase}',
  quickLinks: [
    { title: 'Каталог', description: 'Весь ассортимент товаров' },
    { title: 'Акции', description: 'Скидки до 50%' },
    { title: 'Доставка', description: 'Быстрая доставка по городу' },
    { title: 'Гарантия', description: 'Официальная гарантия' },
  ],
  usePhraseInTitle: true,
  usePhraseInText: true,
};

export const useStore = create<AnnouncementsStore>((set, get) => ({
  templates: [
    {
      ...DEFAULT_TEMPLATE,
      id: 'template_default',
      createdAt: Date.now(),
    },
  ],
  generatedAds: [],
  selectedTemplateId: 'template_default',
  selectedAdIds: new Set(),
  isGenerating: false,
  progress: 0,
  totalToGenerate: 0,

  // Действия для шаблонов
  addTemplate: (template) => {
    const newTemplate: AdTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      createdAt: Date.now(),
    };
    set((state) => ({
      templates: [...state.templates, newTemplate],
    }));
  },

  updateTemplate: (id, updates) => {
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  deleteTemplate: (id) => {
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
      selectedTemplateId:
        state.selectedTemplateId === id ? null : state.selectedTemplateId,
    }));
  },

  selectTemplate: (id) => {
    set({ selectedTemplateId: id });
  },

  // Генерация объявлений
  generateAds: async (phrases, options) => {
    const {
      templateId,
      phraseIds,
      replaceExisting,
      domain,
      utm,
      clarifications,
      quickLinks,
      addons = [],
      bodyText,
      groupId,
      useDynamicDisplayUrl = true,
      customDisplayPath,
    } = options;
    const template = get().templates.find((t) => t.id === templateId);

    if (!template) {
      throw new Error('Шаблон не найден');
    }

    // Фильтруем фразы по ID
    const selectedPhrases = phrases.filter((p) => phraseIds.includes(p.id));

    if (selectedPhrases.length === 0) {
      throw new Error('Не выбрано ни одной фразы');
    }

    set({
      isGenerating: true,
      progress: 0,
      totalToGenerate: selectedPhrases.length,
    });

    // Генерируем объявления
    const baseAds = generateAdsFromPhrases(
      selectedPhrases,
      template,
      (current, total) => {
        set({ progress: current, totalToGenerate: total });
      }
    );

    const preparedBodyText = sanitizeBodyText(bodyText);

    const newAds: GeneratedAd[] = baseAds.map((ad, index) => {
      const title1Result = buildTitle1FromPhrase(ad.phrase);
      const title2Result = buildTitle2FromAddons(addons, index, title1Result.text);
      const warnings: string[] = ad.warnings ? [...ad.warnings] : [];
      if (title1Result.warning) {
        warnings.push(`Заголовок 1: ${title1Result.warning}`);
      }
      if (title2Result?.warning) {
        warnings.push(`Заголовок 2: ${title2Result.warning}`);
      }
      if (preparedBodyText?.warning) {
        warnings.push(`Текст: ${preparedBodyText.warning}`);
      }

      const url = domain ? buildUrl(domain, utm, ad.phrase) : ad.url;
      const sanitizedPath = customDisplayPath?.trim().replace(/^\/+|\/+$/g, '') || undefined;
      const displayPath = useDynamicDisplayUrl ? transliteratePath(ad.phrase) : sanitizedPath;
      const displayUrl = url ? buildDisplayUrl(url, displayPath) : ad.displayUrl;

      return {
        ...ad,
        title1: title1Result.text,
        title2: title2Result?.text ?? ad.title2,
        text: preparedBodyText?.text ?? ad.text,
        url,
        displayUrl,
        clarifications: clarifications ?? ad.clarifications,
        quickLinks: quickLinks ?? ad.quickLinks,
        groupId: groupId || ad.groupId,
        warnings: warnings.length ? warnings : undefined,
      };
    });

    set((state) => {
      let updatedAds = [...state.generatedAds];

      if (replaceExisting) {
        // Удаляем существующие объявления для этих фраз
        updatedAds = updatedAds.filter(
          (ad) => !phraseIds.includes(ad.phraseId)
        );
      }

      return {
        generatedAds: [...updatedAds, ...newAds],
        isGenerating: false,
        progress: 0,
        totalToGenerate: 0,
      };
    });
  },

  deleteAd: (id) => {
    set((state) => ({
      generatedAds: state.generatedAds.filter((ad) => ad.id !== id),
      selectedAdIds: new Set(
        Array.from(state.selectedAdIds).filter((adId) => adId !== id)
      ),
    }));
  },

  deleteAds: (ids) => {
    set((state) => ({
      generatedAds: state.generatedAds.filter((ad) => !ids.includes(ad.id)),
      selectedAdIds: new Set(
        Array.from(state.selectedAdIds).filter((adId) => !ids.includes(adId))
      ),
    }));
  },

  updateAd: (id, updates) => {
    set((state) => ({
      generatedAds: state.generatedAds.map((ad) =>
        ad.id === id ? { ...ad, ...updates } : ad
      ),
    }));
  },

  selectAds: (ids) => {
    set({ selectedAdIds: new Set(ids) });
  },

  selectAllAds: () => {
    set((state) => ({
      selectedAdIds: new Set(state.generatedAds.map((ad) => ad.id)),
    }));
  },

  deselectAllAds: () => {
    set({ selectedAdIds: new Set() });
  },

  applyCommonSettings: (settings) => {
    set((state) => ({
      generatedAds: state.generatedAds.map((ad) => ({
        ...ad,
        clarifications: settings.clarifications ?? ad.clarifications,
        quickLinks: settings.quickLinks ?? ad.quickLinks,
      })),
    }));
  },
  applyDisplaySettings: ({ useDynamicDisplayUrl, customDisplayPath }) => {
    const sanitizePath = (path?: string) => {
      if (!path) return undefined;
      const trimmed = path.trim().replace(/^\/+|\/+$/g, '');
      return trimmed || undefined;
    };
    set((state) => ({
      generatedAds: state.generatedAds.map((ad) => {
        if (!ad.url) {
          return ad;
        }
        const path = useDynamicDisplayUrl ? transliteratePath(ad.phrase) : sanitizePath(customDisplayPath);
        return {
          ...ad,
          displayUrl: buildDisplayUrl(ad.url, path),
        };
      }),
    }));
  },

  clearAll: () => {
    set({
      generatedAds: [],
      selectedAdIds: new Set(),
    });
  },

  getAdsByTemplate: (templateId) => {
    return get().generatedAds.filter((ad) => ad.templateId === templateId);
  },

  getAdsByPhrase: (phraseId) => {
    return get().generatedAds.filter((ad) => ad.phraseId === phraseId);
  },
}));
