import { useEffect, useState, ChangeEvent, useRef, useMemo } from "react";
import type { MouseEvent } from "react";

import type {
  Account,
  AntidetectConfig,
  CanvasNoise,
  GeoPreset,
  PlatformPreset,
  WebRTCMode,
} from "../types";

import {
  autologinAccount,
  deleteAccountCookies,
  ensureAccountProfileDirectory,
  openAccountProfileDirectory,
  uploadAccountCookies,
  testProxy,
} from "../api";
import { ProxyManagerSection } from "./ProxyManager";
import { ProfileSlotsSection } from "./ProfileSlotsSection";



const TABS = [


  { id: "basic", label: "Основное", icon: "fas fa-info-circle" },


  { id: "network", label: "Сеть", icon: "fas fa-globe" },


  { id: "fingerprint", label: "Антидетект", icon: "fas fa-mask" },


  { id: "captcha", label: "Капча", icon: "fas fa-shield-alt" },


  { id: "proxy", label: "Менеджер прокси", icon: "fas fa-cogs" },


];





type UpdateAccountFn = (id: number, changes: Partial<Account>) => Promise<void> | void;

type UpdateDraftFn = (patch: Partial<Account>) => void;



interface AccountSidebarProps {
  account: Account | null;
  onClose(): void;
  onUpdateAccount?: UpdateAccountFn;
  onReloadAccounts?: () => Promise<void> | void;
  onLog?: (message: string) => void;
  selectedAccountIds?: number[];
}

