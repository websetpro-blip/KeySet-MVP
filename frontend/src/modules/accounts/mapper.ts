/**
 * Helpers that convert API payloads into UI-friendly structures.
 * Extra account fields travel inside Account.notes as JSON.
 */

import type { Account, AccountStatus, ProxyStrategy } from "./types";
import type { ApiAccount, CreateAccountPayload, UpdateAccountPayload } from "./api";

interface AccountExtras {
  password?: string;
  secretAnswer?: string;
  proxyUsername?: string;
  proxyPassword?: string;
  proxyType?: "http" | "https" | "socks5";
  fingerprint?: string;
  lastLaunch?: string;
  authStatus?: string;
  lastLogin?: string;
  profileSize?: string;
  captchaService?: string;
  captchaAutoSolve?: boolean;
}

export function apiAccountToAccount(apiAccount: ApiAccount): Account {
  let extras: AccountExtras = {};
  try {
    if (apiAccount.notes) {
      const parsed = JSON.parse(apiAccount.notes);
      if (parsed && typeof parsed === "object") {
        extras = parsed as AccountExtras;
      }
    }
  } catch {
    // broken notes payloads are ignored
  }

  return {
    id: apiAccount.id,
    email: apiAccount.name,
    password: extras.password ?? "",
    secretAnswer: extras.secretAnswer ?? "",
    profilePath: apiAccount.profile_path ?? "",
    status: mapStatus(apiAccount.status),
    proxy: apiAccount.proxy ?? "",
    proxyUsername: extras.proxyUsername ?? "",
    proxyPassword: extras.proxyPassword ?? "",
    proxyType: extras.proxyType ?? "http",
    proxyId: apiAccount.proxy_id ?? null,
    proxyStrategy: normalizeProxyStrategy(apiAccount.proxy_strategy),
    fingerprint: (extras.fingerprint as any) ?? "russia_standard",
    captchaService: extras.captchaService ?? "none",
    captchaAutoSolve: extras.captchaAutoSolve ?? false,
    lastLaunch: extras.lastLaunch ?? formatLastUsed(apiAccount.last_used_at),
    authStatus: extras.authStatus ?? "Неизвестно",
    lastLogin: extras.lastLogin ?? formatDateTime(apiAccount.last_used_at),
    profileSize: extras.profileSize ?? "0 МБ",
    notesRaw: apiAccount.notes ?? "",
  };
}

export function accountToCreatePayload(account: Partial<Account>): CreateAccountPayload {
  const extras: AccountExtras = {
    password: account.password,
    secretAnswer: account.secretAnswer,
    proxyUsername: account.proxyUsername,
    proxyPassword: account.proxyPassword,
    proxyType: account.proxyType,
    fingerprint: account.fingerprint,
    lastLaunch: account.lastLaunch,
    authStatus: account.authStatus,
    lastLogin: account.lastLogin,
    profileSize: account.profileSize,
    captchaService: account.captchaService,
    captchaAutoSolve: account.captchaAutoSolve,
  };

  return {
    name: account.email || "",
    profile_path: account.profilePath || "",
    proxy: account.proxy,
    proxy_id: account.proxyId ?? null,
    proxy_strategy: account.proxyStrategy ?? "fixed",
    notes: JSON.stringify(extras),
  };
}

