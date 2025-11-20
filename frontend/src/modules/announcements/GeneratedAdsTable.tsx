import React from 'react';
import type { GeneratedAd } from './types';

interface GeneratedAdsTableProps {
  ads: GeneratedAd[];
}

export function GeneratedAdsTable({ ads }: GeneratedAdsTableProps) {
  if (!ads.length) {
    return (
      <div className="generated-ads-empty">
        Сгенерированных объявлений пока нет. Вставьте ключи слева и нажмите кнопку генерации.
      </div>
    );
  }

  return (
    <div className="generated-ads-table-section">
      <div className="generated-ads-header">
        <h2>
          Сгенерированные объявления (<span>{ads.length}</span>)
        </h2>
      </div>
      <div className="generated-ads-table-wrapper">
        <table className="generated-ads-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Фраза (с минус-словами)</th>
              <th>Заголовок 1</th>
              <th>Заголовок 2</th>
              <th>Текст</th>
              <th>Ссылка</th>
              <th>Отображаемая ссылка</th>
              <th>Заголовки быстрых ссылок</th>
              <th>Описания быстрых ссылок</th>
              <th>Адреса быстрых ссылок</th>
              <th>Уточнения</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad, index) => {
              const quickLinks = ad.quickLinks ?? [];
              const quickLinkTitles = quickLinks.map((ql) => ql.title || '').filter(Boolean).join('||');
              const quickLinkDescriptions = quickLinks
                .map((ql) => ql.description || '')
                .filter(Boolean)
                .join('||');
              const quickLinkUrls = quickLinks.map((ql) => ql.url || '').filter(Boolean).join('||');
              const clarifications = (ad.clarifications || '')
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
                .join('||');

              return (
                <tr key={ad.id}>
                  <td>{index + 1}</td>
                  <td>{ad.phrase}</td>
                  <td>{ad.title1}</td>
                  <td>{ad.title2 || ''}</td>
                  <td>{ad.text}</td>
                  <td className="url-cell" title={ad.url || ''}>
                    {ad.url || ''}
                  </td>
                  <td className="url-cell" title={ad.displayUrl || ''}>
                    {ad.displayUrl || ''}
                  </td>
                  <td>{quickLinkTitles}</td>
                  <td>{quickLinkDescriptions}</td>
                  <td className="url-cell" title={quickLinkUrls}>
                    {quickLinkUrls}
                  </td>
                  <td>{clarifications}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
