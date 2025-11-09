# -*- coding: utf-8 -*-
"""Главное окно KeySet (Comet-версия интерфейса).
Вкладки: Аккаунты / Парсинг / Маски; снизу док-история.
"""
from __future__ import annotations

import json
import importlib
import logging
from pathlib import Path
from typing import Any, Optional, Callable

from PySide6.QtCore import Qt
from PySide6.QtGui import QIcon
from PySide6.QtWidgets import (
    QApplication,
    QDialog,
    QDialogButtonBox,
    QFormLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMessageBox,
    QPlainTextEdit,
    QTabWidget,
    QTextEdit,
    QSplitter,
    QVBoxLayout,
    QWidget,
)

from .keys_panel import KeysPanel
from .widgets.activity_log import ActivityLogWidget
from .module_autoloader import create_autoloader

logger = logging.getLogger(__name__)

try:
    from .tabs.parsing_tab_v5 import ParsingTabV5 as ParsingTab
except ImportError:
    try:
        from .tabs.parsing_tab import ParsingTab
    except ImportError:
        ParsingTab = None


class AccountDialog(QDialog):
    """Диалог создания/редактирования аккаунта Яндекса."""

    def __init__(self, parent: QWidget | None = None, *, data: Optional[dict[str, Any]] = None) -> None:
        super().__init__(parent)
        self.setWindowTitle("Аккаунт")

        self.name_edit = QLineEdit(placeholderText="Логин (например: dsmismirnov)")
        self.password_edit = QLineEdit()
        self.password_edit.setEchoMode(QLineEdit.Password)
        self.password_edit.setPlaceholderText("Пароль")
        self.secret_edit = QLineEdit(placeholderText="Ответ на секретный вопрос (необязательно)")
        self.profile_edit = QLineEdit(placeholderText="Путь к профилю (по умолчанию .profiles/<логин>)")
        self.proxy_edit = QLineEdit(placeholderText="ip:port@user:pass или ip:port")
        self.notes_edit = QPlainTextEdit()
        self.notes_edit.setPlaceholderText("Заметки")
        self.notes_edit.setMaximumHeight(60)

        buttons = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)

        form = QFormLayout(self)
        form.addRow("Логин:", self.name_edit)
        form.addRow("Пароль:", self.password_edit)
        form.addRow("Секретный ответ:", self.secret_edit)
        form.addRow("Путь к профилю:", self.profile_edit)
        form.addRow("Прокси:", self.proxy_edit)
        form.addRow("Заметки:", self.notes_edit)
        form.addRow(buttons)

        if data:
            self.name_edit.setText(data.get("name", ""))
            self.password_edit.setText(data.get("password", ""))
            self.secret_edit.setText(data.get("secret_answer", ""))
            self.profile_edit.setText(data.get("profile_path", ""))
            self.proxy_edit.setText(data.get("proxy") or "")
            self.notes_edit.setPlainText(data.get("notes") or "")

        self._result: Optional[dict[str, Any]] = None

    def accept(self) -> None:  # type: ignore[override]
        name = self.name_edit.text().strip()
        if not name:
            QMessageBox.warning(self, "Проверка", "Укажите логин аккаунта")
            return

        password = self.password_edit.text().strip()
        if not password:
            QMessageBox.warning(self, "Проверка", "Укажите пароль")
            return

        profile_path = self.profile_edit.text().strip() or f".profiles/{name}"
        secret_answer = self.secret_edit.text().strip() or None
        proxy = self.proxy_edit.text().strip() or None
        notes = self.notes_edit.toPlainText().strip() or None

        accounts_file = ACCOUNTS_CONFIG_PATH
        accounts_file.parent.mkdir(parents=True, exist_ok=True)
        accounts: list[dict[str, Any]] = []
        if accounts_file.exists():
            accounts = json.loads(accounts_file.read_text(encoding="utf-8"))

        for acc in accounts:
            if acc.get("login") == name:
                QMessageBox.warning(self, "Ошибка", f"Аккаунт {name} уже существует")
                return

        accounts.append({
            "login": name,
            "password": password,
            "secret": secret_answer,
            "proxy": proxy,
        })
        accounts_file.write_text(json.dumps(accounts, ensure_ascii=False, indent=2), encoding="utf-8")

        self._result = {
            "name": name,
            "profile_path": profile_path,
            "proxy": proxy,
            "notes": notes,
        }
        super().accept()

    def get_data(self) -> Optional[dict[str, Any]]:
        return self._result


