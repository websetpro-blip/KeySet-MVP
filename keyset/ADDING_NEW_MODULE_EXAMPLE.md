# Adding a New Module - Step by Step Example

This guide shows you exactly how to add a new module to KeySet using the module autoloader.

## Example: Adding a "Statistics" Module

Let's create a module that displays statistics about parsed keywords.

### Step 1: Create Module Directory

```bash
mkdir -p modules/statistics_module
```

### Step 2: Create module.json

Create `modules/statistics_module/module.json`:

```json
{
  "id": "statistics_module",
  "title": "Статистика",
  "icon": "📊",
  "description": "Статистика по ключевым словам",
  "version": "1.0.0",
  "entry": "modules.statistics_module.widget:create",
  "order": 30,
  "enabled": true,
  "dependencies": []
}
```

### Step 3: Create Widget

Create `modules/statistics_module/widget.py`:

```python
# -*- coding: utf-8 -*-
"""
Statistics module widget.
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
    QPushButton, QGroupBox, QTableWidget, QTableWidgetItem
)
from PySide6.QtCore import Qt


def create(parent=None):
    """
    Create statistics widget.
    
    Args:
        parent: Parent widget (MainWindow instance)
    
    Returns:
        QWidget with statistics UI
    """
    widget = QWidget(parent)
    
    # Main layout with CARDVANCE spacing
    main_layout = QVBoxLayout(widget)
    main_layout.setContentsMargins(24, 24, 24, 24)
    main_layout.setSpacing(16)
    
    # Title card
    title_group = QGroupBox("📊 Статистика парсинга")
    title_group.setProperty("card", True)
    title_layout = QVBoxLayout(title_group)
    title_layout.setContentsMargins(24, 24, 24, 24)
    title_layout.setSpacing(16)
    
    # Summary stats
    stats_layout = QHBoxLayout()
    stats_layout.setSpacing(16)
    
    # Total keywords
    total_label = QLabel("Всего ключей: 0")
    total_label.setProperty("stat", True)
    stats_layout.addWidget(total_label)
    
    # Total frequency
    freq_label = QLabel("Общая частота: 0")
    freq_label.setProperty("stat", True)
    stats_layout.addWidget(freq_label)
    
    stats_layout.addStretch()
    title_layout.addLayout(stats_layout)
    
    main_layout.addWidget(title_group)
    
    # Data table card
    table_group = QGroupBox("Детальная информация")
    table_group.setProperty("card", True)
    table_layout = QVBoxLayout(table_group)
    table_layout.setContentsMargins(24, 24, 24, 24)
    table_layout.setSpacing(16)
    
    # Table
    table = QTableWidget(0, 3)
    table.setHorizontalHeaderLabels(["Ключевое слово", "Частота", "Регион"])
    table.horizontalHeader().setStretchLastSection(True)
    table_layout.addWidget(table)
    
    # Buttons
    button_layout = QHBoxLayout()
    button_layout.setSpacing(16)
    
    refresh_btn = QPushButton("🔄 Обновить")
    refresh_btn.setProperty("secondary", True)
    button_layout.addWidget(refresh_btn)
    
    export_btn = QPushButton("💾 Экспорт CSV")
    export_btn.setProperty("secondary", True)
    button_layout.addWidget(export_btn)
    
    button_layout.addStretch()
    table_layout.addLayout(button_layout)
    
    main_layout.addWidget(table_group)
    
    # Connect buttons to functions
    if parent:
        refresh_btn.clicked.connect(lambda: refresh_stats(parent, total_label, freq_label, table))
        export_btn.clicked.connect(lambda: export_stats(parent))
    
    main_layout.addStretch()
    
    return widget


def refresh_stats(parent, total_label, freq_label, table):
    """Refresh statistics from database"""
    # TODO: Implement actual database query
    parent.log_event("Статистика обновлена", level="INFO")
    total_label.setText("Всего ключей: 0")
    freq_label.setText("Общая частота: 0")
    table.setRowCount(0)


def export_stats(parent):
    """Export statistics to CSV"""
    # TODO: Implement CSV export
    parent.log_event("Экспорт статистики в CSV", level="INFO")
```

### Step 4: (Optional) Add Lifecycle Hooks

Create `modules/statistics_module/__init__.py`:

```python
# -*- coding: utf-8 -*-
"""
Statistics module with lifecycle hooks.
"""
import logging

logger = logging.getLogger(__name__)


def init(app_context):
    """
    Initialize statistics module.
    
    Args:
        app_context: MainWindow instance
    """
    logger.info("Statistics module initializing...")
    
    # Log to activity log
    if hasattr(app_context, 'log_event'):
        app_context.log_event("📊 Модуль статистики загружен", level="INFO")
    
    # TODO: Initialize database connection
    # TODO: Load cached statistics


def unload():
    """
    Cleanup when app closes.
    """
    logger.info("Statistics module unloading...")
    
    # TODO: Save statistics cache
    # TODO: Close database connections
```

