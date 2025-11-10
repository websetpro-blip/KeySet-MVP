import { useEffect, useState } from "react";
import type { Account } from "../types";
import * as api from "../api";
import { accountToUpdatePayload } from "../mapper";

const TABS = [
  { id: "basic", label: "Основное", icon: "fas fa-info-circle" },
  { id: "network", label: "Сеть", icon: "fas fa-globe" },
  { id: "fingerprint", label: "Fingerprint", icon: "fas fa-mask" },
  { id: "captcha", label: "Капча", icon: "fas fa-shield-alt" },
  { id: "proxy", label: "Менеджер прокси", icon: "fas fa-cogs" },
];

interface AccountSidebarProps {
  account: Account | null;
  onAccountUpdate?: (updated: Partial<Account>) => void | Promise<void>;
  onClose(): void;
}

export function AccountSidebar({ account, onAccountUpdate, onClose }: AccountSidebarProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [editedAccount, setEditedAccount] = useState<Account | null>(account);
  const [proxyTestResult, setProxyTestResult] = useState<any>(null);
  const [proxyTesting, setProxyTesting] = useState(false);

  // Update edited account when account prop changes
  useEffect(() => {
    setEditedAccount(account);
  }, [account]);

  const handleSave = async () => {
    if (!editedAccount || !onAccountUpdate) return;

    try {
      await onAccountUpdate(editedAccount);
    } catch (err) {
      console.error("Failed to save account:", err);
    }
  };

  const handleProxyTest = async () => {
    if (!editedAccount) return;

    try {
      setProxyTesting(true);
      setProxyTestResult(null);

      const [host, port] = (editedAccount.proxy || "").split(":");
      if (!host || !port) {
        alert("Введите корректный адрес прокси (host:port)");
        return;
      }

      const result = await api.testProxy(
        host.trim(),
        parseInt(port.trim(), 10),
        editedAccount.proxyUsername || undefined,
        editedAccount.proxyPassword || undefined,
        editedAccount.proxyType
      );

      setProxyTestResult(result);
      alert(`Прокси работает! Время ответа: ${result.response_time_ms}ms`);
    } catch (err) {
      alert(`Ошибка тестирования прокси: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setProxyTesting(false);
    }
  };

  return (
    <div className="sidebar" id="settingsSidebar">
      <div className="sidebar-header">
        <h3>Настройки аккаунта</h3>
      </div>

      {editedAccount && (
        <div className="account-info">
          <div className="account-email">
            <i className="fas fa-user-circle" />
            <span>{editedAccount.email}</span>
          </div>
        </div>
      )}

      <div className="tabs-container">
        <div className="tabs-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tabs-content">
          {renderTabContent(
            activeTab,
            editedAccount,
            setEditedAccount,
            handleSave,
            handleProxyTest,
            proxyTesting,
            proxyTestResult
          )}
        </div>
      </div>
    </div>
  );
}

function renderTabContent(
  tab: string,
  account: Account | null,
  setAccount: (account: Account | null) => void,
  onSave: () => void,
  onProxyTest: () => void,
  proxyTesting: boolean,
  proxyTestResult: any
) {
  if (!account) {
    return (
      <div className="empty-state">
        <p>Выберите аккаунт в таблице, чтобы увидеть подробности.</p>
      </div>
    );
  }

  switch (tab) {
    case "basic":
      return (
        <div className="tab-content active">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={account.email}
              onChange={(e) =>
                setAccount({ ...account, email: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <div className="password-field">
              <input
                type="password"
                value={account.password}
                onChange={(e) =>
                  setAccount({ ...account, password: e.target.value })
                }
              />
              <button type="button" className="password-toggle">
                <i className="fas fa-eye" />
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Секретный вопрос</label>
            <input
              type="text"
              value={account.secretAnswer}
              onChange={(e) =>
                setAccount({ ...account, secretAnswer: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Профиль Chrome</label>
            <input
              type="text"
              value={account.profilePath}
              onChange={(e) =>
                setAccount({ ...account, profilePath: e.target.value })
              }
            />
          </div>
          <div className="info-section">
            <div className="info-item">
              <span className="info-label">Статус авторизации:</span>
              <span className="info-value">{account.authStatus}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Последний вход:</span>
              <span className="info-value">{account.lastLogin}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Размер профиля:</span>
              <span className="info-value">{account.profileSize}</span>
            </div>
          </div>
          <div className="action-buttons" style={{ marginTop: "20px" }}>
            <button className="btn btn-success" type="button" onClick={onSave}>
              <i className="fas fa-save" /> Сохранить
            </button>
          </div>
        </div>
      );

    case "network":
      return (
        <div className="tab-content active">
          <div className="form-group">
            <label>Адрес прокси</label>
            <input
              type="text"
              value={account.proxy}
              onChange={(e) =>
                setAccount({ ...account, proxy: e.target.value })
              }
              placeholder="192.168.1.101:8080"
            />
          </div>
          <div className="form-group">
            <label>Логин (опционально)</label>
            <input
              type="text"
              value={account.proxyUsername}
              onChange={(e) =>
                setAccount({ ...account, proxyUsername: e.target.value })
              }
              placeholder="user3"
            />
          </div>
          <div className="form-group">
            <label>Пароль (опционально)</label>
            <input
              type="password"
              value={account.proxyPassword}
              onChange={(e) =>
                setAccount({ ...account, proxyPassword: e.target.value })
              }
              placeholder="••••••••"
            />
          </div>
          <div className="form-group">
            <label>Тип протокола</label>
            <select
              value={account.proxyType}
              onChange={(e) =>
                setAccount({
                  ...account,
                  proxyType: e.target.value as "http" | "https" | "socks5",
                })
              }
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks5">SOCKS5</option>
            </select>
          </div>
          <div className="action-buttons" style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
            <button
              className="btn btn-info"
              type="button"
              onClick={onProxyTest}
              disabled={proxyTesting}
            >
              <i className={proxyTesting ? "fas fa-spinner fa-spin" : "fas fa-flask"} />
              {proxyTesting ? " Тестируем..." : " Тест прокси"}
            </button>
            <button className="btn btn-success" type="button" onClick={onSave}>
              <i className="fas fa-save" /> Сохранить
            </button>
          </div>
          {proxyTestResult && (
            <div className="proxy-status-info" style={{ marginTop: "15px" }}>
              <div className="proxy-status-item">
                <span className="status-label">Статус:</span>
                <span className="status-value">✅ {proxyTestResult.status}</span>
              </div>
              <div className="proxy-status-item">
                <span className="status-label">Скорость:</span>
                <span className="status-value">{proxyTestResult.response_time_ms}ms</span>
              </div>
              <div className="proxy-status-item">
                <span className="status-label">Прокси:</span>
                <span className="status-value">{proxyTestResult.proxy}</span>
              </div>
            </div>
          )}
        </div>
      );

    case "fingerprint":
      return (
        <div className="tab-content active">
          <div className="form-group">
            <label>Предустановка</label>
            <select
              value={account.fingerprint}
              onChange={(e) =>
                setAccount({
                  ...account,
                  fingerprint: e.target.value as any,
                })
              }
            >
              <option value="russia_standard">🇷🇺 Россия (стандарт)</option>
              <option value="kazakhstan_standard">🇰🇿 Казахстан (стандарт)</option>
              <option value="no_spoofing">🌐 Без подмены</option>
            </select>
          </div>
          <div className="form-group">
            <label>User-Agent</label>
            <input type="text" placeholder="Автоматически" />
          </div>
          <div className="form-group">
            <label>Часовой пояс</label>
            <select defaultValue="Europe/Moscow">
              <option value="Europe/Moscow">Europe/Moscow</option>
              <option value="Asia/Almaty">Asia/Almaty</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div className="form-group">
            <label>Язык</label>
            <select defaultValue="ru-RU">
              <option value="ru-RU">Русский</option>
              <option value="kk-KZ">Казахский</option>
              <option value="en-US">English</option>
            </select>
          </div>
          <div className="form-group">
            <label>Разрешение экрана</label>
            <select defaultValue="1920x1080">
              <option value="1920x1080">1920x1080</option>
              <option value="1366x768">1366x768</option>
              <option value="1536x864">1536x864</option>
              <option value="2560x1440">2560x1440</option>
            </select>
          </div>
          <div className="advanced-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span className="checkmark" />
              Canvas спуфинг
            </label>
            <label className="checkbox-label">
              <input type="checkbox" />
              <span className="checkmark" />
              WebGL спуфинг
            </label>
            <label className="checkbox-label">
              <input type="checkbox" />
              <span className="checkmark" />
              AudioContext спуфинг
            </label>
          </div>
          <div className="action-buttons">
            <button className="btn btn-info btn-small" type="button">
              <i className="fas fa-sync-alt" /> Сгенерировать
            </button>
            <button className="btn btn-success btn-small" type="button">
              <i className="fas fa-chart-bar" /> Проверить
            </button>
            <button className="btn btn-success btn-small" type="button" onClick={onSave}>
              <i className="fas fa-save" /> Сохранить
            </button>
          </div>
        </div>
      );

    case "captcha":
      return (
        <div className="tab-content active">
          <div className="form-group">
            <label>Сервис</label>
            <select defaultValue="none">
              <option value="none">Отключено</option>
              <option value="rucaptcha">RuCaptcha</option>
              <option value="2captcha">2Captcha</option>
              <option value="anticaptcha">AntiCaptcha</option>
            </select>
          </div>
          <div className="form-group">
            <label>API Ключ</label>
            <div className="password-field">
              <input type="password" placeholder="API ключ" />
              <button type="button" className="password-toggle">
                <i className="fas fa-eye" />
              </button>
            </div>
          </div>
          <div className="captcha-info">
            <div className="info-item">
              <span className="info-label">Баланс:</span>
              <span className="info-value">$0.00</span>
            </div>
            <div className="info-item">
              <span className="info-label">Статус:</span>
              <span className="info-value">Не подключен</span>
            </div>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span className="checkmark" />
              Автоматически решать капчу
            </label>
          </div>
          <div className="action-buttons">
            <button className="btn btn-info btn-small" type="button">
              <i className="fas fa-flask" /> Проверить баланс
            </button>
          </div>
        </div>
      );

    case "proxy":
      return (
        <div className="tab-content active">
          <div className="proxy-manager-container">
            <div className="proxy-section">
              <h4>
                <i className="fas fa-download" /> Парсинг прокси
              </h4>
              <div className="proxy-sources">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span className="checkmark" />
                  fineproxy.org
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span className="checkmark" />
                  proxyelite.info
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span className="checkmark" />
                  htmlweb.ru
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span className="checkmark" />
                  advanced.name
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span className="checkmark" />
                  proxy.market
                </label>
              </div>
              <div className="proxy-parse-options">
                <div className="form-group">
                  <label>Протокол</label>
                  <select defaultValue="http">
                    <option value="http">HTTP</option>
                    <option value="socks5">SOCKS5</option>
                    <option value="any">Любой</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Страна</label>
                  <select defaultValue="ru">
                    <option value="ru">Россия</option>
                    <option value="kz">Казахстан</option>
                    <option value="any">Любая</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" type="button">
                <i className="fas fa-play" /> Начать парсинг
              </button>
            </div>

            <div className="proxy-section">
              <h4>
                <i className="fas fa-vial" /> Тестирование списка
              </h4>
              <div className="form-group">
                <label>Таймаут (сек)</label>
                <input type="number" defaultValue={10} min={1} max={60} />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span className="checkmark" />
                  Удалять нерабочие
                </label>
              </div>
              <button className="btn btn-warning" type="button">
                <i className="fas fa-flask" /> Тестировать все
              </button>
            </div>

            <div className="proxy-section">
              <h4>
                <i className="fas fa-sync-alt" /> Автоматическая ротация
              </h4>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span className="checkmark" />
                  Включить ротацию
                </label>
              </div>
              <div className="form-group">
                <label>Интервал (мин)</label>
                <input type="number" defaultValue={30} min={1} max={1440} />
              </div>
              <button className="btn btn-success" type="button">
                <i className="fas fa-list" /> Показать спарсенные
              </button>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="tab-content active">
          <p style={{ color: "#6b7280" }}>Содержимое вкладки готовим.</p>
        </div>
      );
  }
}
