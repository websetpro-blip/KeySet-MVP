import { useState, useEffect, useMemo } from "react";
import {
  RefreshCw,
  Link2,
  Trash2,
  ArrowRightLeft,
  Key as KeyIcon,
  Globe2,
  ShoppingBag,
  FlaskConical,
  Users,
} from "lucide-react";
import type { Account } from "../types";
import type { ProxyItem, Px6AccountResponse } from "../api";
import {
  testAllProxies,
  fetchProxies,
  assignProxyToAccount,
  px6CheckAccount,
  px6Sync,
  px6Prolong,
  px6Delete,
  px6Distribute,
  px6Buy,
  px6GetPrice,
  testProxy,
  createProxy,
} from "../api";

type UpdateDraftFn = (partial: Partial<Account>) => void;

type UpdateAccountFn = (id: number, changes: Partial<Account>) => Promise<void> | void;

interface ProxyManagerSectionProps {
  account: Account;
  onReloadAccounts?: () => Promise<void> | void;
  onLog?: (message: string) => void;
  selectedAccountIds?: number[];
  onUpdateDraft?: UpdateDraftFn;
  onUpdateAccount?: UpdateAccountFn;
}

const cardClass =
  "rounded-xl border border-slate-200 bg-white shadow-sm mb-4 overflow-hidden";

const cardHeaderClass =
  "flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 bg-slate-50";

const cardTitleClass =
  "text-sm font-semibold text-slate-800 flex items-center gap-2";

const labelClass = "block text-xs font-medium text-slate-600 mb-1";

const inputClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300";

const selectClass = `${inputClass} pr-8`;

const smallButtonClass =
  "inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 active:translate-y-[1px]";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md bg-orange-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-orange-600 active:translate-y-[1px] disabled:opacity-60 disabled:cursor-default";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-sky-700 active:translate-y-[1px] disabled:opacity-60 disabled:cursor-default";

const dangerButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md bg-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-rose-600 active:translate-y-[1px] disabled:opacity-60 disabled:cursor-default";

const tealButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700 active:translate-y-[1px] disabled:opacity-60 disabled:cursor-default";

const iconButtonClass =
  "inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 active:translate-y-[1px]";

const badgeClass =
  "inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100";

const statusBadge = (status: string) => {
  switch (status) {
    case "active":
    case "ok":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
          Активен
        </span>
      );
    case "expired":
    case "failed":
      return (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-100">
          Истёк
        </span>
      );
    case "draft":
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
          Черновик
        </span>
      );
  }
};

const versions = [
  { value: 4, label: "IPv4" },
  { value: 6, label: "IPv6" },
];