### Step 5: Test Your Module

1. Restart the application:
   ```bash
   python3 run_keyset.pyw
   ```

2. Look for your new tab: "📊 Статистика"

3. Check the logs for:
   - "✓ Модуль statistics_module загружен"
   - "📊 Модуль статистики загружен"

4. Test the buttons - they should log events

### Step 6: Update PyInstaller Build (for distribution)

Edit `keyset_accounts_v2.spec`:

```python
datas=[
    # Add your module
    (str(ROOT_DIR / "modules" / "statistics_module"), "modules/statistics_module"),
],
hiddenimports=[
    # Add to imports
    "modules.statistics_module",
],
```

### Step 7: (Optional) Temporarily Disable

To disable without deleting, either:

**Option A**: In `modules/statistics_module/module.json`:
```json
{
  "enabled": false
}
```

**Option B**: In `config/modules.json`:
```json
{
  "disabled": ["statistics_module"]
}
```

## Advanced: Using Qt Designer (.ui file)

### Step 1: Create UI in Qt Designer

Open Qt Designer and create `statistics.ui` with:
- Root widget: QWidget
- Layout margins: 24px
- Spacing: 16px
- Use QGroupBox for cards

Save as `modules/statistics_module/statistics.ui`

### Step 2: Update module.json

```json
{
  "id": "statistics_module",
  "title": "Статистика",
  "icon": "📊",
  "ui": "statistics.ui",
  "order": 30,
  "enabled": true
}
```

That's it! No Python code needed for basic UI.

## Design System Checklist

When creating your widget, ensure:

- ✅ Layout margins: 24px
- ✅ Element spacing: 16px
- ✅ QGroupBox for cards (with `card` property)
- ✅ Emoji prefixes on buttons
- ✅ Button properties: `secondary`, `danger`, `size`
- ✅ Use parent.log_event() for logging
- ✅ Graceful error handling

## Common Patterns

### Access Main Window

```python
def create(parent=None):
    widget = QWidget(parent)
    
    # Access main window methods
    if parent:
        parent.log_event("Message")
        parent.tabs  # Access other tabs
```

### Connect to Other Tabs

```python
def init(app_context):
    # Access parsing tab
    if hasattr(app_context, 'parsing'):
        parsing_tab = app_context.parsing
        # Do something with parsing tab
```

### Error Handling

```python
def some_operation(parent):
    try:
        # Do something risky
        result = risky_operation()
        parent.log_event("✓ Success", level="INFO")
    except Exception as e:
        parent.log_event(f"✗ Error: {e}", level="ERROR")
        # Don't re-raise - keep app stable
```

## Troubleshooting

### Module Not Loading

1. Check `module.json` is valid JSON
2. Verify `enabled: true`
3. Check not in `config/modules.json` disabled list
4. Look at logs for error messages

### Import Error

1. Verify entry point: `"modules.your_module.widget:create"`
2. Check file exists: `modules/your_module/widget.py`
3. Ensure function exists: `def create(parent=None):`

### Widget Not Appearing

1. Verify `create()` returns a QWidget
2. Check no exceptions in widget creation
3. Look at activity log for errors

## Next Steps

- Read `MODULE_AUTOLOADER_README.md` for complete documentation
- Check `modules/demo_hooks_module/` for working example
- Review `DESIGN_SYSTEM.md` for styling guidelines
- Run tests: `python3 test_autoloader_integration.py`

## Quick Reference

### module.json Template

```json
{
  "id": "module_id",
  "title": "Module Title",
  "icon": "🎨",
  "description": "Description",
  "version": "1.0.0",
  "entry": "modules.module_id.widget:create",
  "order": 100,
  "enabled": true,
  "dependencies": []
}
```

### widget.py Template

```python
# -*- coding: utf-8 -*-
from PySide6.QtWidgets import QWidget, QVBoxLayout, QGroupBox

def create(parent=None):
    widget = QWidget(parent)
    layout = QVBoxLayout(widget)
    layout.setContentsMargins(24, 24, 24, 24)
    layout.setSpacing(16)
    
    # Add your UI here
    
    return widget
```

### __init__.py Template

```python
# -*- coding: utf-8 -*-
import logging

logger = logging.getLogger(__name__)

def init(app_context):
    logger.info("Module initialized")
    if hasattr(app_context, 'log_event'):
        app_context.log_event("Module ready!")

def unload():
    logger.info("Module cleanup")
```
