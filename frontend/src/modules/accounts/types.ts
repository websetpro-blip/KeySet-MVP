export type AccountStatus = "active" | "needs_login" | "error" | "working";

export type FingerprintPreset =
  | "russia_standard"
  | "kazakhstan_standard"
  | "no_spoofing";

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
  fingerprint: FingerprintPreset;
  lastLaunch: string;
  authStatus: string;
  lastLogin: string;
  profileSize: string;
}

export interface AccountsFilters {
  search: string;
  status: AccountStatus | "";
  onlyWithProxy: boolean;
}
