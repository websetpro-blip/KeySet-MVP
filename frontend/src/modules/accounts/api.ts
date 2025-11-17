import { apiUrl } from "../../lib/apiClient";

const API_BASE = apiUrl("/api");
const ACCOUNTS_URL = `${API_BASE}/accounts`;
const PROXIES_URL = `${API_BASE}/proxies`;

export interface ApiAccount {
  id: number;
  name: string;
  profile_path: string | null;
  proxy: string | null;
  proxy_id?: string | null;
  proxy_strategy?: string | null;
  status: string;
   cookies_status?: string | null;
  created_at: string | null;
  last_used_at: string | null;
  notes: string | null;
}

export interface CreateAccountPayload {
  name: string;
  profile_path: string;
  proxy?: string | null;
  notes?: string | null;
  proxy_id?: string | null;
  proxy_strategy?: string;
  captcha_key?: string | null;
}

export interface UpdateAccountPayload {
  name?: string;
  profile_path?: string;
  proxy?: string | null;
  status?: string;
  notes?: string | null;
  proxy_id?: string | null;
  proxy_strategy?: string;
  captcha_key?: string | null;
}

export interface LaunchAccountResponse {
  status: string;
  account_id: number;
  message: string;
  cdp_port: number;
}

export interface BulkLaunchResponse {
  results: LaunchAccountResponse[];
}

export interface LaunchAccountsPayload {
  ids: number[];
  start_url?: string;
  base_port?: number;
}

export interface UploadCookiesResponse {
  status: string;
  path: string;
}

export interface AutologinResponse {
  ok: boolean;
  message: string;
  storage_path?: string;
}

export interface ProxyTestResponse {
  status: string;
  proxy: string;
  response_time_ms?: number;
  ip?: string | null;
  error?: string | null;
}

export interface ProxyItem {
  id: string;
  label: string;
  type: string;
  server: string;
  username?: string | null;
  password?: string | null;
  geo?: string | null;
  sticky: boolean;
  max_concurrent: number;
  enabled: boolean;
  notes: string;
  last_check?: number | null;
  last_ip?: string | null;
}

export interface ProxyListResponse {
  status: string;
  items: ProxyItem[];
}

export interface ProxyAssignResponse {
  status: string;
  account_id: number;
  proxy_id: string | null;
  strategy: string;
}

export interface ProxyUpsertPayload {
  label: string;
  server: string;
  type?: string;
  username?: string | null;
  password?: string | null;
  geo?: string | null;
  sticky?: boolean;
  maxConcurrent?: number;
  enabled?: boolean;
  notes?: string | null;
}

export interface ParseProxiesOptions {
  sources: string[];
  protocol?: string;
  country?: string;
  count?: number;
}

export interface ParseProxiesResponse {
  success: boolean;
  found: number;
  valid: number;
  added: number;
  items: ProxyItem[];
}

export interface TestAllProxiesResponse {
  success: boolean;
  tested: number;
  ok: number;
  failed: number;
}

export interface ClearProxiesResponse {
  status: string;
  removed: number;
}

