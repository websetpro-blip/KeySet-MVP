# 📋 Анализ конвертации React KeySet v5.0 → Qt Designer .ui

## 🎯 Общая оценка: **ВОЗМОЖНО, но требует адаптации**

### ✅ Что можно конвертировать 1:1

#### **1. Основной Layout**
```xml
<!-- React: h-screen flex flex-col bg-gray-50 -->
<MainWindow>
  <VBoxLayout>
    <!-- Toolbar -->
    <QWidget name="toolbar">
      <QHBoxLayout>
        <!-- Кнопки копируются в QPushButton -->
      </QHBoxLayout>
    </QWidget>
    
    <!-- Main Content -->
    <QSplitter>
      <!-- Left: Table + Log + Status -->
      <QSplitter>
        <PhrasesTableWidget />
        <ActivityLogWidget /> 
        <StatusBarWidget />
      </QSplitter>
      
      <!-- Right: Groups Panel -->
      <GroupsPanelWidget />
    </QSplitter>
  </VBoxLayout>
</MainWindow>
```

#### **2. Toolbar → QToolBar/QMenuBar**
- **QAction** вместо React кнопок
- **QComboBox** вместо Dropdown компонентов  
- **QToolButton** для иконок
- **QMenu** для контекстных меню

#### **3. Основные формы → QDialog**
```python
# ImportModal → QDialog
class ImportDialog(QDialog):
    def __init__(self):
        super().__init__()
        self.setModal(True)
        self.resize(400, 300)
        # QVBoxLayout с QVBoxLayout + QHBoxLayout
        # QPushButton для выбора файла
        # QProgressBar для загрузки
```

### 🔶 Что требует адаптации

#### **1. PhrasesTable (сложнее всего)**
```typescript
// React: TanStack Table с продвинутыми функциями
const table = useReactTable({
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  // ... 20+ настроек
});
```

**Адаптация в Qt:**
```python
# Частичное воспроизведение через QTableWidget
class PhrasesTable(QTableWidget):
    def __init__(self):
        super().__init__()
        self.setSortingEnabled(True)
        self.setDragEnabled(True)
        self.setAcceptDrops(True)
        
    # Удаление копий столбцов - вручную
    # Закрепление колонок - ограниченно  
    # Inline редактирование - через QItemDelegate
```

#### **2. Drag & Drop система**
```typescript
// React: @dnd-kit/core с сенсорами
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }
  })
);
```

**Адаптация в Qt:**
```python
# Qt drag&drop (более простой)
def dragEnterEvent(self, event):
    if event.mimeData().hasText():
        event.acceptProposedAction()

def dropEvent(self, event):
    # Парсинг данных из QMimeData
    # Вызов диалога "переместить/копировать"
```

#### **3. Горячие клавиши**
```typescript
// React: react-hotkeys-hook  
useHotkeys('ctrl+a', (e) => {
  e.preventDefault();
  selectAll();
});
```

**Адаптация в Qt:**
```python
# Qt Shortcut (полная замена)
from PySide6.QtGui import QShortcut, QKeySequence
QShortcut(QKeySequence("Ctrl+A"), self).activated.connect(self.select_all)
```

### ❌ Что НЕ получится конвертировать 1:1

#### **1. Современные CSS стили**
```css
/* React: Tailwind CSS с Gray Scale */
.gradient-table-cell {
  background: linear-gradient(135deg, 
    rgba(34, 197, 94, 0.15) 0%, 
    rgba(34, 197, 94, 0.5) 100%);
}
```

**Ограничения Qt:**
- Нет CSS gradients в QTableWidget
- Ограниченная палитра цветов
- Простые border-radius

#### **2. React State Management (Zustand)**
```typescript
// React: Centralized state
const { 
  selectedPhraseIds, 
  phrases, 
  groups,
  selectAll,
  deletePhrases 
} = useStore();
```

**Адаптация в Qt:**
```python
# Qt Signals вместо Zustand
from PySide6.QtCore import QObject, Signal

class KeySetSignals(QObject):
    selected_changed = Signal(set)
    phrases_changed = Signal(list)
    
class MainWindow(QMainWindow):
    def __init__(self):
        # Сигналы-слоты вместо Zustand
        self.signals.selected_changed.connect(self.on_selection_changed)
```

#### **3. 23 модальных окна**
Сложность высокая - каждое требует отдельной разработки QDialog.

#### **4. React-специфичные функции**
- **Zustand persistence** → PySide6 settings
- **React Select/Select2** → QComboBox с кастомным делегатом
- **React animations** → Qt animations (ограниченно)

## 🛠️ План реализации

### **Этап 1: Базовые компоненты (40%)**
1. ✅ Toolbar → QToolBar + QAction
2. ✅ Модальные окна → QDialog (Import, Export, Duplicates)
3. ✅ Простые формы → QWidget с QLayout
4. ✅ Горячие клавиши → QShortcut

### **Этап 2: Сложные компоненты (50%)**
1. 🔶 PhrasesTable → QTableWidget с QItemDelegate
2. 🔶 GroupsPanel → QTreeWidget с drag&drop  
3. 🔶 ActivityLog → QTextEdit + регулярные обновления
4. 🔶 StatusBar → QStatusBar

### **Этап 3: Интеграция (10%)**
1. ✅ Подключение к морфологическим алгоритмам
2. ✅ Сохранение Python логики
3. ✅ Упаковка PyInstaller

## 📊 Сложность по компонентам

| Компонент | React | Qt Widget | Сложность | Время |
|-----------|-------|-----------|-----------|--------|
| Toolbar | ✅ | ✅ | 🟢 Легко | 2 часа |
| Import Modal | ✅ | ✅ | 🟢 Легко | 1 час |
| Groups Panel | ✅ | 🔶 | 🟡 Средне | 4 часа |
| Phrases Table | ✅ | 🔶 | 🔴 Сложно | 8 часов |
| Drag & Drop | ✅ | 🔶 | 🟡 Средне | 3 часа |
| Hotkeys | ✅ | ✅ | 🟢 Легко | 30 мин |
| 23 Modals | ✅ | 🔶 | 🔴 Сложно | 20 часов |

## 🚀 Рекомендация

**НАЧАТЬ с базового прототипа:**
1. Создать главное окно с базовым layout
2. Реализовать 5-10 ключевых модалов
3. Проверить совместимость с Python логикой
4. Затем постепенно добавлять функционал

**Результат:** Создание полноценного PySide6 приложения с функционалом KeySet v5.0