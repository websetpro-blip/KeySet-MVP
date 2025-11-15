import React, { useState } from 'react';
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

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleGenerateAds = async () => {
    if (!selectedTemplateId || selectedPhraseIds.size === 0) {
      alert('Выберите шаблон и хотя бы одну фразу');
      return;
    }

    try {
      await generateAds(samplePhrases, {
        templateId: selectedTemplateId,
        phraseIds: Array.from(selectedPhraseIds),
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

  return (
    <div className="announcements-app">
      <div className="announcements-header">
        <h1>Генератор объявлений для Яндекс Директ</h1>
        <p className="announcements-subtitle">
          Создавайте тысячи объявлений за пару минут из ключевых фраз
        </p>
      </div>

      <div className="announcements-content">
        {/* Левая панель - Шаблоны и фразы */}
        <div className="announcements-sidebar">
          {/* Выбор шаблона */}
          <div className="announcements-section">
            <h2>Шаблон объявления</h2>
            <select
              className="template-select"
              value={selectedTemplateId || ''}
              onChange={(e) => selectTemplate(e.target.value)}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>

            {selectedTemplate && (
              <div className="template-preview">
                <div className="template-field">
                  <label>Заголовок 1:</label>
                  <div className="template-value">{selectedTemplate.title1}</div>
                </div>
                {selectedTemplate.title2 && (
                  <div className="template-field">
                    <label>Заголовок 2:</label>
                    <div className="template-value">{selectedTemplate.title2}</div>
                  </div>
                )}
                <div className="template-field">
                  <label>Текст:</label>
                  <div className="template-value">{selectedTemplate.text}</div>
                </div>
                <div className="template-options">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedTemplate.usePhraseInTitle}
                      readOnly
                    />
                    Фраза в заголовке
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedTemplate.usePhraseInText}
                      readOnly
                    />
                    Фраза в тексте
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Выбор фраз */}
          <div className="announcements-section">
            <h2>Ключевые фразы ({samplePhrases.length})</h2>
            <div className="phrases-actions">
              <button
                className="btn-small"
                onClick={() => setSelectedPhraseIds(new Set(samplePhrases.map((p) => p.id)))}
              >
                Выбрать все
              </button>
              <button className="btn-small" onClick={() => setSelectedPhraseIds(new Set())}>
                Снять выбор
              </button>
            </div>
            <div className="phrases-list">
              {samplePhrases.map((phrase) => (
                <label key={phrase.id} className="phrase-item">
                  <input
                    type="checkbox"
                    checked={selectedPhraseIds.has(phrase.id)}
                    onChange={() => togglePhraseSelection(phrase.id)}
                  />
                  <span className="phrase-text">{phrase.text}</span>
                  <span className="phrase-ws">({phrase.ws.toLocaleString()})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Кнопка генерации */}
          <div className="announcements-section">
            <button
              className="btn-generate"
              onClick={handleGenerateAds}
              disabled={isGenerating || selectedPhraseIds.size === 0}
            >
              {isGenerating
                ? `Генерация... ${progress}/${totalToGenerate}`
                : `Генерировать объявления (${selectedPhraseIds.size})`}
            </button>
          </div>
        </div>

        {/* Правая панель - Сгенерированные объявления */}
        <div className="announcements-main">
          <div className="announcements-toolbar">
            <h2>Сгенерированные объявления ({generatedAds.length})</h2>
            <div className="toolbar-actions">
              <button className="btn" onClick={selectAllAds}>
                Выбрать все
              </button>
              <button className="btn" onClick={deselectAllAds}>
                Снять выбор
              </button>
              <button className="btn btn-danger" onClick={handleDeleteSelected}>
                Удалить выбранные ({selectedAdIds.size})
              </button>
              <button className="btn btn-primary" onClick={handleExport}>
                Экспорт в CSV
              </button>
            </div>
          </div>

          {/* Настройки экспорта */}
          <div className="export-settings">
            <div className="export-field">
              <label>Название кампании:</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="export-input"
              />
            </div>
            <div className="export-field">
              <label>Название группы объявлений:</label>
              <input
                type="text"
                value={adGroupName}
                onChange={(e) => setAdGroupName(e.target.value)}
                className="export-input"
              />
            </div>
          </div>

          {/* Список объявлений */}
          <div className="ads-list">
            {generatedAds.length === 0 ? (
              <div className="empty-state">
                <p>Выберите фразы и нажмите "Генерировать объявления"</p>
                <p className="empty-hint">
                  Система автоматически подставит ключевые фразы в шаблон и создаст готовые объявления
                </p>
              </div>
            ) : (
              generatedAds.map((ad) => (
                <div
                  key={ad.id}
                  className={`ad-card ${selectedAdIds.has(ad.id) ? 'selected' : ''} ${
                    ad.status === 'draft' ? 'draft' : ''
                  }`}
                >
                  <div className="ad-header">
                    <input
                      type="checkbox"
                      checked={selectedAdIds.has(ad.id)}
                      onChange={() => {
                        const newSet = new Set(selectedAdIds);
                        if (newSet.has(ad.id)) {
                          newSet.delete(ad.id);
                        } else {
                          newSet.add(ad.id);
                        }
                        useStore.setState({ selectedAdIds: newSet });
                      }}
                    />
                    <span className="ad-phrase">{ad.phrase}</span>
                    <span className={`ad-status status-${ad.status}`}>{ad.status}</span>
                  </div>
                  <div className="ad-body">
                    <div className="ad-title1">{ad.title1}</div>
                    {ad.title2 && <div className="ad-title2">{ad.title2}</div>}
                    <div className="ad-text">{ad.text}</div>
                    {ad.displayUrl && <div className="ad-url">{ad.displayUrl}</div>}
                    {ad.quickLinks && ad.quickLinks.length > 0 && (
                      <div className="ad-quicklinks">
                        {ad.quickLinks.map((ql, idx) => (
                          <span key={idx} className="quicklink">
                            {ql.title}
                          </span>
                        ))}
                      </div>
                    )}
                    {ad.warnings && ad.warnings.length > 0 && (
                      <div className="ad-warnings">
                        {ad.warnings.map((warning, idx) => (
                          <div key={idx} className="warning">
                            ⚠️ {warning}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
