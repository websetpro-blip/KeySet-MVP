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
              <th>Ключ</th>
              <th>H1</th>
              <th>H2</th>
              <th>Текст</th>
              <th>URL</th>
              <th>Отобр. ссылка</th>
              <th>Уточнения</th>
              <th>SL1</th>
              <th>SL1 Desc</th>
              <th>SL1 URL</th>
              <th>SL2</th>
              <th>SL2 Desc</th>
              <th>SL2 URL</th>
              <th>SL3</th>
              <th>SL3 Desc</th>
              <th>SL3 URL</th>
              <th>SL4</th>
              <th>SL4 Desc</th>
              <th>SL4 URL</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad, index) => (
              <tr key={ad.id}>
                <td>{index + 1}</td>
                <td>{ad.phrase}</td>
                <td>{ad.title1}</td>
                <td>{ad.title2 || ''}</td>
                <td>{ad.text}</td>
                <td>{ad.url || ''}</td>
                <td>{ad.displayUrl || ''}</td>
                <td>{ad.clarifications || ''}</td>
                <td>{ad.quickLinks?.[0]?.title || ''}</td>
                <td>{ad.quickLinks?.[0]?.description || ''}</td>
                <td>{ad.quickLinks?.[0]?.url || ''}</td>
                <td>{ad.quickLinks?.[1]?.title || ''}</td>
                <td>{ad.quickLinks?.[1]?.description || ''}</td>
                <td>{ad.quickLinks?.[1]?.url || ''}</td>
                <td>{ad.quickLinks?.[2]?.title || ''}</td>
                <td>{ad.quickLinks?.[2]?.description || ''}</td>
                <td>{ad.quickLinks?.[2]?.url || ''}</td>
                <td>{ad.quickLinks?.[3]?.title || ''}</td>
                <td>{ad.quickLinks?.[3]?.description || ''}</td>
                <td>{ad.quickLinks?.[3]?.url || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
