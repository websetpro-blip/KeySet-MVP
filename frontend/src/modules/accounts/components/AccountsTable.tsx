import type { Account } from "../types";
import { Highlight } from "./Highlight";
import { getFingerprintMeta, getStatusMeta } from "../utils";

interface AccountsTableProps {
  accounts: Account[];
  searchTerm: string;
  selectedIds: Set<number>;
  isAllSelected: boolean;
  onToggleAll(checked: boolean): void;
  onToggleRow(id: number): void;
  onSelectAccount(account: Account): void;
  onLaunch(account: Account): void;
  onOpenSettings(account: Account): void;
}

export function AccountsTable({
  accounts,
  searchTerm,
  selectedIds,
  isAllSelected,
  onToggleAll,
  onToggleRow,
  onSelectAccount,
  onLaunch,
  onOpenSettings,
}: AccountsTableProps) {
  return (
    <div className="table-container">
      <table className="accounts-table">
        <thead>
          <tr>
            <th style={{ width: "50px" }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(event) => onToggleAll(event.target.checked)}
              />
            </th>
            <th>Аккаунт</th>
            <th>Статус</th>
            <th>Консистентность</th>
            <th>Прокси</th>
            <th>Отпечаток</th>
            <th>Последний запуск</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody id="accountsTableBody">
          {accounts.map((account) => {
            const statusMeta = getStatusMeta(account.status);
            const fingerprintMeta = getFingerprintMeta(account.fingerprint);
            const isSelected = selectedIds.has(account.id);
            const hasProxy = Boolean(account.proxy);

            return (
              <tr
                key={account.id}
                className="table-row-clickable"
                onClick={(event) => {
                  if (event.target instanceof HTMLInputElement) {
                    return;
                  }
                  onSelectAccount(account);
                }}
              >
                <td>
                  <input
                    type="checkbox"
                    className="account-checkbox"
                    checked={isSelected}
                    onChange={(event) => {
                      onToggleRow(account.id);
                      event.stopPropagation();
                    }}
                  />
                </td>
                <td className="account-email">
                  <Highlight text={account.email} term={searchTerm} />
                </td>
                <td>
                  <span className={`status-badge ${statusMeta.badgeClass}`}>
                    {statusMeta.label}
                  </span>
                </td>
                <td>
                  {account.consistencyLabel ? (
                    <span
                      className={
                        account.consistencyWarning
                          ? "consistency-badge consistency-badge-warning"
                          : "consistency-badge consistency-badge-ok"
                      }
                    >
                      {account.consistencyLabel}
                    </span>
                  ) : (
                    <span className="consistency-badge consistency-badge-unknown">
                      —
                    </span>
                  )}
                </td>
                <td className={hasProxy ? "proxy-info" : "proxy-none"}>
                  <Highlight
                    text={hasProxy ? account.proxy : "Нет"}
                    term={searchTerm}
                  />
                </td>
                <td>
                  <span className={`fingerprint-badge ${fingerprintMeta.badgeClass}`}>
                    {fingerprintMeta.label}
                  </span>
                </td>
                <td className="last-run">{account.lastLaunch}</td>
                <td className="action-buttons-cell">
                  <button
                    className="action-btn action-btn-play"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onLaunch(account);
                    }}
                    aria-label="Запустить аккаунт"
                  >
                    <i className="fas fa-play" />
                  </button>
                  <button
                    className="action-btn action-btn-settings"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenSettings(account);
                    }}
                    aria-label="Настройки аккаунта"
                  >
                    <i className="fas fa-cog" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
