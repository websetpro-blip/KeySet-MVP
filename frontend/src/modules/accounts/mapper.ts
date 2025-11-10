/**
 * Mappers to convert between frontend Account format and backend ApiAccount format
 * Backend stores extended fields in the notes field as JSON
 */

import type { Account } from "./types";
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
}

/**
 * Convert backend ApiAccount to frontend Account
 */
export function apiAccountToAccount(apiAccount: ApiAccount): Account {
  // Parse extras from notes field
  let extras: AccountExtras = {};
  try {
    if (apiAccount.notes) {
      const parsed = JSON.parse(apiAccount.notes);
      if (typeof parsed === "object" && parsed !== null && "password" in parsed) {
        extras = parsed;
      }
    }
  } catch (e) {
    // If notes is not valid JSON, ignore and use defaults
  }

  return {
    id: apiAccount.id,
    email: apiAccount.name,
    password: extras.password || "",
    secretAnswer: extras.secretAnswer || "",
    profilePath: apiAccount.profile_path || "",
    status: apiAccount.status as any, // backend uses string, frontend has specific types
    proxy: apiAccount.proxy || "",
    proxyUsername: extras.proxyUsername || "",
    proxyPassword: extras.proxyPassword || "",
    proxyType: extras.proxyType || "http",
    fingerprint: (extras.fingerprint as any) || "russia_standard",
    lastLaunch: extras.lastLaunch || formatLastUsed(apiAccount.last_used_at),
    authStatus: extras.authStatus || "Неизвестно",
    lastLogin: extras.lastLogin || formatDateTime(apiAccount.last_used_at),
    profileSize: extras.profileSize || "0 МБ",
  };
}

/**
 * Convert frontend Account to backend CreateAccountPayload
 */
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
  };

  return {
    name: account.email || "",
    profile_path: account.profilePath,
    proxy: account.proxy,
    notes: JSON.stringify(extras),
  };
}

/**
 * Convert frontend Account to backend UpdateAccountPayload
 */
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

  const payload: UpdateAccountPayload = {};

  if (account.email !== undefined) payload.name = account.email;
  if (account.profilePath !== undefined) payload.profile_path = account.profilePath;
  if (account.proxy !== undefined) payload.proxy = account.proxy;
  if (account.status !== undefined) payload.status = account.status;
  if (Object.keys(extras).length > 0) payload.notes = JSON.stringify(extras);

  return payload;
}

/**
 * Format last used timestamp to relative time
 */
function formatLastUsed(timestamp: string | null): string {
  if (!timestamp) return "никогда";

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

/**
 * Format datetime for display
 */
function formatDateTime(timestamp: string | null): string {
  if (!timestamp) return "—";

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

/**
 * Russian pluralization helper
 */
function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