export interface ProfilesRootResponse {
  status: string;
  path: string;
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    let message = response.statusText;
    try {
      const payload = await response.json();
      message = payload.detail || JSON.stringify(payload);
    } catch {
      // ignore json parse errors
    }
    throw new Error(message || "Ошибка запроса");
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export function fetchAccounts(): Promise<ApiAccount[]> {
  return request<ApiAccount[]>(ACCOUNTS_URL, {
    headers: { "Content-Type": "application/json" },
  });
}

export function fetchAccount(id: number): Promise<ApiAccount> {
  return request<ApiAccount>(`${ACCOUNTS_URL}/${id}`, {
    headers: { "Content-Type": "application/json" },
  });
}

export function createAccount(payload: CreateAccountPayload): Promise<ApiAccount> {
  return request<ApiAccount>(ACCOUNTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateAccount(
  id: number,
  payload: UpdateAccountPayload
): Promise<ApiAccount> {
  return request<ApiAccount>(`${ACCOUNTS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteAccount(id: number): Promise<void> {
  await request(`${ACCOUNTS_URL}/${id}`, { method: "DELETE" });
}

export function launchAccount(id: number): Promise<LaunchAccountResponse> {
  return request<LaunchAccountResponse>(`${ACCOUNTS_URL}/${id}/launch`, {
    method: "POST",
  });
}

export function launchAccounts(payload: LaunchAccountsPayload): Promise<BulkLaunchResponse> {
  return request<BulkLaunchResponse>(`${ACCOUNTS_URL}/launch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function uploadAccountCookies(
  id: number,
  file: File
): Promise<UploadCookiesResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${ACCOUNTS_URL}/${id}/cookies`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Не удалось загрузить куки");
  }
  return (await response.json()) as UploadCookiesResponse;
}

export function autologinAccount(id: number): Promise<AutologinResponse> {
  return request<AutologinResponse>(`${ACCOUNTS_URL}/${id}/autologin`, {
    method: "POST",
  });
}

export function deleteAccountCookies(id: number): Promise<UploadCookiesResponse> {
  return request<UploadCookiesResponse>(`${ACCOUNTS_URL}/${id}/cookies`, {
    method: "DELETE",
  });
}

export function testProxy(
  host: string,
  port: number,
  username?: string,
  password?: string,
  proxy_type: string = "http"
): Promise<ProxyTestResponse> {
  return request<ProxyTestResponse>(`${PROXIES_URL}/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host, port, username, password, proxy_type }),
  });
}

export function fetchProxies(): Promise<ProxyListResponse> {
  return request<ProxyListResponse>(`${PROXIES_URL}`, {
    method: "GET",
  });
}

export function assignProxyToAccount(
  accountId: number,
  proxyId: string | null,
  strategy: string = "fixed"
): Promise<ProxyAssignResponse> {
  return request<ProxyAssignResponse>(`${PROXIES_URL}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_id: accountId, proxy_id: proxyId, strategy }),
  });
}

export function parseProxies(options: ParseProxiesOptions): Promise<ParseProxiesResponse> {
  return request<ParseProxiesResponse>(`${PROXIES_URL}/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
}

export function testAllProxies(ids?: string[]): Promise<TestAllProxiesResponse> {
  const payload = ids && ids.length ? { ids } : undefined;
  return request<TestAllProxiesResponse>(`${PROXIES_URL}/test-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

export function clearProxies(ids?: string[]): Promise<ClearProxiesResponse> {
  const payload = ids && ids.length ? { ids } : undefined;
  return request<ClearProxiesResponse>(`${PROXIES_URL}/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

function mapProxyPayload(payload: ProxyUpsertPayload): Record<string, unknown> {
  return {
    label: payload.label,
    server: payload.server,
    type: payload.type ?? "http",
    username: payload.username ?? undefined,
    password: payload.password ?? undefined,
    geo: payload.geo ?? undefined,
    sticky: payload.sticky ?? true,
    max_concurrent: payload.maxConcurrent ?? 10,
    enabled: payload.enabled ?? true,
    notes: payload.notes ?? "",
  };
}

export function createProxy(payload: ProxyUpsertPayload): Promise<ProxyItem> {
  return request<ProxyItem>(`${PROXIES_URL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapProxyPayload(payload)),
  });
}

export function updateProxy(id: string, payload: ProxyUpsertPayload): Promise<ProxyItem> {
  return request<ProxyItem>(`${PROXIES_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapProxyPayload(payload)),
  });
}

export async function deleteProxy(id: string): Promise<void> {
  await request(`${PROXIES_URL}/${id}`, {
    method: "DELETE",
  });
}

export function openProfilesRoot(): Promise<ProfilesRootResponse> {
  return request<ProfilesRootResponse>(`${ACCOUNTS_URL}/profiles-root/open`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

export function openAccountProfileDirectory(id: number): Promise<ProfilesRootResponse> {
  return request<ProfilesRootResponse>(`${ACCOUNTS_URL}/${id}/profile/open`, {
    method: "POST",
  });
}

export function ensureAccountProfileDirectory(id: number): Promise<ProfilesRootResponse> {
  return request<ProfilesRootResponse>(`${ACCOUNTS_URL}/${id}/profile/ensure`, {
    method: "POST",
  });
}