const countries = [
  { value: "RU", label: "🇷🇺 Россия (RU)" },
  { value: "UA", label: "🇺🇦 Украина (UA)" },
  { value: "KZ", label: "🇰🇿 Казахстан (KZ)" },
  { value: "BY", label: "🇧🇾 Беларусь (BY)" },
  { value: "US", label: "🇺🇸 США (US)" },
  { value: "GB", label: "🇬🇧 Великобритания (GB)" },
  { value: "DE", label: "🇩🇪 Германия (DE)" },
  { value: "FR", label: "🇫🇷 Франция (FR)" },
  { value: "ES", label: "🇪🇸 Испания (ES)" },
  { value: "IT", label: "🇮🇹 Италия (IT)" },
  { value: "NL", label: "🇳🇱 Нидерланды (NL)" },
  { value: "PL", label: "🇵🇱 Польша (PL)" },
  { value: "TR", label: "🇹🇷 Турция (TR)" },
  { value: "CA", label: "🇨🇦 Канада (CA)" },
  { value: "AU", label: "🇦🇺 Австралия (AU)" },
  { value: "JP", label: "🇯🇵 Япония (JP)" },
  { value: "CN", label: "🇨🇳 Китай (CN)" },
  { value: "IN", label: "🇮🇳 Индия (IN)" },
  { value: "BR", label: "🇧🇷 Бразилия (BR)" },
  { value: "MX", label: "🇲🇽 Мексика (MX)" },
  { value: "AR", label: "🇦🇷 Аргентина (AR)" },
  { value: "CL", label: "🇨🇱 Чили (CL)" },
  { value: "CO", label: "🇨🇴 Колумбия (CO)" },
  { value: "PE", label: "🇵🇪 Перу (PE)" },
  { value: "ZA", label: "🇿🇦 ЮАР (ZA)" },
  { value: "EG", label: "🇪🇬 Египет (EG)" },
  { value: "SA", label: "🇸🇦 Саудовская Аравия (SA)" },
  { value: "AE", label: "🇦🇪 ОАЭ (AE)" },
  { value: "IL", label: "🇮🇱 Израиль (IL)" },
  { value: "SE", label: "🇸🇪 Швеция (SE)" },
  { value: "NO", label: "🇳🇴 Норвегия (NO)" },
  { value: "FI", label: "🇫🇮 Финляндия (FI)" },
  { value: "DK", label: "🇩🇰 Дания (DK)" },
  { value: "BE", label: "🇧🇪 Бельгия (BE)" },
  { value: "AT", label: "🇦🇹 Австрия (AT)" },
  { value: "CH", label: "🇨🇭 Швейцария (CH)" },
  { value: "PT", label: "🇵🇹 Португалия (PT)" },
  { value: "GR", label: "🇬🇷 Греция (GR)" },
  { value: "CZ", label: "🇨🇿 Чехия (CZ)" },
  { value: "HU", label: "🇭🇺 Венгрия (HU)" },
  { value: "RO", label: "🇷🇴 Румыния (RO)" },
  { value: "BG", label: "🇧🇬 Болгария (BG)" },
  { value: "RS", label: "🇷🇸 Сербия (RS)" },
  { value: "HR", label: "🇭🇷 Хорватия (HR)" },
  { value: "SK", label: "🇸🇰 Словакия (SK)" },
  { value: "SI", label: "🇸🇮 Словения (SI)" },
  { value: "LT", label: "🇱🇹 Литва (LT)" },
  { value: "LV", label: "🇱🇻 Латвия (LV)" },
  { value: "EE", label: "🇪🇪 Эстония (EE)" },
  { value: "IE", label: "🇮🇪 Ирландия (IE)" },
  { value: "KR", label: "🇰🇷 Южная Корея (KR)" },
  { value: "TW", label: "🇹🇼 Тайвань (TW)" },
  { value: "HK", label: "🇭🇰 Гонконг (HK)" },
  { value: "SG", label: "🇸🇬 Сингапур (SG)" },
  { value: "TH", label: "🇹🇭 Таиланд (TH)" },
  { value: "VN", label: "🇻🇳 Вьетнам (VN)" },
  { value: "MY", label: "🇲🇾 Малайзия (MY)" },
  { value: "ID", label: "🇮🇩 Индонезия (ID)" },
  { value: "PH", label: "🇵🇭 Филиппины (PH)" },
  { value: "NZ", label: "🇳🇿 Новая Зеландия (NZ)" },
  { value: "PK", label: "🇵🇰 Пакистан (PK)" },
  { value: "BD", label: "🇧🇩 Бангладеш (BD)" },
  { value: "NG", label: "🇳🇬 Нигерия (NG)" },
  { value: "KE", label: "🇰🇪 Кения (KE)" },
];

const periods = [7, 30, 60, 90];
const quantities = [1, 2, 3, 5, 10, 15, 20, 25, 30];

const protocolTypes: Array<{ value: "http" | "socks"; label: string }> = [
  { value: "http", label: "HTTP" },
  { value: "socks", label: "SOCKS5" },
];