export function AccountSidebar({
  account,
  onClose,
  onUpdateAccount,
  onReloadAccounts,
  onLog,
  selectedAccountIds,
}: AccountSidebarProps) {
  const [activeTab, setActiveTab] = useState("basic");

  const [draft, setDraft] = useState<Account | null>(account);

  const [saving, setSaving] = useState(false);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);

  const [autologinMessage, setAutologinMessage] = useState<string | null>(null);

  const [autologinError, setAutologinError] = useState<string | null>(null);

  const [isAutologinRunning, setIsAutologinRunning] = useState(false);



  useEffect(() => {

    setDraft(account);

    setSaveMessage(null);

    setSaveError(null);

    setAutologinMessage(null);

    setAutologinError(null);

    setIsAutologinRunning(false);

  }, [account?.id]);



  const handleDraftChange: UpdateDraftFn = (patch) => {

    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  };



  const handleSaveAll = async () => {

    if (!draft || !onUpdateAccount) return;

    setSaving(true);

    setSaveMessage(null);

    setSaveError(null);

    try {
      await onUpdateAccount(draft.id, draft);
      setSaveMessage("Настройки аккаунта сохранены");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSaveError(message);
      onLog?.(`Ошибка сохранения аккаунта ${draft.email}: ${message}`);
    } finally {
      setSaving(false);
    }
  };


  const handleAutologin = async () => {

    if (!draft) return;

    setIsAutologinRunning(true);

    setAutologinMessage(null);

    setAutologinError(null);

    try {
      const response = await autologinAccount(draft.id);
      setAutologinMessage(response.message || "Автологин выполнен");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAutologinError(message);
      onLog?.(`Ошибка автологина для ${draft.email}: ${message}`);
    } finally {
      setIsAutologinRunning(false);
    }
  };


  return (
    <div className="sidebar" id="settingsSidebar">
      {draft && (
        <div className="account-info">
          <div className="account-email">
            <i className="fas fa-user-circle" />
            <span>{draft.email}</span>
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
          <div className="tab-content-scroll">
            {renderTabContent(activeTab, draft, handleDraftChange, onUpdateAccount, onReloadAccounts, onLog, selectedAccountIds)}
          </div>
          {draft && (
            <div className="sidebar-floating-actions">
              <div className="action-buttons dual-buttons">
                <button
                  className="btn btn-secondary btn-large"
                  type="button"
                  onClick={handleAutologin}
                  disabled={isAutologinRunning}
                >
                  <i className="fas fa-sign-in-alt" />{}
                  {isAutologinRunning ? "Запуск..." : "Автологин"}
                </button>
                <button
                  className="btn btn-primary btn-large"
                  type="button"
                  onClick={handleSaveAll}
                  disabled={!onUpdateAccount || saving}
                >
                  <i className="fas fa-save" /> {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
              {(autologinMessage || autologinError || saveMessage || saveError) && (
                <div className="action-messages">
                  {autologinMessage && (
                    <p className="action-hint" style={{ color: "#059669" }}>
                      <i className="fas fa-check-circle" /> {autologinMessage}
                    </p>
                  )}
                  {autologinError && (
                    <p className="action-hint" style={{ color: "#b91c1c" }}>
                      <i className="fas fa-exclamation-circle" /> {autologinError}
                    </p>
                  )}
                  {saveMessage && (
                    <p className="action-hint" style={{ color: "#059669" }}>
                      <i className="fas fa-check-circle" /> {saveMessage}
                    </p>
                  )}
                  {saveError && (
                    <p className="action-hint" style={{ color: "#b91c1c" }}>
                      <i className="fas fa-exclamation-circle" /> {saveError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}


function renderTabContent(
  tab: string,
  account: Account | null,
  onUpdateDraft?: UpdateDraftFn,
  onUpdateAccount?: UpdateAccountFn,
  onReloadAccounts?: () => Promise<void> | void,
  onLog?: (message: string) => void,
  selectedAccountIds?: number[],
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

      return <BasicTab account={account} onUpdateDraft={onUpdateDraft} />;



    case "network":

      return <NetworkTab account={account} onUpdateDraft={onUpdateDraft} onLog={onLog} />;



    case "fingerprint":

      return <FingerprintTab account={account} onUpdateDraft={onUpdateDraft} />;




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
            <ProxyManagerSection
              account={account}
              onReloadAccounts={onReloadAccounts}
              onLog={onLog}
              selectedAccountIds={selectedAccountIds}
              onUpdateDraft={onUpdateDraft}
              onUpdateAccount={onUpdateAccount}
            />
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



interface NetworkTabProps {
  account: Account;
  onUpdateDraft?: UpdateDraftFn;
  onLog?: (message: string) => void;
}



function NetworkTab({ account, onUpdateDraft, onLog }: NetworkTabProps) {
  const [address, setAddress] = useState(extractProxyAddress(account.proxy));

  const [username, setUsername] = useState(account.proxyUsername || "");

  const [password, setPassword] = useState(account.proxyPassword || "");

  const [protocol, setProtocol] = useState<Account["proxyType"]>(account.proxyType || "http");
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);


  useEffect(() => {

    setAddress(extractProxyAddress(account.proxy));

    setUsername(account.proxyUsername || "");

    setPassword(account.proxyPassword || "");

    setProtocol(account.proxyType || "http");

    setTestMessage(null);
    setTestError(null);
    setIsTesting(false);
  }, [account.id, account.proxy, account.proxyUsername, account.proxyPassword, account.proxyType]);



  const syncDraft = (next: {

    address?: string;

    username?: string;

    password?: string;

    protocol?: Account["proxyType"];

  }) => {

    const nextAddress = (next.address ?? address).trim();

    const nextUsername = next.username ?? username;

    const nextPassword = next.password ?? password;

    const nextProtocol = next.protocol ?? protocol;

    const proxyValue = composeProxyValue(nextAddress, nextProtocol, nextUsername, nextPassword);



    onUpdateDraft?.({

      proxy: proxyValue,

      proxyUsername: nextUsername,

      proxyPassword: nextPassword,

      proxyType: nextProtocol,
      proxyId: null,

    });

  };



  const handleAddressChange = (value: string) => {

    setAddress(value);

    syncDraft({ address: value });

  };



  const handleUsernameChange = (value: string) => {

    setUsername(value);

    syncDraft({ username: value });

  };



  const handlePasswordChange = (value: string) => {

    setPassword(value);

    syncDraft({ password: value });

  };



  const handleProtocolChange = (value: Account["proxyType"]) => {

    setProtocol(value);

    syncDraft({ protocol: value });

  };



  return (
    <div className="tab-content active">

      <div className="form-group">

        <label>Адрес прокси</label>

        <input

          type="text"

          value={address}

          onChange={(e) => handleAddressChange(e.target.value)}

          placeholder="user:pass@host:port или host:port"

        />

      </div>

      <div className="form-group">

        <label>Логин (опционально)</label>

        <input

          type="text"

          value={username}

          onChange={(e) => handleUsernameChange(e.target.value)}

          placeholder="user3"

        />

      </div>

      <div className="form-group">

        <label>Пароль (опционально)</label>

        <input

          type="password"

          value={password}

          onChange={(e) => handlePasswordChange(e.target.value)}

          placeholder="••••••••"

        />

      </div>

      <div className="form-group">

        <label>Тип протокола</label>

        <select value={protocol} onChange={(e) => handleProtocolChange(e.target.value as Account["proxyType"])}>

          <option value="http">HTTP</option>

          <option value="https">HTTPS</option>

          <option value="socks5">SOCKS5</option>

        </select>

      </div>

        <div className="proxy-test-section" style={{ marginTop: "12px" }}>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={async () => {
              const rawAddress = address.trim();

              if (!rawAddress) {
                setTestError("Укажите адрес прокси в формате host:port.");
                setTestMessage(null);
                return;
              }

              const proxyValue = composeProxyValue(rawAddress, protocol, username, password);

              if (!proxyValue) {
                setTestError("Укажите корректный адрес прокси.");
                setTestMessage(null);
                return;
              }

              let url: URL;

              try {
                url = new URL(proxyValue);
              } catch {
                setTestError("Неверный формат прокси. Ожидается host:port.");
                setTestMessage(null);
                return;
              }

              if (!url.hostname || !url.port) {
                setTestError("Нужно указать хост и порт прокси, например 127.0.0.1:3128.");
                setTestMessage(null);
                return;
              }

              const portNumber = Number(url.port);

              if (!Number.isFinite(portNumber) || portNumber <= 0) {
                setTestError("Неверный порт прокси. Укажите число, например 3128.");
                setTestMessage(null);
                return;
              }

              setIsTesting(true);
              setTestMessage(null);
              setTestError(null);

              try {
                const response = await testProxy(
                  url.hostname,
                  portNumber,
                  url.username || undefined,
                  url.password || undefined,
                  protocol
                );

                if (response.status === "ok") {
                  const parts: string[] = [];

                  if (typeof response.response_time_ms === "number") {
                    parts.push(`${Math.round(response.response_time_ms)} мс`);
                  }

                  if (response.ip) {
                    parts.push(`IP: ${response.ip}`);
                  }

                  const details = parts.length ? ` (${parts.join(", ")})` : "";

                  setTestMessage(`Прокси работает${details}`);
                  setTestError(null);
                  onLog?.(
                    `Тест прокси (Сеть) для ${account.email}: OK${details} (${url.hostname}:${portNumber}, ${protocol.toUpperCase()})`,
                  );
                } else {
                  setTestError(response.error || "Прокси не отвечает или вернул ошибку.");
                  setTestMessage(null);
                  onLog?.(
                    `Тест прокси (Сеть) для ${account.email}: ошибка: ${response.error || "прокси не отвечает"}`,
                  );
                }
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                setTestError(message || "Ошибка при проверке прокси.");
                setTestMessage(null);
                onLog?.(
                  `Тест прокси (Сеть) для ${account.email}: исключение: ${message || "неизвестная ошибка"}`,
                );
              } finally {
                setIsTesting(false);
              }
            }}
            disabled={isTesting || !address.trim()}
          >
            <i className="fas fa-plug" /> {isTesting ? "Проверка..." : "Тестировать прокси"}
          </button>

          {testMessage && (
            <p className="action-hint" style={{ color: "#059669", marginTop: 8 }}>
              <i className="fas fa-check-circle" /> {testMessage}
            </p>
          )}

          {testError && (
            <p className="action-hint" style={{ color: "#b91c1c", marginTop: 8 }}>
              <i className="fas fa-exclamation-circle" /> {testError}
            </p>
          )}
        <small style={{ color: "#6b7280" }}>

          Изменения будут применены после кнопки «Сохранить настройки аккаунта».

        </small>

      </div>

    </div>

  );
}


function formatRelativeTimestamp(value: number | null | undefined): string {
  if (!value || value <= 0) {
    return "—";
  }
  const timestamp = value > 1e12 ? value : value * 1000;
  const date = new Date(timestamp);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) {
    return "только что";
  }
  if (diff < 3_600_000) {
    return `${Math.floor(diff / 60_000)} мин назад`;
  }
  if (diff < 86_400_000) {
    return `${Math.floor(diff / 3_600_000)} ч назад`;
  }
  return date.toLocaleDateString("ru-RU");
}

function extractProxyAddress(proxyValue: string | undefined): string {

  if (!proxyValue) {

    return "";

  }

  const withoutScheme = proxyValue.replace(/^\w+:\/\//, "");

  const parts = withoutScheme.split("@");

  return parts.length === 2 ? parts[1] : withoutScheme;

}



function composeProxyValue(

  address: string,

  protocol: Account["proxyType"],

  username: string,

  password: string,

): string {

  const normalized = address.replace(/^\w+:\/\//, "");

  if (!normalized) {

    return "";

  }

  if (username || password) {

    const safeUser = username || "";

    const safePass = password || "";

    return `${protocol}://${safeUser}:${safePass}@${normalized}`;

  }

  return `${protocol}://${normalized}`;

}



interface FingerprintTabProps {
  account: Account;
  onUpdateDraft?: UpdateDraftFn;
}

function FingerprintTab({ account, onUpdateDraft }: FingerprintTabProps) {
  const presetMap: Record<GeoPreset, AntidetectConfig> = {
    usa: {
      geo: "usa",
      timezone: "America/New_York",
      locale: "en-US",
    languages: ["en-US", "en"],
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    userAgentRandom: true,
    userAgentPool: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    ],
    geolocation: { latitude: 40.7128, longitude: -74.006, accuracy: 100, jitter: 0.01 },
    screen: {
      width: 1920,
      height: 1080,
      dpr: 1.0,
      options: [
        { width: 1920, height: 1080, dpr: 1.0 },
        { width: 1366, height: 768, dpr: 1.0 },
        { width: 1440, height: 900, dpr: 1.25 },
      ],
    },
    hardware: {
      cores: 8,
      memory: 8,
      platform: "Windows",
      deviceName: "Windows 11",
      coresOptions: [4, 6, 8],
      memoryOptions: [4, 8, 16],
      webglProfiles: [
        { vendor: "Intel Inc.", renderer: "Intel(R) UHD Graphics 620" },
        { vendor: "Intel Inc.", renderer: "Intel(R) Iris(R) Xe Graphics" },
        { vendor: "AMD", renderer: "Radeon RX 6600" },
      ],
    },
      webrtc: "replace_ip",
      canvasNoise: "light",
      webglNoise: true,
      audioNoise: true,
      fontsSpoofing: true,
      dnt: false,
      dohEnabled: true,
    },
    russia: {
      geo: "russia",
      timezone: "Europe/Moscow",
    locale: "ru-RU",
    languages: ["ru-RU", "ru", "en-US", "en"],
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    userAgentRandom: true,
    userAgentPool: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    ],
    geolocation: { latitude: 55.7558, longitude: 37.6173, accuracy: 100, jitter: 0.01 },
    screen: {
      width: 1920,
      height: 1080,
      dpr: 1.0,
      options: [
        { width: 1920, height: 1080, dpr: 1.0 },
        { width: 1600, height: 900, dpr: 1.25 },
        { width: 1366, height: 768, dpr: 1.0 },
      ],
    },
    hardware: {
      cores: 8,
      memory: 8,
      platform: "Windows",
      deviceName: "Windows 11",
      coresOptions: [4, 6, 8],
      memoryOptions: [4, 8],
      webglProfiles: [
        { vendor: "Intel Inc.", renderer: "Intel(R) HD Graphics 630" },
        { vendor: "Intel Inc.", renderer: "Intel(R) Iris(R) Graphics 6100" },
      ],
    },
      webrtc: "disable",
      canvasNoise: "medium",
      webglNoise: true,
      audioNoise: false,
      fontsSpoofing: true,
      dnt: false,
      dohEnabled: true,
    },
    kazakhstan: {
      geo: "kazakhstan",
      timezone: "Asia/Almaty",
    locale: "ru-KZ",
    languages: ["ru-KZ", "ru", "en-US", "en"],
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    userAgentRandom: true,
    userAgentPool: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    ],
    geolocation: { latitude: 51.1694, longitude: 71.4491, accuracy: 100, jitter: 0.01 },
    screen: {
      width: 1920,
      height: 1080,
      dpr: 1.0,
      options: [
        { width: 1920, height: 1080, dpr: 1.0 },
        { width: 1366, height: 768, dpr: 1.0 },
      ],
    },
    hardware: {
      cores: 6,
      memory: 8,
      platform: "Windows",
      deviceName: "Windows 10",
      coresOptions: [4, 6],
      memoryOptions: [4, 8],
      webglProfiles: [
        { vendor: "Intel Inc.", renderer: "Intel(R) UHD Graphics 610" },
      ],
    },
      webrtc: "disable",
      canvasNoise: "light",
      webglNoise: false,
      audioNoise: false,
      fontsSpoofing: true,
      dnt: false,
      dohEnabled: true,
    },
    nigeria: {
      geo: "nigeria",
      timezone: "Africa/Lagos",
    locale: "en-NG",
    languages: ["en-NG", "en"],
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    userAgentRandom: true,
    userAgentPool: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    ],
    geolocation: { latitude: 6.5244, longitude: 3.3792, accuracy: 150, jitter: 0.01 },
    screen: {
      width: 1366,
      height: 768,
      dpr: 1.0,
      options: [
        { width: 1366, height: 768, dpr: 1.0 },
        { width: 1920, height: 1080, dpr: 1.0 },
      ],
    },
    hardware: {
      cores: 6,
      memory: 8,
      platform: "Windows",
      deviceName: "Windows 10",
      coresOptions: [4, 6],
      memoryOptions: [4, 8],
      webglProfiles: [
        { vendor: "Intel Inc.", renderer: "Intel(R) UHD Graphics 620" },
        { vendor: "AMD", renderer: "Radeon RX 570" },
      ],
    },
      webrtc: "replace_ip",
      canvasNoise: "medium",
      webglNoise: true,
      audioNoise: false,
      fontsSpoofing: true,
      dnt: false,
      dohEnabled: true,
    },
    lithuania: {
      geo: "lithuania",
      timezone: "Europe/Vilnius",
    locale: "lt-LT",
    languages: ["lt-LT", "lt", "en-US", "en"],
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    userAgentRandom: true,
    userAgentPool: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    ],
    geolocation: { latitude: 54.6872, longitude: 25.2797, accuracy: 100, jitter: 0.01 },
    screen: {
      width: 1920,
      height: 1080,
      dpr: 1.0,
      options: [
        { width: 1920, height: 1080, dpr: 1.0 },
        { width: 1366, height: 768, dpr: 1.0 },
      ],
    },
    hardware: {
      cores: 8,
      memory: 16,
      platform: "Windows",
      deviceName: "Windows 11",
      coresOptions: [6, 8],
      memoryOptions: [8, 16],
      webglProfiles: [
        { vendor: "Intel Inc.", renderer: "Intel(R) UHD Graphics 630" },
        { vendor: "AMD", renderer: "Radeon RX 5700" },
      ],
    },
      webrtc: "replace_ip",
      canvasNoise: "light",
      webglNoise: true,
      audioNoise: true,
      fontsSpoofing: true,
      dnt: false,
      dohEnabled: true,
    },
    custom: {
      geo: "custom",
      timezone: "UTC",
      locale: "en-US",
    languages: ["en-US", "en"],
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    userAgentRandom: true,
    userAgentPool: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    ],
    geolocation: { latitude: 0, longitude: 0, accuracy: 100, jitter: 0.01 },
    screen: {
      width: 1920,
      height: 1080,
      dpr: 1.0,
      options: [
        { width: 1920, height: 1080, dpr: 1.0 },
        { width: 1366, height: 768, dpr: 1.0 },
      ],
    },
    hardware: {
      cores: 4,
      memory: 8,
      platform: "Windows",
      deviceName: "Desktop",
      coresOptions: [4, 6],
      memoryOptions: [8, 16],
      webglProfiles: [
        { vendor: "Intel Inc.", renderer: "Intel(R) UHD Graphics 620" },
      ],
    },
      webrtc: "replace_ip",
      canvasNoise: "light",
      webglNoise: true,
      audioNoise: false,
      fontsSpoofing: true,
      dnt: false,
      dohEnabled: true,
    },
  };

  const randomChoice = <T,>(items: T[] | undefined): T | undefined => {
    if (!items || !items.length) return undefined;
    return items[Math.floor(Math.random() * items.length)];
  };

  const normalizeConfig = (cfg: Partial<AntidetectConfig> | undefined, preset: GeoPreset) => {
    const base = presetMap[preset] ?? presetMap.russia;
    if (!cfg) return base;
    const merge = (value: any, fallback: any) => (value === undefined ? fallback : value);
    return {
      ...base,
      ...cfg,
      geo: cfg.geo ?? preset,
      geolocation: { ...base.geolocation, ...(cfg.geolocation ?? {}) },
      screen: { ...base.screen, ...(cfg.screen ?? {}) },
      hardware: {
        ...base.hardware,
        ...(cfg.hardware ?? {}),
        platform: (cfg.hardware?.platform as PlatformPreset) ?? base.hardware.platform,
        deviceName: cfg.hardware?.deviceName ?? base.hardware.deviceName,
        coresOptions: cfg.hardware?.coresOptions ?? base.hardware.coresOptions,
        memoryOptions: cfg.hardware?.memoryOptions ?? base.hardware.memoryOptions,
        webglProfiles: cfg.hardware?.webglProfiles ?? base.hardware.webglProfiles,
      },
      webrtc: cfg.webrtc ?? base.webrtc,
      canvasNoise: cfg.canvasNoise ?? base.canvasNoise,
      webglNoise: merge(cfg.webglNoise, base.webglNoise),
      audioNoise: merge(cfg.audioNoise, base.audioNoise),
      fontsSpoofing: merge(cfg.fontsSpoofing, base.fontsSpoofing),
      dnt: merge(cfg.dnt, base.dnt),
      dohEnabled: merge(cfg.dohEnabled, base.dohEnabled),
      userAgentPool: cfg.userAgentPool ?? base.userAgentPool,
      userAgentRandom: cfg.userAgentRandom ?? base.userAgentRandom,
      clientHints: cfg.clientHints ?? base.clientHints,
    };
  };

  const applyRandom = (preset: GeoPreset): AntidetectConfig => {
    const base = presetMap[preset] ?? presetMap.russia;
    const jitter = base.geolocation.jitter ?? 0;
    const pickScreen = randomChoice(base.screen.options) ?? base.screen;
    const pickUA = base.userAgentRandom ? randomChoice(base.userAgentPool) ?? base.userAgent : base.userAgent;
    const pickCores = base.hardware.coresOptions ? randomChoice(base.hardware.coresOptions) ?? base.hardware.cores : base.hardware.cores;
    const pickMem = base.hardware.memoryOptions ? randomChoice(base.hardware.memoryOptions) ?? base.hardware.memory : base.hardware.memory;
    const pickWebgl = base.hardware.webglProfiles ? randomChoice(base.hardware.webglProfiles) : undefined;
    const jitteredGeo = {
      latitude: base.geolocation.latitude + (Math.random() * 2 - 1) * jitter,
      longitude: base.geolocation.longitude + (Math.random() * 2 - 1) * jitter,
      accuracy: base.geolocation.accuracy,
      jitter,
    };
    return {
      ...base,
      geolocation: jitter ? jitteredGeo : base.geolocation,
      screen: { ...base.screen, ...pickScreen },
      hardware: {
        ...base.hardware,
        cores: pickCores,
        memory: pickMem,
        webglProfiles: base.hardware.webglProfiles,
      },
      userAgent: pickUA,
      webglProfile: pickWebgl,
    };
  };

  const toGeoPreset = (fp: string | undefined): GeoPreset => {
    if (!fp) return "russia";
    const normalized = fp.toLowerCase();
    if (normalized.includes("usa")) return "usa";
    if (normalized.includes("kz") || normalized.includes("kazakhstan")) return "kazakhstan";
    if (normalized.includes("nigeria") || normalized.includes("ng")) return "nigeria";
    if (normalized.includes("lithuania") || normalized.includes("lt")) return "lithuania";
    if (normalized.includes("russia")) return "russia";
    return "russia";
  };

  const fingerprintToPreset = toGeoPreset(account.fingerprint as string | undefined);
  const [preset, setPreset] = useState<GeoPreset>(account.antidetect?.geo ?? fingerprintToPreset);
  const [config, setConfig] = useState<AntidetectConfig>(
    normalizeConfig(account.antidetect, account.antidetect?.geo ?? fingerprintToPreset),
  );

  const updateDraft = (nextConfig: AntidetectConfig, nextPreset: GeoPreset) => {
    const fingerprintValue =
      nextPreset === "usa"
        ? "usa_standard"
        : nextPreset === "kazakhstan"
          ? "kazakhstan_standard"
          : nextPreset === "russia"
            ? "russia_standard"
            : (nextPreset as Account["fingerprint"]);
    onUpdateDraft?.({
      fingerprint: fingerprintValue,
      antidetect: nextConfig,
    });
  };

  useEffect(() => {
    const freshPreset = account.antidetect?.geo ?? toGeoPreset(account.fingerprint as string | undefined);
    setPreset(freshPreset);
    setConfig(normalizeConfig(account.antidetect, freshPreset));
  }, [account.id, account.fingerprint]);

  return (
    <div className="tab-content active">
      <div className="form-group">
        <label>Антидетект-пресет</label>
        <select value={preset} onChange={(e) => {
          const nextPreset = e.target.value as GeoPreset;
          setPreset(nextPreset);
          const nextConfig = normalizeConfig(nextPreset === config.geo ? config : undefined, nextPreset);
          setConfig(nextConfig);
          updateDraft(nextConfig, nextPreset);
        }}>
          <option value="usa">🇺🇸 USA</option>
          <option value="russia">🇷🇺 Россия</option>
          <option value="kazakhstan">🇰🇿 Казахстан</option>
          <option value="nigeria">🇳🇬 Нигерия</option>
          <option value="lithuania">🇱🇹 Литва</option>
          <option value="custom">🔧 Custom</option>
        </select>
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => {
              const randomized = applyRandom(preset);
              setConfig(randomized);
              updateDraft(randomized, preset);
            }}
          >
            🎲 Сгенерировать случайный
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="form-group">
          <label>WebRTC</label>
          <select
            value={config.webrtc}
            onChange={(e) => {
              const next = { ...config, webrtc: e.target.value as WebRTCMode };
              setConfig(next);
              updateDraft(next, preset);
            }}
          >
            <option value="disable">Disable</option>
            <option value="replace_ip">Replace IP</option>
            <option value="sync_with_proxy">Sync with Proxy</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div className="form-group">
          <label>Canvas Noise</label>
          <select
            value={config.canvasNoise}
            onChange={(e) => {
              const next = { ...config, canvasNoise: e.target.value as CanvasNoise };
              setConfig(next);
              updateDraft(next, preset);
            }}
          >
            <option value="off">Off</option>
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.webglNoise}
            onChange={(e) => {
              const next = { ...config, webglNoise: e.target.checked };
              setConfig(next);
              updateDraft(next, preset);
            }}
          />
          <span className="checkmark" /> WebGL Spoofing
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.audioNoise}
            onChange={(e) => {
              const next = { ...config, audioNoise: e.target.checked };
              setConfig(next);
              updateDraft(next, preset);
            }}
          />
          <span className="checkmark" /> Audio Noise
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.fontsSpoofing}
            onChange={(e) => {
              const next = { ...config, fontsSpoofing: e.target.checked };
              setConfig(next);
              updateDraft(next, preset);
            }}
          />
          <span className="checkmark" /> Fonts Spoofing
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.dohEnabled}
            onChange={(e) => {
              const next = { ...config, dohEnabled: e.target.checked };
              setConfig(next);
              updateDraft(next, preset);
            }}
          />
          <span className="checkmark" /> DoH через прокси
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.dnt}
            onChange={(e) => {
              const next = { ...config, dnt: e.target.checked };
              setConfig(next);
              updateDraft(next, preset);
            }}
          />
          <span className="checkmark" /> DNT Header
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="form-group">
          <label>Экран</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input
              type="number"
              value={config.screen.width}
              onChange={(e) => {
                const next = {
                  ...config,
                  screen: { ...config.screen, width: Number(e.target.value) || 0 },
                };
                setConfig(next);
                updateDraft(next, preset);
              }}
              placeholder="1920"
            />
            <input
              type="number"
              value={config.screen.height}
              onChange={(e) => {
                const next = {
                  ...config,
                  screen: { ...config.screen, height: Number(e.target.value) || 0 },
                };
                setConfig(next);
                updateDraft(next, preset);
              }}
              placeholder="1080"
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <label>DPR</label>
            <select
              value={config.screen.dpr}
              onChange={(e) => {
                const next = {
                  ...config,
                  screen: { ...config.screen, dpr: Number(e.target.value) || 1 },
                };
                setConfig(next);
                updateDraft(next, preset);
              }}
            >
              <option value={1}>1.0</option>
              <option value={1.25}>1.25</option>
              <option value={1.5}>1.5</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Железо</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <select
              value={config.hardware.cores}
              onChange={(e) => {
                const next = {
                  ...config,
                  hardware: { ...config.hardware, cores: Number(e.target.value) || config.hardware.cores },
                };
                setConfig(next);
                updateDraft(next, preset);
              }}
            >
              <option value={4}>4 cores</option>
              <option value={6}>6 cores</option>
              <option value={8}>8 cores</option>
            </select>
            <select
              value={config.hardware.memory}
              onChange={(e) => {
                const next = {
                  ...config,
                  hardware: { ...config.hardware, memory: Number(e.target.value) || config.hardware.memory },
                };
                setConfig(next);
                updateDraft(next, preset);
              }}
            >
              <option value={4}>4 GB</option>
              <option value={8}>8 GB</option>
              <option value={16}>16 GB</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            <select
              value={config.hardware.platform}
              onChange={(e) => {
                const next = {
                  ...config,
                  hardware: { ...config.hardware, platform: e.target.value as PlatformPreset },
                };
                setConfig(next);
                updateDraft(next, preset);
              }}
            >
              <option value="Windows">Windows</option>
              <option value="MacOS">MacOS</option>
              <option value="Linux">Linux</option>
            </select>
            <input
              type="text"
              value={config.hardware.deviceName}
              onChange={(e) => {
                const next = {
                  ...config,
                  hardware: { ...config.hardware, deviceName: e.target.value },
                };
                setConfig(next);
                updateDraft(next, preset);
              }}
              placeholder="Device name"
            />
          </div>
        </div>
      </div>

      <div className="info-section">
        <div className="info-item">
          <span className="info-label">User-Agent:</span>
          <span className="info-value">{config.userAgent}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Locale/Timezone:</span>
          <span className="info-value">
            {config.locale} · {config.timezone}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Accept-Language:</span>
          <span className="info-value">{config.languages.join(", ")}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Гео:</span>
          <span className="info-value">
            {config.geolocation.latitude}, {config.geolocation.longitude} (±
            {config.geolocation.accuracy}м)
          </span>
        </div>
      </div>

      <div className="form-group">
        <label>Геолокация (ручная настройка)</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input
            type="number"
            step="0.0001"
            value={config.geolocation.latitude}
            onChange={(e) => {
              const next = {
                ...config,
                geolocation: {
                  ...config.geolocation,
                  latitude: Number(e.target.value) || 0,
                },
              };
              setConfig(next);
              updateDraft(next, preset);
            }}
            placeholder="Latitude"
          />
          <input
            type="number"
            step="0.0001"
            value={config.geolocation.longitude}
            onChange={(e) => {
              const next = {
                ...config,
                geolocation: {
                  ...config.geolocation,
                  longitude: Number(e.target.value) || 0,
                },
              };
              setConfig(next);
              updateDraft(next, preset);
            }}
            placeholder="Longitude"
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <input
            type="number"
            value={config.geolocation.accuracy}
            onChange={(e) => {
              const next = {
                ...config,
                geolocation: {
                  ...config.geolocation,
                  accuracy: Number(e.target.value) || 0,
                },
              };
              setConfig(next);
              updateDraft(next, preset);
            }}
            placeholder="Accuracy (м)"
          />
        </div>
      </div>

      <div className="form-group">
        <small style={{ color: "#6b7280" }}>
          Настройки применяются при следующем запуске браузера или мультипарсера под этим аккаунтом.
        </small>
      </div>
    </div>
  );
}



