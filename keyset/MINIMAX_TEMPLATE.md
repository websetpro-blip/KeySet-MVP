# 🤖 MiniMax Template для генерации модулей KeySet

Этот документ содержит инструкции для MiniMax AI по генерации модулей KeySet в стиле CARDVANCE white-premium.

## 📋 Общая структура модуля

Каждый модуль KeySet должен иметь:

```
modules/<module_name>/
├── __init__.py           # Экспорт функции create()
├── widget.py             # Главный виджет модуля
└── README.md             # Документация модуля (опционально)
```

## 🏗️ Шаблон widget.py

```python
from __future__ import annotations

from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QGroupBox,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QVBoxLayout,
    QWidget,
)


def create(parent: QWidget | None = None) -> QWidget:
    """Создаёт корневой виджет модуля."""
    root = QWidget(parent)
    layout = QVBoxLayout(root)
    layout.setContentsMargins(24, 24, 24, 24)
    layout.setSpacing(16)
    
    # Заголовок
    header = QLabel("🔧 Название модуля")
    header.setProperty("heading", True)
    
    # Карточка с функционалом
    card = _build_main_card(root)
    
    layout.addWidget(header)
    layout.addWidget(card)
    layout.addStretch()
    
    return root


def _build_main_card(parent: QWidget) -> QGroupBox:
    """Создаёт основную карточку модуля."""
    group = QGroupBox("Основной функционал", parent)
    layout = QVBoxLayout(group)
    layout.setContentsMargins(0, 0, 0, 0)
    layout.setSpacing(12)
    
    # Ваш код здесь
    
    return group


__all__ = ["create"]
```

## 🎨 СТИЛЬ CARDVANCE (ОБЯЗАТЕЛЬНО!)

При генерации модуля следуй дизайн-системе CARDVANCE:

### Цвета

```python
# Используются через QSS (styles/modern.qss):
# - Фон: #FAFAFA (off-white)
# - Карточки: #FFFFFF (pure-white)
# - Акцент: #3B82F6 (accent-blue)
# - Границы: #E5E7EB (light-gray)
# - Текст: #374151 (dark-gray)
```

### Компоненты

#### Кнопки

```python
# Основная кнопка
btn = QPushButton("🎲 Генерировать", parent)

# Вторичная кнопка
btn = QPushButton("📥 Импорт", parent)
btn.setProperty("secondary", True)

# Опасная кнопка
btn = QPushButton("🗑️ Удалить", parent)
btn.setProperty("danger", True)

# Маленькая кнопка
btn = QPushButton("✏️ Редактировать", parent)
btn.setProperty("size", "small")
```

**Обязательно:** Используй эмодзи в начале текста кнопки:
- 🎲 - генерация
- 📥 - импорт
- 📤 - экспорт
- 🔍 - поиск
- ✅ - успех
- ❌ - ошибка
- ⚙️ - настройки
- 🔄 - обновить
- ▶️ - запуск
- ⏸️ - пауза
- 🗑️ - удалить
- ✏️ - редактировать
- ➕ - добавить

#### Карточки (QGroupBox)

```python
group = QGroupBox("Название карточки", parent)
# layout.setContentsMargins(0, 0, 0, 0)  # внутренние отступы убираем
# layout.setSpacing(12)  # расстояние между элементами 12px
```

**Стиль автоматически применяется через QSS:**
- Скругление: `border-radius: 12px`
- Отступы: `padding: 24px`
- Тени: через QSS

#### Таблицы

```python
table = QTableWidget(5, 3, parent)
table.setHorizontalHeaderLabels(["Колонка 1", "Колонка 2", "Колонка 3"])
table.verticalHeader().setVisible(False)
table.setAlternatingRowColors(True)
```

**Стиль автоматически применяется через QSS:**
- Белый фон
- Светлые границы
- Скругленные углы

#### Поля ввода

```python
field = QLineEdit()
field.setPlaceholderText("Введите значение")
```

**Стиль автоматически применяется через QSS:**
- `border-radius: 8px`
- `padding: 12px 16px`
- Минимальная высота: 40px

#### Лейблы

```python
# Заголовок
header = QLabel("🔧 Название")
header.setProperty("heading", True)

# Второстепенный текст
subtitle = QLabel("Описание")
subtitle.setProperty("secondary", True)

# Статус-бейдж
status = QLabel("Активен")
status.setProperty("status", "active")  # active / error / working / needs_login
```

### Layout

