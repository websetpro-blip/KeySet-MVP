import { useEffect, useState, ChangeEvent, useRef, useMemo } from "react";
import type { MouseEvent } from "react";

import type { Account } from "../types";

import {
  autologinAccount,
  deleteAccountCookies,
  ensureAccountProfileDirectory,
  openAccountProfileDirectory,
  uploadAccountCookies,
  testProxy,
  fetchProxies,
  assignProxyToAccount,
  parseProxies,
  testAllProxies,
  clearProxies,
} from "../api";
import type { ProxyItem } from "../api";



const TABS = [


  { id: "basic", label: "Основное", icon: "fas fa-info-circle" },


  { id: "network", label: "Сеть", icon: "fas fa-globe" },


  { id: "fingerprint", label: "Fingerprint", icon: "fas fa-mask" },


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
}

export function AccountSidebar({
  account,
  onClose,
  onUpdateAccount,
  onReloadAccounts,
  onLog,
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
            {renderTabContent(activeTab, draft, handleDraftChange, onReloadAccounts, onLog)}
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
  onReloadAccounts?: () => Promise<void> | void,
  onLog?: (message: string) => void,
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

interface ProxyManagerSectionProps {
  account: Account;
  onReloadAccounts?: () => Promise<void> | void;
  onLog?: (message: string) => void;
}

type ProxyEditorMode = "create" | "edit";

interface ProxyFormState {
  id?: string;
  label: string;
  server: string;
  username: string;
  password: string;
  type: ProxyItem["type"];
  geo: string;
  sticky: boolean;
  maxConcurrent: number;
  enabled: boolean;
  notes: string;
}

const emptyProxyForm: ProxyFormState = {
  id: undefined,
  label: "",
  server: "",
  username: "",
  password: "",
  type: "http",
  geo: "",
  sticky: true,
  maxConcurrent: 10,
  enabled: true,
  notes: "",
};

function ProxyManagerSection({
  account,
  onReloadAccounts,
  onLog,
}: ProxyManagerSectionProps) {
  const [proxies, setProxies] = useState<ProxyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [strategy, setStrategy] = useState<Account["proxyStrategy"]>(account.proxyStrategy || "fixed");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [protocolFilter, setProtocolFilter] = useState<Account["proxyType"]>("http");
  const [countryFilter, setCountryFilter] = useState<string>("ru");
  const [sourceFlags, setSourceFlags] = useState<Record<string, boolean>>({
    fineproxy: true,
    proxyelite: false,
    htmlweb: false,
    advanced: false,
    market: false,
  });

  const firstSelectedId = useMemo(() => Array.from(selectedIds)[0] ?? null, [selectedIds]);
  const selectedProxy = useMemo(
    () => proxies.find((item) => item.id === firstSelectedId) ?? null,
    [proxies, firstSelectedId],
  );

  const loadProxies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchProxies();
      const items = response.items ?? [];
      setProxies(items);
      setSelectedIds((prev) => {
        const next = new Set<string>();
        items.forEach((proxy) => {
          if (prev.has(proxy.id)) {
            next.add(proxy.id);
          }
        });
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Не удалось загрузить список прокси.");
      setProxies([]);
      onLog?.(`Ошибка загрузки списка прокси: ${message || "неизвестная ошибка"}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProxies();
  }, [account.id]);

  useEffect(() => {
    setStrategy(account.proxyStrategy || "fixed");
  }, [account.id, account.proxyStrategy]);

  const toggleSource = (id: string) => {
    setSourceFlags((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartParsing = async () => {
    const sources = Object.entries(sourceFlags)
      .filter(([_, checked]) => checked)
      .map(([id]) => id);
    if (!sources.length) {
      setParseMessage("Выберите хотя бы один источник.");
      return;
    }

    setIsParsing(true);
    setParseMessage(null);
    try {
      const result = await parseProxies({
        sources,
        protocol: protocolFilter,
        country: countryFilter,
        count: 40,
      });
      setParseMessage(`Добавлено ${result.added} прокси (всего найдено ${result.found}).`);
      onLog?.(`Парсинг прокси: ${sources.join(", ")} → +${result.added}`);
      await loadProxies();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setParseMessage(message || "Ошибка парсинга");
      onLog?.(`Ошибка парсинга прокси: ${message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleTestAllProxies = async () => {
    setBulkError(null);
    setBulkMessage(null);
    try {
      const payload = selectedIds.size ? { ids: Array.from(selectedIds) } : undefined;
      const result = await testAllProxies(payload?.ids);
      setBulkMessage(`Проверено ${result.tested}: рабочие ${result.ok}, нерабочие ${result.failed}.`);
      onLog?.(`Тест прокси: ${result.ok}/${result.tested} успешно.`);
      await loadProxies();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setBulkError(message || "Ошибка тестирования");
      onLog?.(`Ошибка массового теста прокси: ${message || "неизвестная ошибка"}`);
    }
  };

  const handleClearProxies = async () => {
    const ids = selectedIds.size ? Array.from(selectedIds) : undefined;
    if (!window.confirm(ids ? "Удалить выбранные прокси?" : "Удалить все прокси?")) {
      return;
    }
    setBulkError(null);
    setBulkMessage(null);
    try {
      const result = await clearProxies(ids);
      setBulkMessage(`Удалено ${result.removed} прокси.`);
      setSelectedIds(new Set());
      await loadProxies();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setBulkError(message || "Не удалось очистить список");
      onLog?.(`Ошибка очистки списка прокси: ${message || "неизвестная ошибка"}`);
    }
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === proxies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(proxies.map((proxy) => proxy.id)));
    }
  };

  const handleTestSelected = async () => {
    if (!selectedProxy) {
      setTestError("Выберите прокси в таблице.");
      setTestMessage(null);
      return;
    }
    const [scheme, hostPort] = selectedProxy.server.split("://");
    const [host, portStr] = hostPort.split(":");
    const port = Number(portStr);
    setIsTesting(true);
    setTestError(null);
    setTestMessage(null);
    try {
      const response = await testProxy(
        host,
        port,
        selectedProxy.username || undefined,
        selectedProxy.password || undefined,
        scheme,
      );
      if (response.status === "ok") {
        const info = [];
        if (typeof response.response_time_ms === "number") {
          info.push(`${Math.round(response.response_time_ms)} мс`);
        }
        if (response.ip) {
          info.push(`IP ${response.ip}`);
        }
        const details = info.length ? ` (${info.join(", ")})` : "";
        setTestMessage(`Прокси работает${details}.`);
        onLog?.(
          `Тест прокси (Менеджер) для ${account.email}: OK${details} (${selectedProxy.server})`,
        );
      } else {
        setTestError(response.error || "Прокси не отвечает.");
        onLog?.(
          `Тест прокси (Менеджер) для ${account.email}: ошибка: ${response.error || "прокси не отвечает"}`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTestError(message || "Ошибка проверки");
       onLog?.(
         `Тест прокси (Менеджер) для ${account.email}: исключение: ${message || "неизвестная ошибка"}`,
       );
    } finally {
      setIsTesting(false);
    }
  };

  const handleAssignToAccount = async () => {
    if (!selectedProxy) {
      setAssignError("Выберите прокси.");
      setAssignMessage(null);
      return;
    }
    setIsAssigning(true);
    setAssignError(null);
    setAssignMessage(null);
    try {
      await assignProxyToAccount(account.id, selectedProxy.id, strategy);
      setAssignMessage("Прокси применён к аккаунту.");
      onReloadAccounts && (await onReloadAccounts());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setAssignError(message || "Не удалось применить прокси.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePreviewProxy = () => {
    if (!selectedProxy) {
      setBulkError("Выберите прокси для предпросмотра.");
      return;
    }
    onLog?.(
      `Прокси ${selectedProxy.label || selectedProxy.server}: ${selectedProxy.server} (${selectedProxy.geo || "N/A"})`)
    ;
  };

  return (
    <>
      <div className="proxy-section">
        <h4>
          <i className="fas fa-download" /> Парсинг прокси
        </h4>
        <div className="proxy-sources">
          {[
            { id: "fineproxy", label: "fineproxy.org" },
            { id: "proxyelite", label: "proxyelite.info" },
            { id: "htmlweb", label: "htmlweb.ru" },
            { id: "advanced", label: "advanced.name" },
            { id: "market", label: "proxy.market" },
          ].map((source) => (
            <label key={source.id} className="checkbox-label">
              <input
                type="checkbox"
                checked={!!sourceFlags[source.id]}
                onChange={() => toggleSource(source.id)}
              />
              <span className="checkmark" />
              {source.label}
            </label>
          ))}
        </div>
        <div className="proxy-parse-options">
          <div className="form-group">
            <label>Протокол</label>
            <select value={protocolFilter} onChange={(e) => setProtocolFilter(e.target.value as Account["proxyType"]) }>
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks5">SOCKS5</option>
            </select>
          </div>
          <div className="form-group">
            <label>Страна</label>
            <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}>
              <option value="ru">Россия</option>
              <option value="kz">Казахстан</option>
              <option value="by">Беларусь</option>
              <option value="any">Любая</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" type="button" onClick={handleStartParsing} disabled={isParsing}>
          <i className="fas fa-play" /> {isParsing ? "Парсинг..." : "Начать парсинг"}
        </button>
        {parseMessage && (
          <p className="action-hint" style={{ marginTop: 8 }}>
            <i className="fas fa-info-circle" /> {parseMessage}
          </p>
        )}
      </div>

      <div className="proxy-section">
        <h4>
          <i className="fas fa-vial" /> Тестирование списка
        </h4>
        <div className="form-group">
          <label>Действия</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button className="btn btn-warning" type="button" onClick={handleTestAllProxies}>
              <i className="fas fa-flask" /> Тестировать {selectedIds.size ? "выбранные" : "все"}
            </button>
            <button className="btn btn-secondary" type="button" onClick={handleClearProxies}>
              <i className="fas fa-trash" /> Очистить {selectedIds.size ? "выбранные" : "все"}
            </button>
            <button className="btn btn-secondary" type="button" onClick={handlePreviewProxy}>
              <i className="fas fa-eye" /> Предпросмотр
            </button>
          </div>
        </div>
        {bulkMessage && (
          <p className="action-hint" style={{ color: "#059669" }}>
            <i className="fas fa-check-circle" /> {bulkMessage}
          </p>
        )}
        {bulkError && (
          <p className="action-hint" style={{ color: "#b91c1c" }}>
            <i className="fas fa-exclamation-circle" /> {bulkError}
          </p>
        )}
      </div>

      <div className="proxy-section">
        <h4>
          <i className="fas fa-sync-alt" /> Автоматическая ротация
        </h4>
        <div className="form-group">
          <label>Стратегия привязки аккаунтов</label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value as Account["proxyStrategy"]) }>
            <option value="fixed">Фиксированная (один аккаунт → один прокси)</option>
            <option value="rotate">Ротация (подбор свободного прокси)</option>
          </select>
        </div>
        <p className="action-hint">
          Стратегия «Ротация» использует свободные прокси из пула ProxyManager. Настройте макс. одновременные подключения в конфиге.
        </p>
      </div>

      <div className="proxy-section">
        <h4>
          <i className="fas fa-list" /> Список прокси
        </h4>
        <div className="proxy-table-container">
          <table className="proxy-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}>
                  <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === proxies.length}
                  />
                </th>
                <th>Название</th>
                <th>Адрес</th>
                <th>GEO</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5}>Загрузка списка прокси…</td>
                </tr>
              ) : proxies.length === 0 ? (
                <tr>
                  <td colSpan={5}>Прокси не найдены.</td>
                </tr>
              ) : (
                proxies.map((proxy) => (
                  <tr
                    key={proxy.id}
                    className={selectedIds.has(proxy.id) ? "selected" : undefined}
                    onClick={() => handleToggleSelection(proxy.id)}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(proxy.id)}
                        onChange={() => handleToggleSelection(proxy.id)}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{proxy.label}</div>
                      <div className="proxy-notes">{proxy.notes || "—"}</div>
                    </td>
                    <td>{proxy.server}</td>
                    <td>{proxy.geo || "—"}</td>
                    <td>
                      <div style={{ color: proxy.enabled ? "#059669" : "#9ca3af" }}>
                        {proxy.enabled ? "Активен" : "Отключен"}
                      </div>
                      <div className="proxy-meta">IP: {proxy.last_ip || "—"}</div>
                      <div className="proxy-meta">Проверка: {formatRelativeTimestamp(proxy.last_check)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={handleTestSelected}
            disabled={isTesting || !selectedProxy}
          >
            <i className="fas fa-plug" /> {isTesting ? "Проверка..." : "Тестировать выбранный"}
          </button>
          <button
            type="button"
            className="btn btn-success btn-small"
            onClick={handleAssignToAccount}
            disabled={isAssigning || !selectedProxy}
          >
            <i className="fas fa-check" /> {isAssigning ? "Применение..." : "Применить к аккаунту"}
          </button>
        </div>

        {(testMessage || testError || assignMessage || assignError) && (
          <div style={{ marginTop: 8 }}>
            {testMessage && (
              <p className="action-hint" style={{ color: "#059669" }}>
                <i className="fas fa-check-circle" /> {testMessage}
              </p>
            )}
            {testError && (
              <p className="action-hint" style={{ color: "#b91c1c" }}>
                <i className="fas fa-exclamation-circle" /> {testError}
              </p>
            )}
            {assignMessage && (
              <p className="action-hint" style={{ color: "#059669" }}>
                <i className="fas fa-check-circle" /> {assignMessage}
              </p>
            )}
            {assignError && (
              <p className="action-hint" style={{ color: "#b91c1c" }}>
                <i className="fas fa-exclamation-circle" /> {assignError}
              </p>
            )}
          </div>
        )}
      </div>
    </>
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
  const [preset, setPreset] = useState(account.fingerprint || "russia_standard");



  useEffect(() => {

    setPreset(account.fingerprint || "russia_standard");

  }, [account.id, account.fingerprint]);



  const handleChangePreset = (value: Account["fingerprint"]) => {

    setPreset(value);

    onUpdateDraft?.({ fingerprint: value });

  };



  return (

    <div className="tab-content active">

      <div className="form-group">

        <label>Предустановка</label>

        <select

            value={preset}

            onChange={(e) => handleChangePreset(e.target.value as Account["fingerprint"])}

        >

          <option value="russia_standard">🇷🇺 Россия (стандарт)</option>

          <option value="kazakhstan_standard">🇰🇿 Казахстан (стандарт)</option>

          <option value="no_spoofing">🌐 Без подмены</option>

        </select>

      </div>

        <div className="info-section">

          <div className="info-item">

            <span className="info-label">Описание пресета:</span>

            <span className="info-value">

              Управляет User-Agent, языком интерфейса и часовым поясом браузера для этого аккаунта.

            </span>

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
