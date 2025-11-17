export type AccountStatus = "active" | "needs_login" | "error" | "working";

export type FingerprintPreset =
  | "russia_standard"
  | "kazakhstan_standard"
  | "no_spoofing";

export type ProxyStrategy = "fixed" | "rotate";

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