interface BasicTabProps {

  account: Account;

  onUpdateDraft?: UpdateDraftFn;

}



function BasicTab({ account, onUpdateDraft }: BasicTabProps) {

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cookiesMessage, setCookiesMessage] = useState<string | null>(null);

  const [cookiesError, setCookiesError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [isOpening, setIsOpening] = useState(false);

  const [isEnsuringProfile, setIsEnsuringProfile] = useState(false);

  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [profileError, setProfileError] = useState<string | null>(null);



  useEffect(() => {

    setCookiesMessage(null);

    setCookiesError(null);

    setProfileMessage(null);

    setProfileError(null);

  }, [account.id]);



  const handleChange =

    (field: "email" | "password" | "secretAnswer" | "profilePath") =>

    (event: ChangeEvent<HTMLInputElement>) => {

      const { value } = event.target;

      onUpdateDraft?.({ [field]: value } as Partial<Account>);

    };



  const handleOpenProfile = async () => {

    setIsOpening(true);

    setCookiesError(null);

    setProfileError(null);

    try {

      const response = await openAccountProfileDirectory(account.id);

      setProfileMessage(`Открыта папка: ${response.path}`);

    } catch (error) {

      const message = error instanceof Error ? error.message : String(error);

      setProfileError(message);

    } finally {

      setIsOpening(false);

    }

  };



  const handleEnsureProfileDir = async () => {

    setIsEnsuringProfile(true);

    setProfileMessage(null);

    setProfileError(null);

    try {

      const response = await ensureAccountProfileDirectory(account.id);

      setProfileMessage(`Папка профиля сохранена: ${response.path}`);

    } catch (error) {

      const message = error instanceof Error ? error.message : String(error);

      setProfileError(message);

    } finally {

      setIsEnsuringProfile(false);

    }

  };



  const handleClearProfile = () => {

    onUpdateDraft?.({ profilePath: "" });

    setProfileMessage("Путь профиля очищен");

    setProfileError(null);

  };



  const handleUploadClick = () => {

    fileInputRef.current?.click();

  };



  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0];

    if (!file) {

      return;

    }

    setIsUploading(true);

    setCookiesMessage(null);

    setCookiesError(null);

    try {

      const response = await uploadAccountCookies(account.id, file);

      setCookiesMessage(`Файл сохранен: ${response.path}`);

    } catch (error) {

      const message = error instanceof Error ? error.message : String(error);

      setCookiesError(message);

    } finally {

      setIsUploading(false);

      event.target.value = "";

    }

  };



  const handleDeleteCookies = async () => {

    setIsDeleting(true);

    setCookiesMessage(null);

    setCookiesError(null);

    try {

      const response = await deleteAccountCookies(account.id);

      setCookiesMessage(`Файлы cookies удалены из ${response.path}`);

    } catch (error) {

      const message = error instanceof Error ? error.message : String(error);

      setCookiesError(message);

    } finally {

      setIsDeleting(false);

    }

  };



  const cookiesPath =

    account.profilePath && account.profilePath.trim().length

      ? `${account.profilePath.replace(/\\\\/g, "\\")}\\storage_state.json`

      : "—";



  return (

    <div className="tab-content active">

      <div className="form-group">

        <label>Email</label>

        <input

          type="email"

          value={account.email}

          onChange={handleChange("email")}

          placeholder="login@yandex.ru"

        />

      </div>

      <div className="form-group">

        <label>Пароль</label>

        <div className="password-field">

          <input

            type="password"

            value={account.password}

            onChange={handleChange("password")}

            placeholder="••••••••"

          />

        </div>

      </div>

      <div className="form-group">

        <label>Секретный вопрос</label>

        <input

          type="text"

          value={account.secretAnswer}

          onChange={handleChange("secretAnswer")}

          placeholder="Ответ на секретный вопрос"

        />

      </div>

      <div className="form-group">

        <label>Профиль Chrome</label>

        <div className="path-field">

          <input

            type="text"

            value={account.profilePath}

            onChange={handleChange("profilePath")}

            placeholder="C:/AI/yandex/.profiles/..."

          />

          <div className="path-actions">

            <button

              type="button"

              className="btn btn-secondary btn-path btn-icon"

              onClick={handleOpenProfile}

              disabled={isOpening}

              aria-label="Открыть профиль"

              title="Открыть профиль"

            >

              <i className="fas fa-folder-open" />

            </button>

            <button

              type="button"

              className="btn btn-secondary btn-path btn-icon"

              onClick={handleEnsureProfileDir}

              disabled={isEnsuringProfile}

              aria-label="Создать профиль"

              title="Создать профиль"

            >

              <i className={`fas ${isEnsuringProfile ? "fa-spinner fa-spin" : "fa-save"}`} />

            </button>

            <button

              type="button"

              className="btn btn-danger btn-path btn-icon"

              onClick={handleClearProfile}

              aria-label="Очистить профиль"

              title="Очистить профиль"

            >

              <i className="fas fa-trash-alt" />

            </button>

          </div>

        </div>

        {profileMessage && (

          <p className="action-hint" style={{ color: "#059669" }}>

            <i className="fas fa-info-circle" /> {profileMessage}

          </p>

        )}

        {profileError && (

          <p className="action-hint" style={{ color: "#b91c1c" }}>

            <i className="fas fa-exclamation-circle" /> {profileError}

          </p>

        )}

      </div>
      <div className="form-group">
        <label>Файл cookies</label>
        <div className="path-field">
          <input
            type="text"

            readOnly

            value={cookiesPath}

            placeholder="Файл cookies появится после автологина или загрузки"

          />

          <div className="path-actions">

            <button

              type="button"

              className="btn btn-secondary btn-path btn-icon"

              onClick={handleOpenProfile}

              disabled={isOpening}

              aria-label="Открыть папку cookies"

              title="Открыть папку cookies"

            >

              <i className="fas fa-folder-open" />

            </button>

            <button

              type="button"

              className="btn btn-secondary btn-path btn-icon"

              onClick={handleUploadClick}

              disabled={isUploading}

              aria-label="Загрузить cookies"

              title="Загрузить cookies"

            >

              <i className={`fas ${isUploading ? "fa-spinner fa-spin" : "fa-save"}`} />

            </button>

            <button

              type="button"

              className="btn btn-danger btn-path btn-icon"

              onClick={handleDeleteCookies}

              disabled={isDeleting}

              aria-label="Удалить cookies"

              title="Удалить cookies"

            >

              <i className="fas fa-trash-alt" />

            </button>

          </div>

          <input

            ref={fileInputRef}

            type="file"

            accept=".json,.txt"

            style={{ display: "none" }}

            onChange={handleFileChange}

          />

        </div>

        {cookiesMessage && (

          <p className="action-hint" style={{ color: "#059669" }}>

            <i className="fas fa-info-circle" /> {cookiesMessage}

          </p>

        )}

        {cookiesError && (
          <p className="action-hint" style={{ color: "#b91c1c" }}>
            <i className="fas fa-exclamation-circle" /> {cookiesError}
          </p>
        )}
      </div>
      <div className="info-section compact">
        <div className="info-item">
          <span className="info-label">Статус cookies:</span>
          <span className="info-value">{account.cookiesStatus || "—"}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Статус авторизации:</span>
          <span className="info-value">{account.authStatus || "Неизвестно"}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Последний вход:</span>
          <span className="info-value">{account.lastLogin || "Никогда"}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Размер профиля:</span>
          <span className="info-value">{account.profileSize || "0 МБ"}</span>
        </div>
      </div>

      <ProfileSlotsSection
        accountId={account.id}
        profilePath={account.profilePath}
      />
    </div>
  );
}

