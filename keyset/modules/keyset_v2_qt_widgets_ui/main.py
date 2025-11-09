#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Keyset v2.0 - Управление аккаунтами (Qt Widgets версия)
Точная копия оригинального веб-интерфейса в Qt Designer формате

Автор: MiniMax Agent
Версия: 2.0
Формат: Qt Designer .ui (Widgets)
"""

import sys
import os
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QTableWidget, QTableWidgetItem, QPushButton, QLineEdit, 
    QComboBox, QLabel, QFrame, QGroupBox, QTabWidget,
    QCheckBox, QListWidget, QListWidgetItem, QMenuBar, QStatusBar,
    QMessageBox, QFileDialog
)
from PyQt5.QtCore import Qt, pyqtSignal, QTimer
from PyQt5.QtGui import QFont, QIcon


class KeysetMainWindow(QMainWindow):
    """Главное окно приложения Keyset v2.0"""
    
    # Сигналы
    accountSelected = pyqtSignal(str)
    searchTextChanged = pyqtSignal(str)
    
    def __init__(self):
        super().__init__()
        self.init_ui()
        self.setup_connections()
        self.setup_timer()
        
    def init_ui(self):
        """Инициализация интерфейса"""
        self.setWindowTitle("Keyset v2.0 - Вкладка Аккаунты")
        self.setGeometry(100, 100, 1400, 900)
        
        # Главный виджет
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        
        # Главный layout
        self.main_layout = QVBoxLayout(self.central_widget)
        self.main_layout.setSpacing(4)
        self.main_layout.setContentsMargins(0, 0, 0, 0)
        
        # Верхняя панель
        self.create_top_bar()
        
        # Панель инструментов
        self.create_toolbar()
        
        # Основной контент
        self.create_main_content()
        
        # Менюбар и статусбар
        self.create_menu_bar()
        self.create_status_bar()
        
        # Загрузка демо-данных
        self.load_demo_data()
        
    def create_top_bar(self):
        """Создание верхней панели"""
        self.top_bar_frame = QFrame()
        self.top_bar_frame.setFrameShape(QFrame.NoFrame)
        self.top_bar_frame.setStyleSheet("""
            QFrame#top_bar_frame { 
                background-color: #f8f9fa; 
                border-bottom: 1px solid #e0e0e0; 
                padding: 8px; 
            }
        """)
        
        self.top_bar_layout = QHBoxLayout(self.top_bar_frame)
        
        # Заголовок
        self.title_label = QLabel("🔑 Аккаунты")
        self.title_label.setStyleSheet("font-size: 24px; font-weight: bold; color: #333;")
        
        # Новые функции
        self.new_functions_frame = QFrame()
        self.new_functions_layout = QHBoxLayout(self.new_functions_frame)
        
        self.btn_browser_launcher = QPushButton("🚀 Запуск браузера")
        self.btn_browser_launcher.setStyleSheet("""
            QPushButton { 
                background-color: #ffc107; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                font-size: 14px; 
                color: #212529; 
            }
            QPushButton:hover { 
                background-color: #e0a800; 
            }
        """)
        
        self.btn_consistency_checker = QPushButton("🔍 Проверка консистентности")
        self.btn_consistency_checker.setStyleSheet("""
            QPushButton { 
                background-color: #17a2b8; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                font-size: 14px; 
                color: white; 
            }
            QPushButton:hover { 
                background-color: #138496; 
            }
        """)
        
        self.new_functions_layout.addWidget(self.btn_browser_launcher)
        self.new_functions_layout.addWidget(self.btn_consistency_checker)
        
        # Spacer
        self.top_bar_spacer = QFrame()
        
        # Добавление в layout
        self.top_bar_layout.addWidget(self.title_label)
        self.top_bar_layout.addWidget(self.new_functions_frame)
        self.top_bar_layout.addStretch()
        
        self.main_layout.addWidget(self.top_bar_frame)
        
    def create_toolbar(self):
        """Создание панели инструментов"""
        self.toolbar_frame = QFrame()
        self.toolbar_frame.setFrameShape(QFrame.NoFrame)
        self.toolbar_frame.setStyleSheet("""
            QFrame#toolbar_frame { 
                background-color: white; 
                border-bottom: 1px solid #e0e0e0; 
                padding: 12px 20px; 
            }
        """)
        
        self.toolbar_layout = QHBoxLayout(self.toolbar_frame)
        self.toolbar_layout.setSpacing(8)
        
        # Кнопки
        self.btn_add = QPushButton("➕ Добавить")
        self.btn_add.setStyleSheet("""
            QPushButton { 
                background-color: #007bff; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                color: white; 
                font-weight: bold; 
            }
            QPushButton:hover { 
                background-color: #0056b3; 
            }
        """)
        
        self.btn_edit = QPushButton("✏️ Изменить")
        self.btn_edit.setStyleSheet("""
            QPushButton { 
                background-color: #6c757d; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                color: white; 
            }
            QPushButton:hover { 
                background-color: #545b62; 
            }
        """)
        
        self.btn_delete = QPushButton("🗑️ Удалить")
        self.btn_delete.setStyleSheet("""
            QPushButton { 
                background-color: #6c757d; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                color: white; 
            }
            QPushButton:hover { 
                background-color: #545b62; 
            }
        """)
        
        self.btn_refresh = QPushButton("🔄 Обновить")
        self.btn_refresh.setStyleSheet("""
            QPushButton { 
                background-color: #17a2b8; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                color: white; 
            }
            QPushButton:hover { 
                background-color: #138496; 
            }
        """)
        
        self.btn_launch = QPushButton("▶️ Запустить")
        self.btn_launch.setStyleSheet("""
            QPushButton { 
                background-color: #28a745; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                color: white; 
                font-weight: bold; 
            }
            QPushButton:hover { 
                background-color: #218838; 
            }
        """)
        
        self.btn_proxy_manager = QPushButton("⚙️ Менеджер прокси")
        self.btn_proxy_manager.setStyleSheet("""
            QPushButton { 
                background-color: #ffc107; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                color: #212529; 
                font-weight: bold; 
            }
            QPushButton:hover { 
                background-color: #e0a800; 
            }
        """)
        
        # Добавление в layout
        self.toolbar_layout.addWidget(self.btn_add)
        self.toolbar_layout.addWidget(self.btn_edit)
        self.toolbar_layout.addWidget(self.btn_delete)
        self.toolbar_layout.addWidget(self.btn_refresh)
        self.toolbar_layout.addWidget(self.btn_launch)
        self.toolbar_layout.addWidget(self.btn_proxy_manager)
        self.toolbar_layout.addStretch()
        
        self.main_layout.addWidget(self.toolbar_frame)
        
    def create_main_content(self):
        """Создание основного контента"""
        self.main_content_widget = QWidget()
        self.main_content_layout = QHBoxLayout(self.main_content_widget)
        self.main_content_layout.setSpacing(8)
        self.main_content_layout.setContentsMargins(0, 0, 0, 0)
        
        # Левая часть (70%)
        self.create_left_content()
        
        # Правая часть - боковая панель (30%)
        self.create_sidebar()
        
        self.main_layout.addWidget(self.main_content_widget)
        
    def create_left_content(self):
        """Создание левого контента"""
        self.left_content_widget = QWidget()
        self.left_content_layout = QVBoxLayout(self.left_content_widget)
        self.left_content_layout.setSpacing(8)
        
        # Поиск и фильтры
        self.create_search_filters()
        
        # Таблица аккаунтов
        self.create_accounts_table()
        
        # 3 блока в одну строку
        self.create_info_blocks()
        
        self.main_content_layout.addWidget(self.left_content_widget, 7)
        
    def create_search_filters(self):
        """Создание поиска и фильтров"""
        self.search_filter_frame = QFrame()
        self.search_filter_frame.setFrameShape(QFrame.NoFrame)
        self.search_filter_frame.setStyleSheet("""
            QFrame#search_filter_frame { 
                background-color: white; 
                padding: 8px; 
            }
        """)
        
        self.search_filter_layout = QHBoxLayout(self.search_filter_frame)
        
        # Поисковая строка
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("🔍 Поиск по email...")
        self.search_input.setMinimumSize(300, 36)
        
        # Фильтр статуса
        self.status_filter = QComboBox()
        self.status_filter.setMinimumSize(150, 36)
        self.status_filter.addItem("Все статусы")
        self.status_filter.addItem("✅ Активен")
        self.status_filter.addItem("⚠️ Требует входа")
        self.status_filter.addItem("❌ Ошибка")
        self.status_filter.addItem("🔄 В работе")
        
        self.search_filter_layout.addWidget(self.search_input)
        self.search_filter_layout.addWidget(self.status_filter)
        
        self.left_content_layout.addWidget(self.search_filter_frame)
        
        # Быстрые фильтры
        self.create_quick_filters()
        
    def create_quick_filters(self):
        """Создание быстрых фильтров"""
        self.quick_filters_frame = QFrame()
        self.quick_filters_frame.setFrameShape(QFrame.NoFrame)
        self.quick_filters_frame.setStyleSheet("""
            QFrame#quick_filters_frame { 
                background-color: #f8f9fa; 
                border-bottom: 1px solid #e0e0e0; 
                padding: 8px 20px; 
            }
        """)
        
        self.quick_filters_layout = QHBoxLayout(self.quick_filters_frame)
        self.quick_filters_layout.setSpacing(8)
        
        # Кнопки быстрых фильтров
        buttons = [
            ("Только активные", "btn_active_only"),
            ("Требуют входа", "btn_needs_login"),
            ("С ошибками", "btn_with_errors"),
            ("С прокси", "btn_with_proxy"),
            ("Очистить", "btn_clear_filters")
        ]
        
        for text, name in buttons:
            btn = QPushButton(text)
            btn.setStyleSheet("""
                QPushButton { 
                    background-color: #6c757d; 
                    border: none; 
                    padding: 6px 12px; 
                    border-radius: 4px; 
                    color: white; 
                    font-size: 12px; 
                }
                QPushButton:hover { 
                    background-color: #545b62; 
                }
            """)
            setattr(self, name, btn)
            self.quick_filters_layout.addWidget(btn)
        
        self.left_content_layout.addWidget(self.quick_filters_frame)
        
    def create_accounts_table(self):
        """Создание таблицы аккаунтов"""
        self.accounts_table = QTableWidget()
        self.accounts_table.setAlternatingRowColors(True)
        self.accounts_table.setSelectionMode(QTableWidget.SingleSelection)
        self.accounts_table.setSelectionBehavior(QTableWidget.SelectRows)
        self.accounts_table.setShowGrid(False)
        self.accounts_table.setGridStyle(Qt.NoPen)
        
        # Колонки
        columns = [
            ("", 40),        # Чекбокс
            ("Аккаунт", 250),
            ("Статус", 120),
            ("Прокси", 150),
            ("Отпечаток", 150),
            ("Последний запуск", 160),
            ("Действия", 150)
        ]
        
        self.accounts_table.setColumnCount(len(columns))
        self.accounts_table.setHorizontalHeaderLabels([col[0] for col in columns])
        
        for i, (name, width) in enumerate(columns):
            self.accounts_table.setColumnWidth(i, width)
            
        self.left_content_layout.addWidget(self.accounts_table)
        
    def create_info_blocks(self):
        """Создание 3 информационных блоков"""
        self.info_blocks_widget = QWidget()
        self.info_blocks_layout = QHBoxLayout(self.info_blocks_widget)
        self.info_blocks_layout.setSpacing(12)
        
        # Блок 1: Управление прокси
        self.create_proxy_management_block()
        
        # Блок 2: Быстрые действия
        self.create_quick_actions_block()
        
        # Блок 3: История запусков
        self.create_launch_history_block()
        
        self.left_content_layout.addWidget(self.info_blocks_widget)
        
    def create_proxy_management_block(self):
        """Создание блока управления прокси"""
        self.proxy_management_box = QGroupBox("🌐 Управление прокси")
        proxy_layout = QVBoxLayout(self.proxy_management_box)
        
        self.proxy_summary = QLabel("23 активных | 5 мёртвых")
        proxy_layout.addWidget(self.proxy_summary)
        
        self.proxy_list = QListWidget()
        self.proxy_list.setMaximumHeight(100)
        proxy_layout.addWidget(self.proxy_list)
        
        # Кнопки прокси
        proxy_buttons_layout = QHBoxLayout()
        
        self.btn_import_proxy = QPushButton("📥 Импорт")
        self.btn_import_proxy.setStyleSheet("""
            QPushButton { 
                background-color: #17a2b8; 
                border: none; 
                padding: 4px 8px; 
                border-radius: 4px; 
                color: white; 
                font-size: 12px; 
            }
            QPushButton:hover { 
                background-color: #138496; 
            }
        """)
        
        self.btn_test_all_proxies = QPushButton("🧪 Тест всех")
        self.btn_test_all_proxies.setStyleSheet("""
            QPushButton { 
                background-color: #ffc107; 
                border: none; 
                padding: 4px 8px; 
                border-radius: 4px; 
                color: #212529; 
                font-size: 12px; 
            }
            QPushButton:hover { 
                background-color: #e0a800; 
            }
        """)
        
        self.btn_clear_dead_proxies = QPushButton("🗑️ Очистить")
        self.btn_clear_dead_proxies.setStyleSheet("""
            QPushButton { 
                background-color: #6c757d; 
                border: none; 
                padding: 4px 8px; 
                border-radius: 4px; 
                color: white; 
                font-size: 12px; 
            }
            QPushButton:hover { 
                background-color: #545b62; 
            }
        """)
        
        proxy_buttons_layout.addWidget(self.btn_import_proxy)
        proxy_buttons_layout.addWidget(self.btn_test_all_proxies)
        proxy_buttons_layout.addWidget(self.btn_clear_dead_proxies)
        
        proxy_layout.addLayout(proxy_buttons_layout)
        
        self.info_blocks_layout.addWidget(self.proxy_management_box)
        
    def create_quick_actions_block(self):
        """Создание блока быстрых действий"""
        self.quick_actions_box = QGroupBox("⚡ Быстрые действия")
        actions_layout = QVBoxLayout(self.quick_actions_box)
        
        # Кнопки действий
        actions = [
            ("🔄 Обновить все статусы", "btn_refresh_all_statuses"),
            ("▶️ Массовый запуск (5 браузеров)", "btn_mass_launch"),
            ("🛡️ Проверить авторизацию", "btn_check_auth"),
            ("📄 Экспорт списка аккаунтов", "btn_export_accounts")
        ]
        
        for text, name in actions:
            btn = QPushButton(text)
            btn.setStyleSheet("""
                QPushButton { 
                    background-color: transparent; 
                    border: 1px solid #e0e0e0; 
                    padding: 8px; 
                    border-radius: 4px; 
                    text-align: left; 
                }
                QPushButton:hover { 
                    background-color: #f8f9fa; 
                }
            """)
            setattr(self, name, btn)
            actions_layout.addWidget(btn)
            
        self.info_blocks_layout.addWidget(self.quick_actions_box)
        
    def create_launch_history_block(self):
        """Создание блока истории запусков"""
        self.launch_history_box = QGroupBox("📜 История запусков")
        history_layout = QVBoxLayout(self.launch_history_box)
        
        self.launch_history_list = QListWidget()
        self.launch_history_list.setMaximumHeight(120)
        history_layout.addWidget(self.launch_history_list)
        
        self.btn_show_all_history = QPushButton("📋 Показать всё")
        self.btn_show_all_history.setStyleSheet("""
            QPushButton { 
                background-color: #17a2b8; 
                border: none; 
                padding: 4px 8px; 
                border-radius: 4px; 
                color: white; 
                font-size: 12px; 
            }
            QPushButton:hover { 
                background-color: #138496; 
            }
        """)
        
        history_layout.addWidget(self.btn_show_all_history)
        
        self.info_blocks_layout.addWidget(self.launch_history_box)
        
    def create_sidebar(self):
        """Создание боковой панели"""
        self.sidebar_widget = QWidget()
        self.sidebar_widget.setMinimumWidth(350)
        self.sidebar_widget.setStyleSheet("""
            QWidget#sidebar_widget { 
                background-color: white; 
                border-left: 1px solid #e0e0e0; 
            }
        """)
        
        self.sidebar_layout = QVBoxLayout(self.sidebar_widget)
        self.sidebar_layout.setSpacing(0)
        
        # Заголовок боковой панели
        self.create_sidebar_header()
        
        # Вкладки настроек
        self.create_settings_tabs()
        
        # Кнопка сохранить
        self.create_save_button()
        
        self.main_content_layout.addWidget(self.sidebar_widget, 3)
        
    def create_sidebar_header(self):
        """Создание заголовка боковой панели"""
        self.sidebar_header_frame = QFrame()
        self.sidebar_header_frame.setFrameShape(QFrame.NoFrame)
        self.sidebar_header_frame.setStyleSheet("""
            QFrame#sidebar_header_frame { 
                background-color: #f8f9fa; 
                border-bottom: 1px solid #e0e0e0; 
                padding: 12px; 
            }
        """)
        
        self.sidebar_header_layout = QHBoxLayout(self.sidebar_header_frame)
        
        self.sidebar_title = QLabel("Настройки аккаунта")
        self.sidebar_title.setStyleSheet("font-weight: bold; font-size: 16px; color: #333;")
        
        self.btn_sidebar_close = QPushButton("✕")
        self.btn_sidebar_close.setStyleSheet("""
            QPushButton { 
                background-color: transparent; 
                border: none; 
                font-size: 18px; 
                padding: 4px; 
            }
            QPushButton:hover { 
                background-color: #e0e0e0; 
            }
        """)
        
        self.sidebar_header_layout.addWidget(self.sidebar_title)
        self.sidebar_header_layout.addStretch()
        self.sidebar_header_layout.addWidget(self.btn_sidebar_close)
        
        self.sidebar_layout.addWidget(self.sidebar_header_frame)
        
    def create_settings_tabs(self):
        """Создание вкладок настроек"""
        self.settings_tab_widget = QTabWidget()
        self.settings_tab_widget.setTabPosition(QTabWidget.West)
        self.settings_tab_widget.setTabShape(QTabWidget.Rounded)
        
        # Вкладка: Основное
        self.create_basic_tab()
        
        # Вкладка: Сеть
        self.create_network_tab()
        
        # Вкладка: Fingerprint
        self.create_fingerprint_tab()
        
        # Вкладка: Капча
        self.create_captcha_tab()
        
        # Вкладка: Менеджер прокси
        self.create_proxy_manager_tab()
        
        self.sidebar_layout.addWidget(self.settings_tab_widget)
        
    def create_basic_tab(self):
        """Создание вкладки Основное"""
        self.tab_basic = QWidget()
        basic_layout = QVBoxLayout(self.tab_basic)
        basic_layout.setSpacing(12)
        basic_layout.setContentsMargins(16, 16, 16, 16)
        
        # Поля формы
        fields = [
            ("Email", "account_email_input", "user@example.com"),
            ("Пароль", "account_password_input", "Пароль", True),
            ("Секретный вопрос", "secret_question_input", "Ответ на секретный вопрос"),
            ("Профиль Chrome", "chrome_profile_input", "Путь к профилю")
        ]
        
        for label_text, name, placeholder, *args in fields:
            is_password = len(args) > 0 and args[0]
            
            label = QLabel(label_text)
            label.setStyleSheet("font-weight: bold;")
            
            field = QLineEdit()
            field.setPlaceholderText(placeholder)
            if is_password:
                field.setEchoMode(QLineEdit.Password)
                
            basic_layout.addWidget(label)
            basic_layout.addWidget(field)
            setattr(self, name, field)
            
        basic_layout.addStretch()
        
        self.settings_tab_widget.addTab(self.tab_basic, "📋 Основное")
        
    def create_network_tab(self):
        """Создание вкладки Сеть"""
        self.tab_network = QWidget()
        network_layout = QVBoxLayout(self.tab_network)
        network_layout.setSpacing(12)
        network_layout.setContentsMargins(16, 16, 16, 16)
        
        # Поля сети
        label = QLabel("Адрес прокси")
        label.setStyleSheet("font-weight: bold;")
        
        self.proxy_address_input = QLineEdit()
        self.proxy_address_input.setPlaceholderText("192.168.1.101:8080")
        
        label2 = QLabel("Тип протокола")
        label2.setStyleSheet("font-weight: bold;")
        
        self.proxy_type_combo = QComboBox()
        self.proxy_type_combo.addItems(["HTTP", "HTTPS", "SOCKS5"])
        
        self.btn_test_proxy = QPushButton("🧪 Тест прокси")
        self.btn_test_proxy.setStyleSheet("""
            QPushButton { 
                background-color: #17a2b8; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                color: white; 
            }
            QPushButton:hover { 
                background-color: #138496; 
            }
        """)
        
        network_layout.addWidget(label)
        network_layout.addWidget(self.proxy_address_input)
        network_layout.addWidget(label2)
        network_layout.addWidget(self.proxy_type_combo)
        network_layout.addWidget(self.btn_test_proxy)
        network_layout.addStretch()
        
        self.settings_tab_widget.addTab(self.tab_network, "🌐 Сеть")
        
    def create_fingerprint_tab(self):
        """Создание вкладки Fingerprint"""
        self.tab_fingerprint = QWidget()
        fingerprint_layout = QVBoxLayout(self.tab_fingerprint)
        fingerprint_layout.setSpacing(12)
        fingerprint_layout.setContentsMargins(16, 16, 16, 16)
        
        # Поля Fingerprint
        label = QLabel("Предустановка")
        label.setStyleSheet("font-weight: bold;")
        
        self.fingerprint_preset_combo = QComboBox()
        self.fingerprint_preset_combo.addItems([
            "🇷🇺 Россия (стандарт)",
            "🇰🇿 Казахстан (стандарт)", 
            "🌐 Без подмены"
        ])
        
        label2 = QLabel("Часовой пояс")
        label2.setStyleSheet("font-weight: bold;")
        
        self.timezone_combo = QComboBox()
        self.timezone_combo.addItems(["Europe/Moscow", "Asia/Almaty", "UTC"])
        
        self.canvas_spoofing_check = QCheckBox("Canvas спуфинг")
        self.webgl_spoofing_check = QCheckBox("WebGL спуфинг")
        self.audio_spoofing_check = QCheckBox("AudioContext спуфинг")
        
        fingerprint_layout.addWidget(label)
        fingerprint_layout.addWidget(self.fingerprint_preset_combo)
        fingerprint_layout.addWidget(label2)
        fingerprint_layout.addWidget(self.timezone_combo)
        fingerprint_layout.addWidget(self.canvas_spoofing_check)
        fingerprint_layout.addWidget(self.webgl_spoofing_check)
        fingerprint_layout.addWidget(self.audio_spoofing_check)
        fingerprint_layout.addStretch()
        
        self.settings_tab_widget.addTab(self.tab_fingerprint, "🎭 Fingerprint")
        
    def create_captcha_tab(self):
        """Создание вкладки Капча"""
        self.tab_captcha = QWidget()
        captcha_layout = QVBoxLayout(self.tab_captcha)
        captcha_layout.setSpacing(12)
        captcha_layout.setContentsMargins(16, 16, 16, 16)
        
        # Поля капчи
        label = QLabel("Сервис")
        label.setStyleSheet("font-weight: bold;")
        
        self.captcha_service_combo = QComboBox()
        self.captcha_service_combo.addItems([
            "Отключено",
            "RuCaptcha",
            "2Captcha", 
            "AntiCaptcha"
        ])
        
        label2 = QLabel("API Ключ")
        label2.setStyleSheet("font-weight: bold;")
        
        self.captcha_api_key_input = QLineEdit()
        self.captcha_api_key_input.setEchoMode(QLineEdit.Password)
        self.captcha_api_key_input.setPlaceholderText("API ключ")
        
        captcha_layout.addWidget(label)
        captcha_layout.addWidget(self.captcha_service_combo)
        captcha_layout.addWidget(label2)
        captcha_layout.addWidget(self.captcha_api_key_input)
        captcha_layout.addStretch()
        
        self.settings_tab_widget.addTab(self.tab_captcha, "🛡️ Капча")
        
    def create_proxy_manager_tab(self):
        """Создание вкладки Менеджер прокси"""
        self.tab_proxy_manager = QWidget()
        proxy_manager_layout = QVBoxLayout(self.tab_proxy_manager)
        proxy_manager_layout.setSpacing(12)
        proxy_manager_layout.setContentsMargins(16, 16, 16, 16)
        
        # Секция парсинга
        self.proxy_parsing_box = QGroupBox("📥 Парсинг прокси")
        proxy_parsing_layout = QVBoxLayout(self.proxy_parsing_box)
        
        self.fineproxy_check = QCheckBox("fineproxy.org")
        self.fineproxy_check.setChecked(True)
        
        self.proxyelite_check = QCheckBox("proxyelite.info")
        self.htmlweb_check = QCheckBox("htmlweb.ru")
        
        self.btn_start_parsing = QPushButton("▶️ Начать парсинг")
        self.btn_start_parsing.setStyleSheet("""
            QPushButton { 
                background-color: #007bff; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                color: white; 
            }
            QPushButton:hover { 
                background-color: #0056b3; 
            }
        """)
        
        proxy_parsing_layout.addWidget(self.fineproxy_check)
        proxy_parsing_layout.addWidget(self.proxyelite_check)
        proxy_parsing_layout.addWidget(self.htmlweb_check)
        proxy_parsing_layout.addWidget(self.btn_start_parsing)
        
        # Секция списка
        self.proxy_list_box = QGroupBox("📋 Список прокси")
        proxy_list_layout = QVBoxLayout(self.proxy_list_box)
        
        self.proxy_count_label = QLabel("Найдено: 0")
        proxy_list_layout.addWidget(self.proxy_count_label)
        
        self.btn_apply_proxy = QPushButton("✅ Применить к аккаунту")
        self.btn_apply_proxy.setStyleSheet("""
            QPushButton { 
                background-color: #28a745; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                color: white; 
            }
            QPushButton:hover { 
                background-color: #218838; 
            }
        """)
        
        proxy_list_layout.addWidget(self.btn_apply_proxy)
        
        proxy_manager_layout.addWidget(self.proxy_parsing_box)
        proxy_manager_layout.addWidget(self.proxy_list_box)
        proxy_manager_layout.addStretch()
        
        self.settings_tab_widget.addTab(self.tab_proxy_manager, "⚙️ Менеджер прокси")
        
    def create_save_button(self):
        """Создание кнопки сохранения"""
        self.btn_save_account = QPushButton("💾 СОХРАНИТЬ")
        self.btn_save_account.setStyleSheet("""
            QPushButton { 
                background-color: #28a745; 
                border: none; 
                padding: 16px; 
                border-radius: 4px; 
                color: white; 
                font-weight: bold; 
                font-size: 16px; 
            }
            QPushButton:hover { 
                background-color: #218838; 
            }
        """)
        
        self.sidebar_layout.addWidget(self.btn_save_account)
        
    def create_menu_bar(self):
        """Создание менюбара"""
        self.menu_bar = QMenuBar()
        
        # Меню Файл
        self.menu_file = self.menu_bar.addMenu("Файл")
        
        # Меню Правка
        self.menu_edit = self.menu_bar.addMenu("Правка")
        
        # Меню Справка
        self.menu_help = self.menu_bar.addMenu("Справка")
        
        self.setMenuBar(self.menu_bar)
        
    def create_status_bar(self):
        """Создание статусбара"""
        self.status_bar = QStatusBar()
        self.status_bar.setStyleSheet("""
            QStatusBar { 
                background-color: #f9fafb; 
                border-top: 1px solid #e5e7eb; 
            }
        """)
        
        self.setStatusBar(self.status_bar)
        
    def setup_connections(self):
        """Настройка соединений сигналов и слотов"""
        # Основные кнопки
        self.btn_add.clicked.connect(self.on_add_clicked)
        self.btn_edit.clicked.connect(self.on_edit_clicked)
        self.btn_delete.clicked.connect(self.on_delete_clicked)
        self.btn_refresh.clicked.connect(self.on_refresh_clicked)
        self.btn_launch.clicked.connect(self.on_launch_clicked)
        self.btn_proxy_manager.clicked.connect(self.on_proxy_manager_clicked)
        
        # Новые функции
        self.btn_browser_launcher.clicked.connect(self.on_browser_launcher_clicked)
        self.btn_consistency_checker.clicked.connect(self.on_consistency_checker_clicked)
        
        # Поиск
        self.search_input.textChanged.connect(self.on_search_text_changed)
        self.status_filter.currentTextChanged.connect(self.on_status_filter_changed)
        
        # Быстрые фильтры
        self.btn_active_only.clicked.connect(lambda: self.filter_by_status("✅ Активен"))
        self.btn_needs_login.clicked.connect(lambda: self.filter_by_status("⚠️ Требует входа"))
        self.btn_with_errors.clicked.connect(lambda: self.filter_by_status("❌ Ошибка"))
        self.btn_with_proxy.clicked.connect(self.filter_by_proxy)
        self.btn_clear_filters.clicked.connect(self.clear_all_filters)
        
        # Действия в таблицах
        self.accounts_table.itemSelectionChanged.connect(self.on_account_selection_changed)
        
        # Настройки
        self.btn_test_proxy.clicked.connect(self.on_test_proxy_clicked)
        self.btn_start_parsing.clicked.connect(self.on_start_parsing_clicked)
        self.btn_apply_proxy.clicked.connect(self.on_apply_proxy_clicked)
        self.btn_save_account.clicked.connect(self.on_save_account_clicked)
        self.btn_sidebar_close.clicked.connect(self.hide_sidebar)
        
        # Статус бар
        self.status_bar.showMessage("Готово к работе")
        
    def setup_timer(self):
        """Настройка таймера для обновления"""
        self.update_timer = QTimer()
        self.update_timer.timeout.connect(self.update_display)
        self.update_timer.start(5000)  # Обновление каждые 5 секунд
        
    def load_demo_data(self):
        """Загрузка демо-данных"""
        demo_accounts = [
            {
                "email": "user1@yandex.ru",
                "status": "✅ Активен",
                "proxy": "185.176.26.202:80",
                "fingerprint": "Chrome 118.0",
                "last_run": "2025-11-05 14:30"
            },
            {
                "email": "user2@yandex.ru", 
                "status": "⚠️ Требует входа",
                "proxy": "45.131.208.99:8000",
                "fingerprint": "Chrome 119.0",
                "last_run": "2025-11-05 10:15"
            },
            {
                "email": "user3@gmail.com",
                "status": "❌ Ошибка", 
                "proxy": "89.116.250.12:8080",
                "fingerprint": "Chrome 117.0",
                "last_run": "2025-11-04 16:45"
            }
        ]
        
        self.accounts_table.setRowCount(len(demo_accounts))
        
        for row, account in enumerate(demo_accounts):
            # Чекбокс
            checkbox = QTableWidgetItem()
            checkbox.setCheckState(Qt.Unchecked)
            self.accounts_table.setItem(row, 0, checkbox)
            
            # Данные
            self.accounts_table.setItem(row, 1, QTableWidgetItem(account["email"]))
            self.accounts_table.setItem(row, 2, QTableWidgetItem(account["status"]))
            self.accounts_table.setItem(row, 3, QTableWidgetItem(account["proxy"]))
            self.accounts_table.setItem(row, 4, QTableWidgetItem(account["fingerprint"]))
            self.accounts_table.setItem(row, 5, QTableWidgetItem(account["last_run"]))
            
            # Кнопки действий
            actions_widget = QWidget()
            actions_layout = QHBoxLayout(actions_widget)
            actions_layout.setContentsMargins(4, 0, 4, 0)
            
            btn_view = QPushButton("👁️")
            btn_view.setMaximumSize(24, 24)
            btn_view.clicked.connect(lambda checked, email=account["email"]: self.view_account(email))
            
            btn_edit = QPushButton("✏️")
            btn_edit.setMaximumSize(24, 24)
            btn_edit.clicked.connect(lambda checked, email=account["email"]: self.edit_account(email))
            
            btn_delete = QPushButton("🗑️")
            btn_delete.setMaximumSize(24, 24)
            btn_delete.clicked.connect(lambda checked, email=account["email"]: self.delete_account(email))
            
            actions_layout.addWidget(btn_view)
            actions_layout.addWidget(btn_edit)
            actions_layout.addWidget(btn_delete)
            
            self.accounts_table.setCellWidget(row, 6, actions_widget)
            
        # Демо прокси
        proxy_items = [
            "185.176.26.202:80 ✅ 312ms RU",
            "45.131.208.99:8000 ✅ 480ms RU", 
            "89.116.250.12:8080 ❌ timeout KZ"
        ]
        
        for item in proxy_items:
            self.proxy_list.addItem(item)
            
        # Демо история
        history_items = [
            "user1@yandex.ru Запущен: 2025-10-31 00:05:00 ✅ Работает | Порт: 9222",
            "user2@yandex.ru Запущен: 2025-10-30 23:45:12 ❌ Закрыт",
            "user3@gmail.com Запущен: 2025-10-30 22:30:45 ✅ Работает | Порт: 9223"
        ]
        
        for item in history_items:
            self.launch_history_list.addItem(item)
            
    # Слоты обработки событий
    def on_add_clicked(self):
        self.status_bar.showMessage("Добавление нового аккаунта...")
        QMessageBox.information(self, "Добавить", "Функция добавления аккаунта")
        
    def on_edit_clicked(self):
        self.status_bar.showMessage("Изменение аккаунта...")
        QMessageBox.information(self, "Изменить", "Функция изменения аккаунта")
        
    def on_delete_clicked(self):
        self.status_bar.showMessage("Удаление аккаунта...")
        reply = QMessageBox.question(self, "Удалить", "Вы уверены, что хотите удалить выбранный аккаунт?", QMessageBox.Yes | QMessageBox.No)
        if reply == QMessageBox.Yes:
            QMessageBox.information(self, "Удалить", "Аккаунт удалён")
            
    def on_refresh_clicked(self):
        self.status_bar.showMessage("Обновление данных...")
        self.update_display()
        
    def on_launch_clicked(self):
        self.status_bar.showMessage("Запуск браузера...")
        QMessageBox.information(self, "Запустить", "Функция запуска браузера")
        
    def on_proxy_manager_clicked(self):
        self.status_bar.showMessage("Открытие менеджера прокси...")
        QMessageBox.information(self, "Менеджер прокси", "Функция управления прокси")
        
    def on_browser_launcher_clicked(self):
        self.status_bar.showMessage("Запуск нового браузера...")
        QMessageBox.information(self, "Запуск браузера", "Функция запуска браузера")
        
    def on_consistency_checker_clicked(self):
        self.status_bar.showMessage("Проверка консистентности...")
        QMessageBox.information(self, "Проверка консистентности", "Функция проверки консистентности")
        
    def on_search_text_changed(self, text):
        self.status_bar.showMessage(f"Поиск: {text}")
        
    def on_status_filter_changed(self, status):
        self.status_bar.showMessage(f"Фильтр статуса: {status}")
        
    def filter_by_status(self, status):
        self.status_bar.showMessage(f"Фильтр: {status}")
        
    def filter_by_proxy(self):
        self.status_bar.showMessage("Фильтр: аккаунты с прокси")
        
    def clear_all_filters(self):
        self.search_input.clear()
        self.status_filter.setCurrentIndex(0)
        self.status_bar.showMessage("Фильтры очищены")
        
    def on_account_selection_changed(self):
        selected_items = self.accounts_table.selectedItems()
        if selected_items:
            email = selected_items[1].text()  # Колонка email
            self.status_bar.showMessage(f"Выбран аккаунт: {email}")
            
    def on_test_proxy_clicked(self):
        self.status_bar.showMessage("Тестирование прокси...")
        QMessageBox.information(self, "Тест прокси", "Тестирование прокси завершено")
        
    def on_start_parsing_clicked(self):
        self.status_bar.showMessage("Запуск парсинга прокси...")
        QMessageBox.information(self, "Парсинг", "Парсинг прокси начат")
        
    def on_apply_proxy_clicked(self):
        self.status_bar.showMessage("Применение прокси...")
        QMessageBox.information(self, "Применить прокси", "Прокси применён к аккаунту")
        
    def on_save_account_clicked(self):
        self.status_bar.showMessage("Сохранение настроек аккаунта...")
        QMessageBox.information(self, "Сохранить", "Настройки аккаунта сохранены")
        
    def hide_sidebar(self):
        self.sidebar_widget.hide()
        
    def view_account(self, email):
        self.status_bar.showMessage(f"Просмотр аккаунта: {email}")
        QMessageBox.information(self, "Просмотр", f"Просмотр аккаунта {email}")
        
    def edit_account(self, email):
        self.status_bar.showMessage(f"Изменение аккаунта: {email}")
        self.sidebar_widget.show()
        QMessageBox.information(self, "Изменить", f"Изменение аккаунта {email}")
        
    def delete_account(self, email):
        self.status_bar.showMessage(f"Удаление аккаунта: {email}")
        reply = QMessageBox.question(self, "Удалить", f"Удалить аккаунт {email}?", QMessageBox.Yes | QMessageBox.No)
        if reply == QMessageBox.Yes:
            QMessageBox.information(self, "Удалить", f"Аккаунт {email} удалён")
            
    def update_display(self):
        """Обновление отображения"""
        self.status_bar.showMessage("Данные обновлены")
        

def main():
    """Главная функция"""
    app = QApplication(sys.argv)
    
    # Настройка шрифта
    font = QFont("Segoe UI", 9)
    app.setFont(font)
    
    # Создание главного окна
    window = KeysetMainWindow()
    window.show()
    
    # Запуск цикла событий
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()