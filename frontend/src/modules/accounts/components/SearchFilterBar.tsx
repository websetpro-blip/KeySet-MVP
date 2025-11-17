import type { AccountStatus } from "../types";

interface SearchFilterBarProps {
  search: string;
  status: AccountStatus | "";
  filteredCount: number;
  totalCount: number;
  onSearchChange(value: string): void;
  onStatusChange(value: AccountStatus | ""): void;
}

export function SearchFilterBar({
  search,
  status,
  filteredCount,
  totalCount,
  onSearchChange,
  onStatusChange,
}: SearchFilterBarProps) {
  return (
    <div className="search-filter-bar">
      <label className="search-box">
        <i className="fas fa-search" aria-hidden />
        <input
          type="text"
          placeholder="Поиск по email..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <div className="filter-box">
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as AccountStatus | "")
          }
        >
          <option value="">Все статусы</option>
          <option value="active">✅ Активен</option>
          <option value="needs_login">⚠️ Требует входа</option>
          <option value="error">❌ Ошибка</option>
          <option value="working">🔄 В работе</option>
        </select>
      </div>

      <div className="search-counter" aria-label="Результаты поиска">
        <span className="counter-current">{filteredCount}</span>
        <span className="counter-separator">/</span>
        <span className="counter-total">{totalCount}</span>
      </div>
    </div>
  );
}
