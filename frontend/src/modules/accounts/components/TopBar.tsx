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
            className="btn btn-warning btn-small"
            type="button"
            onClick={() => onAction("launch-browser")}
          >
            <i className="fas fa-rocket" /> Запуск браузера
          </button>
          <button
            className="btn btn-info btn-small"
            type="button"
            onClick={() => onAction("consistency-check")}
          >
            <i className="fas fa-search" /> Проверка консистентности
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
        <button
          className="btn btn-info"
          type="button"
          onClick={() => onAction("refresh")}
        >
          <i className="fas fa-sync-alt" /> Обновить
        </button>
        <button
          className="btn btn-success"
          type="button"
          onClick={() => onAction("launch")}
        >
          <i className="fas fa-play" /> Запустить
        </button>
        <button
          className="btn btn-warning"
          type="button"
          onClick={() => onAction("proxy-manager")}
        >
          <i className="fas fa-cogs" /> Менеджер прокси
        </button>
      </div>
    </div>
  );
}
