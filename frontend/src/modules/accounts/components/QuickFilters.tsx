interface QuickFiltersProps {
  onStatusSelect(status: "active" | "needs_login" | "error"): void;
  onProxyOnly(): void;
  onReset(): void;
}

export function QuickFilters({
  onStatusSelect,
  onProxyOnly,
  onReset,
}: QuickFiltersProps) {
  return (
    <div className="quick-filters">
      <button
        className="btn btn-small btn-secondary"
        type="button"
        onClick={() => onStatusSelect("active")}
      >
        Только активные
      </button>
      <button
        className="btn btn-small btn-secondary"
        type="button"
        onClick={() => onStatusSelect("needs_login")}
      >
        Требуют входа
      </button>
      <button
        className="btn btn-small btn-secondary"
        type="button"
        onClick={() => onStatusSelect("error")}
      >
        С ошибками
      </button>
      <button
        className="btn btn-small btn-secondary"
        type="button"
        onClick={onProxyOnly}
      >
        С прокси
      </button>
      <button
        className="btn btn-small btn-secondary"
        type="button"
        onClick={onReset}
      >
        Очистить
      </button>
    </div>
  );
}
