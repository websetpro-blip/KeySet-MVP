# -*- coding: utf-8 -*-
"""
Wrapper around the standalone CARDVANCE UI (keyset_v2_pyside6_FULL.py).

For the visual phase we embed the ready-made AccountsTableWidget inside the
KeySet desktop shell so that the tab looks exactly like the supplied mock.
Business logic hooks will be reconnected in a follow-up task.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from typing import Optional

from PySide6.QtCore import Signal
from PySide6.QtWidgets import QWidget, QVBoxLayout, QLayout


class AccountsV2Widget(QWidget):
    """Embed the external CARDVANCE UI widget inside the application tab."""

    account_selected = Signal(str)
    accounts_changed = Signal()

    def __init__(self, parent: Optional[QWidget] = None) -> None:
        super().__init__(parent)
        self.setObjectName("accountsV2Root")

        self._module = self._load_external_module()
        self._embedded_widget = self._create_external_widget()

        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.addWidget(self._embedded_widget)

    @staticmethod
    def _external_script_path() -> Path:
        return (
            Path(__file__).resolve().parents[2]
            / "МОДУЛИ"
            / "аккаунты"
            / "keyset_v2_pyside6_FULL.py"
        )

    def _load_external_module(self):
        script_path = self._external_script_path()
        if not script_path.exists():
            raise FileNotFoundError(
                f"Не найден файл внешнего интерфейса: {script_path}"
            )

        module_name = "_accounts_v2_external_ui"
        spec = importlib.util.spec_from_file_location(module_name, script_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Не удалось создать spec для {script_path}")

        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        return module

    def _create_external_widget(self):
        if not hasattr(self._module, "AccountsTableWidget"):
            raise AttributeError(
                "В файле keyset_v2_pyside6_FULL.py отсутствует класс AccountsTableWidget"
            )
        widget = self._module.AccountsTableWidget()
        widget.setParent(self)
        return widget


def create_accounts_v2_tab(app_context: Optional[object] = None) -> AccountsV2Widget:
    """
    Entry point for module_autoloader (modules/accounts_v2/module.json).

    Returns:
        AccountsV2Widget instance so the cardvance UI can be mounted anywhere.
    """
    _ = app_context  # reserved for future hooks
    return AccountsV2Widget()
def _monkey_patch_layout_styles() -> None:
    """Allow legacy modules to call setStyleSheet on layouts by proxying to parent widget."""
    if hasattr(QLayout, "_cardvance_style_patched"):
        return

    def _set_stylesheet(self: QLayout, style: str) -> None:
        parent = getattr(self, "parentWidget", lambda: None)()
        if parent is not None and hasattr(parent, "setStyleSheet"):
            parent.setStyleSheet(style)

    setattr(QLayout, "setStyleSheet", _set_stylesheet)
    setattr(QLayout, "_cardvance_style_patched", True)


_monkey_patch_layout_styles()
