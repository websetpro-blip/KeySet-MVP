import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from './store/useStore';
import { exportToYandexDirectCSV } from './lib/generator';
import type { GeneratedAd } from './types';
import './App.css';
import { GeneratedAdsTable } from './GeneratedAdsTable';

// Импортируем типы из модуля Data для интеграции
interface Phrase {
  id: string;
  text: string;
  ws: number;
}

type QuickLinkInput = {
  title: string;
  description: string;
  url: string;
};

const splitMultilineInput = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const chooseBodyTextVariant = (variants: string[], limit: number): string => {
  if (!variants.length) {
    return '';
  }
  let best = '';
  variants.forEach((variant) => {
    const trimmed = variant.trim();
    if (!trimmed) {
      return;
    }
    const withinLimit = trimmed.length <= limit;
    if (withinLimit && trimmed.length > best.length) {
      best = trimmed;
    }
  });
  if (!best) {
    best = variants[0].trim();
  }
  return best;
};

export default function AnnouncementsApp() {
  const {
    templates,
    generatedAds,
    selectedTemplateId,
    selectedAdIds,
    isGenerating,
    progress,
    totalToGenerate,
    selectTemplate,
    generateAds,
    selectAllAds,
    deselectAllAds,
    deleteAds,
    applyCommonSettings,
  } = useStore();

  // Состояния для новой левой панели
  const [keysInput, setKeysInput] = useState('');
  const [domain, setDomain] = useState('example.com');
  const [utm, setUtm] = useState('utm_source=yandex&utm_medium=cpc&utm_campaign={group}&utm_term={key}');
  const [groupId, setGroupId] = useState('');
  const [addonsInput, setAddonsInput] = useState(
    'Бесплатная доставка\nСкидка до 30%\nГарантия 1 год\nАкции каждую неделю'
  );
  const [bodyVariantsInput, setBodyVariantsInput] = useState(
    'Узнайте подробности и получите персональное предложение за 1 минуту.'
  );

  const [selectedAdIndex, setSelectedAdIndex] = useState(0);

  const [samplePhrases] = useState<Phrase[]>([
    { id: '1', text: 'купить пылесос', ws: 15000 },
    { id: '2', text: 'пылесос для дома', ws: 8500 },
    { id: '3', text: 'робот пылесос цена', ws: 12000 },
    { id: '4', text: 'беспроводной пылесос', ws: 6200 },
    { id: '5', text: 'моющий пылесос', ws: 5800 },
  ]);

  const [selectedPhraseIds, setSelectedPhraseIds] = useState<Set<string>>(new Set());
  const [campaignName, setCampaignName] = useState('Моя кампания');
  const [adGroupName, setAdGroupName] = useState('Группа объявлений');
  const [searchQuery, setSearchQuery] = useState('поисковый запрос пользователя');
  const [isDynamicLink, setIsDynamicLink] = useState(true);
  const [clarificationsInput, setClarificationsInput] = useState(
    'Быстрая доставка\nГарантия\nОтзывы клиентов\nБез предоплат'
  );
  const [quickLinksInput, setQuickLinksInput] = useState<QuickLinkInput[]>([
    { title: 'Распродажа', description: 'Горячие предложения', url: 'https://example.com/sale' },
    { title: 'Скидка 30% до 15.05', description: 'Лучшие цены до конца акции', url: 'https://example.com/discount' },
    { title: 'Видео отзывы', description: 'Честные обзоры клиентов', url: 'https://example.com/reviews' },
    { title: 'Заказать', description: 'Оставьте заявку онлайн', url: 'https://example.com/order' },
  ]);

  const addonsList = useMemo(() => splitMultilineInput(addonsInput), [addonsInput]);
  const bodyVariants = useMemo(() => splitMultilineInput(bodyVariantsInput), [bodyVariantsInput]);
  const preferredBodyText = useMemo(
    () => chooseBodyTextVariant(bodyVariants, 81),
    [bodyVariants]
  );

  const quickLinksPayload = useMemo(
    () => quickLinksInput.map((link) => ({ title: link.title, description: link.description, url: link.url })),
    [quickLinksInput]
  );

  const handleClarificationsChange = (value: string) => {
    setClarificationsInput(value);
    applyCommonSettings({ clarifications: value, quickLinks: quickLinksPayload });
  };

  const handleClarificationCellChange = (index: number, value: string) => {
    const lines = clarificationsInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    while (lines.length < 4) {
      lines.push('');
    }
    lines[index] = value;
    const updated = lines.join('\n');
    handleClarificationsChange(updated);
  };

  const handleQuickLinkChange = (
    index: number,
    field: 'title' | 'description' | 'url',
    value: string
  ) => {
    const updatedLinks = quickLinksInput.map((link, idx) =>
      idx === index ? { ...link, [field]: value } : link
    );
    setQuickLinksInput(updatedLinks);
    const payload = updatedLinks.map((link) => ({
      title: link.title,
      description: link.description,
      url: link.url,
    }));
    applyCommonSettings({ clarifications: clarificationsInput, quickLinks: payload });
  };

  const keyList = useMemo(
    () => [
      ...new Set(
        keysInput
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
      ),
    ],
    [keysInput]
  );

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleGenerateAds = async () => {
    if (!keyList.length) {
      alert('Вставьте ключевые фразы');
      return;
    }

    // Конвертируем keyList в формат Phrase[]
    const phrases: Phrase[] = keyList.map((text, index) => ({
      id: String(index + 1),
      text,
      ws: 0,
    }));

    try {
      // Используем первый доступный шаблон если не выбран
      const templateId = selectedTemplateId || templates[0]?.id;
      if (!templateId) {
        alert('Нет доступных шаблонов');
        return;
      }

      await generateAds(phrases, {
        templateId,
        phraseIds: phrases.map((p) => p.id),
        replaceExisting: true,
        domain,
        utm,
        clarifications: clarificationsInput,
        quickLinks: quickLinksPayload,
        addons: addonsList,
        bodyText: preferredBodyText,
        groupId: groupId || undefined,
      });
      applyCommonSettings({ clarifications: clarificationsInput, quickLinks: quickLinksPayload });
    } catch (error) {
      console.error('Ошибка генерации объявлений:', error);
      alert('Ошибка при генерации объявлений');
    }
  };

  const handleExport = () => {
    if (generatedAds.length === 0) {
      alert('Нет объявлений для экспорта');
      return;
    }

    const csv = exportToYandexDirectCSV(generatedAds, campaignName, adGroupName);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `yandex_direct_ads_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTSV = async () => {
    if (generatedAds.length === 0) {
      alert('Нет объявлений для копирования');
      return;
    }

    const headers = [
      'Тип кампании',
      '№ заказа',
      'Минус-фразы на кампанию',
      'Валюта',
      'Доп. объявление группы',
      'Тип объявления',
      'ID группы',
      'Название группы',
      'Номер группы',
      'ID фразы',
      'Фраза (с минус-словами)',
      'ID объявления',
      'Заголовок 1',
      'Заголовок 2',
      'Текст',
      'Ссылка',
      'Отображаемая ссылка',
      'Регион',
      'Статус объявления',
      'Статус фразы',
      'Заголовки быстрых ссылок',
      'Описания быстрых ссылок',
      'Адреса быстрых ссылок',
      'Параметр 1',
      'Параметр 2',
      'Метки',
      'Уточнения',
      'Минус-фразы на группу',
    ];

    const rows = generatedAds.map((ad, index) => {
      const quickLinks = ad.quickLinks?.length ? ad.quickLinks : quickLinksPayload;
      const normalizedQuickLinks = [...quickLinks];
      while (normalizedQuickLinks.length < 4) {
        normalizedQuickLinks.push({ title: '', description: '', url: '' });
      }

      const quickLinkTitles = normalizedQuickLinks.map((ql) => ql.title || '').join('||');
      const quickLinkDescriptions = normalizedQuickLinks.map((ql) => ql.description || '').join('||');
      const quickLinkUrls = normalizedQuickLinks.map((ql) => ql.url || '').join('||');

      const clarifications = (ad.clarifications || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join('||');

      return [
        'Текстово-графическое',
        '',
        '',
        '',
        '',
        'Текстово-графическое',
        ad.groupId || '',
        adGroupName || '',
        String(index + 1),
        ad.phraseId,
        ad.phrase,
        ad.id,
        ad.title1,
        ad.title2 || '',
        ad.text,
        ad.url || '',
        ad.displayUrl || '',
        '',
        '',
        '',
        quickLinkTitles,
        quickLinkDescriptions,
        quickLinkUrls,
        '',
        '',
        '',
        clarifications,
        '',
      ];
    });

    const tsv = [headers, ...rows].map((r) => r.join('\t')).join('\n');

    try {
      await navigator.clipboard.writeText(tsv);
      alert('TSV скопирован. Вставьте его в буфер Direct Commander.');
    } catch (error) {
      console.error('Ошибка копирования TSV', error);
      alert('Не удалось скопировать TSV.');
    }
  };

  const togglePhraseSelection = (phraseId: string) => {
    const newSet = new Set(selectedPhraseIds);
    if (newSet.has(phraseId)) {
      newSet.delete(phraseId);
    } else {
      newSet.add(phraseId);
    }
    setSelectedPhraseIds(newSet);
  };

  const handleDeleteSelected = () => {
    if (selectedAdIds.size === 0) {
      alert('Выберите объявления для удаления');
      return;
    }

    if (confirm(`Удалить ${selectedAdIds.size} объявлений?`)) {
      deleteAds(Array.from(selectedAdIds));
      deselectAllAds();
    }
  };

  const normalizeDomain = (value: string) => {
    if (!value) return '';
    let d = value.trim();
    d = d.replace(/^https?:\/\//i, '');
    d = d.replace(/\/+$/g, '');
    return d;
  };

  const selectedAd = generatedAds[selectedAdIndex];

  const defaultPreviewAd: Pick<GeneratedAd, 'title1' | 'title2' | 'text' | 'phrase'> = {
    phrase: 'поисковый запрос пользователя',
    title1: 'Краткий заголовок предложения',
    title2: 'Уточняющий второй заголовок',
    text: 'Короткое описание оффера с преимуществами и призывом к действию.',
  };

  const previewAd: Pick<GeneratedAd, 'title1' | 'title2' | 'text' | 'phrase'> =
    selectedAd ?? defaultPreviewAd;
  const displayUrlText = isDynamicLink ? searchQuery : '';
  const previewQuickLinksRaw =
    selectedAd && selectedAd.quickLinks && selectedAd.quickLinks.length
      ? selectedAd.quickLinks
      : quickLinksPayload;
  const previewQuickLinks = previewQuickLinksRaw.map((link) => ({
    title: link.title || '',
    description: link.description || '',
    url: link.url || '',
  }));
  while (previewQuickLinks.length < 4) {
    previewQuickLinks.push({ title: '', description: '', url: '' });
  }

  const previewClarificationsSource = selectedAd?.clarifications ?? clarificationsInput;
  const previewClarifications = previewClarificationsSource
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  while (previewClarifications.length < 4) {
    previewClarifications.push('');
  }
  const normalizedDomain = normalizeDomain(domain);

  useEffect(() => {
    if (selectedAd) {
      setSearchQuery(selectedAd.phrase);
    } else {
      setSearchQuery(defaultPreviewAd.phrase);
    }
  }, [selectedAd]);

  return (
    <div className="announcements-app ads-app">
      <div className="announcements-header ads-header">
        <h1>Генератор объявлений Яндекс.Директ</h1>
        <div className="announcements-subtitle ads-subtitle">
          Автоматическое создание объявлений из ключевых фраз
        </div>
      </div>

      <div className="announcements-content ads-content">
        {/* Левая панель с настройками */}
        <div className="announcements-sidebar ads-sidebar">
          <div className="announcements-sidebar-scroll">
          {/* Настройки URL */}
          <div className="announcements-section ads-section">
            <h2>Настройки URL</h2>
            <label>Домен / лендинг</label>
            <input
              className="ads-input"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />

            <label>UTM-шаблон</label>
            <input
              className="ads-input"
              placeholder="utm_source=yandex&utm_term={key}"
              value={utm}
              onChange={(e) => setUtm(e.target.value)}
            />

            <label>ID группы (опционально)</label>
            <input
              className="ads-input"
              placeholder="grp-1, grp-2 ..."
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            />
          </div>

          {/* Прибавки к H2 */}
          <div className="announcements-section ads-section">
            <h2>Прибавки к заголовку №2</h2>
            <textarea
              className="ads-textarea"
              placeholder="всего за 16 990р!&#10;под ключ за 70 190р!&#10;от 16 990р!"
              value={addonsInput}
              onChange={(e) => setAddonsInput(e.target.value)}
            />
            <div className="ads-hint">Каждая строка — отдельная прибавка (до 56 симв.)</div>
          </div>

          {/* Тексты объявлений */}
          <div className="announcements-section ads-section">
            <h2>Тексты объявлений</h2>
            <textarea
              className="ads-textarea"
              placeholder="Узнайте стоимость системы за 1 минуту!&#10;Ответьте на 5 вопросов и получите расчёт."
              value={bodyVariantsInput}
              onChange={(e) => setBodyVariantsInput(e.target.value)}
            />
            <div className="ads-hint">
              Варианты текста (до 81 симв.). Выбирается самый длинный.
            </div>
          </div>

          {/* Ключевые фразы */}
          <div className="announcements-section ads-section">
            <h2>Ключевые фразы</h2>
            <textarea
              className="ads-textarea"
              style={{ minHeight: '80px' }}
              placeholder="фильтр для воды купить&#10;система очистки воды&#10;обезжелезиватель воды"
              value={keysInput}
              onChange={(e) => setKeysInput(e.target.value)}
            />
            <div className="ads-hint">Фраз: {keyList.length}. Дубликаты будут удалены.</div>
          </div>
          </div>
          {/* Кнопка генерации */}
          <button
            className="btn-generate"
            onClick={handleGenerateAds}
            disabled={!keyList.length}
          >
            🚀 Сгенерировать объявления
          </button>
        </div>

        {/* Правая колонка: превью + таблица */}
        <div className="announcements-main">
          <div className="announcements-main-inner">
            {/* Яндекс превью */}
            <div className="yandex-preview-wrapper">
              <div className="yandex-preview-page page">
                <div className="yandex-top-row">
                  <div className="yandex-logo">
                    <div className="yandex-logo-main">
                      <span>Я</span>ндекс
                    </div>
                    <div className="yandex-logo-sub">Поиск №1 в России*</div>
                  </div>
                  <div className="yandex-search-area">
                    <div className="yandex-search-top">
                      <input
                        className="yandex-search-input"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="yandex-search-controls">
                        <div className="yandex-icon-btn">🔍</div>
                        <div className="yandex-icon-btn">★</div>
                        <div className="yandex-icon-btn">⚙</div>
                        <button className="yandex-search-button">Найти</button>
                      </div>
                    </div>
                    <div className="yandex-search-nav">
                      <a href="#" className="active">
                        <span>поиск</span>
                      </a>
                      <a href="#">картинки</a>
                      <a href="#">видео</a>
                      <a href="#">карты</a>
                      <a href="#">маркет</a>
                      <a href="#">новости</a>
                      <a href="#">переводчик</a>
                      <a href="#">ещё</a>
                    </div>
                  </div>
                </div>

                <div className="yandex-main">
                  <aside className="yandex-sidebar">
                    <div className="yandex-side-block">
                      <div className="yandex-side-block-title">Реклама на поиске</div>
                      <div className="yandex-side-row">
                        <span className="yandex-side-label">Директ</span>{' '}
                        <span className="yandex-side-arrow">&gt;</span> Яндекс
                      </div>
                    </div>
                  </aside>
                  <section className="yandex-content">
                    <div className="yandex-crumbs">Яндекс &gt; Реклама &gt; Поиск</div>

                    <div className="yandex-ad">
                      <div className="yandex-ad-row yandex-ad-row-title">
                        <div className="yandex-ad-label"></div>
                        <div className="yandex-ad-row-main">
                          <div className="yandex-ad-title">
                            <a href="#">
                              {previewAd.title1}
                              {previewAd.title2 && ` — ${previewAd.title2}`}
                            </a>
                          </div>
                        </div>
                      </div>

                  <div className="yandex-ad-row">
                    <div className="yandex-ad-label">
                      Быстрые ссылки <span className="yandex-side-arrow">&gt;</span>
                    </div>
                    <div className="yandex-ad-row-main">
                      <div className="yandex-ad-quick-links">
                        {previewQuickLinks.map((link, index) => (
                          <div key={`preview-ql-${index}`} className={index === 0 ? 'active' : undefined}>
                            <input
                              className="preview-input"
                              value={link.title}
                              placeholder={`Ссылка ${index + 1}`}
                              onChange={(e) => handleQuickLinkChange(index, 'title', e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                      <div className="yandex-ad-row">
                        <div className="yandex-ad-label">
                          Отображаемая ссылка <span className="yandex-side-arrow">&gt;</span>
                        </div>
                        <div className="yandex-ad-row-main">
                        <div className="yandex-ad-url-row">
                          <div className="yandex-ad-url-domain">{normalizedDomain}/</div>
                          <div className="yandex-ad-url-text">{displayUrlText}</div>
                        </div>
                        </div>
                      </div>

                      <div className="yandex-ad-row yandex-ad-row-text">
                        <div className="yandex-ad-label">
                          Текст <span className="yandex-side-arrow">&gt;</span>
                        </div>
                        <div className="yandex-ad-row-main">
                          <span className="yandex-ad-text">{previewAd.text}</span>
                        </div>
                      </div>

                      <div className="yandex-ad-row yandex-ad-row-clarify">
                        <div className="yandex-ad-label">
                          Уточнения <span className="yandex-side-arrow">&gt;</span>
                        </div>
                        <div className="yandex-ad-row-main">
                          <table className="yandex-sitelinks yandex-sitelinks-clarify">
                            <tbody>
                              <tr>
                          {previewClarifications.map((item, idx) => (
                            <td key={`clar-${idx}`}>
                              <input
                                className="preview-input"
                                value={item}
                                placeholder={`Уточнение ${idx + 1}`}
                                onChange={(e) => handleClarificationCellChange(idx, e.target.value)}
                              />
                            </td>
                          ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="yandex-ad-row yandex-ad-row-contacts">
                        <div className="yandex-ad-label"></div>
                        <div className="yandex-ad-row-main">
                          <div className="yandex-ad-body">
                            <div style={{ marginTop: '4px' }}>
                              <a href="#">Контактная информация</a> · +7 (800) 0000-000 · пн-пт 9:00-18:00,
                              сб 9:30-17:00
                            </div>
                            <div>м. Невский Проспект · Санкт-Петербург</div>
                          </div>
                        </div>
                      </div>

                      <div className="yandex-ad-row yandex-ad-row-sitelinks">
                        <div className="yandex-ad-label yandex-ad-label-sitelinks">
                          <div>
                            Адреса быстрых ссылок <span className="yandex-side-arrow">&gt;</span>
                          </div>
                          <div>
                            Якоря быстрых ссылок <span className="yandex-side-arrow">&gt;</span>
                          </div>
                          <div>
                            Описания быстрых ссылок <span className="yandex-side-arrow">&gt;</span>
                          </div>
                        </div>
                        <div className="yandex-ad-row-main">
                          <table className="yandex-sitelinks">
                            <tbody>
                        <tr>
                          {previewQuickLinks.map((link, idx) => (
                            <td key={`ql-url-${idx}`}>
                              <input
                                className="preview-input"
                                value={link.url}
                                placeholder={`https://example.com/link${idx + 1}`}
                                onChange={(e) => handleQuickLinkChange(idx, 'url', e.target.value)}
                              />
                            </td>
                          ))}
                        </tr>
                        <tr>
                          {previewQuickLinks.map((link, idx) => (
                            <td key={`ql-title-${idx}`}>
                              <input
                                className="preview-input"
                                value={link.title}
                                placeholder={`Заголовок ${idx + 1}`}
                                onChange={(e) => handleQuickLinkChange(idx, 'title', e.target.value)}
                              />
                            </td>
                          ))}
                        </tr>
                        <tr>
                          {previewQuickLinks.map((link, idx) => (
                            <td key={`ql-desc-${idx}`}>
                              <input
                                className="preview-input"
                                value={link.description}
                                placeholder={`Описание ${idx + 1}`}
                                onChange={(e) => handleQuickLinkChange(idx, 'description', e.target.value)}
                              />
                            </td>
                          ))}
                        </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="yandex-dynamic-flag">
                        <span className="yandex-dynamic-flag-label">Отображаемая ссылка динамическая</span>
                        <div
                          className={`yandex-toggle-switch ${isDynamicLink ? 'yandex-toggle-on' : ''}`}
                          onClick={() => setIsDynamicLink((prev) => !prev)}
                        >
                          <span
                            className={`yandex-toggle-option ${!isDynamicLink ? 'yandex-active' : ''}`}
                          >
                            нет
                          </span>
                          <div className="yandex-toggle-track">
                            <div className="yandex-toggle-knob"></div>
                          </div>
                          <span
                            className={`yandex-toggle-option ${isDynamicLink ? 'yandex-active' : ''}`}
                          >
                            да
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Таблица сгенерированных объявлений */}
            <div className="announcements-results">
              <div className="generated-ads-container">
                <div className="generated-ads-controls">
                  <button className="btn" onClick={handleCopyTSV} disabled={generatedAds.length === 0}>
                    Скопировать в буфер (TSV)
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleExport}
                    disabled={generatedAds.length === 0}
                  >
                    Скачать CSV
                  </button>
                </div>
                <GeneratedAdsTable ads={generatedAds} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
