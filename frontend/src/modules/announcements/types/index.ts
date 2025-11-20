// Типы данных для модуля Объявления (Яндекс Директ)

export interface AdTemplate {
  id: string;
  name: string;
  title1: string; // Заголовок 1 (до 35 символов)
  title2?: string; // Заголовок 2 (до 30 символов)
  text: string; // Текст объявления (до 81 символа)
  displayUrl?: string; // Отображаемая ссылка
  quickLinks?: QuickLink[]; // Быстрые ссылки
  createdAt: number;
  usePhraseInTitle: boolean; // Подставлять ключевую фразу в заголовок
  usePhraseInText: boolean; // Подставлять ключевую фразу в текст
}

export interface QuickLink {
  title: string; // Заголовок быстрой ссылки (до 30 символов)
  description?: string; // Описание (до 60 символов)
  url?: string; // URL ссылки
}

export interface GeneratedAd {
  id: string;
  phraseId: string; // ID фразы из модуля Data
  phrase: string; // Ключевая фраза
  templateId: string; // ID шаблона
  groupId?: string; // Идентификатор группы для экспорта
  title1: string;
  title2?: string;
  text: string;
  url?: string; // Полная ссылка (с UTM)
  displayUrl?: string;
  quickLinks?: QuickLink[];
  clarifications?: string; // Уточнения (строки, разделённые переводами)
  status: 'draft' | 'ready' | 'exported';
  warnings?: string[]; // Предупреждения о длине и т.д.
  createdAt: number;
}

export interface AnnouncementsState {
  templates: AdTemplate[];
  generatedAds: GeneratedAd[];
  selectedTemplateId: string | null;
  selectedAdIds: Set<string>;
  isGenerating: boolean;
  progress: number;
  totalToGenerate: number;
}

export interface GenerateOptions {
  templateId: string;
  phraseIds: string[]; // ID фраз для генерации
  replaceExisting: boolean; // Заменить существующие объявления
  domain?: string; // Домен / лендинг
  utm?: string; // UTM-шаблон
  clarifications?: string; // Уточнения (единые для всех объявлений)
  quickLinks?: QuickLink[]; // Общие быстрые ссылки
  addons?: string[]; // Прибавки к заголовку №2
  bodyText?: string; // Текст объявления из левого блока
  groupId?: string; // ID группы объявлений
  useDynamicDisplayUrl?: boolean; // Динамическая отображаемая ссылка
  customDisplayPath?: string; // Ручной путь для отображаемой ссылки
}

// Формат экспорта для Яндекс Директ
export interface YandexDirectExport {
  Campaign: string;
  AdGroup: string;
  Keyword: string;
  Title1: string;
  Title2?: string;
  Text: string;
  DisplayUrl?: string;
  QuickLink1Title?: string;
  QuickLink1Desc?: string;
  QuickLink2Title?: string;
  QuickLink2Desc?: string;
  QuickLink3Title?: string;
  QuickLink3Desc?: string;
  QuickLink4Title?: string;
  QuickLink4Desc?: string;
}
