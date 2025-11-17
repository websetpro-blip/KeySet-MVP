import { useCallback, useEffect, useMemo, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./legacy/styles.css";

import type { Account, AccountsFilters } from "./types";
import { filterAccounts } from "./utils";
import { TopBar } from "./components/TopBar";
import { SearchFilterBar } from "./components/SearchFilterBar";
import { AccountsTable } from "./components/AccountsTable";
import { AccountSidebar } from "./components/AccountSidebar";
import { AccountLogPanel } from "./components/AccountLogPanel";
import {
  fetchAccounts,
  deleteAccount as apiDeleteAccount,
  launchAccount,
  launchAccounts,
  createAccount,
  updateAccount,
} from "./api";
import {
  apiAccountToAccountWithCookies,
  accountToCreatePayload,
  accountToUpdatePayload,
} from "./mapper";

export default function AccountsModule() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AccountsFilters>({
    search: "",
    status: "",
    onlyWithProxy: false,
  });
  const [clientLogs, setClientLogs] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);

  const appendClientLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleString("ru-RU");
    const line = `[${timestamp}] ${message}`;
    setClientLogs((prev) => {
      const next = [...prev, line];
      return next.slice(-200);
    });
  }, []);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAccounts();
      const mapped = data.map(apiAccountToAccountWithCookies);
      setAccounts(mapped);
    } catch (loadError) {
      setAccounts([]);
      setError(
        (loadError as Error).message ||
          "Не удалось загрузить аккаунты. Проверьте backend.",
      );
      appendClientLog(
        `Ошибка загрузки аккаунтов: ${(loadError as Error).message || "backend недоступен"}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [appendClientLog]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) {
        return prev;
      }
      const next = new Set<number>();
      accounts.forEach((account) => {
        if (prev.has(account.id)) {
          next.add(account.id);
        }
      });
      if (next.size === prev.size) {
        return prev;
      }
      return next;
    });
  }, [accounts]);

  useEffect(() => {
    setCurrentAccount((prev) => {
      if (prev && accounts.some((account) => account.id === prev.id)) {
        return prev;
      }
      return accounts[0] ?? null;
    });
  }, [accounts]);

  const filteredAccounts = useMemo(
    () => filterAccounts(accounts, filters),
    [accounts, filters],
  );

  const isAllSelected =
    filteredAccounts.length > 0 &&
    filteredAccounts.every((account) => selectedIds.has(account.id));

  const handleToggleAll = (checked: boolean) => {
    const next = new Set(selectedIds);

    if (checked) {
      filteredAccounts.forEach((account) => next.add(account.id));
    } else {
      filteredAccounts.forEach((account) => next.delete(account.id));
    }

    setSelectedIds(next);
  };

  const handleToggleRow = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAccount = (account: Account) => {
    setCurrentAccount(account);
  };

  const handleAction = async (action: string) => {
    const ids = Array.from(selectedIds);

    const pickSingleAccount = (): Account | null => {
      if (ids.length !== 1) {
        alert("Выберите один аккаунт");
        return null;
      }
      const target = accounts.find((item) => item.id === ids[0]) ?? null;
      if (!target) {
        alert("Аккаунт не найден");
      }
      return target;
    };

    try {
      if (action.startsWith("launch-")) {
        const id = Number(action.split("-")[1]);
        if (!Number.isNaN(id)) {
          const response = await launchAccount(id);
          alert(response.message);
        }
        return;
      }

      switch (action) {
        case "mass-launch-5": {
          const targetIds =
            ids.length > 0 ? ids.slice(0, 5) : accounts.slice(0, 5).map((a) => a.id);
          if (targetIds.length === 0) {
            alert("Нет аккаунтов для запуска");
            return;
          }
          await launchAccounts({ ids: targetIds });
          break;
        }
        case "check-auth": {
          const targetAccounts = ids.length
            ? accounts.filter((acc) => ids.includes(acc.id))
            : accounts.slice(0, 5);
          if (targetAccounts.length === 0) {
            alert("Нет аккаунтов для проверки");
            return;
          }
          const lines = targetAccounts.map(
            (acc) => `${acc.email}: ${acc.authStatus || "Неизвестно"} (посл. вход ${acc.lastLogin || "—"})`,
          );
          alert(lines.join("\n"));
          break;
        }
        case "export-accounts": {
          if (accounts.length === 0) {
            alert("Список аккаунтов пуст");
            return;
          }
          const headers = [
            "email",
            "status",
            "proxy",
            "fingerprint",
            "lastLaunch",
            "authStatus",
            "lastLogin",
            "profileSize",
          ];
          const rows = accounts.map((acc) =>
            [
              acc.email,
              acc.status,
              acc.proxy,
              acc.fingerprint,
              acc.lastLaunch,
              acc.authStatus,
              acc.lastLogin,
              acc.profileSize,
            ]
              .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
              .join(","),
          );
          const csv = [headers.join(","), ...rows].join("\n");
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "accounts_export.csv";
          link.click();
          URL.revokeObjectURL(url);
          break;
        }
        case "show-history": {
          const historyLines = accounts
            .slice()
            .sort((a, b) => b.lastLaunch.localeCompare(a.lastLaunch))
            .slice(0, 5)
            .map((acc) => `${acc.email}: ${acc.lastLaunch || "никогда"} (${acc.status})`);
          alert(historyLines.join("\n") || "История пуста");
          break;
        }
        case "add": {
          const email = window.prompt("Email аккаунта Yandex");
          if (!email) return;
          const profilePath = window.prompt("Путь к профилю Chrome", `C:\\profiles\\${email}`);
          if (!profilePath) return;
          const proxy = window.prompt("Прокси (user:pass@host:port)", "");
          const payload = accountToCreatePayload({
            email,
            profilePath,
            proxy: proxy || undefined,
          });
          await createAccount(payload);
          await loadAccounts();
          break;
        }
        case "edit": {
          const current = pickSingleAccount();
          if (!current) return;
          const nextProfile = window.prompt("Новый путь к профилю", current.profilePath) ?? current.profilePath;
          const nextProxy = window.prompt("Прокси", current.proxy) ?? current.proxy;
          const payload = accountToUpdatePayload({
            profilePath: nextProfile,
            proxy: nextProxy,
          });
          await updateAccount(current.id, payload);
          await loadAccounts();
          break;
        }
        case "delete": {
          if (ids.length === 0) {
            alert("Выберите аккаунты для удаления");
            return;
          }
          const confirmed = window.confirm(
            `Удалить выбранные аккаунты (${ids.length})? Действие нельзя отменить.`,
          );
          if (!confirmed) return;
          for (const id of ids) {
            await apiDeleteAccount(id);
          }
          await loadAccounts();
          setSelectedIds(new Set());
          break;
        }
        case "refresh":
          await loadAccounts();
          break;
        case "launch":
        case "launch-browser": {
          if (ids.length === 0) {
            alert("Выберите аккаунты для запуска");
            return;
          }
          await launchAccounts({ ids });
          break;
        }
        case "proxy-manager":
          alert("Открытие менеджера прокси пока не реализовано.");
          break;
        case "consistency-check":
          alert("Проверка консистентности находится в разработке.");
          break;
        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
      appendClientLog(`Ошибка действия "${action}": ${message}`);
    }
  };

  return (
    <div className="app-container">
      <TopBar onAction={handleAction} />

      <div className="main-content">
        <div className="table-section">
          <SearchFilterBar
            search={filters.search}
            status={filters.status}
            filteredCount={filteredAccounts.length}
            totalCount={accounts.length}
            onSearchChange={(value) =>
              setFilters((prev) => ({ ...prev, search: value }))
            }
            onStatusChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value }))
            }
          />

          {isLoading ? (
            <div
              style={{
                padding: "24px",
                border: "1px dashed #d1d5db",
                borderRadius: "12px",
                textAlign: "center",
                color: "#4b5563",
                marginTop: "16px",
              }}
            >
              Загрузка аккаунтов…
            </div>
          ) : error ? (
            <div
              style={{
                padding: "20px",
                border: "1px solid #fecaca",
                borderRadius: "12px",
                background: "#fef2f2",
                color: "#b91c1c",
                marginTop: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <span>{error}</span>
              <button
                type="button"
                className="action-btn"
                onClick={loadAccounts}
                style={{ minWidth: "140px" }}
              >
                Повторить
              </button>
            </div>
          ) : (
            <div className="table-log-container">
              <div className="accounts-table-wrapper">
                <div className="accounts-table-scroll">
                  <AccountsTable
                    accounts={filteredAccounts}
                    searchTerm={filters.search}
                    selectedIds={selectedIds}
                    isAllSelected={isAllSelected}
                    onToggleAll={handleToggleAll}
                    onToggleRow={handleToggleRow}
                    onSelectAccount={handleSelectAccount}
                    onLaunch={(account) => handleAction(`launch-${account.id}`)}
                    onOpenSettings={handleSelectAccount}
                  />
                </div>
              </div>

              <div className="account-log-panel-wrapper">
                <AccountLogPanel accounts={accounts} extraLogs={clientLogs} />
              </div>
            </div>
          )}
        </div>

        <AccountSidebar
          account={currentAccount}
          onClose={() => {}}
          onLog={appendClientLog}
          onReloadAccounts={loadAccounts}
          onUpdateAccount={async (id: number, changes: Partial<Account>) => {
            const payload = accountToUpdatePayload(changes);
            const updated = await updateAccount(id, payload);
            const mapped = apiAccountToAccountWithCookies(updated);
            setAccounts((prev) => prev.map((acc) => (acc.id === id ? mapped : acc)));
            setCurrentAccount((prev) => (prev && prev.id === id ? mapped : prev));
          }}
        />
      </div>
    </div>
  );
}
