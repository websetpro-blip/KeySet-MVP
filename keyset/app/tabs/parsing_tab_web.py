# -*- coding: utf-8 -*-
"""
Web-based Parsing Tab - встраивает React интерфейс из v5.0
"""
from PySide6.QtCore import QUrl
from PySide6.QtWidgets import QWidget, QVBoxLayout
from PySide6.QtWebEngineWidgets import QWebEngineView


class WebParsingTab(QWidget):
    """Вкладка парсинга с React интерфейсом"""

    def __init__(self, parent=None, **kwargs):
        super().__init__(parent)
        self._init_ui()

    def _init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # Встраиваем React dev server
        self.webview = QWebEngineView()
        self.webview.setUrl(QUrl("http://localhost:5173"))

        layout.addWidget(self.webview)
