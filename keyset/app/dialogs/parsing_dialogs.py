# -*- coding: utf-8 -*-
"""
Диалоги для вкладки Парсинг (портировано из keyset-v5.0)
"""
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QLineEdit, QSpinBox, QCheckBox, QGroupBox, QDialogButtonBox,
    QListWidget, QListWidgetItem, QTextEdit, QComboBox
)
from PySide6.QtCore import Qt


class StopwordsDialog(QDialog):
    """Диалог управления стоп-словами (минус-слова)"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Стоп-слова (Минус-слова)")
        self.setMinimumSize(600, 400)
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)

        # Список стоп-слов
        label = QLabel("Добавьте стоп-слова (по одному на строку):")
        layout.addWidget(label)

        self.stopwords_text = QTextEdit()
        self.stopwords_text.setPlaceholderText("купить\nцена\nдешево\n...")
        layout.addWidget(self.stopwords_text)

        # Тип вхождения
        type_group = QGroupBox("Тип вхождения")
        type_layout = QVBoxLayout()

        self.exact_match = QCheckBox("Точное совпадение")
        self.partial_match = QCheckBox("Частичное вхождение")
        self.independent_match = QCheckBox("Независимое вхождение (целое слово)")
        self.morphological_match = QCheckBox("Морфонезависимое (по леммам)")
        self.partial_match.setChecked(True)

        type_layout.addWidget(self.exact_match)
        type_layout.addWidget(self.partial_match)
        type_layout.addWidget(self.independent_match)
        type_layout.addWidget(self.morphological_match)
        type_group.setLayout(type_layout)
        layout.addWidget(type_group)

        # Кнопки
        buttons = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def get_stopwords(self):
        """Получить список стоп-слов"""
        text = self.stopwords_text.toPlainText()
        words = [w.strip() for w in text.split('\n') if w.strip()]

        # Определяем режим (приоритет: exact > morphological > independent > partial)
        if self.exact_match.isChecked():
            mode = 'exact'
        elif self.morphological_match.isChecked():
            mode = 'morphological'
        elif self.independent_match.isChecked():
            mode = 'independent'
        else:
            mode = 'partial'

        return {
            'words': words,
            'mode': mode
        }


class FilterDialog(QDialog):
    """Диалог фильтрации фраз"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Фильтры")
        self.setMinimumSize(400, 300)
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)

        # Фильтр по частоте
        freq_group = QGroupBox("Частотность")
        freq_layout = QHBoxLayout()

        freq_layout.addWidget(QLabel("От:"))
        self.freq_min = QSpinBox()
        self.freq_min.setRange(0, 999999999)
        freq_layout.addWidget(self.freq_min)

        freq_layout.addWidget(QLabel("До:"))
        self.freq_max = QSpinBox()
        self.freq_max.setRange(0, 999999999)
        self.freq_max.setValue(999999999)
        freq_layout.addWidget(self.freq_max)

        freq_group.setLayout(freq_layout)
        layout.addWidget(freq_group)

        # Фильтр по количеству слов
        words_group = QGroupBox("Количество слов в фразе")
        words_layout = QHBoxLayout()

        words_layout.addWidget(QLabel("От:"))
        self.words_min = QSpinBox()
        self.words_min.setRange(1, 20)
        self.words_min.setValue(1)
        words_layout.addWidget(self.words_min)

        words_layout.addWidget(QLabel("До:"))
        self.words_max = QSpinBox()
        self.words_max.setRange(1, 20)
        self.words_max.setValue(20)
        words_layout.addWidget(self.words_max)

        words_group.setLayout(words_layout)
        layout.addWidget(words_group)

        # Фильтр по тексту
        text_group = QGroupBox("Поиск по тексту")
        text_layout = QVBoxLayout()

        self.search_text = QLineEdit()
        self.search_text.setPlaceholderText("Введите текст для поиска...")
        text_layout.addWidget(self.search_text)

        text_group.setLayout(text_layout)
        layout.addWidget(text_group)

        layout.addStretch()

        # Кнопки
        buttons = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def get_filters(self):
        """Получить настройки фильтров"""
        return {
            'freq_min': self.freq_min.value(),
            'freq_max': self.freq_max.value(),
            'words_min': self.words_min.value(),
            'words_max': self.words_max.value(),
            'search_text': self.search_text.text().strip()
        }


class DuplicatesDialog(QDialog):
    """Диалог поиска и удаления дублей"""

    def __init__(self, duplicates_list, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Найдены дубли")
        self.setMinimumSize(500, 400)
        self.duplicates = duplicates_list
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)

        label = QLabel(f"Найдено дублей: {len(self.duplicates)}")
        layout.addWidget(label)

        # Список дублей
        self.list_widget = QListWidget()
        for dup in self.duplicates:
            self.list_widget.addItem(dup)
        layout.addWidget(self.list_widget)

        # Кнопки
        btn_layout = QHBoxLayout()

        self.btn_delete = QPushButton("Удалить дубли")
        self.btn_delete.clicked.connect(self.accept)
        btn_layout.addWidget(self.btn_delete)

        btn_cancel = QPushButton("Отмена")
        btn_cancel.clicked.connect(self.reject)
        btn_layout.addWidget(btn_cancel)

        layout.addLayout(btn_layout)