export function accountToUpdatePayload(account: Partial<Account>): UpdateAccountPayload {
  const extras: AccountExtras = {};

  if (account.password !== undefined) extras.password = account.password;
  if (account.secretAnswer !== undefined) extras.secretAnswer = account.secretAnswer;
  if (account.proxyUsername !== undefined) extras.proxyUsername = account.proxyUsername;
  if (account.proxyPassword !== undefined) extras.proxyPassword = account.proxyPassword;
  if (account.proxyType !== undefined) extras.proxyType = account.proxyType;
  if (account.fingerprint !== undefined) extras.fingerprint = account.fingerprint;
  if (account.lastLaunch !== undefined) extras.lastLaunch = account.lastLaunch;
  if (account.authStatus !== undefined) extras.authStatus = account.authStatus;
  if (account.lastLogin !== undefined) extras.lastLogin = account.lastLogin;
  if (account.profileSize !== undefined) extras.profileSize = account.profileSize;
  if (account.captchaService !== undefined) extras.captchaService = account.captchaService;
  if (account.captchaAutoSolve !== undefined) extras.captchaAutoSolve = account.captchaAutoSolve;

  const payload: UpdateAccountPayload = {};

  if (account.email !== undefined) payload.name = account.email;
  if (account.profilePath !== undefined) payload.profile_path = account.profilePath;
  if (account.proxy !== undefined) payload.proxy = account.proxy;
  if (account.proxyId !== undefined) payload.proxy_id = account.proxyId;
  if (account.proxyStrategy !== undefined) payload.proxy_strategy = account.proxyStrategy;
  if (account.status !== undefined) payload.status = mapStatusToApi(account.status);
  if (Object.keys(extras).length > 0) {
    payload.notes = JSON.stringify(extras);
  }

  return payload;
}

function formatLastUsed(timestamp: string | null): string {
  if (!timestamp) {
    return "никогда";
  }

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "только что";
  if (diffMins < 60) return `${diffMins} ${pluralize(diffMins, "минуту", "минуты", "минут")} назад`;
  if (diffHours < 24) return `${diffHours} ${pluralize(diffHours, "час", "часа", "часов")} назад`;
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} ${pluralize(diffDays, "день", "дня", "дней")} назад`;

  return date.toLocaleDateString("ru-RU");
}

function formatDateTime(timestamp: string | null): string {
  if (!timestamp) {
    return "—";
  }
  const date = new Date(timestamp);
  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function mapStatus(raw: string): AccountStatus {
  const status = (raw || "").toLowerCase();
  switch (status) {
    case "ok":
    case "active":
      return "active";
    case "cooldown":
    case "working":
      return "working";
    case "captcha":
    case "needs_login":
      return "needs_login";
    case "banned":
    case "disabled":
    case "error":
      return "error";
    default:
      return "needs_login";
  }
}

function mapStatusToApi(status: AccountStatus): string {
  switch (status) {
    case "active":
      return "ok";
    case "working":
      return "cooldown";
    case "needs_login":
      return "captcha";
    case "error":
    default:
      return "error";
  }
}

export function apiAccountToAccountWithCookies(apiAccount: ApiAccount): Account {
  const base = apiAccountToAccount(apiAccount);
  const cookiesStatus = apiAccount.cookies_status ?? "";

  const hasProxy = Boolean(base.proxy);
  const hasProfile = Boolean(base.profilePath);
  const hasFreshCookies =
    cookiesStatus && !cookiesStatus.toLowerCase().includes("нет") &&
    !cookiesStatus.toLowerCase().includes("expired");

  let consistencyLabel = "";
  let consistencyWarning = false;

  if (!hasProfile) {
    consistencyLabel = "Нет профиля";
    consistencyWarning = true;
  } else if (!hasProxy) {
    consistencyLabel = "Нет прокси";
    consistencyWarning = true;
  } else if (!cookiesStatus) {
    consistencyLabel = "Неизвестный статус cookies";
    consistencyWarning = false;
  } else if (cookiesStatus.toLowerCase().includes("нет куков")) {
    consistencyLabel = "Нет cookies";
    consistencyWarning = true;
  } else if (cookiesStatus.toLowerCase().includes("expired")) {
    consistencyLabel = "Просроченные cookies";
    consistencyWarning = true;
  } else if (cookiesStatus.toLowerCase().includes("stale")) {
    consistencyLabel = "Старые cookies";
    consistencyWarning = false;
  } else {
    consistencyLabel = "Ок";
    consistencyWarning = false;
  }

  return {
    ...base,
    cookiesStatus,
    consistencyLabel,
    consistencyWarning,
  };
}

function normalizeProxyStrategy(value: string | null | undefined): ProxyStrategy {
  switch ((value || "").toLowerCase()) {
    case "rotate":
      return "rotate";
    default:
      return "fixed";
  }
}
