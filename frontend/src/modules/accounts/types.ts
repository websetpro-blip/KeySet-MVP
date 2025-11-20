export type AccountStatus = "active" | "needs_login" | "error" | "working";

export type GeoPreset = "usa" | "russia" | "kazakhstan" | "nigeria" | "lithuania" | "custom";

export type FingerprintPreset =
  | "russia_standard"
  | "kazakhstan_standard"
  | "usa_standard"
  | "no_spoofing"
  | GeoPreset;

export type WebRTCMode = "disable" | "replace_ip" | "sync_with_proxy" | "manual";
export type CanvasNoise = "off" | "light" | "medium" | "hard";
export type PlatformPreset = "Windows" | "MacOS" | "Linux";

export type ProxyStrategy = "fixed" | "rotate";

export interface ClientHints {
  brands: { brand: string; version: string }[];
  platform: PlatformPreset;
  platformVersion?: string;
  architecture?: string;
  bitness?: string;
  fullVersion?: string;
  mobile?: boolean;
}

export interface AntidetectConfig {
  geo: GeoPreset;
  timezone: string;
  locale: string;
  languages: string[];
  userAgent: string;
  userAgentRandom?: boolean;
  userAgentPool?: string[];
  clientHints?: ClientHints;
  geolocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    jitter?: number;
  };
  screen: {
    width: number;
    height: number;
    dpr: number;
    options?: Array<{ width: number; height: number; dpr: number }>;
  };
  hardware: {
    cores: number;
    memory: number; // GB
    platform: PlatformPreset;
    deviceName: string;
    coresOptions?: number[];
    memoryOptions?: number[];
    webglProfiles?: Array<{ vendor: string; renderer: string }>;
  };
  webglProfile?: { vendor: string; renderer: string };
  webrtc: WebRTCMode;
  canvasNoise: CanvasNoise;
  webglNoise: boolean;
  audioNoise: boolean;
  fontsSpoofing: boolean;
  dnt: boolean;
  dohEnabled: boolean;
}

export interface Account {
  id: number;
  email: string;
  password: string;
  secretAnswer: string;
  profilePath: string;
  status: AccountStatus;
  proxy: string;
  proxyUsername: string;
  proxyPassword: string;
  proxyType: "http" | "https" | "socks5";
  proxyId: string | null;
  proxyStrategy: ProxyStrategy;
  fingerprint: FingerprintPreset;
  /** Расширенный антидетект-конфиг, хранится в notes. */
  antidetect?: AntidetectConfig;
  /** Сервис капчи: none/rucaptcha/2captcha/anticaptcha. */
  captchaService: string;
  /** Включена ли автоматическая разгадайка капчи для аккаунта. */
  captchaAutoSolve: boolean;
  lastLaunch: string;
  authStatus: string;
  lastLogin: string;
  profileSize: string;
  /** Статус cookies по оценке backend (Fresh/Stale/Expired/нет профиля/нет куков). */
  cookiesStatus?: string;
  /** Сырой текст notes из БД — используем как лог аккаунта. */
  notesRaw: string;
  /** Краткое описание консистентности аккаунта (прокси/cookies/профиль). */
  consistencyLabel?: string;
  /** Флаг: есть ли проблемы с консистентностью. */
  consistencyWarning?: boolean;
}

export interface AccountsFilters {
  search: string;
  status: AccountStatus | "";
  onlyWithProxy: boolean;
}
