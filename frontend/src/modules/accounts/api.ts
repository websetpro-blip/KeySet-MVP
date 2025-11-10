/**
 * API service for Accounts module
 * Handles all HTTP requests to the backend
 */

const API_BASE = "http://localhost:8765/api";

export interface ApiAccount {
  id: number;
  name: string; // email
  profile_path: string | null;
  proxy: string | null;
  status: string;
  created_at: string;
  last_used_at: string | null;
  notes: string | null;
}

export interface CreateAccountPayload {
  name: string;
  profile_path?: string;
  proxy?: string;
  cookies?: string;
  notes?: string;
}

export interface UpdateAccountPayload {
  name?: string;
  profile_path?: string;
  proxy?: string;
  cookies?: string;
  status?: string;
  notes?: string;
}

export interface LaunchAccountResponse {
  status: string;
  account_id: number;
  message: string;
}

export interface ProxyTestResponse {
  status: string;
  proxy: string;
  response_time_ms: number;
}

/**
 * Fetch all accounts
 */
export async function fetchAccounts(): Promise<ApiAccount[]> {
  const response = await fetch(`${API_BASE}/accounts`);
  if (!response.ok) {
    throw new Error(`Failed to fetch accounts: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch single account by ID
 */
export async function fetchAccount(id: number): Promise<ApiAccount> {
  const response = await fetch(`${API_BASE}/accounts/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch account: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Create new account
 */
export async function createAccount(
  payload: CreateAccountPayload
): Promise<ApiAccount> {
  const response = await fetch(`${API_BASE}/accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create account");
  }

  return response.json();
}

/**
 * Update existing account
 */
export async function updateAccount(
  id: number,
  payload: UpdateAccountPayload
): Promise<ApiAccount> {
  const response = await fetch(`${API_BASE}/accounts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update account");
  }

  return response.json();
}

/**
 * Delete account
 */
export async function deleteAccount(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/accounts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete account");
  }
}

/**
 * Launch browser for account
 */
export async function launchAccount(
  id: number
): Promise<LaunchAccountResponse> {
  const response = await fetch(`${API_BASE}/accounts/${id}/launch`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to launch account");
  }

  return response.json();
}

/**
 * Test proxy connection
 */
export async function testProxy(
  host: string,
  port: number,
  username?: string,
  password?: string,
  proxy_type: string = "http"
): Promise<ProxyTestResponse> {
  const response = await fetch(`${API_BASE}/proxies/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      host,
      port,
      username,
      password,
      proxy_type,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to test proxy");
  }

  return response.json();
}
