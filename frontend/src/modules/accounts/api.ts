import type { Account } from "./types";
import { apiUrl } from "../../lib/apiClient";

const BASE_URL = apiUrl("/api/accounts");

export async function fetchAccounts(): Promise<Account[]> {
  const response = await fetch(BASE_URL, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Accounts API error (${response.status})`);
  }

  return (await response.json()) as Account[];
}
