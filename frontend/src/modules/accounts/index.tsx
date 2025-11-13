import { useEffect, useMemo, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./legacy/styles.css";
import type { Account, AccountsFilters } from "./types";
import { filterAccounts } from "./utils";
import { TopBar } from "./components/TopBar";
import { SearchFilterBar } from "./components/SearchFilterBar";
import { QuickFilters } from "./components/QuickFilters";
import { AccountsTable } from "./components/AccountsTable";
import { TableSummary } from "./components/TableSummary";
import { AccountSidebar } from "./components/AccountSidebar";
import { AddAccountDialog } from "./components/AddAccountDialog";
import * as api from "./api";
import { apiAccountToAccount, accountToUpdatePayload } from "./mapper";

export default function AccountsModule() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AccountsFilters>({
    search: "",
    status: "",
    onlyWithProxy: false,
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Fetch accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiAccounts = await api.fetchAccounts();
      const mappedAccounts = apiAccounts.map(apiAccountToAccount);
      setAccounts(mappedAccounts);
      if (mappedAccounts.length > 0 && !currentAccount) {
        setCurrentAccount(mappedAccounts[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
      console.error("Failed to load accounts:", err);
    } finally {
      setLoading(false);
    }
  };

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
    console.log(`[accounts] action -> ${action}`);

    try {
      switch (action) {
        case "add":
          setShowAddDialog(true);
          break;

        case "edit":
          if (selectedIds.size === 0) {
            alert("Выберите аккаунт для редактирования");
          } else if (selectedIds.size > 1) {
            alert("Выберите только один аккаунт для редактирования");
          } else {
            const accountId = Array.from(selectedIds)[0];
            const account = accounts.find((acc) => acc.id === accountId);
            if (account) {
              setCurrentAccount(account);
              alert("Отредактируйте аккаунт в боковой панели справа");
            }
          }
          break;

        case "delete":
          if (selectedIds.size === 0) {
            alert("Выберите аккаунты для удаления");
          } else {
            const confirmed = window.confirm(
              `Удалить выбранные аккаунты (${selectedIds.size})? Это действие нельзя отменить.`
            );
            if (confirmed) {
              await handleDeleteAccounts(Array.from(selectedIds));
            }
          }
          break;

        case "refresh":
          await loadAccounts();
          alert("Список аккаунтов обновлён");
          break;

        case "launch":
          if (selectedIds.size === 0) {
            alert("Выберите аккаунты для запуска");
          } else {
            await handleLaunchAccounts(Array.from(selectedIds));
          }
          break;

        case "proxy-manager":
          alert("Открытие менеджера прокси...");
          break;

        case "launch-browser":
          alert("Запуск браузера...");
          break;

        case "consistency-check":
          alert("Проверка консистентности данных...");
          break;

        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (err) {
      alert(`Ошибка: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleDeleteAccounts = async (ids: number[]) => {
    try {
      for (const id of ids) {
        await api.deleteAccount(id);
      }
      alert(`Удалено ${ids.length} аккаунтов`);
      setSelectedIds(new Set());
      await loadAccounts();
    } catch (err) {
      throw new Error(`Не удалось удалить аккаунты: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleLaunchAccounts = async (ids: number[]) => {
    try {
      const results = await Promise.allSettled(
        ids.map((id) => api.launchAccount(id))
      );

      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (failed > 0) {
        alert(`Запущено: ${succeeded}, ошибок: ${failed}`);
      } else {
        alert(`Успешно запущено ${succeeded} аккаунтов`);
      }
    } catch (err) {
      throw new Error(`Не удалось запустить аккаунты: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleCreateAccount = async (payload: api.CreateAccountPayload) => {
    const response = await api.createAccount(payload);
    const newAccount = apiAccountToAccount(response);
    setAccounts(prev => [...prev, newAccount]);
    setCurrentAccount(newAccount);
    alert(`Аккаунт ${newAccount.email} успешно создан`);
  };

  const handleQuickStatus = (status: "active" | "needs_login" | "error") => {
    setFilters((prev) => ({
      ...prev,
      status,
      onlyWithProxy: false,
    }));
  };

  const handleProxyOnly = () => {
    setFilters((prev) => ({
      ...prev,
      onlyWithProxy: true,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "",
      onlyWithProxy: false,
    });
    setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <div className="app-container">
        <TopBar onAction={handleAction} />
        <div className="main-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
          <p style={{ color: "#6b7280", fontSize: "16px" }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />
            Загрузка аккаунтов...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <TopBar onAction={handleAction} />
        <div className="main-content" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "400px" }}>
          <p style={{ color: "#ef4444", fontSize: "16px", marginBottom: "16px" }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: "8px" }} />
            {error}
          </p>
          <button
            className="btn btn-primary"
            onClick={loadAccounts}
            type="button"
          >
            <i className="fas fa-redo" style={{ marginRight: "8px" }} />
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <TopBar onAction={handleAction} />

      <div className="main-content">
        <div className="table-section">
          <SearchFilterBar
            search={filters.search}
            status={filters.status}
            onSearchChange={(value) =>
              setFilters((prev) => ({ ...prev, search: value }))
            }
            onStatusChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value }))
            }
          />

          <QuickFilters
            onStatusSelect={handleQuickStatus}
            onProxyOnly={handleProxyOnly}
            onReset={handleResetFilters}
          />

          <AccountsTable
            accounts={filteredAccounts}
            searchTerm={filters.search}
            selectedIds={selectedIds}
            isAllSelected={isAllSelected}
            onToggleAll={handleToggleAll}
            onToggleRow={handleToggleRow}
            onSelectAccount={handleSelectAccount}
            onLaunch={async (account) => {
              try {
                await api.launchAccount(account.id);
                alert(`Браузер для ${account.email} запущен`);
              } catch (err) {
                alert(`Ошибка запуска: ${err instanceof Error ? err.message : "Unknown error"}`);
              }
            }}
            onOpenSettings={handleSelectAccount}
          />

          <TableSummary filtered={filteredAccounts.length} total={accounts.length} />
        </div>

        <AccountSidebar
          account={currentAccount}
          onAccountUpdate={async (updated) => {
            if (!updated.id) return;
            try {
              const payload = accountToUpdatePayload(updated);
              const response = await api.updateAccount(updated.id, payload);
              const mappedAccount = apiAccountToAccount(response);
              setAccounts(prev => prev.map(acc => acc.id === updated.id ? mappedAccount : acc));
              setCurrentAccount(mappedAccount);
              alert("Аккаунт успешно обновлён");
            } catch (err) {
              alert(`Ошибка обновления: ${err instanceof Error ? err.message : "Unknown error"}`);
            }
          }}
          onClose={() => {}}
        />
      </div>

      {showAddDialog && (
        <AddAccountDialog
          onSubmit={handleCreateAccount}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </div>
  );
}
