# -*- coding: utf-8 -*-
"""
Parsing Tab V5 - полный интерфейс из keyset-v5.0 встроенный в Qt
"""
from pathlib import Path
from PySide6.QtCore import QUrl, Slot, QObject
from PySide6.QtWidgets import QWidget, QVBoxLayout
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebChannel import QWebChannel
import json


class PythonBridge(QObject):
    """Мост между Python (парсинг) и JavaScript (React UI)"""

    def __init__(self, parsing_tab):
        super().__init__()
        self.parsing_tab = parsing_tab
        self.keys_panel = parsing_tab.keys_panel
        self.activity_log = parsing_tab.activity_log

    @Slot(str, result=str)
    def call_python(self, data_json: str) -> str:
        """Вызов Python функций из JavaScript"""
        try:
            data = json.loads(data_json)
            action = data.get('action')

            if action == 'start_parsing':
                # Запуск парсинга частот
                phrases = data.get('phrases', [])
                settings = data.get('settings', {})
                return self._start_wordstat_parsing(phrases, settings)

            elif action == 'start_batch':
                # Запуск пакетного сбора
                phrases = data.get('phrases', [])
                return self._start_batch_parsing(phrases)

            elif action == 'get_accounts':
                # Получить список аккаунтов
                return self._get_accounts()

            elif action == 'add_phrases':
                # Добавить фразы
                phrases = data.get('phrases', [])
                return self._add_phrases(phrases)

            elif action == 'get_phrases':
                # Получить все фразы
                return self._get_phrases()

            elif action == 'import_from_clipboard':
                # Импорт из буфера обмена
                return self._import_from_clipboard()

            elif action == 'delete_phrases':
                # Удалить фразы по ID
                phrase_ids = data.get('phrase_ids', [])
                return self._delete_phrases(phrase_ids)

            return json.dumps({'status': 'error', 'message': f'Unknown action: {action}'})

        except Exception as e:
            return json.dumps({'status': 'error', 'message': str(e)})

    def _start_wordstat_parsing(self, phrases, settings):
        """Запуск парсинга Wordstat через существующий парсер"""
        try:
            if not hasattr(self.parsing_tab, '_parser_instance'):
                # Создаем экземпляр парсера один раз
                from .parsing_tab import ParsingTab as OriginalParsingTab
                self.parsing_tab._parser_instance = OriginalParsingTab(
                    parent=self.parsing_tab,
                    keys_panel=self.keys_panel,
                    activity_log=self.activity_log
                )

            parser = self.parsing_tab._parser_instance

            # Преобразуем настройки из React формата в формат Python
            selected_profiles = settings.get('profiles', [])
            normalized_settings = {
                'modes': settings.get('modes', ['ws']),
                'regions': settings.get('regions', [225]),
                'regions_map': settings.get('regions_map', {}),
                'ws': 'ws' in settings.get('modes', []),
                'qws': 'qws' in settings.get('modes', []),
                'bws': 'bws' in settings.get('modes', []),
            }

            # Запускаем парсинг
            if hasattr(parser, '_run_parsing_with_settings'):
                parser._run_parsing_with_settings(phrases, selected_profiles, normalized_settings)

            if self.activity_log:
                self.activity_log.append_line(f"INFO: Запущен парсинг {len(phrases)} фраз")

            return json.dumps({
                'status': 'started',
                'phrases_count': len(phrases),
                'message': 'Парсинг запущен успешно'
            })
        except Exception as e:
            if self.activity_log:
                self.activity_log.append_line(f"ERROR: {str(e)}")
            return json.dumps({'status': 'error', 'message': str(e)})

    def _start_batch_parsing(self, phrases):
        """Запуск пакетного парсинга"""
        # TODO: Подключить к существующему функционалу пакета
        return json.dumps({'status': 'started', 'phrases_count': len(phrases)})

    def _get_accounts(self):
        """Получить аккаунты Яндекса"""
        try:
            from ...services.accounts import list_accounts
            accounts = list_accounts()
            return json.dumps({'status': 'ok', 'accounts': accounts})
        except Exception as e:
            return json.dumps({'status': 'error', 'message': str(e)})

    def _add_phrases(self, phrases):
        """Добавить фразы в таблицу"""
        try:
            if not hasattr(self.parsing_tab, '_parser_instance'):
                from .parsing_tab import ParsingTab as OriginalParsingTab
                self.parsing_tab._parser_instance = OriginalParsingTab(
                    parent=self.parsing_tab,
                    keys_panel=self.keys_panel,
                    activity_log=self.activity_log
                )

            parser = self.parsing_tab._parser_instance

            # Добавляем фразы в таблицу через метод парсера
            if hasattr(parser, '_add_phrases_to_table'):
                count = parser._add_phrases_to_table(
                    phrases,
                    source="фраз из React UI",
                    checked=True
                )

                if self.activity_log:
                    self.activity_log.append_line(f"INFO: Добавлено {count} фраз")

                return json.dumps({
                    'status': 'ok',
                    'added_count': count
                })
            else:
                return json.dumps({
                    'status': 'error',
                    'message': 'Метод _add_phrases_to_table не найден'
                })

        except Exception as e:
            if self.activity_log:
                self.activity_log.append_line(f"ERROR: {str(e)}")
            return json.dumps({'status': 'error', 'message': str(e)})

    def _get_phrases(self):
        """Получить все фразы из таблицы"""
        try:
            if not hasattr(self.parsing_tab, '_parser_instance'):
                return json.dumps({'status': 'ok', 'phrases': []})

            parser = self.parsing_tab._parser_instance

            # Читаем фразы из таблицы
            phrases = []
            if hasattr(parser, 'keys_table'):
                for row in range(parser.keys_table.rowCount()):
                    phrase_item = parser.keys_table.item(row, 0)
                    freq_item = parser.keys_table.item(row, 1)

                    if phrase_item:
                        phrase_data = {
                            'id': str(row),
                            'text': phrase_item.text(),
                            'ws': int(freq_item.text()) if freq_item and freq_item.text().isdigit() else 0,
                            'groupId': None,
                            'selected': False
                        }
                        phrases.append(phrase_data)

            return json.dumps({
                'status': 'ok',
                'phrases': phrases
            })

        except Exception as e:
            return json.dumps({'status': 'error', 'message': str(e)})

    def _import_from_clipboard(self):
        """Импорт фраз из буфера обмена"""
        try:
            from PySide6.QtGui import QGuiApplication

            clipboard = QGuiApplication.clipboard()
            text = clipboard.text()

            if not text:
                return json.dumps({
                    'status': 'error',
                    'message': 'Буфер обмена пуст'
                })

            # Разбиваем на строки
            phrases = [line.strip() for line in text.split('\n') if line.strip()]

            # Добавляем через метод _add_phrases
            return self._add_phrases(phrases)

        except Exception as e:
            if self.activity_log:
                self.activity_log.append_line(f"ERROR: {str(e)}")
            return json.dumps({'status': 'error', 'message': str(e)})

    def _delete_phrases(self, phrase_ids):
        """Удалить фразы по ID"""
        try:
            if not hasattr(self.parsing_tab, '_parser_instance'):
                return json.dumps({'status': 'ok', 'deleted_count': 0})

            parser = self.parsing_tab._parser_instance

            # Конвертируем ID в индексы строк
            rows_to_remove = [int(pid) for pid in phrase_ids if pid.isdigit()]
            rows_to_remove.sort(reverse=True)

            # Удаляем строки
            if hasattr(parser, 'keys_table'):
                for row in rows_to_remove:
                    if row < parser.keys_table.rowCount():
                        parser.keys_table.removeRow(row)

                if self.activity_log:
                    self.activity_log.append_line(f"INFO: Удалено {len(rows_to_remove)} фраз")

                return json.dumps({
                    'status': 'ok',
                    'deleted_count': len(rows_to_remove)
                })

            return json.dumps({'status': 'ok', 'deleted_count': 0})

        except Exception as e:
            if self.activity_log:
                self.activity_log.append_line(f"ERROR: {str(e)}")
            return json.dumps({'status': 'error', 'message': str(e)})


