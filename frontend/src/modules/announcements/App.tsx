import React, { useState, useMemo } from 'react';
import { useStore } from './store/useStore';
import { exportToYandexDirectCSV } from './lib/generator';
import './App.css';

// Импортируем типы из модуля Data для интеграции
interface Phrase {
  id: string;
  text: string;
  ws: number;
}

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
  } = useStore();

  // Состояния для новой левой панели
  const [keysInput, setKeysInput] = useState('');
  const [domain, setDomain] = useState('nordkor.ru');
  const [utm, setUtm] = useState('utm_source=yandex&utm_medium=cpc&utm_campaign={group}&utm_term={key}');
  const [groupId, setGroupId] = useState('');
  const [addonsInput, setAddonsInput] = useState(
    'система под ключ за 70 190р!\nобезжелезиватели от 16 990р!\nфильтры от 16 990р!\nвсего за 16 990р!'
  );
  const [bodyVariantsInput, setBodyVariantsInput] = useState(
    'Ответьте на 5 вопросов и узнайте стоимость системы очистки воды!'
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
      });
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

  return (
    <div className="announcements-app">
      <div className="announcements-header">
        <h1>Генератор объявлений Яндекс.Директ</h1>
        <div className="announcements-subtitle">
          Автоматическое создание объявлений из ключевых фраз
        </div>
      </div>

      <div className="announcements-content">
        {/* Левая панель с настройками */}
        <div className="announcements-sidebar">
          {/* Настройки URL */}
          <div className="announcements-section">
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
            <div className="ads-hint">
              Используйте {'{key}'} и {'{group}'} для подстановки
            </div>

            <label>ID группы (опционально)</label>
            <input
              className="ads-input"
              placeholder="grp-1, grp-2 ..."
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            />
          </div>

          {/* Прибавки к H2 */}
          <div className="announcements-section">
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
          <div className="announcements-section">
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
          <div className="announcements-section">
            <h2>Ключевые фразы</h2>
            <label>Вставьте фразы (по одной на строку)</label>
            <textarea
              className="ads-textarea"
              style={{ minHeight: '120px' }}
              placeholder="фильтр для воды купить&#10;система очистки воды&#10;обезжелезиватель воды"
              value={keysInput}
              onChange={(e) => setKeysInput(e.target.value)}
            />
            <div className="ads-hint">Фраз: {keyList.length}. Дубликаты будут удалены.</div>
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

        {/* Яндекс превью */}
        <div className="yandex-preview-page">
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
                  value={selectedAd ? selectedAd.phrase : 'ключевая фраза'}
                  readOnly
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
            <section className="yandex-content">
              <div className="yandex-ad">
                {generatedAds.length > 0 && selectedAd ? (
                  <>
                    <div className="yandex-ad-row">
                      <div className="yandex-ad-label"></div>
                      <div className="yandex-ad-row-main">
                        <div className="yandex-ad-title">
                          <a href="#">
                            {selectedAd.title1}
                            {selectedAd.title2 && ` — ${selectedAd.title2}`}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="yandex-ad-row">
                      <div className="yandex-ad-label">
                        Отображаемая ссылка <span className="yandex-side-arrow">&gt;</span>
                      </div>
                      <div className="yandex-ad-row-main">
                        <div className="yandex-ad-url-row">
                          <div className="yandex-ad-url-domain">{normalizeDomain(domain)}/</div>
                          <div className="yandex-ad-url-text">{selectedAd.phrase}</div>
                        </div>
                      </div>
                    </div>

                    <div className="yandex-ad-row">
                      <div className="yandex-ad-label">
                        Текст <span className="yandex-side-arrow">&gt;</span>
                      </div>
                      <div className="yandex-ad-row-main">
                        <span className="yandex-ad-text">{selectedAd.text}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    <p>📝 Сгенерируйте объявления</p>
                    <p style={{ fontSize: '14px', marginTop: '10px' }}>
                      Заполните настройки слева и нажмите кнопку генерации
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
