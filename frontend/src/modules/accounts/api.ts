import type { Account } from "./types";

const BASE_URL = "/api/accounts";

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
