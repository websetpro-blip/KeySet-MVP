// Модуль Объявления - табличный интерфейс
// Основано на требованиях из ГОТОВЫЕ_МОДУЛИ/Объявления

import React, { useState, useMemo } from 'react';
import { useStore } from './store/useStore';
import { LIMITS } from './types';
import {
  exportToCSV,
  downloadCSV,
  copyRowsAsTSV,
  copyKeysOnly,
  displayUrl,
} from './lib/generator';
import styles from './App.module.css';

export default function AnnouncementsApp() {
  const {
    rows,
    settings,
    isGenerating,
    isAIGenerating,
    selectedRowIndices,
    updateSettings,
    generateAds,
    generateWithAI,
    updateRow,
    deleteRows,
    addQuickLinksToAll,
    trimAllToLimits,
    selectAllRows,
    deselectAllRows,
    toggleRowSelection,
  } = useStore();

  // Локальное состояние для ввода ключей
  const [keysInput, setKeysInput] = useState('');
  const [campaignName, setCampaignName] = useState(`AUTO-${new Date().toISOString().slice(0, 10)}`);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Парсим ключи
  const keys = useMemo(() => {
    return [...new Set(keysInput.split(/\r?\n/).map((s) => s.trim()).filter(Boolean))].slice(0, 1000);
  }, [keysInput]);

  // Текущее объявление для предпросмотра
  const currentAd = rows[previewIndex];

  // Обработчики
  const handleGenerate = () => {
    if (!keys.length) {
      alert('Добавьте ключевые фразы (по одной в строке)');
      return;
    }
    generateAds(keys);
    setPreviewIndex(0);
  };

  const handleGenerateAI = async () => {
    if (!keys.length) {
      alert('Добавьте ключевые фразы (по одной в строке)');
      return;
    }
    await generateWithAI(keys);
    setPreviewIndex(0);
  };

  const handleExportCSV = () => {
    if (!rows.length) {
      alert('Нет объявлений для экспорта');
      return;
    }

    const csv = exportToCSV(rows, {
      campaignName,
      delimiter: ';',
      includeBOM: true,
    });

    downloadCSV(csv, `yandex_ads_${Date.now()}.csv`);
  };

  const handleCopyTSV = async () => {
    if (!rows.length) {
      alert('Нет объявлений для копирования');
      return;
    }

    const success = await copyRowsAsTSV(rows);
    if (success) {
      alert('Таблица скопирована в буфер обмена');
    } else {
      alert('Ошибка копирования');
    }
  };

  const handleCopyKeys = async () => {
    if (!rows.length) {
      alert('Нет объявлений');
      return;
    }

    const success = await copyKeysOnly(rows);
    if (success) {
      alert('Ключи скопированы в буфер обмена');
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRowIndices.size === 0) {
      alert('Выберите строки для удаления');
      return;
    }

    if (confirm(`Удалить ${selectedRowIndices.size} строк?`)) {
      deleteRows(Array.from(selectedRowIndices));
      setPreviewIndex(0);
    }
  };

  const handleEditCell = (rowIndex: number, field: string, value: string) => {
    updateRow(rowIndex, { [field]: value });
  };

  return (
    <div className={styles.container}>
      {/* Шапка */}
      <div className={styles.header}>
        <h1 className={styles.title}>Генератор объявлений для Яндекс.Директ</h1>
        <p className={styles.subtitle}>
          Создавайте 1000 готовых объявлений за 5-10 минут
        </p>
      </div>

      {/* Основной контент */}
      <div className={styles.content}>
        {/* Левая колонка - Ввод ключей и настройки */}
        <div className={styles.sidebar}>
          {/* Шаг 1: Ключи */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Шаг 1 — Ключевые фразы</h2>
            <textarea
              className={styles.textarea}
              placeholder="Ключи — по одному в строке"
              value={keysInput}
              onChange={(e) => setKeysInput(e.target.value)}
              rows={10}
            />
            <div className={styles.hint}>Фраз: {keys.length} / 1000</div>
          </section>

          {/* Шаг 2: Домен и UTM */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Шаг 2 — Домен и UTM</h2>
            <div className={styles.field}>
              <label className={styles.label}>Домен/лендинг</label>
              <input
                className={styles.input}
                placeholder="example.ru"
                value={settings.domain}
                onChange={(e) => updateSettings({ domain: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>UTM-шаблон (опц.)</label>
              <input
                className={styles.input}
                value={settings.utm}
                onChange={(e) => updateSettings({ utm: e.target.value })}
              />
              <div className={styles.hint}>
                В предпросмотре показываем только домен/путь, без UTM
              </div>
            </div>
          </section>

          {/* Шаг 3: Заголовки */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Шаг 3 — Заголовки</h2>
            <div className={styles.field}>
              <label className={styles.label}>Шаблон H1</label>
              <input
                className={styles.input}
                value={settings.h1Template}
                onChange={(e) => updateSettings({ h1Template: e.target.value })}
              />
              <div className={styles.hint}>
                Подстановка: {'{key}'}; если H1 &gt; 56, хвост уйдёт в H2
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Суффикс H2</label>
              <input
                className={styles.input}
                value={settings.h2Suffix}
                onChange={(e) => updateSettings({ h2Suffix: e.target.value })}
              />
              <div className={styles.hint}>
                Если ключ влез в H1, H2 возьмём из суффикса
              </div>
            </div>
          </section>

          {/* Шаг 4: Текст */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Шаг 4 — Текст объявления</h2>
            <textarea
              className={styles.textarea}
              placeholder="Текст объявления (до 81 символа)"
              value={settings.textVariants.join('\n')}
              onChange={(e) =>
                updateSettings({
                  textVariants: e.target.value.split(/\r?\n/).filter(Boolean),
                })
              }
              rows={4}
            />
            <div className={styles.hint}>Каждый вариант с новой строки (≤{LIMITS.TEXT} символов)</div>
          </section>

          {/* Кнопки генерации */}
          <section className={styles.section}>
            <div className={styles.buttonGroup}>
              <button
                className={styles.btnPrimary}
                onClick={handleGenerate}
                disabled={isGenerating || !keys.length}
              >
                {isGenerating ? 'Генерация...' : 'Сгенерировать'}
              </button>
              <button
                className={styles.btnSecondary}
                onClick={handleGenerateAI}
                disabled={isAIGenerating || !keys.length}
              >
                {isAIGenerating ? 'ИИ генерирует...' : 'Сгенерировать с ИИ'}
              </button>
            </div>
            <div className={styles.hint}>
              H1≤{LIMITS.H1}, H2≤{LIMITS.H2}, Текст≤{LIMITS.TEXT}
            </div>
          </section>
        </div>

        {/* Правая колонка - Таблица и предпросмотр */}
        <div className={styles.main}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <h2 className={styles.sectionTitle}>Объявления: {rows.length}</h2>
            <div className={styles.buttonGroup}>
              <button className={styles.btn} onClick={selectAllRows}>
                Выбрать все
              </button>
              <button className={styles.btn} onClick={deselectAllRows}>
                Снять выбор
              </button>
              <button
                className={styles.btnDanger}
                onClick={handleDeleteSelected}
                disabled={selectedRowIndices.size === 0}
              >
                Удалить ({selectedRowIndices.size})
              </button>
              <button
                className={styles.btn}
                onClick={addQuickLinksToAll}
                disabled={rows.length === 0}
              >
                + Быстрые ссылки (4)
              </button>
              <button
                className={styles.btn}
                onClick={trimAllToLimits}
                disabled={rows.length === 0}
              >
                Подрезать по лимитам
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleExportCSV}
                disabled={rows.length === 0}
              >
                Экспорт CSV
              </button>
              <button className={styles.btn} onClick={handleCopyTSV} disabled={rows.length === 0}>
                Копировать TSV
              </button>
              <button className={styles.btn} onClick={handleCopyKeys} disabled={rows.length === 0}>
                Только ключи
              </button>
            </div>
          </div>

          {/* Настройки экспорта */}
          <div className={styles.exportSettings}>
            <div className={styles.field}>
              <label className={styles.label}>Название кампании:</label>
              <input
                className={styles.input}
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>
          </div>

          {/* Таблица + Предпросмотр */}
          <div className={styles.tableWrapper}>
            {rows.length === 0 ? (
              <div className={styles.empty}>
                <p>Введите ключи и нажмите "Сгенерировать"</p>
                <p className={styles.hint}>
                  Система автоматически подставит ключевые фразы в шаблон и создаст готовые объявления
                </p>
              </div>
            ) : (
              <div className={styles.grid}>
                {/* Таблица */}
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>☑</th>
                        <th className={styles.th}>Ключ</th>
                        <th className={styles.th}>H1</th>
                        <th className={styles.th}>H2</th>
                        <th className={styles.th}>Текст</th>
                        <th className={styles.th}>URL</th>
                        <th className={styles.th}>Отобр. путь</th>
                        <th className={styles.th}>Уточнения</th>
                        <th className={styles.th}>SL1</th>
                        <th className={styles.th}>SL1 URL</th>
                        <th className={styles.th}>SL2</th>
                        <th className={styles.th}>SL2 URL</th>
                        <th className={styles.th}>SL3</th>
                        <th className={styles.th}>SL3 URL</th>
                        <th className={styles.th}>SL4</th>
                        <th className={styles.th}>SL4 URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr
                          key={i}
                          className={selectedRowIndices.has(i) ? styles.selected : ''}
                          onClick={() => setPreviewIndex(i)}
                        >
                          <td className={styles.td}>
                            <input
                              type="checkbox"
                              checked={selectedRowIndices.has(i)}
                              onChange={() => toggleRowSelection(i)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.cellInput}
                              value={row.key}
                              onChange={(e) => handleEditCell(i, 'key', e.target.value)}
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.cellInput}
                              value={row.h1}
                              onChange={(e) => handleEditCell(i, 'h1', e.target.value)}
                              maxLength={LIMITS.H1}
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.cellInput}
                              value={row.h2}
                              onChange={(e) => handleEditCell(i, 'h2', e.target.value)}
                              maxLength={LIMITS.H2}
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.cellInput}
                              value={row.txt}
                              onChange={(e) => handleEditCell(i, 'txt', e.target.value)}
                              maxLength={LIMITS.TEXT}
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.cellInput}
                              value={row.url}
                              onChange={(e) => handleEditCell(i, 'url', e.target.value)}
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.cellInput}
                              value={row.path}
                              onChange={(e) => handleEditCell(i, 'path', e.target.value)}
                              placeholder="catalog/page"
                              maxLength={LIMITS.DISPLAY_URL}
                            />
                          </td>
                          <td className={styles.td}>
                            <textarea
                              className={styles.cellTextarea}
                              value={row.clar}
                              onChange={(e) => handleEditCell(i, 'clar', e.target.value)}
                              placeholder="До 4, каждая с новой строки"
                              rows={1}
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.cellInput}
                              value={row.sl1_text}
                              onChange={(e) => handleEditCell(i, 'sl1_text', e.target.value)}
                              maxLength={LIMITS.QUICKLINK_TEXT}
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.cellInput}
                              value={row.sl1_url}
                              onChange={(e) => handleEditCell(i, 'sl1_url', e.target.value)}
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.cellInput}
                              value={row.sl2_text}
                              onChange={(e) => handleEditCell(i, 'sl2_text', e.target.value)}
                              maxLength={LIMITS.QUICKLINK_TEXT}
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.cellInput}
                              value={row.sl2_url}
                              onChange={(e) => handleEditCell(i, 'sl2_url', e.target.value)}
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.cellInput}
                              value={row.sl3_text}
                              onChange={(e) => handleEditCell(i, 'sl3_text', e.target.value)}
                              maxLength={LIMITS.QUICKLINK_TEXT}
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.cellInput}
                              value={row.sl3_url}
                              onChange={(e) => handleEditCell(i, 'sl3_url', e.target.value)}
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.cellInput}
                              value={row.sl4_text}
                              onChange={(e) => handleEditCell(i, 'sl4_text', e.target.value)}
                              maxLength={LIMITS.QUICKLINK_TEXT}
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.cellInput}
                              value={row.sl4_url}
                              onChange={(e) => handleEditCell(i, 'sl4_url', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Компактный предпросмотр (справа, sticky) */}
                <div className={styles.preview}>
                  <div className={styles.previewHeader}>
                    <h3 className={styles.previewTitle}>Предпросмотр</h3>
                    <span className={styles.previewCounter}>
                      {previewIndex + 1} / {rows.length}
                    </span>
                  </div>

                  {currentAd && (
                    <div className={styles.previewCard}>
                      {/* Как в выдаче Яндекса */}
                      <div className={styles.adTitle}>
                        <b>{currentAd.h1}</b> — {currentAd.h2}
                      </div>
                      <div className={styles.adUrl}>{displayUrl(currentAd.url, currentAd.path)}</div>
                      <div className={styles.adText}>{currentAd.txt}</div>

                      {/* Уточнения */}
                      {currentAd.clar && (
                        <div className={styles.clarifications}>
                          {currentAd.clar
                            .split(/\r?\n/)
                            .filter(Boolean)
                            .slice(0, 4)
                            .map((c, i) => (
                              <span key={i} className={styles.clarChip}>
                                {c}
                              </span>
                            ))}
                        </div>
                      )}

                      {/* Быстрые ссылки */}
                      {(currentAd.sl1_text ||
                        currentAd.sl2_text ||
                        currentAd.sl3_text ||
                        currentAd.sl4_text) && (
                        <div className={styles.quickLinks}>
                          {[
                            currentAd.sl1_text,
                            currentAd.sl2_text,
                            currentAd.sl3_text,
                            currentAd.sl4_text,
                          ]
                            .filter(Boolean)
                            .map((text, i) => (
                              <a key={i} href="#" className={styles.quickLink}>
                                {text}
                              </a>
                            ))}
                        </div>
                      )}

                      {/* Навигация */}
                      <div className={styles.previewNav}>
                        <button
                          className={styles.btn}
                          onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                          disabled={previewIndex === 0}
                        >
                          ←
                        </button>
                        <button
                          className={styles.btn}
                          onClick={() => setPreviewIndex(Math.min(rows.length - 1, previewIndex + 1))}
                          disabled={previewIndex === rows.length - 1}
                        >
                          →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
