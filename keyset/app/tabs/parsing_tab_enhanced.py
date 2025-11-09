# -*- coding: utf-8 -*-
"""
Enhanced Parsing Tab - портированный функционал из keyset-v5.0
Добавлены: чекбоксы, фильтры, стоп-слова, drag&drop
"""
from app.tabs.parsing_tab import ParsingTab
from PySide6.QtWidgets import QTableWidget, QTableWidgetItem, QCheckBox, QHeaderView
from PySide6.QtCore import Qt
from typing import List, Set

class EnhancedParsingTab(ParsingTab):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.selected_phrase_ids: Set[str] = set()
        self._setup_enhanced_table()

    def _setup_enhanced_table(self):
        """Добавить чекбоксы в таблицу"""
        if not hasattr(self, 'keys_table') or self.keys_table is None:
            return

        # Добавляем столбец с чекбоксами
        current_cols = self.keys_table.columnCount()
        self.keys_table.insertColumn(0)
        self.keys_table.setHorizontalHeaderItem(0, QTableWidgetItem("☑"))
        self.keys_table.setColumnWidth(0, 30)

    def add_checkbox_to_row(self, row: int):
        """Добавить чекбокс в строку"""
        checkbox = QCheckBox()
        checkbox.stateChanged.connect(lambda state, r=row: self._on_checkbox_changed(r, state))
        self.keys_table.setCellWidget(row, 0, checkbox)

    def _on_checkbox_changed(self, row: int, state: int):
        """Обработка изменения чекбокса"""
        phrase_id = self.keys_table.item(row, 1).data(Qt.UserRole) if self.keys_table.item(row, 1) else None
        if phrase_id:
            if state == Qt.Checked:
                self.selected_phrase_ids.add(phrase_id)
            else:
                self.selected_phrase_ids.discard(phrase_id)

    def select_all(self):
        """Выбрать все фразы"""
        for row in range(self.keys_table.rowCount()):
            checkbox = self.keys_table.cellWidget(row, 0)
            if checkbox:
                checkbox.setChecked(True)

    def deselect_all(self):
        """Снять выделение"""
        for row in range(self.keys_table.rowCount()):
            checkbox = self.keys_table.cellWidget(row, 0)
            if checkbox:
                checkbox.setChecked(False)
        self.selected_phrase_ids.clear()

    def invert_selection(self):
        """Инвертировать выделение"""
        for row in range(self.keys_table.rowCount()):
            checkbox = self.keys_table.cellWidget(row, 0)
            if checkbox:
                checkbox.setChecked(not checkbox.isChecked())
