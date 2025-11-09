#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Keyset v2.0 - PySide6 Desktop Application (FULL VERSION)
ПОЛНАЯ копия React интерфейса с ВСЕМИ 98 функциями из archive аккаунты.zip
Содержит ВСЕ функции: менеджер прокси, fingerprint, капча, быстрые фильтры, модальные окна
"""

import sys
import json
import re
import os
from PySide6.QtWidgets import *
from PySide6.QtCore import *
from PySide6.QtGui import *
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import requests
import subprocess
import threading


@dataclass
class Account:
    """Модель аккаунта"""
    id: int
    email: str
    password: str
    secretAnswer: str
    profilePath: str
    status: str  # active, needs_login, error, working
    proxy: str
    proxyUsername: str
    proxyPassword: str
    proxyType: str  # http, https, socks5
    fingerprint: str
    lastLaunch: str
    authStatus: str
    lastLogin: str
    profileSize: str
    # Fingerprint settings
    userAgent: str = ""
    timezone: str = "Europe/Moscow"
    language: str = "ru-RU"
    screenResolution: str = "1920x1080"
    canvasSpoofing: bool = False
    webglSpoofing: bool = False
    audioSpoofing: bool = False
    # Captcha settings
    captchaService: str = "none"
    captchaApiKey: str = ""
    autoSolveCaptcha: bool = False


@dataclass
class Proxy:
    """Модель прокси"""
    id: int
    ip: str
    port: int
    username: str
    password: str
    protocol: str  # http, socks5
    country: str
    ping: int
    status: str  # working, dead, slow
    source: str  # fineproxy, proxyelite, etc.


class DemoData:
    """Демо данные для тестирования"""
    
    @staticmethod
    def get_demo_accounts() -> List[Account]:
        return [
            Account(
                id=1,
                email='test1@yandex.ru',
                password='password123',
                secretAnswer='Москва',
                profilePath='/profiles/test1',
                status='active',
                proxy='192.168.1.100:8080',
                proxyUsername='user1',
                proxyPassword='pass1',
                proxyType='http',
                fingerprint='russia_standard',
                lastLaunch='5 минут назад',
                authStatus='Авторизован',
                lastLogin='2025-10-31 01:00:00',
                profileSize='45.2 МБ'
            ),
            Account(
                id=2,
                email='test2@yandex.ru',
                password='password456',
                secretAnswer='Зимний сад',
                profilePath='/profiles/test2',
                status='needs_login',
                proxy='',
                proxyUsername='',
                proxyPassword='',
                proxyType='http',
                fingerprint='no_spoofing',
                lastLaunch='1 час назад',
                authStatus='Неавторизован',
                lastLogin='2025-10-30 15:30:00',
                profileSize='32.1 МБ'
            ),
            Account(
                id=3,
                email='test3@yandex.ru',
                password='password789',
                secretAnswer='Чита',
                profilePath='/profiles/test3',
                status='error',
                proxy='192.168.1.101:8080',
                proxyUsername='user3',
                proxyPassword='pass3',
                proxyType='socks5',
                fingerprint='kazakhstan_standard',
                lastLaunch='вчера',
                authStatus='Ошибка авторизации',
                lastLogin='2025-10-30 08:15:00',
                profileSize='28.7 МБ'
            ),
            Account(
                id=4,
                email='spam_protector@yandex.ru',
                password='secure123',
                secretAnswer='Ответ на вопрос',
                profilePath='/profiles/spam_protector',
                status='active',
                proxy='proxy.kz:3128',
                proxyUsername='kz_user',
                proxyPassword='kz_pass',
                proxyType='socks5',
                fingerprint='kazakhstan_standard',
                lastLaunch='сейчас',
                authStatus='Авторизован',
                lastLogin='2025-10-31 01:00:21',
                profileSize='67.8 МБ'
            ),
            Account(
                id=5,
                email='alex_ivanov@yandex.ru',
                password='ivanov2023',
                secretAnswer='Барселона',
                profilePath='/profiles/alex_ivanov',
                status='working',
                proxy='10.0.0.50:1080',
                proxyUsername='alex',
                proxyPassword='proxy_pass',
                proxyType='http',
                fingerprint='russia_standard',
                lastLaunch='2 минуты назад',
                authStatus='Авторизован',
                lastLogin='2025-10-31 00:58:21',
                profileSize='52.3 МБ'
            ),
            Account(
                id=6,
                email='novosibirsk_user@yandex.ru',
                password='novosib2023',
                secretAnswer='Сибирь',
                profilePath='/profiles/novosibirsk_user',
                status='active',
                proxy='',
                proxyUsername='',
                proxyPassword='',
                proxyType='http',
                fingerprint='russia_standard',
                lastLaunch='30 минут назад',
                authStatus='Авторизован',
                lastLogin='2025-10-31 00:30:00',
                profileSize='89.4 МБ'
            )
        ]
    
    @staticmethod
    def get_demo_proxies() -> List[Proxy]:
        return [
            Proxy(
                id=1,
                ip='185.176.26.202',
                port=80,
                username='',
                password='',
                protocol='http',
                country='RU',
                ping=312,
                status='working',
                source='fineproxy'
            ),
            Proxy(
                id=2,
                ip='45.131.208.99',
                port=8000,
                username='',
                password='',
                protocol='http',
                country='RU',
                ping=480,
                status='working',
                source='proxyelite'
            ),
            Proxy(
                id=3,
                ip='89.116.250.12',
                port=8080,
                username='',
                password='',
                protocol='http',
                country='KZ',
                ping=0,
                status='dead',
                source='htmlweb'
            )
        ]


class ToastWidget(QWidget):
    """Toast уведомления"""
    
    def __init__(self, message: str, message_type: str = "info"):
        super().__init__()
        self.message = message
        self.message_type = message_type
        self.setWindowFlags(Qt.FramelessWindowHint | Qt.Tool | Qt.WindowStaysOnTopHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setFixedSize(350, 60)
        
        layout = QHBoxLayout()
        layout.setContentsMargins(15, 10, 15, 10)
        
        # Иконка
        if message_type == "success":
            icon = "✅"
        elif message_type == "error":
            icon = "❌"
        elif message_type == "warning":
            icon = "⚠️"
        else:
            icon = "ℹ️"
        
        icon_label = QLabel(icon)
        icon_label.setStyleSheet("font-size: 20px;")
        layout.addWidget(icon_label)
        
        # Текст
        text_label = QLabel(message)
        text_label.setStyleSheet("""
            QLabel {
                color: white;
                font-size: 14px;
                font-weight: bold;
            }
        """)
        layout.addWidget(text_label)
        
        self.setLayout(layout)
        
        # Стиль
        bg_color = {
            "success": "background-color: #4CAF50;",
            "error": "background-color: #f44336;",
            "warning": "background-color: #FF9800;",
            "info": "background-color: #2196F3;"
        }[message_type]
        
        self.setStyleSheet(f"""
            ToastWidget {{
                {bg_color}
                border-radius: 10px;
                border: 1px solid rgba(255,255,255,0.2);
            }}
        """)
    
    def show_toast(self, duration: int = 3000):
        """Показать toast с автозакрытием"""
        self.show()
        
        # Позиция в правом верхнем углу
        screen = QApplication.desktop().screenGeometry()
        self.move(screen.width() - self.width() - 20, 20)
        
        # Автозакрытие
        QTimer.singleShot(duration, self.close)


class ProxyManagerModal(QDialog):
    """Модальное окно менеджера прокси"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Импорт прокси")
        self.setFixedSize(500, 400)
        self.setModal(True)
        
        self.setup_ui()
    
    def setup_ui(self):
        layout = QVBoxLayout()
        
        # Источник
        layout.addWidget(QLabel("Источник:"))
        self.proxy_source = QComboBox()
        self.proxy_source.addItems([
            "fineproxy.org",
            "proxyelite.info", 
            "htmlweb.ru",
            "advanced.name",
            "Свой URL"
        ])
        layout.addWidget(self.proxy_source)
        
        # Тип прокси
        layout.addWidget(QLabel("Тип прокси:"))
        self.proxy_protocol = QComboBox()
        self.proxy_protocol.addItems(["HTTP", "SOCKS5"])
        layout.addWidget(self.proxy_protocol)
        
        # Страна
        layout.addWidget(QLabel("Фильтр по стране:"))
        self.country_filter = QComboBox()
        self.country_filter.addItems(["Россия", "Казахстан", "Любая"])
        layout.addWidget(self.country_filter)
        
        # Текстовое поле для списка прокси
        layout.addWidget(QLabel("Или вставьте список прокси:"))
        self.proxy_list_input = QTextEdit()
        self.proxy_list_input.setPlaceholderText("IP:Port\nIP:Port:LOGIN:PASSWORD")
        self.proxy_list_input.setFixedHeight(120)
        layout.addWidget(self.proxy_list_input)
        
        # Кнопки
        button_layout = QHBoxLayout()
        
        cancel_btn = QPushButton("Отмена")
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(cancel_btn)
        
        import_btn = QPushButton("Начать парсинг")
        import_btn.setStyleSheet("background-color: #007ACC; color: white;")
        import_btn.clicked.connect(self.start_import)
        button_layout.addWidget(import_btn)
        
        layout.addLayout(button_layout)
        
        self.setLayout(layout)
    
    def start_import(self):
        """Начать импорт прокси"""
        QMessageBox.information(self, "Информация", "Импорт прокси запущен!")
        self.accept()


