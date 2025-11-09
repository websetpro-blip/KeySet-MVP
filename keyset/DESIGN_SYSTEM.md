# 🎨 KeySet Design System (CARDVANCE)

CARDVANCE — это white-premium стиль для KeySet с акцентом на минимализм, чистые поверхности и современную типографику. Этот документ описывает дизайн-токены, компоненты и паттерны, которые необходимо использовать при разработке интерфейсов.

## 📚 Содержание

1. [Цветовая палитра](#цветовая-палитра)
2. [Типографика](#типографика)
3. [Отступы и сетка](#отступы-и-сетка)
4. [Компоненты](#компоненты)
    - [Кнопки](#кнопки)
    - [Карточки (QGroupBox)](#карточки-qgroupbox)
    - [Таблицы](#таблицы)
    - [Формы](#формы)
    - [Статус-бейджи](#статус-бейджи)
5. [Паттерны макета](#паттерны-макета)
6. [Примеры модулей](#примеры-модулей)
7. [Чеклист внедрения](#чеклист-внедрения)
8. [Ссылки и ресурсы](#ссылки-и-ресурсы)

---

## Цветовая палитра

```css
/* Базовые цвета */
--pure-white: #FFFFFF;
--off-white: #FAFAFA;   /* фон приложения */
--soft-gray: #F8F9FA;
--light-gray: #E5E7EB;  /* границы */
--medium-gray: #9CA3AF;
--dark-gray: #374151;   /* основной текст */
--charcoal: #1F2937;

/* Акцентные цвета */
--accent-blue: #3B82F6;
--accent-blue-hover: #2563EB;
--accent-blue-pressed: #1D4ED8;
--accent-blue-light: #EFF6FF;

/* Статусы */
--status-active-bg: #D1FAE5;
--status-active-text: #065F46;
--status-error-bg: #FEE2E2;
--status-error-text: #991B1B;
--status-working-bg: #DBEAFE;
--status-working-text: #1E40AF;
--status-needs-login-bg: #FEF3C7;
--status-needs-login-text: #92400E;
```

Все цвета задаются через QSS (`styles/modern.qss`). Не используйте хардкод-значения в коде Python.

## Типографика

- Шрифт: `'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif`
- Основной текст: 14px, `font-weight: 400`, `color: #374151`
- Заголовки: 18px, `font-weight: 600`, `color: #1F2937`
- Вторичный текст: 13px, `font-weight: 500`, `color: #6B7280`
- Мелкий текст: 12px, `font-weight: 500`, `color: #6B7280`

Используйте свойства:
- `label.setProperty("heading", True)` — заголовок раздела
- `label.setProperty("secondary", True)` — вторичный текст / описание

## Отступы и сетка

- Корневой контейнер (layout) модуля: `setContentsMargins(24, 24, 24, 24)`
- Расстояние между карточками (QGroupBox): `layout.setSpacing(16)`
- Внутренние layout карточек: `setContentsMargins(0, 0, 0, 0)` и `setSpacing(12)`
- Стандартная высота полей ввода и кнопок: 40px

## Компоненты

### Кнопки

```python
from PySide6.QtWidgets import QPushButton

primary = QPushButton("🎲 Генерировать")  # основная кнопка

secondary = QPushButton("📥 Импорт")
secondary.setProperty("secondary", True)

danger = QPushButton("🗑️ Удалить")
danger.setProperty("danger", True)

small = QPushButton("✏️ Править")
small.setProperty("size", "small")
```

- Скругление: `border-radius: 8px`
- Отступы: `padding: 10px 20px`
- Минимальная ширина: `min-width: 100px`
- Цвет hover/pressed задаётся стилем
- Всегда используйте эмодзи в начале текста кнопки

### Карточки (QGroupBox)

```python
from PySide6.QtWidgets import QGroupBox, QVBoxLayout

group = QGroupBox("Настройки")
layout = QVBoxLayout(group)
layout.setContentsMargins(0, 0, 0, 0)
layout.setSpacing(12)
```

- Скругление: `border-radius: 12px`
- Отступы: `padding: 24px`
- Тень: `box-shadow` задаётся в QSS (используйте `styles/modern.qss`)

### Таблицы

```python
from PySide6.QtWidgets import QTableWidget

table = QTableWidget(5, 3)
table.setHorizontalHeaderLabels(["Дата", "Событие", "Статус"])
table.verticalHeader().setVisible(False)
table.setAlternatingRowColors(True)
```

- Фон: белый
- Границы: светлые (`#E5E7EB`)
- Скругление: `border-radius: 12px`
- Выделение: `background-color: #EFF6FF`, `color: #1E40AF`

### Формы

```python
from PySide6.QtWidgets import QFormLayout, QLineEdit

form = QFormLayout()
form.setContentsMargins(0, 0, 0, 0)
form.setSpacing(12)

field = QLineEdit()
field.setPlaceholderText("Введите значение")
```

- Поля ввода: `border-radius: 8px`, `padding: 12px 16px`
- Минимальная высота: 40px
- Состояния (hover/focus/disabled) оформляются через QSS

### Статус-бейджи

```python
status = QLabel("Активен")
status.setProperty("status", "active")  # active | error | working | needs_login
status.setAlignment(Qt.AlignCenter)
```

- Активный: зелёный фон / тёмно-зелёный текст
- Ошибка: красный фон / бордовый текст
- В работе: голубой фон / синий текст
- Требует входа: жёлтый фон / коричневый текст

## Паттерны макета

### Карточка действий

```python
actions = QGroupBox("Быстрые действия")
row = QHBoxLayout(actions)
row.setContentsMargins(0, 0, 0, 0)
row.setSpacing(12)

row.addWidget(QPushButton("🎲 Генерация"))
row.addWidget(QPushButton("📥 Импорт"))
row.addWidget(QPushButton("📤 Экспорт"))
row.addStretch()
row.addWidget(QPushButton("🔍 Проверка"))
```

### Карточка с формой и статусом

```python
profile = QGroupBox("Профиль")
grid = QGridLayout(profile)
grid.setContentsMargins(0, 0, 0, 0)
grid.setHorizontalSpacing(16)
grid.setVerticalSpacing(12)

fingerprint = QLineEdit()
fingerprint.setPlaceholderText("fp-XXXX")

status = QLabel("Активен")
status.setProperty("status", "active")
status.setAlignment(Qt.AlignCenter)

grid.addWidget(QLabel("Fingerprint"), 0, 0)
grid.addWidget(fingerprint, 1, 0, 1, 2)
grid.addWidget(QLabel("Статус"), 2, 0)
grid.addWidget(status, 2, 1)
```

### Карточка с таблицей и поиском

```python
data = QGroupBox("История")
column = QVBoxLayout(data)
column.setContentsMargins(0, 0, 0, 0)
column.setSpacing(12)

search = QLineEdit()
search.setPlaceholderText("🔍 Поиск по истории")

log = QTableWidget(0, 3)
log.setHorizontalHeaderLabels(["Дата", "Действие", "Статус"])
log.verticalHeader().setVisible(False)

column.addWidget(search)
column.addWidget(log)
```

## Примеры модулей

- `modules/antidetect/widget.py` — эталонный модуль управления отпечатками в стиле CARDVANCE
- Для новых модулей копируйте структуру: заголовок, карточка действий, карточки с данными, таблицы

## Чеклист внедрения

- [ ] Используется `styles/modern.qss`
- [ ] Кнопки с эмодзи и правильными свойствами (`secondary`, `danger`, `size`)
- [ ] Все карточки — `QGroupBox` со скруглениями 12px
- [ ] Отступы: 24px (корень), 16px (межкарточный), 12px (внутри карточек)
- [ ] Применяются свойства `heading`, `secondary`, `status`
- [ ] Нет inline-стилей (цвет, размер шрифта) в Python-коде
- [ ] Таблицы используют белый фон, мягкие границы и скругления
- [ ] Статус-бейджи оформлены через свойства (`setProperty("status", ...)`)

## Ссылки и ресурсы

- **Эталон дизайна:** https://hcfymgjsofg7.space.minimax.io/
- **Файл стилей:** `styles/modern.qss`
- **MiniMax Template:** `MINIMAX_TEMPLATE.md`
- **Руководство:** `modules/antidetect/widget.py`
- **Дополнительный справочник:** `МОДУЛИ/cardvance-white-premium-style-guide.md`

---

**Версия:** 1.0  
**Дата:** 2024  
**Подготовил:** KeySet Design Team