export function ProxyManagerSection({
  account,
  onReloadAccounts,
  onLog,
  selectedAccountIds,
  onUpdateDraft,
  onUpdateAccount,
}: ProxyManagerSectionProps) {
  const [proxies, setProxies] = useState<ProxyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [strategy, setStrategy] = useState<Account["proxyStrategy"]>(
    account.proxyStrategy || "fixed"
  );
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const [px6ApiKey, setPx6ApiKey] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }
    try {
      return window.localStorage.getItem("px6ApiKey") || "";
    } catch {
      return "";
    }
  });
  const [px6Account, setPx6Account] = useState<Px6AccountResponse | null>(
    null
  );
  const [px6Loading, setPx6Loading] = useState(false);
  const [px6Error, setPx6Error] = useState<string | null>(null);
  const [px6ManageMessage, setPx6ManageMessage] = useState<string | null>(null);
  const [px6ManageError, setPx6ManageError] = useState<string | null>(null);
  const [px6ManageLoading, setPx6ManageLoading] = useState(false);
  const [px6ProlongPeriod, setPx6ProlongPeriod] = useState<number>(30);

  // Параметры для быстрой покупки
  const [version, setVersion] = useState<number>(4);
  const [country, setCountry] = useState("RU");
  const [type, setType] = useState<"http" | "socks">("http");
  const [quantity, setQuantity] = useState(10);
  const [period, setPeriod] = useState(30);
  const [autoProlong, setAutoProlong] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  // Режим прокси для аккаунта
  const [proxyMode, setProxyMode] = useState<"pool" | "manual">("pool");
  const [manualProxyAddress, setManualProxyAddress] = useState("");
  const [manualProxyLogin, setManualProxyLogin] = useState("");
  const [manualProxyPassword, setManualProxyPassword] = useState("");
  const [manualProxyType, setManualProxyType] = useState<Account["proxyType"]>("http");
  const [manualProxyGeo, setManualProxyGeo] = useState("");

  const firstSelectedId = useMemo(
    () => Array.from(selectedIds)[0] ?? null,
    [selectedIds]
  );
  const selectedProxy = useMemo(
    () => proxies.find((item) => item.id === firstSelectedId) ?? null,
    [proxies, firstSelectedId]
  );
  const attachedProxy = useMemo(
    () =>
      account.proxyId
        ? proxies.find((item) => item.id === account.proxyId) ?? null
        : null,
    [proxies, account.proxyId]
  );
  const selectedPx6Ids = useMemo(
    () =>
      proxies
        .filter((item) => selectedIds.has(item.id) && item.provider === "px6")
        .map((item) => item.id),
    [proxies, selectedIds]
  );

  const hasValidPx6Key = !!px6Account;

  const loadProxies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[ProxyManager] Загрузка списка прокси...");
      const response = await fetchProxies();
      console.log("[ProxyManager] Ответ от API:", response);
      const items = response.items ?? [];
      console.log("[ProxyManager] Количество прокси:", items.length);
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
      onLog?.(`Загружено ${items.length} прокси из пула`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[ProxyManager] Ошибка загрузки прокси:", err);
      setError(message || "Не удалось загрузить список прокси.");
      setProxies([]);
      onLog?.(
        `Ошибка загрузки списка прокси: ${message || "Неизвестная ошибка"}`
      );
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

  // Синхронизация режима прокси и полей с аккаунтом при смене
  useEffect(() => {
    if (account.proxyId) {
      // Аккаунт использует прокси из пула
      setProxyMode("pool");
      setManualProxyAddress("");
      setManualProxyLogin("");
      setManualProxyPassword("");
      setManualProxyType("http");
      setManualProxyGeo("");
    } else if (account.proxy) {
      // Аккаунт использует ручной прокси
      setProxyMode("manual");
      setManualProxyAddress(account.proxy || "");
      setManualProxyLogin(account.proxyUsername || "");
      setManualProxyPassword(account.proxyPassword || "");
      setManualProxyType(account.proxyType || "http");
      setManualProxyGeo(""); // TODO: добавить поле geo в Account
    } else {
      // Нет прокси - по умолчанию режим pool
      setProxyMode("pool");
      setManualProxyAddress("");
      setManualProxyLogin("");
      setManualProxyPassword("");
      setManualProxyType("http");
      setManualProxyGeo("");
    }
  }, [account.id, account.proxy, account.proxyId, account.proxyUsername, account.proxyPassword, account.proxyType]);

  const handlePx6CheckAccount = async () => {
    const key = px6ApiKey.trim();
    if (!key) {
      setPx6Error("Введите API key PX6.");
      setPx6Account(null);
      return;
    }
    setPx6Loading(true);
    setPx6Error(null);
    try {
      const data = await px6CheckAccount(key);
      setPx6Account(data);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("px6ApiKey", key);
        } catch {
          // ignore
        }
      }
      onLog?.(
        `PX6 account: user_id=${data.user_id}, balance=${data.balance} ${data.currency}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPx6Error(message || "Не удалось проверить ключ PX6");
      setPx6Account(null);
    } finally {
      setPx6Loading(false);
    }
  };

  const handleOpenPx6 = () => {
    if (typeof window !== "undefined") {
      window.open("https://px6.me/?r=791365", "_blank", "noopener,noreferrer");
    }
  };

  const handleCalcPrice = async () => {
    const key = px6ApiKey.trim();
    if (!key) {
      setPx6Error("Введите API key PX6 для расчета цены");
      return;
    }
    setPx6Loading(true);
    setPx6Error(null);
    try {
      const result = await px6GetPrice(key, version, quantity, period);
      setPrice(result.price);
      onLog?.(
        `PX6 getPrice: ${quantity} прокси (v${version}, ${period}д) = ${result.price} ${result.currency}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPx6Error(message || "Не удалось рассчитать цену");
      setPrice(null);
    } finally {
      setPx6Loading(false);
    }
  };

  const handleBuy = async () => {
    const key = px6ApiKey.trim();
    if (!key) {
      setPx6Error("Сначала сохраните API key px6.me");
      return;
    }
    if (quantity < 1) {
      setPx6ManageError("Минимальный заказ — от 1 прокси");
      return;
    }

    // Находим название страны
    const countryLabel = countries.find(c => c.value === country)?.label || country;
    const versionLabel = versions.find(v => v.value === version)?.label || `IPv${version}`;
    const typeLabel = type === "http" ? "HTTP" : "SOCKS5";

    // Подтверждение покупки
    const confirmMessage = `Вы хотите купить:\n\n${quantity} ${countryLabel} прокси (${versionLabel}, ${typeLabel})\nна ${period} дней\n${price ? `\nСтоимость: ${price} RUB` : ''}\n\nПродолжить?`;

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) {
      return;
    }

    setIsBuying(true);
    setPx6ManageMessage(null);
    setPx6ManageError(null);

    try {
      const result = await px6Buy(key, {
        version,
        country,
        type,
        count: quantity,
        period,
        autoProlong,
      });
      setPx6ManageMessage(
        `Куплено ${quantity} прокси. Добавлено в пул: ${result.proxies.length} шт.`
      );
      onLog?.(`PX6 buy: успешно куплено ${quantity} прокси`);
      await loadProxies();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPx6ManageError(message || "Не удалось купить прокси");
    } finally {
      setIsBuying(false);
    }
  };

  const handlePx6Sync = async () => {
    const key = px6ApiKey.trim();
    if (!key) {
      setPx6Error("Введите API key PX6.");
      return;
    }
    setPx6ManageLoading(true);
    setPx6ManageMessage(null);
    setPx6ManageError(null);
    try {
      await px6Sync(key, "active");
      setPx6ManageMessage("Список PX6-прокси обновлен.");
      onLog?.("PX6 sync: успешно обновлён список прокси из сервиса.");
      await loadProxies();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPx6ManageError(message || "Не удалось обновить список PX6-прокси");
    } finally {
      setPx6ManageLoading(false);
    }
  };

  const handlePx6Prolong = async () => {
    const key = px6ApiKey.trim();
    if (!key) {
      setPx6Error("Введите API key PX6.");
      return;
    }
    if (!selectedPx6Ids.length) {
      setPx6ManageError("Выберите PX6-прокси для продления.");
      return;
    }
    setPx6ManageLoading(true);
    setPx6ManageMessage(null);
    setPx6ManageError(null);
    try {
      await px6Prolong(key, selectedPx6Ids, px6ProlongPeriod);
      setPx6ManageMessage(
        `Продлены PX6-прокси: ${selectedPx6Ids.length} шт. на ${px6ProlongPeriod} дней.`
      );
      onLog?.(
        `PX6 prolong: продлено ${selectedPx6Ids.length} прокси на ${px6ProlongPeriod} дней.`
      );
      await loadProxies();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPx6ManageError(message || "Не удалось продлить PX6-прокси");
    } finally {
      setPx6ManageLoading(false);
    }
  };

  const handlePx6Delete = async () => {
    const key = px6ApiKey.trim();
    if (!key) {
      setPx6Error("Введите API key PX6.");
      return;
    }
    if (!selectedPx6Ids.length) {
      setPx6ManageError("Выберите PX6-прокси для удаления.");
      return;
    }
    const confirmed = window.confirm(
      `Удалить выбранные PX6-прокси (${selectedPx6Ids.length}) в PX6 и локально?`
    );
    if (!confirmed) {
      return;
    }
    setPx6ManageLoading(true);
    setPx6ManageMessage(null);
    setPx6ManageError(null);
    try {
      await px6Delete(key, selectedPx6Ids);
      setPx6ManageMessage(`Удалено PX6-прокси: ${selectedPx6Ids.length} шт.`);
      onLog?.(`PX6 delete: удалено ${selectedPx6Ids.length} прокси.`);
      await loadProxies();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPx6ManageError(message || "Не удалось удалить PX6-прокси");
    } finally {
      setPx6ManageLoading(false);
    }
  };

  const handlePx6Distribute = async () => {
    const payload =
      selectedAccountIds && selectedAccountIds.length
        ? { accountIds: selectedAccountIds }
        : { allWithoutProxy: true };

    setPx6ManageLoading(true);
    setPx6ManageMessage(null);
    setPx6ManageError(null);
    try {
      const result = await px6Distribute(payload);
      setPx6ManageMessage(
        result.assigned
          ? `PX6-прокси распределены на ${result.assigned} аккаунтов.`
          : "Все аккаунты уже имеют прокси или нет свободных."
      );
      onLog?.(
        `PX6 distribute: прокси назначены для ${result.assigned} аккаунтов (selected=${
          selectedAccountIds?.length ?? 0
        }).`
      );
      if (onReloadAccounts) {
        await onReloadAccounts();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPx6ManageError(
        message || "Не удалось распределить PX6-прокси по аккаунтам"
      );
    } finally {
      setPx6ManageLoading(false);
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

  const handleTestSingle = async (id: string) => {
    setIsTesting(true);
    setTestError(null);
    setTestMessage(null);
    try {
      const result = await testAllProxies([id]);
      setTestMessage(
        `Протестировано ${result.tested}: успешно ${result.ok}, провалено ${result.failed}.`
      );
      onLog?.(
        `Тест прокси (менеджер, один) для ${account.email}: ${result.ok}/${result.tested} успешны.`
      );
      await loadProxies();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTestError(message || "Ошибка тестирования");
      onLog?.(
        `Тест прокси (менеджер, один) для ${account.email}: исключение: ${
          message || "Неизвестная ошибка"
        }`
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestSelected = async () => {
    setIsTesting(true);
    setTestError(null);
    setTestMessage(null);
    try {
      const ids = selectedIds.size ? Array.from(selectedIds) : undefined;
      const result = await testAllProxies(ids);
      setTestMessage(
        `Протестировано ${result.tested}: успешно ${result.ok}, провалено ${result.failed}.`
      );
      onLog?.(
        `Тест прокси (менеджер) для ${account.email}: ${result.ok}/${result.tested} успешны.`
      );
      await loadProxies();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTestError(message || "Ошибка тестирования");
      onLog?.(
        `Тест прокси (менеджер) для ${account.email}: исключение: ${
          message || "Неизвестная ошибка"
        }`
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleAssignSingle = async (proxyId: string) => {
    setIsAssigning(true);
    setAssignError(null);
    setAssignMessage(null);
    const proxy = proxies.find((item) => item.id === proxyId) || null;
    try {
      await assignProxyToAccount(account.id, proxyId, strategy);
      setAssignMessage("Прокси применён к аккаунту.");
      if (proxy && onUpdateDraft) {
        onUpdateDraft({
          proxyId: proxy.id,
          proxy: proxy.server,
          proxyUsername: proxy.username || "",
          proxyPassword: proxy.password || "",
          proxyType: (proxy.type === "socks"
            ? "socks5"
            : (proxy.type as Account["proxyType"]) || "http"),
        });
      }
      if (onReloadAccounts) {
        await onReloadAccounts();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setAssignError(message || "Не удалось применить прокси.");
    } finally {
      setIsAssigning(false);
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
      if (onUpdateDraft) {
        onUpdateDraft({
          proxyId: selectedProxy.id,
          proxy: selectedProxy.server,
          proxyUsername: selectedProxy.username || "",
          proxyPassword: selectedProxy.password || "",
          proxyType: (selectedProxy.type === "socks"
            ? "socks5"
            : (selectedProxy.type as Account["proxyType"]) || "http"),
        });
      }
      onReloadAccounts && (await onReloadAccounts());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setAssignError(message || "Не удалось применить прокси.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClearAccountProxy = async () => {
    setIsAssigning(true);
    setAssignError(null);
    setAssignMessage(null);
    try {
      await assignProxyToAccount(account.id, null, strategy);
      setAssignMessage("Прокси убран из аккаунта.");
      onUpdateDraft?.({
        proxyId: null,
        proxy: "",
        proxyUsername: "",
        proxyPassword: "",
      });
      if (onReloadAccounts) {
        await onReloadAccounts();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setAssignError(message || "Не удалось убрать прокси из аккаунта.");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <>
      {/* 1. Покупка прокси через PX6 + API key */}
      <section className={cardClass}>
        <header className={cardHeaderClass}>
          <div className={cardTitleClass}>
            <ShoppingBag className="h-4 w-4 text-orange-500" />
            <span>Рабочие прокси через сервис px6.me</span>
          </div>
        </header>
        <div className="space-y-3 px-4 py-3">
          <p className="text-xs text-slate-700">
            Скидка <span className="font-semibold">5%</span> по купону{" "}
            <span className="font-mono font-semibold">keyset</span>.
            Можно покупать от 1 прокси.
          </p>

          <button
            className={`${primaryButtonClass} w-full justify-center`}
            onClick={handleOpenPx6}
          >
            <Link2 className="h-4 w-4" />
            Купить прокси за 30 ₽
          </button>

          <p className="mt-2 text-xs text-slate-700">
            Чтобы KeySet мог показывать ваш баланс и подключать прокси через
            API, вставьте ваш API key из раздела «Разработчикам (API)» в
            кабинете px6.me.
          </p>

          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className={labelClass}>API key px6.me</label>
              {px6Account && (
                <span className="text-[11px] font-semibold text-emerald-700">
                  Баланс: {px6Account.balance} {px6Account.currency}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="password"
                  className={`${inputClass} pr-8`}
                  placeholder="f6d4d566ee-19c0ca63444-..."
                  value={px6ApiKey}
                  onChange={(e) => setPx6ApiKey(e.target.value)}
                />
                <KeyIcon className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" />
              </div>
              <button
                className={secondaryButtonClass}
                onClick={handlePx6CheckAccount}
                disabled={px6Loading}
              >
                Проверить ключ / баланс
              </button>
            </div>
            {px6Error && (
              <p className="mt-1 text-xs text-rose-600">
                <span className="font-semibold">Ошибка:</span> {px6Error}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 2. Быстрая покупка через API (показывается только если есть валидный ключ) */}
      {hasValidPx6Key && (
        <section className={cardClass}>
          <header className={cardHeaderClass}>
            <div className={cardTitleClass}>
              <Globe2 className="h-4 w-4 text-sky-500" />
              <span>Быстрая покупка через PX6 (API)</span>
            </div>
          </header>
          <div className="space-y-3 px-4 py-3">
            <p className="text-xs text-slate-700">
              KeySet отправит заказ в PX6 от вашего имени и сразу добавит прокси
              в пул ниже.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Версия IP</label>
                <select
                  className={selectClass}
                  value={version}
                  onChange={(e) => setVersion(Number(e.target.value))}
                >
                  {versions.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Страна</label>
                <select
                  className={selectClass}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {countries.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Тип</label>
                <select
                  className={selectClass}
                  value={type}
                  onChange={(e) => setType(e.target.value as "http" | "socks")}
                >
                  {protocolTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Количество</label>
                <select
                  className={selectClass}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                >
                  {quantities.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Можно купить от 1 прокси.
                </p>
              </div>
              <div>
                <label className={labelClass}>Период (дней)</label>
                <select
                  className={selectClass}
                  value={period}
                  onChange={(e) => setPeriod(Number(e.target.value))}
                >
                  {periods.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    checked={autoProlong}
                    onChange={(e) => setAutoProlong(e.target.checked)}
                  />
                  Автопродление
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button className={smallButtonClass} onClick={handleCalcPrice}>
                Рассчитать цену
              </button>
              <div className="text-xs text-slate-700">
                Цена:{" "}
                {price ? (
                  <span className="font-semibold">
                    ~{price} ₽ ({Math.round(price / quantity)} ₽ / шт)
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
            </div>

            <button
              className={`${primaryButtonClass} mt-1 w-full justify-center`}
              onClick={handleBuy}
              disabled={isBuying}
            >
              <ShoppingBag className="h-4 w-4" />
              {isBuying ? "Покупка..." : "Купить и добавить в пул"}
            </button>
          </div>
        </section>
      )}

      {/* 3. Управление прокси - перенесено в иконки в заголовке "Пул прокси" */}
      <section className={cardClass}>
        <header className={cardHeaderClass}>
          <div className={cardTitleClass}>
            <Globe2 className="h-4 w-4 text-slate-700" />
            <span>Управление прокси</span>
          </div>
        </header>
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              className={secondaryButtonClass}
              onClick={handlePx6Prolong}
              disabled={px6ManageLoading || !selectedPx6Ids.length}
            >
              Продлить выбранные
            </button>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600">Период (дней):</label>
              <select
                className={selectClass}
                value={px6ProlongPeriod}
                onChange={(e) => setPx6ProlongPeriod(Number(e.target.value) || 30)}
                style={{ minWidth: 80, maxWidth: 100 }}
              >
                <option value={7}>7</option>
                <option value={30}>30</option>
                <option value={60}>60</option>
                <option value={90}>90</option>
              </select>
            </div>
          </div>
          {(px6ManageMessage || px6ManageError) && (
            <div className="mt-2">
              {px6ManageMessage && (
                <p className="text-xs text-emerald-700">
                  <i className="fas fa-check-circle" /> {px6ManageMessage}
                </p>
              )}
              {px6ManageError && (
                <p className="text-xs text-rose-600">
                  <i className="fas fa-exclamation-circle" /> {px6ManageError}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. Пул прокси (PX6 и свои) */}
      <section className={cardClass}>
        <header className={cardHeaderClass}>
          <div className="flex items-center justify-between w-full">
            <div className={cardTitleClass}>
              <Globe2 className="h-4 w-4 text-slate-500" />
              <span>Пул прокси (PX6 и свои)</span>
            </div>
            <div className="flex gap-1.5">
              <button
                className={iconButtonClass}
                title="Тестировать выбранные"
                onClick={handleTestSelected}
                disabled={isTesting}
              >
                <FlaskConical className="h-3.5 w-3.5" />
              </button>
              <button
                className={`${iconButtonClass} ${selectedProxy ? 'bg-sky-50 text-sky-700' : ''}`}
                title="Применить выбранный к аккаунту"
                onClick={handleAssignToAccount}
                disabled={isAssigning || !selectedProxy}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </button>
              <button
                className={`${iconButtonClass} text-rose-600 hover:text-rose-700`}
                title="Убрать прокси из аккаунта"
                onClick={handleClearAccountProxy}
                disabled={isAssigning || !account.proxyId}
              >
                <Link2 className="h-3.5 w-3.5 rotate-45" />
              </button>
              <button
                className={iconButtonClass}
                title="Добавить свой прокси"
                onClick={async () => {
                  const proxyString = prompt("Введите прокси в формате:\nhost:port:user:pass\nили host:port");
                  if (!proxyString) return;

                  const parts = proxyString.trim().split(":");
                  if (parts.length < 2) {
                    alert("Неверный формат. Используйте host:port или host:port:user:pass");
                    return;
                  }

                  const [host, port, username, password] = parts;

                  try {
                    await createProxy({
                      server: `${host}:${port}`,
                      username: username || undefined,
                      password: password || undefined,
                      type: "http",
                      label: `${host}:${port}`,
                    });
                    setAssignMessage("Прокси добавлен в пул");
                    await loadProxies();
                  } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    setAssignError(message || "Не удалось добавить прокси");
                  }
                }}
              >
                <i className="fas fa-plus" style={{ fontSize: '10px' }} />
              </button>
              <button
                className={`${iconButtonClass} text-rose-600 hover:text-rose-700`}
                title="Удалить PX6-прокси + локально"
                onClick={handlePx6Delete}
                disabled={px6ManageLoading || !selectedPx6Ids.length}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                className={iconButtonClass}
                title="Распределить PX6-прокси по аккаунтам"
                onClick={handlePx6Distribute}
                disabled={px6ManageLoading}
              >
                <Users className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </header>

        <div className="px-3 py-2.5">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full border-collapse text-[12px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="w-7 px-2.5 py-1.5">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      checked={
                        selectedIds.size === proxies.length &&
                        proxies.length > 0
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-2.5 py-1.5">Адрес</th>
                  <th className="px-2.5 py-1.5">Истекает</th>
                  <th className="px-2.5 py-1.5">Статус</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-2.5 py-3 text-center text-slate-500">
                      Загрузка списка прокси...
                    </td>
                  </tr>
                ) : proxies.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2.5 py-3 text-center text-slate-500">
                      Прокси не найдены.
                    </td>
                  </tr>
                ) : (
                  proxies.map((proxy) => {
                    const isChecked = selectedIds.has(proxy.id);
                    const isAttached = account.proxyId === proxy.id;
                    return (
                      <tr
                        key={proxy.id}
                        className={`border-t border-slate-100 hover:bg-slate-50 cursor-pointer ${
                          isAttached ? "bg-sky-50/40" : "bg-white"
                        }`}
                        onClick={() => {
                          setSelectedIds(new Set([proxy.id]));
                          void handleAssignSingle(proxy.id);
                        }}
                      >
                        <td className="px-2.5 py-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            checked={isChecked}
                            onChange={() => handleToggleSelection(proxy.id)}
                          />
                        </td>
                        <td className="px-2.5 py-1.5 align-middle font-mono text-[11px] text-slate-800">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                proxy.provider === "px6"
                                  ? "bg-amber-50 text-amber-800 border border-amber-100"
                                  : "bg-slate-50 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {proxy.provider === "px6" ? "PX6" : "Свой"}
                            </span>
                            <span>{proxy.server}</span>
                          </div>
                        </td>
                        <td className="px-2.5 py-1.5 align-middle text-[11px] text-slate-700">
                          {proxy.expires_at
                            ? new Date(
                                proxy.expires_at > 1e12
                                  ? proxy.expires_at
                                  : proxy.expires_at * 1000
                              ).toLocaleDateString("ru-RU")
                            : "—"}
                        </td>
                        <td className="px-2.5 py-1.5 align-middle">
                          {statusBadge(
                            proxy.enabled ? "active" : "draft"
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {(testMessage || testError || assignMessage || assignError) && (
            <div className="mt-2 space-y-1">
              {testMessage && (
                <p className="text-xs text-emerald-700">
                  <i className="fas fa-check-circle" /> {testMessage}
                </p>
              )}
              {testError && (
                <p className="text-xs text-rose-600">
                  <i className="fas fa-exclamation-circle" /> {testError}
                </p>
              )}
              {assignMessage && (
                <p className="text-xs text-emerald-700">
                  <i className="fas fa-check-circle" /> {assignMessage}
                </p>
              )}
              {assignError && (
                <p className="text-xs text-rose-600">
                  <i className="fas fa-exclamation-circle" /> {assignError}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 5. Указать прокси вручную */}
      <section className={cardClass}>
        <header className={cardHeaderClass}>
          <div className={cardTitleClass}>
            <Globe2 className="h-4 w-4 text-sky-600" />
            <span>Указать прокси вручную</span>
          </div>
        </header>
        <div className="space-y-3 px-4 py-3">
          <div>
            <label className={labelClass}>Адрес прокси</label>
            <input
              className={inputClass}
              placeholder="ip:port или схема://логин:пароль@ip:port"
              value={manualProxyAddress}
              onChange={(e) => {
                setManualProxyAddress(e.target.value);
                onUpdateDraft?.({ proxy: e.target.value, proxyId: null });
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Логин</label>
              <input
                className={inputClass}
                placeholder="user"
                value={manualProxyLogin}
                onChange={(e) => {
                  setManualProxyLogin(e.target.value);
                  onUpdateDraft?.({ proxyUsername: e.target.value });
                }}
              />
            </div>
            <div>
              <label className={labelClass}>Пароль</label>
              <input
                type="password"
                className={inputClass}
                placeholder="••••••••"
                value={manualProxyPassword}
                onChange={(e) => {
                  setManualProxyPassword(e.target.value);
                  onUpdateDraft?.({ proxyPassword: e.target.value });
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Тип протокола</label>
              <select
                className={selectClass}
                value={manualProxyType}
                onChange={(e) => {
                  const newType = e.target.value as Account["proxyType"];
                  setManualProxyType(newType);
                  onUpdateDraft?.({ proxyType: newType });
                }}
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks5">SOCKS5</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>GEO (опционально)</label>
              <select
                className={selectClass}
                value={manualProxyGeo}
                onChange={(e) => setManualProxyGeo(e.target.value)}
              >
                <option value="">Не указано</option>
                {countries.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            className={`${smallButtonClass} mt-1`}
            onClick={async () => {
              if (!manualProxyAddress.trim()) {
                alert("Сначала укажите адрес прокси");
                return;
              }

              const parts = manualProxyAddress.split(":");
              if (parts.length < 2) {
                alert("Неверный формат. Укажите адрес как host:port");
                return;
              }

              const host = parts[0];
              const port = parseInt(parts[1], 10);

              if (!port || port <= 0) {
                alert("Неверный порт. Укажите число, например 3128");
                return;
              }

              setIsTesting(true);
              try {
                const result = await testProxy(
                  host,
                  port,
                  manualProxyLogin || undefined,
                  manualProxyPassword || undefined,
                  manualProxyType
                );
                if (result.status === "ok") {
                  alert(`Прокси работает${result.ip ? ` (IP: ${result.ip})` : ""}`);
                } else {
                  alert(`Ошибка: ${result.error || "Прокси не работает"}`);
                }
              } catch (err) {
                alert(`Ошибка тестирования: ${err instanceof Error ? err.message : String(err)}`);
              } finally {
                setIsTesting(false);
              }
            }}
            disabled={isTesting}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            {isTesting ? "Тестирование..." : "Тестировать прокси"}
          </button>

          <p className="mt-2 text-[11px] text-slate-500">
            Настройки выше имитируют вкладку «Сеть»: выбранный здесь прокси будет использован при запуске браузера и парсинга для этого аккаунта.
          </p>
        </div>
      </section>
    </>
  );
}