```python
# Корневой layout модуля
layout = QVBoxLayout(root)
layout.setContentsMargins(24, 24, 24, 24)  # Отступы контейнера
layout.setSpacing(16)  # Расстояние между карточками

# Layout внутри карточки
card_layout = QVBoxLayout(group)
card_layout.setContentsMargins(0, 0, 0, 0)  # Убираем, т.к. padding есть в QGroupBox
card_layout.setSpacing(12)  # Плотнее, чем в корне
```

### Типографика

Не нужно указывать вручную — всё через QSS:
- Основной текст: 14px
- Заголовки: 18px, font-weight: 600
- Второстепенный: 13px, color: #6B7280

## 🚀 Примеры использования

### Пример 1: Модуль с действиями

```python
def _build_actions_card(parent: QWidget) -> QGroupBox:
    group = QGroupBox("Быстрые действия", parent)
    layout = QHBoxLayout(group)
    layout.setContentsMargins(0, 0, 0, 0)
    layout.setSpacing(12)
    
    btn_new = QPushButton("➕ Создать", group)
    btn_import = QPushButton("📥 Импорт", group)
    btn_export = QPushButton("📤 Экспорт", group)
    btn_delete = QPushButton("🗑️ Удалить", group)
    btn_delete.setProperty("danger", True)
    
    layout.addWidget(btn_new)
    layout.addWidget(btn_import)
    layout.addWidget(btn_export)
    layout.addStretch()
    layout.addWidget(btn_delete)
    
    return group
```

### Пример 2: Модуль с формой

```python
from PySide6.QtWidgets import QFormLayout, QLineEdit

def _build_form_card(parent: QWidget) -> QGroupBox:
    group = QGroupBox("Настройки", parent)
    form = QFormLayout(group)
    form.setContentsMargins(0, 0, 0, 0)
    form.setSpacing(12)
    
    name_field = QLineEdit()
    name_field.setPlaceholderText("Введите имя")
    
    url_field = QLineEdit()
    url_field.setPlaceholderText("https://example.com")
    
    form.addRow("Название:", name_field)
    form.addRow("URL:", url_field)
    
    return group
```

### Пример 3: Модуль с таблицей и поиском

```python
def _build_data_card(parent: QWidget) -> QGroupBox:
    group = QGroupBox("Список элементов", parent)
    layout = QVBoxLayout(group)
    layout.setContentsMargins(0, 0, 0, 0)
    layout.setSpacing(12)
    
    # Поиск
    search_bar = QLineEdit()
    search_bar.setPlaceholderText("🔍 Поиск...")
    
    # Таблица
    table = QTableWidget(10, 4, group)
    table.setHorizontalHeaderLabels(["ID", "Название", "Статус", "Дата"])
    table.verticalHeader().setVisible(False)
    table.setAlternatingRowColors(True)
    
    layout.addWidget(search_bar)
    layout.addWidget(table)
    
    return group
```

## 📝 Чеклист перед генерацией

- [ ] Используется функция `create(parent: QWidget | None = None) -> QWidget`
- [ ] Корневой layout имеет отступы `(24, 24, 24, 24)` и spacing `16`
- [ ] Все карточки — это `QGroupBox` с `border-radius: 12px`
- [ ] Кнопки имеют эмодзи в начале текста
- [ ] Используются свойства `heading`, `secondary`, `status` для лейблов
- [ ] Используются свойства `danger`, `secondary`, `size` для кнопок
- [ ] Layout внутри карточек имеет `setContentsMargins(0, 0, 0, 0)`
- [ ] Spacing между элементами: 12px внутри карточек, 16px между карточками
- [ ] Не используются хардкод-стили (color, font-size) — всё через QSS

## 🎯 Эталон дизайна

**URL:** https://hcfymgjsofg7.space.minimax.io/

Этот дизайн — эталон минималистичного премиального интерфейса.

## 🔗 Связанные документы

- `DESIGN_SYSTEM.md` — полная спецификация дизайн-системы
- `styles/modern.qss` — файл стилей CARDVANCE
- `modules/antidetect/widget.py` — эталонный пример модуля

## ⚡ Быстрая генерация через MiniMax

**Промпт для MiniMax:**

```
Создай модуль KeySet в стиле CARDVANCE white-premium.

Требования:
1. Используй шаблон из MINIMAX_TEMPLATE.md
2. Следуй дизайн-системе CARDVANCE
3. Все кнопки с эмодзи
4. Карточки через QGroupBox
5. Отступы: 24px корень, 12px внутри карточек
6. Не используй хардкод-стили

Название модуля: [НАЗВАНИЕ]
Функционал: [ОПИСАНИЕ]
```

---

**Версия:** 1.0  
**Дата:** 2024  
**Автор:** KeySet Team