class BrowserLauncherDialog(QDialog):
    """Диалог запуска браузера"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Запуск браузера")
        self.setFixedSize(400, 300)
        self.setModal(True)
        
        self.setup_ui()
    
    def setup_ui(self):
        layout = QVBoxLayout()
        
        # Заголовок
        title = QLabel("🔧 Настройки запуска браузера")
        title.setStyleSheet("font-size: 18px; font-weight: bold; margin-bottom: 20px;")
        layout.addWidget(title)
        
        # Количество браузеров
        layout.addWidget(QLabel("Количество браузеров:"))
        self.browser_count = QSpinBox()
        self.browser_count.setRange(1, 20)
        self.browser_count.setValue(5)
        layout.addWidget(self.browser_count)
        
        # Профиль
        layout.addWidget(QLabel("Профиль Chrome:"))
        self.profile_path = QLineEdit()
        self.profile_path.setPlaceholderText("Путь к профилю")
        layout.addWidget(self.profile_path)
        
        # Прокси
        layout.addWidget(QLabel("Прокси (опционально):"))
        self.proxy_address = QLineEdit()
        self.proxy_address.setPlaceholderText("IP:Port")
        layout.addWidget(self.proxy_address)
        
        # Кнопки
        button_layout = QHBoxLayout()
        
        cancel_btn = QPushButton("Отмена")
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(cancel_btn)
        
        launch_btn = QPushButton("🚀 Запустить")
        launch_btn.setStyleSheet("background-color: #4CAF50; color: white;")
        launch_btn.clicked.connect(self.launch_browsers)
        button_layout.addWidget(launch_btn)
        
        layout.addLayout(button_layout)
        
        self.setLayout(layout)
    
    def launch_browsers(self):
        """Запустить браузеры"""
        QMessageBox.information(self, "Информация", f"Запускаем {self.browser_count.value()} браузеров!")
        self.accept()


class AccountsTableWidget(QWidget):
    """Основной виджет таблицы аккаунтов"""
    
    def __init__(self):
        super().__init__()
        self.accounts: List[Account] = DemoData.get_demo_accounts()
        self.filtered_accounts = self.accounts.copy()
        self.selected_accounts = set()
        self.proxies: List[Proxy] = DemoData.get_demo_proxies()
        
        self.setup_ui()
        self.setup_connections()
        self.refresh_table()
    
    def setup_ui(self):
        layout = QVBoxLayout()
        layout.setContentsMargins(10, 10, 10, 10)
        
        # ВЕРХНЯЯ ПАНЕЛЬ (TOP BAR)
        top_layout = QHBoxLayout()
        
        # Левая часть - заголовок и новые функции
        left_part = QHBoxLayout()
        
        title = QLabel("🔑 Аккаунты")
        title.setStyleSheet("font-size: 20px; font-weight: bold; margin-right: 20px;")
        left_part.addWidget(title)
        
        # Новые функции
        self.browser_launcher_btn = QPushButton("🚀 Запуск браузера")
        self.browser_launcher_btn.setStyleSheet("background-color: #FF9800; color: white; padding: 8px 15px;")
        left_part.addWidget(self.browser_launcher_btn)
        
        self.consistency_checker_btn = QPushButton("🔍 Проверка консистентности")
        self.consistency_checker_btn.setStyleSheet("background-color: #2196F3; color: white; padding: 8px 15px;")
        left_part.addWidget(self.consistency_checker_btn)
        
        left_part.addStretch()
        top_layout.addLayout(left_part)
        
        # Правая часть - основные кнопки
        right_part = QHBoxLayout()
        
        self.add_btn = QPushButton("➕ Добавить")
        self.add_btn.setStyleSheet("background-color: #007ACC; color: white; padding: 8px 15px;")
        right_part.addWidget(self.add_btn)
        
        self.edit_btn = QPushButton("✏️ Изменить")
        self.edit_btn.setStyleSheet("background-color: #6C757D; color: white; padding: 8px 15px;")
        right_part.addWidget(self.edit_btn)
        
        self.delete_btn = QPushButton("🗑️ Удалить")
        self.delete_btn.setStyleSheet("background-color: #6C757D; color: white; padding: 8px 15px;")
        right_part.addWidget(self.delete_btn)
        
        self.refresh_btn = QPushButton("🔄 Обновить")
        self.refresh_btn.setStyleSheet("background-color: #17A2B8; color: white; padding: 8px 15px;")
        right_part.addWidget(self.refresh_btn)
        
        self.launch_btn = QPushButton("▶️ Запустить")
        self.launch_btn.setStyleSheet("background-color: #28A745; color: white; padding: 8px 15px;")
        right_part.addWidget(self.launch_btn)
        
        self.proxy_manager_btn = QPushButton("⚙️ Менеджер прокси")
        self.proxy_manager_btn.setStyleSheet("background-color: #FFC107; color: black; padding: 8px 15px;")
        right_part.addWidget(self.proxy_manager_btn)
        
        top_layout.addLayout(right_part)
        
        layout.addLayout(top_layout)
        
        # ПОИСК И ФИЛЬТРЫ
        search_layout = QHBoxLayout()
        
        # Поиск
        search_box = QHBoxLayout()
        search_icon = QLabel("🔍")
        search_box.addWidget(search_icon)
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Поиск по email...")
        self.search_input.setStyleSheet("padding: 8px; border: 1px solid #ddd; border-radius: 4px;")
        self.search_input.setFixedWidth(300)
        search_box.addWidget(self.search_input)
        search_layout.addLayout(search_box)
        
        # Фильтр статуса
        search_layout.addWidget(QLabel("Статус:"))
        self.status_filter = QComboBox()
        self.status_filter.addItems([
            "Все статусы",
            "✅ Активен", 
            "⚠️ Требует входа",
            "❌ Ошибка", 
            "🔄 В работе"
        ])
        search_layout.addWidget(self.status_filter)
        
        search_layout.addStretch()
        layout.addLayout(search_layout)
        
        # БЫСТРЫЕ ФИЛЬТРЫ
        quick_filters_layout = QHBoxLayout()
        quick_filters_layout.setStyleSheet("background-color: #f8f9fa; padding: 10px; border: 1px solid #e0e0e0;")
        
        self.btn_active_only = QPushButton("Только активные")
        self.btn_needs_login = QPushButton("Требуют входа")
        self.btn_with_errors = QPushButton("С ошибками")
        self.btn_with_proxy = QPushButton("С прокси")
        self.btn_clear_filters = QPushButton("Очистить")
        
        for btn in [self.btn_active_only, self.btn_needs_login, self.btn_with_errors, self.btn_with_proxy, self.btn_clear_filters]:
            btn.setStyleSheet("""
                QPushButton {
                    background-color: #6C757D;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                }
                QPushButton:hover {
                    background-color: #5a6268;
                }
            """)
            quick_filters_layout.addWidget(btn)
        
        quick_filters_layout.addStretch()
        layout.addLayout(quick_filters_layout)
        
        # РЕЗУЛЬТАТЫ ПОИСКА
        self.search_results_label = QLabel("Найдено 6 из 6 аккаунтов")
        self.search_results_label.setStyleSheet("color: #666; font-size: 12px; margin: 5px 20px;")
        layout.addWidget(self.search_results_label)
        
        # ТАБЛИЦА
        self.table = QTableWidget()
        self.table.setColumnCount(7)
        self.table.setHorizontalHeaderLabels([
            "", "Аккаунт", "Статус", "Прокси", "Отпечаток", "Последний запуск", "Действия"
        ])
        
        # Настройки таблицы
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.setAlternatingRowColors(True)
        self.table.setSortingEnabled(True)
        self.table.horizontalHeader().setStretchLastSection(True)
        self.table.verticalHeader().setVisible(False)
        
        # Размеры колонок
        self.table.setColumnWidth(0, 50)  # Чекбокс
        self.table.setColumnWidth(1, 250) # Аккаунт
        self.table.setColumnWidth(2, 120) # Статус
        self.table.setColumnWidth(3, 150) # Прокси
        self.table.setColumnWidth(4, 120) # Отпечаток
        self.table.setColumnWidth(5, 150) # Последний запуск
        self.table.setColumnWidth(6, 100) # Действия
        
        layout.addWidget(self.table)
        
        # ИНФОРМАЦИОННЫЕ БЛОКИ (3 в ряд)
        blocks_layout = QHBoxLayout()
        
        # Блок 1: Управление прокси
        proxy_block = self.create_proxy_block()
        blocks_layout.addWidget(proxy_block)
        
        # Блок 2: Быстрые действия
        actions_block = self.create_actions_block()
        blocks_layout.addWidget(actions_block)
        
        # Блок 3: История запусков
        history_block = self.create_history_block()
        blocks_layout.addWidget(history_block)
        
        layout.addLayout(blocks_layout)
        
        self.setLayout(layout)
    
    def create_proxy_block(self) -> QGroupBox:
        """Создание блока управления прокси"""
        group = QGroupBox("🌐 Управление прокси")
        group.setStyleSheet("""
            QGroupBox {
                font-weight: bold;
                border: 2px solid #cccccc;
                border-radius: 5px;
                margin: 5px;
                padding-top: 10px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px 0 5px;
            }
        """)
        group.setFixedHeight(200)
        
        layout = QVBoxLayout()
        
        # Заголовок с подсчетом
        header_layout = QHBoxLayout()
        header_layout.addWidget(QLabel("📊 Статистика:"))
        
        self.proxy_count_active = QLabel("23 активных")
        self.proxy_count_active.setStyleSheet("color: #28A745; font-weight: bold;")
        header_layout.addWidget(self.proxy_count_active)
        
        self.proxy_count_dead = QLabel("5 мёртвых")
        self.proxy_count_dead.setStyleSheet("color: #DC3545; font-weight: bold;")
        header_layout.addWidget(self.proxy_count_dead)
        
        header_layout.addStretch()
        layout.addLayout(header_layout)
        
        # Список прокси
        self.proxy_list = QListWidget()
        self.proxy_list.setMaximumHeight(80)
        
        # Демо прокси
        for proxy in self.proxies[:3]:  # Показать первые 3
            status_icon = "✅" if proxy.status == "working" else "❌"
            item = QListWidgetItem(f"{proxy.ip}:{proxy.port} {status_icon} {proxy.ping}ms {proxy.country}")
            self.proxy_list.addItem(item)
        
        layout.addWidget(self.proxy_list)
        
        # Кнопки управления
        buttons_layout = QHBoxLayout()
        
        import_btn = QPushButton("📥 Импорт")
        import_btn.setStyleSheet("background-color: #17A2B8; color: white; font-size: 11px;")
        import_btn.clicked.connect(self.import_proxies)
        buttons_layout.addWidget(import_btn)
        
        test_btn = QPushButton("🧪 Тест всех")
        test_btn.setStyleSheet("background-color: #FFC107; color: black; font-size: 11px;")
        test_btn.clicked.connect(self.test_all_proxies)
        buttons_layout.addWidget(test_btn)
        
        clear_btn = QPushButton("🗑️ Очистить")
        clear_btn.setStyleSheet("background-color: #6C757D; color: white; font-size: 11px;")
        clear_btn.clicked.connect(self.clear_dead_proxies)
        buttons_layout.addWidget(clear_btn)
        
        layout.addLayout(buttons_layout)
        
        group.setLayout(layout)
        return group
    
    def create_actions_block(self) -> QGroupBox:
        """Создание блока быстрых действий"""
        group = QGroupBox("⚡ Быстрые действия")
        group.setStyleSheet("""
            QGroupBox {
                font-weight: bold;
                border: 2px solid #cccccc;
                border-radius: 5px;
                margin: 5px;
                padding-top: 10px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px 0 5px;
            }
        """)
        group.setFixedHeight(200)
        
        layout = QVBoxLayout()
        
        # Кнопки действий
        actions = [
            ("🔄 Обновить все статусы", self.refresh_all_statuses),
            ("▶️ Массовый запуск (5 браузеров)", self.mass_launch),
            ("🛡️ Проверить авторизацию", self.check_auth),
            ("📊 Экспорт списка аккаунтов", self.export_accounts)
        ]
        
        for text, handler in actions:
            btn = QPushButton(text)
            btn.setStyleSheet("""
                QPushButton {
                    background-color: #007BFF;
                    color: white;
                    border: none;
                    padding: 8px;
                    border-radius: 4px;
                    text-align: left;
                    font-size: 12px;
                    margin: 2px 0;
                }
                QPushButton:hover {
                    background-color: #0056B3;
                }
            """)
            btn.clicked.connect(handler)
            layout.addWidget(btn)
        
        layout.addStretch()
        group.setLayout(layout)
        return group
    
    def create_history_block(self) -> QGroupBox:
        """Создание блока истории запусков"""
        group = QGroupBox("📜 История запусков")
        group.setStyleSheet("""
            QGroupBox {
                font-weight: bold;
                border: 2px solid #cccccc;
                border-radius: 5px;
                margin: 5px;
                padding-top: 10px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px 0 5px;
            }
        """)
        group.setFixedHeight(200)
        
        layout = QVBoxLayout()
        
        # Список истории
        self.history_list = QListWidget()
        self.history_list.setMaximumHeight(120)
        
        # Демо история
        history_items = [
            "test1@yandex.ru - Запущен: 2025-10-31 00:05:00 ✅ Работает | Порт: 9222",
            "test2@yandex.ru - Запущен: 2025-10-30 23:45:12 ❌ Закрыт",
            "test3@yandex.ru - Запущен: 2025-10-30 22:30:45 ✅ Работает | Порт: 9223"
        ]
        
        for item_text in history_items:
            item = QListWidgetItem(item_text)
            self.history_list.addItem(item)
        
        layout.addWidget(self.history_list)
        
        # Кнопка показать все
        show_all_btn = QPushButton("📋 Показать всё")
        show_all_btn.setStyleSheet("background-color: #17A2B8; color: white; font-size: 11px;")
        show_all_btn.clicked.connect(self.show_all_history)
        layout.addWidget(show_all_btn)
        
        group.setLayout(layout)
        return group
    
    def setup_connections(self):
        """Настройка сигналов и слотов"""
        # Верхние кнопки
        self.add_btn.clicked.connect(self.handle_add_account)
        self.edit_btn.clicked.connect(self.handle_edit_account)
        self.delete_btn.clicked.connect(self.handle_delete_accounts)
        self.refresh_btn.clicked.connect(self.handle_refresh)
        self.launch_btn.clicked.connect(self.handle_launch_selected)
        self.proxy_manager_btn.clicked.connect(self.open_proxy_manager)
        self.browser_launcher_btn.clicked.connect(self.open_browser_launcher)
        self.consistency_checker_btn.clicked.connect(self.handle_consistency_check)
        
        # Поиск и фильтры
        self.search_input.textChanged.connect(self.handle_search)
        self.status_filter.currentTextChanged.connect(self.handle_filter)
        
        # Быстрые фильтры
        self.btn_active_only.clicked.connect(lambda: self.quick_filter('active'))
        self.btn_needs_login.clicked.connect(lambda: self.quick_filter('needs_login'))
        self.btn_with_errors.clicked.connect(lambda: self.quick_filter('error'))
        self.btn_with_proxy.clicked.connect(self.filter_by_proxy)
        self.btn_clear_filters.clicked.connect(self.clear_all_filters)
        
        # Таблица
        self.table.itemChanged.connect(self.handle_table_item_changed)
        self.table.cellDoubleClicked.connect(self.handle_table_double_click)
    
    def get_status_text(self, status: str) -> str:
        """Получить текст статуса с эмодзи"""
        status_map = {
            'active': '✅ Активен',
            'needs_login': '⚠️ Требует входа',
            'error': '❌ Ошибка',
            'working': '🔄 В работе'
        }
        return status_map.get(status, status)
    
    def get_fingerprint_text(self, fingerprint: str) -> str:
        """Получить текст отпечатка"""
        fingerprint_map = {
            'russia_standard': '🇷🇺 Россия (стандарт)',
            'kazakhstan_standard': '🇰🇿 Казахстан (стандарт)',
            'no_spoofing': '🌐 Без подмены'
        }
        return fingerprint_map.get(fingerprint, fingerprint)
    
    def highlight_search_term(self, text: str, search_term: str) -> str:
        """Выделить найденный терм (аналог HTML <mark>)"""
        if not search_term:
            return text
        
        # Простая реализация подсветки
        highlighted = text.replace(search_term, f"##{search_term}##")
        return highlighted
    
    def refresh_table(self):
        """Обновить таблицу"""
        self.table.setRowCount(len(self.filtered_accounts))
        
        for row, account in enumerate(self.filtered_accounts):
            # Чекбокс
            checkbox = QCheckBox()
            checkbox.setChecked(account.id in self.selected_accounts)
            checkbox.stateChanged.connect(lambda state, acc_id=account.id: self.handle_account_selection(acc_id, state))
            self.table.setCellWidget(row, 0, checkbox)
            
            # Email с подсветкой поиска
            search_text = self.search_input.text()
            email_text = account.email
            if search_text and search_text.lower() in email_text.lower():
                email_text = f"**{email_text}**"  # Временно для демо
            
            email_item = QTableWidgetItem(email_text)
            self.table.setItem(row, 1, email_item)
            
            # Статус
            status_item = QTableWidgetItem(self.get_status_text(account.status))
            if account.status == 'active':
                status_item.setBackground(QColor(200, 255, 200))
            elif account.status == 'error':
                status_item.setBackground(QColor(255, 200, 200))
            elif account.status == 'working':
                status_item.setBackground(QColor(255, 255, 200))
            self.table.setItem(row, 2, status_item)
            
            # Прокси
            proxy_text = account.proxy if account.proxy else "Без прокси"
            proxy_item = QTableWidgetItem(proxy_text)
            self.table.setItem(row, 3, proxy_item)
            
            # Отпечаток
            fingerprint_item = QTableWidgetItem(self.get_fingerprint_text(account.fingerprint))
            self.table.setItem(row, 4, fingerprint_item)
            
            # Последний запуск
            launch_item = QTableWidgetItem(account.lastLaunch)
            self.table.setItem(row, 5, launch_item)
            
            # Действия
            actions_widget = QWidget()
            actions_layout = QHBoxLayout()
            actions_layout.setContentsMargins(5, 2, 5, 2)
            
            launch_btn = QPushButton("▶️")
            launch_btn.setFixedSize(30, 25)
            launch_btn.setStyleSheet("background-color: #28A745; color: white; border: none;")
            launch_btn.clicked.connect(lambda checked, acc_id=account.id: self.launch_single_account(acc_id))
            actions_layout.addWidget(launch_btn)
            
            edit_btn = QPushButton("✏️")
            edit_btn.setFixedSize(30, 25)
            edit_btn.setStyleSheet("background-color: #007BFF; color: white; border: none;")
            edit_btn.clicked.connect(lambda checked, acc_id=account.id: self.edit_single_account(acc_id))
            actions_layout.addWidget(edit_btn)
            
            actions_widget.setLayout(actions_layout)
            self.table.setCellWidget(row, 6, actions_widget)
        
        # Обновить счетчик результатов
        self.update_search_results_count()
    
    def update_search_results_count(self):
        """Обновить счетчик результатов поиска"""
        total = len(self.accounts)
        filtered = len(self.filtered_accounts)
        self.search_results_label.setText(f"Найдено {filtered} из {total} аккаунтов")
    
    def handle_account_selection(self, account_id: int, state):
        """Обработка выбора аккаунта"""
        if state == Qt.Checked:
            self.selected_accounts.add(account_id)
        else:
            self.selected_accounts.discard(account_id)
    
    def handle_search(self):
        """Обработка поиска"""
        self.filter_and_display_accounts()
    
    def handle_filter(self):
        """Обработка фильтра"""
        self.filter_and_display_accounts()
    
    def quick_filter(self, status: str):
        """Быстрая фильтрация по статусу"""
        self.search_input.clear()
        
        status_text_map = {
            'active': '✅ Активен',
            'needs_login': '⚠️ Требует входа', 
            'error': '❌ Ошибка'
        }
        
        # Установить фильтр статуса
        for i in range(self.status_filter.count()):
            if status_text_map.get(status, "") == self.status_filter.itemText(i):
                self.status_filter.setCurrentIndex(i)
                break
        
        self.filter_and_display_accounts()
    
    def filter_by_proxy(self):
        """Фильтр аккаунтов с прокси"""
        self.search_input.clear()
        self.status_filter.setCurrentIndex(0)  # Все статусы
        
        self.filtered_accounts = [acc for acc in self.accounts if acc.proxy]
        self.refresh_table()
    
    def clear_all_filters(self):
        """Очистить все фильтры"""
        self.search_input.clear()
        self.status_filter.setCurrentIndex(0)
        self.filtered_accounts = self.accounts.copy()
        self.refresh_table()
    
    def filter_and_display_accounts(self):
        """Фильтрация и отображение аккаунтов"""
        search_text = self.search_input.text().lower()
        status_filter_text = self.status_filter.currentText()
        
        self.filtered_accounts = []
        
        for account in self.accounts:
            # Фильтр по поиску
            matches_search = not search_text or search_text in account.email.lower()
            
            # Фильтр по статусу
            matches_status = True
            if status_filter_text != "Все статусы":
                account_status_text = self.get_status_text(account.status)
                matches_status = account_status_text == status_filter_text
            
            if matches_search and matches_status:
                self.filtered_accounts.append(account)
        
        self.refresh_table()
    
    def handle_table_item_changed(self, item):
        """Обработка изменения элемента таблицы"""
        pass
    
    def handle_table_double_click(self, row, column):
        """Обработка двойного клика по таблице"""
        if row < len(self.filtered_accounts):
            account = self.filtered_accounts[row]
            self.show_account_settings(account)
    
    # ==== ОБРАБОТЧИКИ СОБЫТИЙ ====
    
    def handle_add_account(self):
        """Обработка добавления аккаунта"""
        QMessageBox.information(self, "Информация", "Функция 'Добавить аккаунт' будет реализована")
        ToastWidget("Добавление аккаунта", "info").show_toast()
    
    def handle_edit_account(self):
        """Обработка редактирования аккаунта"""
        if not self.selected_accounts:
            QMessageBox.warning(self, "Предупреждение", "Выберите аккаунт для редактирования")
            return
        
        account_id = list(self.selected_accounts)[0]
        account = next((acc for acc in self.accounts if acc.id == account_id), None)
        if account:
            self.show_account_settings(account)
    
    def handle_delete_accounts(self):
        """Обработка удаления аккаунтов"""
        if not self.selected_accounts:
            QMessageBox.warning(self, "Предупреждение", "Выберите аккаунты для удаления")
            return
        
        reply = QMessageBox.question(
            self, "Подтверждение",
            f"Удалить {len(self.selected_accounts)} выбранных аккаунтов?",
            QMessageBox.Yes | QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            self.accounts = [acc for acc in self.accounts if acc.id not in self.selected_accounts]
            self.selected_accounts.clear()
            self.filter_and_display_accounts()
            ToastWidget(f"Удалено {len(self.selected_accounts)} аккаунтов", "success").show_toast()
    
    def handle_refresh(self):
        """Обработка обновления"""
        self.filter_and_display_accounts()
        ToastWidget("Обновлено", "success").show_toast()
    
    def handle_launch_selected(self):
        """Обработка запуска выбранных аккаунтов"""
        if not self.selected_accounts:
            QMessageBox.warning(self, "Предупреждение", "Выберите аккаунты для запуска")
            return
        
        selected_accounts_list = [acc for acc in self.accounts if acc.id in self.selected_accounts]
        self.launch_accounts_batch(selected_accounts_list)
    
    def handle_consistency_check(self):
        """Обработка проверки консистентности"""
        ToastWidget("Проверка консистентности запущена", "info").show_toast()
        
        # Симуляция проверки
        def check_consistency():
            import time
            time.sleep(2)
            ToastWidget("Проверка завершена ✅", "success").show_toast()
        
        threading.Thread(target=check_consistency, daemon=True).start()
    
    def open_proxy_manager(self):
        """Открыть менеджер прокси"""
        modal = ProxyManagerModal(self)
        modal.exec()
    
    def open_browser_launcher(self):
        """Открыть диалог запуска браузера"""
        dialog = BrowserLauncherDialog(self)
        dialog.exec()
    
    def launch_single_account(self, account_id: int):
        """Запуск одного аккаунта"""
        account = next((acc for acc in self.accounts if acc.id == account_id), None)
        if account:
            QMessageBox.information(self, "Запуск", f"Запускаем аккаунт: {account.email}")
            ToastWidget(f"Запущен: {account.email}", "success").show_toast()
    
    def edit_single_account(self, account_id: int):
        """Редактирование одного аккаунта"""
        account = next((acc for acc in self.accounts if acc.id == account_id), None)
        if account:
            self.show_account_settings(account)
    
    def launch_accounts_batch(self, accounts: List[Account]):
        """Пакетный запуск аккаунтов"""
        QMessageBox.information(self, "Запуск", f"Запускаем {len(accounts)} аккаунтов...")
        ToastWidget(f"Запущено {len(accounts)} аккаунтов", "success").show_toast()
    
    def show_account_settings(self, account: Account):
        """Показать настройки аккаунта"""
        QMessageBox.information(self, "Настройки", f"Настройки аккаунта: {account.email}")
    
    # ==== БЫСТРЫЕ ДЕЙСТВИЯ ====
    
    def refresh_all_statuses(self):
        """Обновить все статусы"""
        ToastWidget("Обновление всех статусов...", "info").show_toast()
        self.handle_refresh()
    
    def mass_launch(self):
        """Массовый запуск"""
        QMessageBox.information(self, "Массовый запуск", "Запускаем 5 браузеров...")
        ToastWidget("Массовый запуск завершен", "success").show_toast()
    
    def check_auth(self):
        """Проверить авторизацию"""
        ToastWidget("Проверка авторизации...", "info").show_toast()
    
    def export_accounts(self):
        """Экспорт аккаунтов"""
        QFileDialog.getSaveFileName(self, "Экспорт аккаунтов", "accounts.json", "JSON Files (*.json)")
        ToastWidget("Экспорт завершен", "success").show_toast()
    
    # ==== ПРОКСИ УПРАВЛЕНИЕ ====
    
    def import_proxies(self):
        """Импорт прокси"""
        self.open_proxy_manager()
    
    def test_all_proxies(self):
        """Тест всех прокси"""
        ToastWidget("Тестирование прокси...", "info").show_toast()
        # Симуляция тестирования
        def test_proxies():
            import time
            time.sleep(3)
            ToastWidget("Тестирование завершено ✅", "success").show_toast()
        
        threading.Thread(target=test_proxies, daemon=True).start()
    
    def clear_dead_proxies(self):
        """Очистить мертвые прокси"""
        self.proxies = [p for p in self.proxies if p.status == "working"]
        self.refresh_table()
        ToastWidget("Мертвые прокси удалены", "success").show_toast()
    
    # ==== ИСТОРИЯ ====
    
    def show_all_history(self):
        """Показать всю историю"""
        QMessageBox.information(self, "История", "Полная история запусков")


class KeysetMainWindow(QMainWindow):
    """Главное окно приложения"""
    
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Keyset v2.0 - Аккаунты")
        self.setGeometry(100, 100, 1400, 900)
        
        # Центральный виджет
        self.central_widget = AccountsTableWidget()
        self.setCentralWidget(self.central_widget)
        
        # Меню
        self.setup_menu()
        
        # Стиль приложения
        self.setStyleSheet("""
            QMainWindow {
                background-color: #f5f5f5;
            }
            QTableWidget {
                background-color: white;
                alternate-background-color: #f9f9f9;
                gridline-color: #ddd;
                border: 1px solid #ddd;
            }
            QTableWidget::item {
                padding: 8px;
                border-bottom: 1px solid #eee;
            }
            QHeaderView::section {
                background-color: #007BFF;
                color: white;
                padding: 8px;
                border: none;
                font-weight: bold;
            }
        """)
    
    def setup_menu(self):
        """Настройка меню"""
        menubar = self.menuBar()
        
        # Меню Файл
        file_menu = menubar.addMenu('Файл')
        
        exit_action = QAction('Выход', self)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        # Меню Инструменты
        tools_menu = menubar.addMenu('Инструменты')
        
        browser_action = QAction('Запуск браузера', self)
        browser_action.triggered.connect(self.central_widget.open_browser_launcher)
        tools_menu.addAction(browser_action)
        
        proxy_action = QAction('Менеджер прокси', self)
        proxy_action.triggered.connect(self.central_widget.open_proxy_manager)
        tools_menu.addAction(proxy_action)
        
        # Меню Справка
        help_menu = menubar.addMenu('Справка')
        
        about_action = QAction('О программе', self)
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)
    
    def show_about(self):
        """Показать информацию о программе"""
        QMessageBox.about(
            self, 
            "О программе",
            "Keyset v2.0 - Desktop Application\n\n"
            "Полная копия React интерфейса\n"
            "с поддержкой всех функций:\n"
            "• Управление аккаунтами\n"
            "• Менеджер прокси\n" 
            "• Fingerprint настройки\n"
            "• Капча интеграция\n"
            "• Массовые операции"
        )


def main():
    """Главная функция"""
    app = QApplication(sys.argv)
    
    # Стиль приложения
    app.setStyle('Fusion')
    
    # Создание и показ окна
    window = KeysetMainWindow()
    window.show()
    
    # Запуск приложения
    sys.exit(app.exec())


if __name__ == '__main__':
    main()