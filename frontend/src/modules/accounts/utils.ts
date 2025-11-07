import type { Account, AccountStatus, AccountsFilters, FingerprintPreset } from "./types";

const STATUS_META: Record<
  AccountStatus,
  { label: string; badgeClass: string }
> = {
  active: { label: "✅ Активен", badgeClass: "status-active" },
  needs_login: { label: "⚠️ Требует входа", badgeClass: "status-needs_login" },
  error: { label: "❌ Ошибка", badgeClass: "status-error" },
  working: { label: "🔄 В работе", badgeClass: "status-working" },
};

const FINGERPRINT_META: Record<
  FingerprintPreset,
  { label: string; badgeClass: string }
> = {
  russia_standard: {
    label: "🇷🇺 Russia Standard",
    badgeClass: "fp-russia",
  },
  kazakhstan_standard: {
    label: "🇰🇿 Kazakhstan Standard",
    badgeClass: "fp-kz",
  },
  no_spoofing: {
    label: "🧩 Без подмены",
    badgeClass: "fp-default",
  },
};

export function getStatusMeta(status: AccountStatus) {
  return STATUS_META[status];
}

export function getFingerprintMeta(preset: FingerprintPreset) {
  return FINGERPRINT_META[preset];
}

export function filterAccounts(
  accounts: Account[],
  filters: AccountsFilters,
) {
  const { search, status, onlyWithProxy } = filters;
  const normalizedSearch = search.trim().toLowerCase();

  return accounts.filter((account) => {
    if (status && account.status !== status) {
      return false;
    }

    if (onlyWithProxy && !account.proxy) {
      return false;
    }

    if (normalizedSearch) {
      const haystacks = [
        account.email,
        account.proxy,
        account.authStatus,
        account.fingerprint,
      ]
        .filter(Boolean)
        .map((value) => value.toLowerCase());

      if (!haystacks.some((value) => value.includes(normalizedSearch))) {
        return false;
      }
    }

    return true;
  });
}

export function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function splitBySearchTerm(text: string, term: string) {
  if (!term.trim()) {
    return [text];
  }

  const safeTerm = escapeRegExp(term.trim());
  const regex = new RegExp(`(${safeTerm})`, "gi");
  return text.split(regex).filter(Boolean);
}
