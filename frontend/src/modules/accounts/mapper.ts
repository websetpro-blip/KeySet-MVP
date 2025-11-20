/**
 * Helpers that convert API payloads into UI-friendly structures.
 * Extra account fields travel inside Account.notes as JSON.
 */

import type {
  Account,
  AccountStatus,
  AntidetectConfig,
  CanvasNoise,
  FingerprintPreset,
  GeoPreset,
  PlatformPreset,
  ProxyStrategy,
  WebRTCMode,
} from "./types";
import type { ApiAccount, CreateAccountPayload, UpdateAccountPayload } from "./api";

interface AccountExtras {
  password?: string;
  secretAnswer?: string;
  proxyUsername?: string;
  proxyPassword?: string;
  proxyType?: "http" | "https" | "socks5";
  fingerprint?: string;
  antidetect?: AntidetectConfig;
  lastLaunch?: string;
  authStatus?: string;
  lastLogin?: string;
  profileSize?: string;
  captchaService?: string;
  captchaAutoSolve?: boolean;
}

const ANTIDETECT_PRESETS: Record<GeoPreset, AntidetectConfig> = {
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
    clientHints: {
      brands: [
        {"brand": "Chromium", "version": "131"},
        {"brand": "Not:A-Brand", "version": "24"},
        {"brand": "Google Chrome", "version": "131"},
      ],
      platform: "Windows",
      platformVersion: "10.0.0",
      architecture: "x86",
      bitness: "64",
      fullVersion: "131.0.0.0",
      mobile: false,
    },
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
        {"vendor": "Intel Inc.", "renderer": "Intel(R) UHD Graphics 620"},
        {"vendor": "Intel Inc.", "renderer": "Intel(R) Iris(R) Xe Graphics"},
        {"vendor": "AMD", "renderer": "Radeon RX 6600"},
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
        {"vendor": "Intel Inc.", "renderer": "Intel(R) HD Graphics 630"},
        {"vendor": "Intel Inc.", "renderer": "Intel(R) Iris(R) Graphics 6100"},
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
        {"vendor": "Intel Inc.", "renderer": "Intel(R) UHD Graphics 610"},
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
        {"vendor": "Intel Inc.", "renderer": "Intel(R) UHD Graphics 620"},
        {"vendor": "AMD", "renderer": "Radeon RX 570"},
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
        {"vendor": "Intel Inc.", "renderer": "Intel(R) UHD Graphics 630"},
        {"vendor": "AMD", "renderer": "Radeon RX 5700"},
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
        {"vendor": "Intel Inc.", "renderer": "Intel(R) UHD Graphics 620"},
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

function normalizeGeoFromFingerprint(fp?: string): GeoPreset {
  if (!fp) return "russia";
  const normalized = fp.toLowerCase();
  if (normalized.includes("usa")) return "usa";
  if (normalized.includes("kz") || normalized.includes("kazakhstan")) return "kazakhstan";
  if (normalized.includes("ng") || normalized.includes("nigeria")) return "nigeria";
  if (normalized.includes("lt") || normalized.includes("lithuania")) return "lithuania";
  if (normalized.includes("russia")) return "russia";
  return "russia";
}

function ensureAntidetectConfig(
  input: Partial<AntidetectConfig> | undefined,
  fallbackPreset: GeoPreset,
): AntidetectConfig {
  const preset = input?.geo ?? fallbackPreset;
  const base = ANTIDETECT_PRESETS[preset] ?? ANTIDETECT_PRESETS[fallbackPreset];

  const mergeNoise = (value: CanvasNoise | undefined, defaultValue: CanvasNoise) =>
    (value as CanvasNoise) ?? defaultValue;
  const mergeWebrtc = (value: WebRTCMode | undefined, defaultValue: WebRTCMode) =>
    (value as WebRTCMode) ?? defaultValue;
  const mergePlatform = (value: PlatformPreset | undefined, defaultValue: PlatformPreset) =>
    (value as PlatformPreset) ?? defaultValue;

  return {
    ...base,
    ...input,
    geo: preset,
    geolocation: {
      ...base.geolocation,
      ...(input?.geolocation ?? {}),
    },
    screen: {
      ...base.screen,
      ...(input?.screen ?? {}),
    },
    hardware: {
      ...base.hardware,
      ...(input?.hardware ?? {}),
      platform: mergePlatform(input?.hardware?.platform, base.hardware.platform),
      deviceName: input?.hardware?.deviceName ?? base.hardware.deviceName,
    },
    webrtc: mergeWebrtc(input?.webrtc, base.webrtc),
    canvasNoise: mergeNoise(input?.canvasNoise, base.canvasNoise),
    webglNoise: input?.webglNoise ?? base.webglNoise,
    audioNoise: input?.audioNoise ?? base.audioNoise,
    fontsSpoofing: input?.fontsSpoofing ?? base.fontsSpoofing,
    dnt: input?.dnt ?? base.dnt,
    dohEnabled: input?.dohEnabled ?? base.dohEnabled,
  };
}

function parseNotes(raw?: string | null): AccountExtras {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as AccountExtras;
    }
  } catch {
    // ignore parse errors
  }
  return {};
}

function fingerprintFromGeo(geo: GeoPreset): FingerprintPreset {
  switch (geo) {
    case "usa":
      return "usa_standard";
    case "kazakhstan":
      return "kazakhstan_standard";
    case "russia":
      return "russia_standard";
    default:
      return geo;
  }
}

export function apiAccountToAccount(apiAccount: ApiAccount): Account {
  const extras = parseNotes(apiAccount.notes);
  const geoPreset = normalizeGeoFromFingerprint(extras.fingerprint);
  const antidetectConfig = ensureAntidetectConfig(extras.antidetect, geoPreset);

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
    fingerprint: (extras.fingerprint as any) ?? fingerprintFromGeo(antidetectConfig.geo),
    antidetect: antidetectConfig,
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
    ...parseNotes(account.notesRaw),
    password: account.password,
    secretAnswer: account.secretAnswer,
    proxyUsername: account.proxyUsername,
    proxyPassword: account.proxyPassword,
    proxyType: account.proxyType,
    fingerprint: account.fingerprint,
    antidetect: account.antidetect,
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
  const baseExtras = parseNotes(account.notesRaw);
  const extras: AccountExtras = { ...baseExtras };

  if (account.password !== undefined) extras.password = account.password;
  if (account.secretAnswer !== undefined) extras.secretAnswer = account.secretAnswer;
  if (account.proxyUsername !== undefined) extras.proxyUsername = account.proxyUsername;
  if (account.proxyPassword !== undefined) extras.proxyPassword = account.proxyPassword;
  if (account.proxyType !== undefined) extras.proxyType = account.proxyType;
  if (account.fingerprint !== undefined) extras.fingerprint = account.fingerprint;
  if (account.antidetect !== undefined) extras.antidetect = account.antidetect;
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
