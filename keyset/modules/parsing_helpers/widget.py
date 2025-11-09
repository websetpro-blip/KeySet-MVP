# -*- coding: utf-8 -*-
"""
Parsing Helpers Module - Вспомогательные утилиты для парсинга
"""

import json
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List

from PySide6.QtCore import Qt, Signal, QThread
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QTextEdit, QLabel, QGroupBox, QProgressBar,
    QMessageBox, QComboBox, QLineEdit, QFormLayout,
    QCheckBox, QSpinBox, QTabWidget, QTableWidget,
    QTableWidgetItem, QHeaderView, QAbstractItemView
)

# Импорты из основного приложения
try:
    from keyset.turbo_parser_improved import main as turbo_main
    from keyset.services.frequency import FrequencyService
    from keyset.utils.proxy import proxy_to_playwright
except ImportError:
    # Fallback для локального запуска
    import sys
    sys.path.append(str(Path(__file__).parent.parent.parent))
    from turbo_parser_improved import main as turbo_main
    from services.frequency import FrequencyService
    from utils.proxy import proxy_to_playwright


class ProxyTestThread(QThread):
    """Поток для тестирования прокси"""
    
    result_signal = Signal(str, bool, str)  # proxy, success, message
    
    def __init__(self, proxy_list: List[str]):
        super().__init__()
        self.proxy_list = proxy_list
    
    def run(self):
        """Тестировать прокси"""
        import aiohttp
        import asyncio
        
        async def test_proxy(proxy_str: str):
            try:
                proxy = proxy_to_playwright(proxy_str)
                if not proxy:
                    return proxy_str, False, "Неверный формат прокси"
                
                # Формат для aiohttp
                if '@' in proxy_str:
                    auth_part, addr_part = proxy_str.split('@', 1)
                    if ':' in auth_part:
                        user, password = auth_part.split(':', 1)
                        proxy_url = f"http://{user}:{password}@{addr_part}"
                    else:
                        proxy_url = f"http://{addr_part}"
                else:
                    proxy_url = f"http://{proxy_str}"
                
                timeout = aiohttp.ClientTimeout(total=10)
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.get(
                        "https://httpbin.org/ip",
                        proxy=proxy_url,
                        ssl=False
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            return proxy_str, True, f"IP: {data.get('origin', 'unknown')}"
                        else:
                            return proxy_str, False, f"HTTP {response.status}"
                            
            except Exception as e:
                return proxy_str, False, str(e)
        
        async def test_all():
            tasks = [test_proxy(proxy) for proxy in self.proxy_list]
            return await asyncio.gather(*tasks, return_exceptions=True)
        
        try:
            results = asyncio.run(test_all())
            for result in results:
                if isinstance(result, tuple):
                    self.result_signal.emit(*result)
        except Exception as e:
            for proxy in self.proxy_list:
                self.result_signal.emit(proxy, False, f"Error: {str(e)}")


class ParsingHelpersWidget(QWidget):
    """Основной виджет помощников парсинга"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.init_ui()
    
    def init_ui(self):
        """Инициализация интерфейса"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)
        
        # Заголовок
        title_label = QLabel("🔧 Помощники парсинга")
        title_label.setStyleSheet("font-size: 24px; font-weight: bold; color: #1F2937; margin-bottom: 16px;")
        layout.addWidget(title_label)
        
        # Табы
        self.tabs = QTabWidget()
        
        # Таб тестирования прокси
        self.tabs.addTab(self._create_proxy_test_tab(), "🔍 Тест прокси")
        
        # Таб массовых операций
        self.tabs.addTab(self._create_batch_operations_tab(), "⚡ Массовые операции")
        
        # Таб утилит
        self.tabs.addTab(self._create_utilities_tab(), "🛠️ Утилиты")
        
        layout.addWidget(self.tabs)
    
    def _create_proxy_test_tab(self) -> QWidget:
        """Создать вкладку тестирования прокси"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Ввод прокси
        input_group = QGroupBox("📝 Список прокси")
        input_layout = QVBoxLayout(input_group)
        
        self.proxy_input = QTextEdit()
        self.proxy_input.setPlaceholderText(
            "Введите прокси в формате:\n"
            "ip:port\n"
            "ip:port@user:password\n"
            "user:password@ip:port\n\n"
            "Один прокси на строку"
        )
        self.proxy_input.setMaximumHeight(120)
        input_layout.addWidget(self.proxy_input)
        
        # Кнопки
        buttons_layout = QHBoxLayout()
        
        self.test_proxy_btn = QPushButton("🔍 Тестировать")
        self.test_proxy_btn.clicked.connect(self.test_proxies)
        buttons_layout.addWidget(self.test_proxy_btn)
        
        self.clear_proxy_btn = QPushButton("🗑️ Очистить")
        self.clear_proxy_btn.clicked.connect(self.proxy_input.clear)
        buttons_layout.addWidget(self.clear_proxy_btn)
        
        buttons_layout.addStretch()
        input_layout.addLayout(buttons_layout)
        
        layout.addWidget(input_group)
        
        # Результаты
        results_group = QGroupBox("📊 Результаты")
        results_layout = QVBoxLayout(results_group)
        
        self.proxy_results_table = QTableWidget()
        self.proxy_results_table.setColumnCount(3)
        self.proxy_results_table.setHorizontalHeaderLabels(["Прокси", "Статус", "Детали"])
        
        header = self.proxy_results_table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.Stretch)
        header.setSectionResizeMode(1, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(2, QHeaderView.Stretch)
        
        self.proxy_results_table.setAlternatingRowColors(True)
        self.proxy_results_table.setSelectionBehavior(QAbstractItemView.SelectRows)
        
        results_layout.addWidget(self.proxy_results_table)
        
        layout.addWidget(results_group)
        
        return widget
    
    def _create_batch_operations_tab(self) -> QWidget:
        """Создать вкладку массовых операций"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Массовая смена прокси
        proxy_group = QGroupBox("🔄 Массовая смена прокси")
        proxy_layout = QVBoxLayout(proxy_group)
        
        form_layout = QFormLayout()
        
        self.new_proxy_input = QLineEdit()
        self.new_proxy_input.setPlaceholderText("ip:port@user:password")
        form_layout.addRow("Новый прокси:", self.new_proxy_input)
        
        proxy_layout.addLayout(form_layout)
        
        proxy_buttons = QHBoxLayout()
        self.apply_proxy_btn = QPushButton("✅ Применить ко всем")
        self.apply_proxy_btn.clicked.connect(self.apply_proxy_to_all)
        proxy_buttons.addWidget(self.apply_proxy_btn)
        
        proxy_buttons.addStretch()
        proxy_layout.addLayout(proxy_buttons)
        
        layout.addWidget(proxy_group)
        
        # Массовая генерация отпечатков
        fingerprint_group = QGroupBox("🛡️ Массовая генерация отпечатков")
        fp_layout = QVBoxLayout(fingerprint_group)
        
        fp_form = QFormLayout()
        
        self.fp_profile_combo = QComboBox()
        self.fp_profile_combo.addItems(["windows_chrome", "macos_safari", "android_mobile"])
        fp_form.addRow("Профиль:", self.fp_profile_combo)
        
        fp_layout.addLayout(fp_form)
        
        fp_buttons = QHBoxLayout()
        self.generate_fp_btn = QPushButton("🎲 Генерировать для всех")
        self.generate_fp_btn.clicked.connect(self.generate_fingerprints_all)
        fp_buttons.addWidget(self.generate_fp_btn)
        
        fp_buttons.addStretch()
        fp_layout.addLayout(fp_buttons)
        
        layout.addWidget(fingerprint_group)
        
        layout.addStretch()
        
        return widget
    
    def _create_utilities_tab(self) -> QWidget:
        """Создать вкладку утилит"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Очистка кеша
        cache_group = QGroupBox("🧹 Очистка кеша")
        cache_layout = QVBoxLayout(cache_group)
        
        cache_info = QLabel("Очистка временных файлов и кеша профилей браузера")
        cache_layout.addWidget(cache_info)
        
        cache_buttons = QHBoxLayout()
        self.clear_cache_btn = QPushButton("🗑️ Очистить кеш")
        self.clear_cache_btn.clicked.connect(self.clear_cache)
        cache_buttons.addWidget(self.clear_cache_btn)
        
        cache_buttons.addStretch()
        cache_layout.addLayout(cache_buttons)
        
        layout.addWidget(cache_group)
        
        # Проверка системы
        system_group = QGroupBox("🔧 Проверка системы")
        system_layout = QVBoxLayout(system_group)
        
        self.check_system_btn = QPushButton("🔍 Проверить систему")
        self.check_system_btn.clicked.connect(self.check_system)
        system_layout.addWidget(self.check_system_btn)
        
        self.system_info = QTextEdit()
        self.system_info.setMaximumHeight(150)
        self.system_info.setPlaceholderText("Информация о системе появится здесь")
        system_layout.addWidget(self.system_info)
        
        layout.addWidget(system_group)
        
        layout.addStretch()
        
        return widget
    
    def test_proxies(self):
        """Тестировать прокси"""
        proxy_text = self.proxy_input.toPlainText().strip()
        if not proxy_text:
            QMessageBox.warning(self, "Внимание", "Введите список прокси для тестирования")
            return
        
        proxy_list = [line.strip() for line in proxy_text.split('\n') if line.strip()]
        if not proxy_list:
            QMessageBox.warning(self, "Внимание", "Список прокси пуст")
            return
        
        # Очистить таблицу
        self.proxy_results_table.setRowCount(len(proxy_list))
        
        # Показать индикатор
        self.proxy_results_table.setEnabled(False)
        self.test_proxy_btn.setEnabled(False)
        self.test_proxy_btn.setText("⏳ Тестирование...")
        
        # Запустить тестирование
        self.proxy_test_thread = ProxyTestThread(proxy_list)
        self.proxy_test_thread.result_signal.connect(self.on_proxy_test_result)
        self.proxy_test_thread.finished.connect(self.on_proxy_test_finished)
        self.proxy_test_thread.start()
    
    def on_proxy_test_result(self, proxy: str, success: bool, message: str):
        """Обработать результат теста прокси"""
        # Найти строку для этого прокси
        for row in range(self.proxy_results_table.rowCount()):
            proxy_item = self.proxy_results_table.item(row, 0)
            if proxy_item and proxy_item.text() == proxy:
                # Статус
                status_item = QTableWidgetItem("✅ OK" if success else "❌ Ошибка")
                status_item.setData(Qt.UserRole, success)
                self.proxy_results_table.setItem(row, 1, status_item)
                
                # Детали
                details_item = QTableWidgetItem(message)
                self.proxy_results_table.setItem(row, 2, details_item)
                break
        else:
            # Добавить новую строку если не найдена
            row = self.proxy_results_table.rowCount()
            self.proxy_results_table.insertRow(row)
            self.proxy_results_table.setItem(row, 0, QTableWidgetItem(proxy))
            self.proxy_results_table.setItem(row, 1, QTableWidgetItem("✅ OK" if success else "❌ Ошибка"))
            self.proxy_results_table.setItem(row, 2, QTableWidgetItem(message))
    
    def on_proxy_test_finished(self):
        """Завершить тестирование прокси"""
        self.proxy_results_table.setEnabled(True)
        self.test_proxy_btn.setEnabled(True)
        self.test_proxy_btn.setText("🔍 Тестировать")
    
    def apply_proxy_to_all(self):
        """Применить прокси ко всем аккаунтам"""
        QMessageBox.information(self, "Информация", "Функция будет интегрирована с accounts_v2")
    
    def generate_fingerprints_all(self):
        """Генерировать отпечатки для всех аккаунтов"""
        QMessageBox.information(self, "Информация", "Функция будет интегрирована с accounts_v2")
    
    def clear_cache(self):
        """Очистить кеш"""
        try:
            # TODO: Implement cache clearing
            QMessageBox.information(self, "Информация", "Функция очистки кеша будет реализована")
        except Exception as e:
            QMessageBox.critical(self, "Ошибка", f"Не удалось очистить кеш: {str(e)}")
    
    def check_system(self):
        """Проверить систему"""
        try:
            import platform
            import sys
            
            info = []
            info.append(f"ОС: {platform.system()} {platform.release()}")
            info.append(f"Python: {sys.version}")
            info.append(f"Архитектура: {platform.machine()}")
            
            # Проверка Playwright
            try:
                from playwright.sync_api import sync_playwright
                info.append("Playwright: ✅ Установлен")
            except ImportError:
                info.append("Playwright: ❌ Не установлен")
            
            # Проверка браузеров
            try:
                from playwright._impl._driver import get_driver_env
                info.append("Драйверы Playwright: ✅ Доступны")
            except Exception:
                info.append("Драйверы Playwright: ❌ Недоступны")
            
            self.system_info.setPlainText('\n'.join(info))
            
        except Exception as e:
            self.system_info.setPlainText(f"Ошибка проверки: {str(e)}")


def create_parsing_helpers_tab(parent=None) -> QWidget:
    """Фабричная функция для создания вкладки"""
    return ParsingHelpersWidget(parent)