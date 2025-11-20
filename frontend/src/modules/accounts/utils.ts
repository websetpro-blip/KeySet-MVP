import type {
  Account,
  AccountStatus,
  AccountsFilters,
  FingerprintPreset,
} from "./types";

const STATUS_META: Record<
  AccountStatus,
  { label: string; badgeClass: string }
> = {
  active: { label: "Вкл., работает", badgeClass: "status-active" },
  needs_login: {
    label: "Нужен логин",
    badgeClass: "status-needs_login",
  },
  error: { label: "Ошибка аккаунта", badgeClass: "status-error" },
  working: { label: "В работе", badgeClass: "status-working" },
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
  usa_standard: {
    label: "🇺🇸 USA Standard",
    badgeClass: "fp-default",
  },
  usa: {
    label: "🇺🇸 USA",
    badgeClass: "fp-default",
  },
  russia: {
    label: "🇷🇺 Russia",
    badgeClass: "fp-russia",
  },
  kazakhstan: {
    label: "🇰🇿 Kazakhstan",
    badgeClass: "fp-kz",
  },
  nigeria: {
    label: "🇳🇬 Nigeria",
    badgeClass: "fp-default",
  },
  lithuania: {
    label: "🇱🇹 Lithuania",
    badgeClass: "fp-default",
  },
  custom: {
    label: "🔧 Custom",
    badgeClass: "fp-default",
  },
  no_spoofing: {
    label: "🌐 Без подмены",
    badgeClass: "fp-default",
  },
};

const FALLBACK_STATUS_META = {
  label: "Неизвестный статус",
  badgeClass: "status-unknown",
};

const FALLBACK_FP_META = {
  label: "Неизвестный пресет",
  badgeClass: "fp-default",
};

export function getStatusMeta(status: AccountStatus | string | undefined) {
  if (!status) {
    return FALLBACK_STATUS_META;
  }
  const normalized = status as AccountStatus;
  return STATUS_META[normalized] ?? FALLBACK_STATUS_META;
}

export function getFingerprintMeta(
  preset: FingerprintPreset | string | undefined,
) {
  if (!preset) {
    return FALLBACK_FP_META;
  }
  const normalized = preset as FingerprintPreset;
  return FINGERPRINT_META[normalized] ?? FALLBACK_FP_META;
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

function buildAccountLogLines(account: Account): string[] {
  const lines: string[] = [];
  lines.push(`Статус авторизации: ${account.authStatus || "—"}`);
  lines.push(`Последний вход: ${account.lastLogin || "—"}`);
  lines.push(`Размер профиля: ${account.profileSize || "—"}`);

  if (account.notesRaw) {
    let extraLines: string[] = [];
    try {
      const parsed = JSON.parse(account.notesRaw);
      if (parsed && typeof parsed === "object") {
        const anyParsed = parsed as any;
        if (Array.isArray(anyParsed.logs)) {
          extraLines = extraLines.concat(
            anyParsed.logs
              .map((line: unknown) => String(line ?? "").trimEnd())
              .filter((line: string) => line.length > 0),
          );
        }
        if (typeof anyParsed.userNotes === "string") {
          extraLines = extraLines.concat(
            anyParsed.userNotes
              .split(/\r?\n/)
              .map((line: string) => line.trimEnd())
              .filter((line: string) => line.length > 0),
          );
        }
      }
    } catch {
      extraLines = account.notesRaw
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter((line) => line.length > 0);
    }
    if (extraLines.length) {
      lines.push("");
      lines.push(...extraLines.slice(-100));
    }
  }

  return lines;
}

export function formatCombinedAccountLog(accounts: Account[]): string {
  if (!accounts.length) {
    return "";
  }
  const lines: string[] = [];

  accounts.forEach((account, index) => {
    lines.push(`=== ${account.email} ===`);
    lines.push(...buildAccountLogLines(account));
    if (index < accounts.length - 1) {
      lines.push("");
    }
  });

  return lines.join("\n");
}
