import { useMemo, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./legacy/styles.css";
import type { Account, AccountsFilters } from "./types";
import { mockAccounts } from "./data/mockAccounts";
import { filterAccounts } from "./utils";
import { TopBar } from "./components/TopBar";
import { SearchFilterBar } from "./components/SearchFilterBar";
import { QuickFilters } from "./components/QuickFilters";
import { AccountsTable } from "./components/AccountsTable";
import { TableSummary } from "./components/TableSummary";
import { AccountSidebar } from "./components/AccountSidebar";

export default function AccountsModule() {
  const [accounts] = useState<Account[]>(mockAccounts);
  const [filters, setFilters] = useState<AccountsFilters>({
    search: "",
    status: "",
    onlyWithProxy: false,
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentAccount, setCurrentAccount] = useState<Account | null>(
    accounts[0] ?? null,
  );

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

  const handleAction = (action: string) => {
    console.log(`[accounts] action -> ${action}`);

    switch (action) {
      case "add":
        alert("Функция 'Добавить аккаунт' в разработке");
        break;
      case "edit":
        if (selectedIds.size === 0) {
          alert("Выберите аккаунт для редактирования");
        } else if (selectedIds.size > 1) {
          alert("Выберите только один аккаунт для редактирования");
        } else {
          alert("Функция 'Редактировать' в разработке");
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
            alert(`Удалено ${selectedIds.size} аккаунтов`);
            setSelectedIds(new Set());
          }
        }
        break;
      case "refresh":
        alert("Обновление списка аккаунтов...");
        break;
      case "launch":
        if (selectedIds.size === 0) {
          alert("Выберите аккаунты для запуска");
        } else {
          alert(`Запуск ${selectedIds.size} аккаунтов...`);
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
            onLaunch={(account) => handleAction(`launch-${account.id}`)}
            onOpenSettings={handleSelectAccount}
          />

          <TableSummary filtered={filteredAccounts.length} total={accounts.length} />
        </div>

        <AccountSidebar
          account={currentAccount}
          onClose={() => {}}
        />
      </div>
    </div>
  );
}
