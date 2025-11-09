import "@fortawesome/fontawesome-free/css/all.min.css";
import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

const NAV_LINKS = [
  { to: "/accounts", label: "Аккаунты" },
  { to: "/masks", label: "Маски" },
  { to: "/data", label: "Данные" },
  { to: "/analytics", label: "Аналитика" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const handleMinimize = () => {
    if (window.pywebview?.api) {
      window.pywebview.api.minimize().catch(console.error);
    }
  };

  const handleMaximize = () => {
    if (window.pywebview?.api) {
      window.pywebview.api.maximize().catch(console.error);
    }
  };

  const handleClose = () => {
    if (window.pywebview?.api) {
      window.pywebview.api.close().catch(console.error);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <nav className="app-shell__tabs">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  "app-shell__tab",
                  isActive ? "app-shell__tab--active" : "",
                ]
                  .join(" ")
                  .trim()
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-shell__window-controls" aria-hidden>
          <button
            type="button"
            className="window-btn window-btn--flat"
            aria-label="Свернуть"
            onClick={handleMinimize}
          >
            <i className="fas fa-minus" />
          </button>
          <button
            type="button"
            className="window-btn window-btn--flat"
            aria-label="Развернуть"
            onClick={handleMaximize}
          >
            <i className="fas fa-up-right-and-down-left-from-center" />
          </button>
          <button
            type="button"
            className="window-btn window-btn--flat window-btn--danger"
            aria-label="Закрыть"
            onClick={handleClose}
          >
            <i className="fas fa-xmark" />
          </button>
        </div>
      </header>

      <main className="app-shell__content">
        <div className="app-shell__inner">{children}</div>
      </main>
    </div>
  );
}