interface CaptchaTabProps {
  account: Account;
  onUpdateDraft?: UpdateDraftFn;
}

function CaptchaTab({ account, onUpdateDraft }: CaptchaTabProps) {
  const [service, setService] = useState(account.captchaService || "none");
  const [apiKey, setApiKey] = useState("");
  const [autoSolve, setAutoSolve] = useState(
    account.captchaAutoSolve ?? false,
  );

  useEffect(() => {
    setService(account.captchaService || "none");
    setAutoSolve(account.captchaAutoSolve ?? false);
    setApiKey("");
  }, [account.id, account.captchaService, account.captchaAutoSolve]);

  const handleServiceChange = (value: string) => {
    setService(value);
    onUpdateDraft?.({ captchaService: value });
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    onUpdateDraft?.({} as Partial<Account>);
  };

  const handleAutoSolveChange = (checked: boolean) => {
    setAutoSolve(checked);
    onUpdateDraft?.({ captchaAutoSolve: checked });
  };

  return (
    <div className="tab-content active">
      <div className="form-group">
        <label>Сервис</label>
        <select
          value={service}
          onChange={(e) => handleServiceChange(e.target.value)}
        >
          <option value="none">Отключено</option>
          <option value="rucaptcha">RuCaptcha</option>
          <option value="2captcha">2Captcha</option>
          <option value="anticaptcha">AntiCaptcha</option>
        </select>
      </div>

      <div className="form-group">
        <label>API ключ</label>
        <div className="password-field">
          <input
            type="password"
            placeholder="API ключ сервиса капчи"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
          />
          <button type="button" className="password-toggle" disabled>
            <i className="fas fa-eye" />
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={autoSolve}
            onChange={(e) => handleAutoSolveChange(e.target.checked)}
          />
          <span className="checkmark" />
          Автоматически решать капчу
        </label>
      </div>

      <div className="captcha-info">
        <div className="info-item">
          <span className="info-label">Баланс:</span>
          <span className="info-value">—</span>
        </div>
        <div className="info-item">
          <span className="info-label">Статус:</span>
          <span className="info-value">
            {service === "none" ? "Отключено" : "Будет использоваться при парсинге"}
          </span>
        </div>
      </div>
    </div>
  );
}
