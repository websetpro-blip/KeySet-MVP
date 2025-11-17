interface TopBarProps {
  onAction(action: string): void;
}

export function TopBar({ onAction }: TopBarProps) {
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <h1>
          <i className="fas fa-key" /> Аккаунты
        </h1>
        <div className="new-functions">
          <button
            className="btn btn-primary btn-icon-compact"
            type="button"
            title="Массовый запуск (5)"
            onClick={() => onAction("mass-launch-5")}
          >
            <i className="fas fa-rocket" />
          </button>
          <button
            className="btn btn-warning btn-icon-compact"
            type="button"
            title="Запуск браузера"
            onClick={() => onAction("launch-browser")}
          >
            <i className="fas fa-rocket" />
          </button>
          <button
            className="btn btn-info btn-icon-compact"
            type="button"
            title="Проверка консистентности"
            onClick={() => onAction("consistency-check")}
          >
            <i className="fas fa-search" />
          </button>
          <button
            className="btn btn-info btn-icon-compact"
            type="button"
            title="Проверить авторизацию"
            onClick={() => onAction("check-auth")}
          >
            <i className="fas fa-shield-alt" />
          </button>
          <button
            className="btn btn-secondary btn-icon-compact"
            type="button"
            title="Экспорт списка"
            onClick={() => onAction("export-accounts")}
          >
            <i className="fas fa-download" />
          </button>
        </div>
      </div>

      <div className="top-bar-right">
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => onAction("add")}
        >
          <i className="fas fa-plus" /> Добавить
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => onAction("edit")}
        >
          <i className="fas fa-edit" /> Изменить
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => onAction("delete")}
        >
          <i className="fas fa-trash" /> Удалить
        </button>
        <button className="btn btn-info" type="button" onClick={() => onAction("refresh")}>
          <i className="fas fa-sync-alt" /> Обновить
        </button>
      </div>
    </div>
  );
}