class MainWindow(QMainWindow):
    """Главное окно KeySet с вкладками Аккаунты/Парсинг/Маски."""

    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("KeySet — парсер Wordstat/Direct")
        self._apply_icon()

        self.tabs = QTabWidget(self)
        self.log_widget = ActivityLogWidget(self)
        self.log_widget.setMinimumHeight(160)

        self.keys_panel = KeysPanel(self)

        left_stack = QSplitter(Qt.Vertical, self)
        left_stack.setChildrenCollapsible(False)
        left_stack.addWidget(self.tabs)
        left_stack.addWidget(self.log_widget)
        left_stack.setStretchFactor(0, 4)
        left_stack.setStretchFactor(1, 1)

        splitter = QSplitter(Qt.Horizontal, self)
        splitter.setChildrenCollapsible(False)
        splitter.addWidget(left_stack)
        splitter.addWidget(self.keys_panel)
        splitter.setStretchFactor(0, 4)
        splitter.setStretchFactor(1, 1)

        self.setCentralWidget(splitter)

        # Используем новый accounts_v2 модуль с CARDVANCE дизайном
        self.accounts = self._instantiate_widget(
            module="keyset.modules.accounts_v2.widget",
            class_name="AccountsV2Widget",
            parent=self,
            fallback=lambda parent: QWidget(parent),
        )
        self.tabs.addTab(self.accounts, "🔑 Аккаунты")

        if ParsingTab is not None:
            try:
                self.parsing = ParsingTab(parent=self, keys_panel=self.keys_panel, activity_log=self.log_widget)
            except TypeError:
                try:
                    self.parsing = ParsingTab(parent=self, keys_panel=self.keys_panel)
                except TypeError:
                    try:
                        self.parsing = ParsingTab(parent=self)
                    except TypeError:
                        self.parsing = ParsingTab()
        else:
            self.parsing = self._instantiate_widget(
                module="keyset.app.tabs.parsing_tab",
                class_name="ParsingTab",
                parent=self,
                fallback=lambda parent: QWidget(parent),
            )
        if hasattr(self.parsing, "set_keys_panel"):
            try:
                self.parsing.set_keys_panel(self.keys_panel)  # type: ignore[attr-defined]
            except Exception:
                pass
        self.tabs.addTab(self.parsing, "Парсинг")

        self.masks = self._instantiate_masks(
            module="keyset.app.tabs.maskstab",
            class_name="MasksTab",
            parent=self,
            fallback=lambda parent: QWidget(parent),
        )
        self.tabs.addTab(self.masks, "Маски")

        # Автозагрузка модулей из modules/
        self._load_modules()

        self._apply_qss()
        self._connect_signals()
        self._setup_tab_switching()
        self.log_event("Приложение запущено")

    def _load_modules(self) -> None:
        """Автоматическая загрузка модулей из директории modules/ с использованием autoloader"""
        try:
            # Create autoloader
            autoloader = create_autoloader()
            
            # Load all modules with app context
            loaded_modules = autoloader.load_all_modules(app_context=self)
            
            # Mount modules as tabs
            for loaded in loaded_modules:
                # Build tab title with optional icon
                tab_title = loaded.metadata.title
                if loaded.metadata.icon:
                    tab_title = f"{loaded.metadata.icon} {loaded.metadata.title}"
                
                # Add tab to main window
                self.tabs.addTab(loaded.widget, tab_title)
                
                # Log success
                self.log_event(f"✓ Модуль {loaded.metadata.id} загружен")
            
            # Store autoloader for cleanup
            self._module_autoloader = autoloader
            
        except Exception as e:
            logger.error(f"Error loading modules: {e}", exc_info=True)
            self.log_event(f"Ошибка загрузки модулей: {e}", level="ERROR")

    @staticmethod
    def _supports_callback(cls: Callable) -> bool:
        init = getattr(cls, "__init__", None)
        code = getattr(init, "__code__", None)
        return bool(getattr(code, "co_varnames", ())) and "send_to_parsing_callback" in code.co_varnames if code else False

    def _instantiate_widget(
        self,
        *,
        module: str,
        class_name: str,
        parent: QWidget,
        fallback: Callable[[QWidget], QWidget],
    ) -> QWidget:
        cls = self._resolve_class(module, class_name)
        if cls is None:
            return fallback(parent)
        return self._create_widget_instance(cls, parent)

    def _instantiate_masks(
        self,
        *,
        module: str,
        class_name: str,
        parent: QWidget,
        fallback: Callable[[QWidget], QWidget],
    ) -> QWidget:
        cls = self._resolve_class(module, class_name)
        if cls is None:
            return fallback(parent)
        instance = self._create_widget_with_callback(cls, parent, self._push_to_parsing)
        if instance is not None:
            return instance
        return self._create_widget_instance(cls, parent)

    @staticmethod
    def _resolve_class(module: str, class_name: str) -> type | None:
        try:
            mod = importlib.import_module(module)
            return getattr(mod, class_name)
        except Exception:
            return None

    @staticmethod
    def _create_widget_instance(cls: Callable, parent: QWidget) -> QWidget:
        for factory in (
            lambda: cls(parent=parent),
            lambda: cls(parent),
            lambda: cls(),
        ):
            try:
                return factory()
            except TypeError:
                continue
        return cls()

    @staticmethod
    def _create_widget_with_callback(
        cls: Callable,
        parent: QWidget,
        callback: Callable[[list[str]], None],
    ) -> QWidget | None:
        for factory in (
            lambda: cls(parent=parent, send_to_parsing_callback=callback),
            lambda: cls(parent, callback),
            lambda: cls(parent=parent),
            lambda: cls(parent),
            lambda: cls(),
        ):
            try:
                return factory()
            except TypeError:
                continue
        return None

    def _apply_qss(self) -> None:
        app = QApplication.instance()
        if not app:
            return
        # CARDVANCE white-premium тема для всего приложения.
        cardvance_global = Path(__file__).parent.parent / "styles" / "modern.qss"
        if cardvance_global.exists():
            app.setStyleSheet(cardvance_global.read_text(encoding="utf-8"))
            self.log_event("Применена тема: modern.qss")
            return

        # Fallback на предыдущие стили.
        theme_candidates = (
            "beige_gold.qss",
            "orange_light.qss",
            "keyset_dark.qss",
            "semtool_dark.qss",
            "orange_dark.qss",
        )
        for name in theme_candidates:
            qss = Path(__file__).parent.parent / "styles" / name
            if qss.exists():
                app.setStyleSheet(qss.read_text(encoding="utf-8"))
                self.log_event(f"Применена тема: {name}")
                break
        else:
            self.log_event("Не удалось найти файл темы", level="WARN")

    def _apply_icon(self) -> None:
        icon_path = Path(__file__).parent.parent / "keyset_icon.ico"
        if not icon_path.exists():
            self.log_event("Иконка keyset_icon.ico не найдена", level="WARN")
            return

        icon = QIcon(str(icon_path))
        self.setWindowIcon(icon)
        app = QApplication.instance()
        if app:
            app.setWindowIcon(icon)
        self.log_event("Загружена иконка приложения")

    def _connect_signals(self) -> None:
        if hasattr(self.accounts, "accounts_changed") and hasattr(self.parsing, "refresh_profiles"):
            try:
                self.accounts.accounts_changed.connect(self.parsing.refresh_profiles)  # type: ignore[attr-defined]
            except Exception:
                pass

    def _setup_tab_switching(self) -> None:
        """Настроить поведение при переключении вкладок"""
        self.tabs.currentChanged.connect(self._on_tab_changed)
        self._on_tab_changed(self.tabs.currentIndex())

    def _on_tab_changed(self, index: int) -> None:
        """Обработчик переключения вкладок - скрывает KeysPanel для вкладки Парсинг"""
        current_widget = self.tabs.widget(index)
        
        # Скрываем KeysPanel если открыта вкладка Парсинг (т.к. у неё свой внутренний панель групп)
        if current_widget in (getattr(self, "accounts", None), getattr(self, "parsing", None)):
            self.keys_panel.hide()
        else:
            self.keys_panel.show()

    def _push_to_parsing(self, phrases: list[str]) -> None:
        if hasattr(self.parsing, "append_phrases"):
            self.tabs.setCurrentWidget(self.parsing)
            self.parsing.append_phrases(phrases)  # type: ignore[attr-defined]

    def log_event(self, message: str, level: str = "INFO") -> None:
        log = getattr(self, "log_widget", None)
        if log:
            log.append_line(f"{level}: {message}")

    def log_message(self, message: str, level: str = "INFO") -> None:
        self.log_event(message, level)
    
    def closeEvent(self, event) -> None:
        """Handle application close - unload modules"""
        try:
            if hasattr(self, '_module_autoloader'):
                self._module_autoloader.unload_all_modules()
                logger.info("Modules unloaded on app close")
        except Exception as e:
            logger.error(f"Error unloading modules: {e}", exc_info=True)
        
        super().closeEvent(event)


def main() -> None:
    app = QApplication.instance() or QApplication([])
    window = MainWindow()
    window.show()
    app.exec()


__all__ = ["AccountDialog", "MainWindow", "main"]
WORKSPACE_ROOT = Path(r"C:/AI/yandex")
ACCOUNTS_CONFIG_PATH = WORKSPACE_ROOT / "configs" / "accounts.json"