class ParsingTabV5(QWidget):
    """Вкладка парсинга с React UI из v5.0"""

    def __init__(self, parent=None, keys_panel=None, activity_log=None):
        super().__init__(parent)
        self.keys_panel = keys_panel
        self.activity_log = activity_log
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # QWebEngineView для отображения React UI
        self.webview = QWebEngineView()

        # QWebChannel для связи Python ↔ JavaScript
        self.channel = QWebChannel()
        self.bridge = PythonBridge(self)
        self.channel.registerObject('pythonBridge', self.bridge)
        self.webview.page().setWebChannel(self.channel)

        # Загружаем собранный HTML из keyset/ui/
        # Путь относительно модуля (для упаковки в .exe)
        module_dir = Path(__file__).resolve().parent.parent.parent  # keyset/
        ui_path = module_dir / 'ui' / 'index.html'

        if ui_path.exists():
            # Устанавливаем baseUrl для правильной загрузки ./assets/*
            ui_dir = ui_path.parent
            base_url = QUrl.fromLocalFile(str(ui_dir.absolute()) + '/')

            # Читаем HTML и загружаем с базовым URL
            html_content = ui_path.read_text(encoding='utf-8')
            self.webview.setHtml(html_content, base_url)

            if self.activity_log:
                self.activity_log.append_line(f"INFO: Загружен React UI из {ui_path}")
        else:
            # Fallback - показываем заглушку
            error_msg = f'''
                <html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f5f5f5">
                    <div style="text-align:center;padding:40px;background:white;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
                        <h2 style="color:#ef4444">❌ Ошибка загрузки интерфейса</h2>
                        <p style="color:#666">Файл не найден: <code>{ui_path}</code></p>
                        <p style="margin-top:20px;padding:12px;background:#fef3c7;border-radius:6px;color:#92400e">
                            React UI должен находиться в: <code>keyset/ui/index.html</code>
                        </p>
                    </div>
                </body></html>
            '''
            self.webview.setHtml(error_msg)
            if self.activity_log:
                self.activity_log.append_line(f"ERROR: UI не найден: {ui_path}")

        layout.addWidget(self.webview)
