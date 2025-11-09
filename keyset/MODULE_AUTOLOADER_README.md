# Module Autoloader System

## Overview

The module autoloader provides a flexible, non-invasive system for extending KeySet with modular functionality. Modules are automatically discovered and loaded at startup from the `modules/` directory.

## Features

- 🔍 **Automatic Discovery**: Scans `modules/*/module.json` at startup
- 🎨 **Multiple Loading Strategies**: Support for both Python widgets and Qt Designer `.ui` files
- 🪝 **Lifecycle Hooks**: Optional `init()` and `unload()` callbacks
- ⚙️ **Configuration**: Enable/disable modules via `config/modules.json`
- 🛡️ **Error Resilience**: Module errors don't crash the application
- 📦 **PyInstaller Compatible**: Works seamlessly in bundled builds
- 🎯 **Theme Integration**: Modules automatically inherit CARDVANCE white-premium theme

## Module Structure

### Basic Module Layout

```
modules/
└── my_module/
    ├── module.json       # Required: Module metadata
    ├── widget.py         # Option 1: Python widget
    ├── widget.ui         # Option 2: Qt Designer UI file
    └── __init__.py       # Optional: Lifecycle hooks
```

## Module Metadata (`module.json`)

### Required Fields

```json
{
  "id": "my_module",           // Unique module identifier
  "title": "My Module",        // Display name for tab
  "entry": "modules.my_module.widget:create"  // Python entry point
}
```

OR

```json
{
  "id": "my_module",
  "title": "My Module",
  "ui": "widget.ui"            // Path to .ui file (relative to module dir)
}
```

### Optional Fields

```json
{
  "id": "my_module",
  "title": "My Module",
  "entry": "modules.my_module.widget:create",
  
  "icon": "🎨",                // Emoji icon for tab
  "version": "1.0.0",          // Module version
  "order": 100,                // Tab order (lower = earlier)
  "enabled": true,             // Enable/disable in module.json
  "description": "...",        // Module description
  "dependencies": []           // List of required module IDs
}
```

### Entry Point Formats

Both formats are supported:

- **Colon separator**: `"modules.my_module.widget:create"`
- **Dot separator**: `"modules.my_module.widget.create"`

## Creating Modules

### Option 1: Python Widget

**widget.py:**
```python
from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel

def create(parent=None):
    """
    Factory function to create the widget.
    
    Args:
        parent: Parent widget (typically MainWindow)
    
    Returns:
        QWidget instance
    """
    widget = QWidget(parent)
    layout = QVBoxLayout(widget)
    layout.setContentsMargins(24, 24, 24, 24)  # CARDVANCE spacing
    layout.setSpacing(16)
    
    label = QLabel("Hello from my module!")
    layout.addWidget(label)
    
    return widget
```

**module.json:**
```json
{
  "id": "my_module",
  "title": "My Module",
  "icon": "🎨",
  "entry": "modules.my_module.widget:create"
}
```

### Option 2: Qt Designer UI File

**widget.ui:**
Create using Qt Designer with proper CARDVANCE spacing:
- Layout margins: 24px
- Layout spacing: 16px
- QGroupBox for card containers

**module.json:**
```json
{
  "id": "my_ui_module",
  "title": "My UI Module",
  "icon": "🎨",
  "ui": "widget.ui"
}
```

### Option 3: Lifecycle Hooks

Add `__init__.py` to your module with optional hooks:

**__init__.py:**
```python
import logging

logger = logging.getLogger(__name__)

def init(app_context):
    """
    Called after module widget is created.
    
    Args:
        app_context: The MainWindow instance
    """
    logger.info("Module initialized!")
    if hasattr(app_context, 'log_event'):
        app_context.log_event("My module is ready!")

def unload():
    """
    Called when application is closing.
    """
    logger.info("Module unloading - cleanup here")
```

## Design System Compliance

Modules should follow the CARDVANCE white-premium design system:

### Layout Spacing
- **Outer margins**: 24px
- **Element spacing**: 16px

### Card Containers
Use QGroupBox with `card` property:
```python
group = QGroupBox("Card Title")
group.setProperty("card", True)
```

### Buttons
Add emoji prefixes and properties:
```python
button = QPushButton("🔔 Action Button")
button.setProperty("secondary", True)  # or "danger"
button.setProperty("size", "large")     # optional
```

### Colors
The global theme (`styles/modern.qss`) is automatically applied. No need to manually set colors.

## Configuration

### Disabling Modules

**config/modules.json:**
```json
{
  "disabled": ["module_id_1", "module_id_2"],
  "note": "Add module IDs here to disable them without code changes"
}
```

Alternatively, set `"enabled": false` in the module's `module.json`.

## Tab Ordering

Tabs are added in this order:
1. Built-in tabs (Аккаунты, Парсинг, Маски)
2. Modules sorted by:
   - `order` field (ascending)
   - `title` field (alphabetically)

Example ordering:
```json
{"id": "first", "order": 10}   // Appears first
{"id": "second", "order": 20}  // Appears second
{"id": "third", "order": 100}  // Default order
```

## Error Handling

The autoloader is designed to fail gracefully:

- **Malformed JSON**: Module skipped, warning logged
- **Missing entry point**: Module skipped, error logged
- **Import errors**: Module skipped, traceback logged
- **Widget creation errors**: Module skipped, error logged
- **Hook errors**: Hook skipped, module still loads

The application will never crash due to a broken module.

## PyInstaller Bundling

### Including Modules in Build

Update `keyset_accounts_v2.spec`:

```python
datas=[
    # Include your module
    (str(ROOT_DIR / "modules" / "my_module"), "modules/my_module"),
],
hiddenimports=[
    # Add your module package
    "modules.my_module",
],
```

### UI File Resources

UI files are automatically loaded from:
1. Filesystem (development)
2. `sys._MEIPASS` (PyInstaller bundle)
3. Package data (`pkgutil.get_data`)

No special handling required!

## Testing

Run the test suite:

```bash
pytest tests/test_module_autoloader.py -v
```

Key test scenarios:
- Module discovery and validation
- Python widget loading
- UI file loading (mocked)
- Lifecycle hooks execution
- Error handling and resilience
- Module ordering and filtering

## Examples

### Example 1: Simple Information Display

```
modules/info_module/
├── module.json
└── widget.py
```

**module.json:**
```json
{
  "id": "info_module",
  "title": "Info",
  "icon": "ℹ️",
  "entry": "modules.info_module.widget:create",
  "order": 50
}
```

### Example 2: UI Designer Module

```
modules/settings_module/
├── module.json
├── settings.ui
└── __init__.py
```

**module.json:**
```json
{
  "id": "settings_module",
  "title": "Settings",
  "icon": "⚙️",
  "ui": "settings.ui",
  "order": 999
}
```

### Example 3: Module with Hooks

```
modules/analytics_module/
├── module.json
├── widget.py
└── __init__.py
```

**__init__.py:**
```python
_analytics_service = None

def init(app_context):
    global _analytics_service
    _analytics_service = AnalyticsService()
    _analytics_service.start()

def unload():
    if _analytics_service:
        _analytics_service.stop()
```

## Existing Modules

### accounts_v2
- **ID**: `accounts_v2`
- **Title**: 🔑 Аккаунты v2
- **Description**: Account management with antidetect and proxy support
- **Entry**: Python widget
- **Order**: 10

### parsing_helpers
- **ID**: `parsing_helpers`
- **Title**: 🔧 Помощники парсинга
- **Description**: Utility helpers for parsing operations
- **Entry**: Python widget
- **Order**: 20

### demo_ui_module (disabled)
- **ID**: `demo_ui_module`
- **Title**: 🎨 Demo UI
- **Description**: Demo module loaded from .ui file
- **Entry**: UI file
- **Order**: 999
- **Status**: Disabled by default

### demo_hooks_module (disabled)
- **ID**: `demo_hooks_module`
- **Title**: 🎯 Demo Hooks
- **Description**: Demo module with lifecycle hooks
- **Entry**: Python widget
- **Order**: 998
- **Status**: Disabled by default

## API Reference

### ModuleAutoloader

```python
from app.module_autoloader import ModuleAutoloader, create_autoloader

# Create with default paths
autoloader = create_autoloader()

# Or specify custom paths
autoloader = ModuleAutoloader(
    modules_dir=Path("modules"),
    config_path=Path("config/modules.json")
)

# Discover modules
discovered = autoloader.discover_modules()

# Load all modules
loaded = autoloader.load_all_modules(app_context=main_window)

# Load specific module
loaded_module = autoloader.load_module(module_dir, metadata, app_context)

# Unload all modules (calls unload hooks)
autoloader.unload_all_modules()
```

### ModuleMetadata

```python
from app.module_autoloader import ModuleMetadata

metadata = ModuleMetadata(
    id="my_module",
    title="My Module",
    entry="modules.my_module.widget:create",
    icon="🎨",
    version="1.0.0",
    order=100,
    enabled=True,
    description="Module description",
    dependencies=[]
)
```

### LoadedModule

```python
# Properties
loaded_module.metadata      # ModuleMetadata
loaded_module.widget        # QWidget instance
loaded_module.module_dir    # Path to module directory
loaded_module.init_hook     # Optional callable
loaded_module.unload_hook   # Optional callable
```

## Troubleshooting

### Module Not Loading

1. Check logs for error messages
2. Verify `module.json` is valid JSON
3. Ensure `entry` or `ui` field is present
4. Check `enabled` field in module.json
5. Check `disabled` list in config/modules.json
6. Verify import path in `entry` field

### UI File Not Found

1. Check `ui` path is relative to module directory
2. Verify .ui file exists
3. For PyInstaller builds, ensure module is in `datas`

### Import Errors

1. Verify module package structure
2. Add to `hiddenimports` in .spec file
3. Check Python path includes project root

### Hooks Not Called

1. Hooks must be in module's `__init__.py`
2. Hook names must be exactly `init` and `unload`
3. Check logs for hook execution errors

## Best Practices

1. ✅ **Use descriptive IDs**: `accounts_manager` not `am`
2. ✅ **Add icons**: Improves visual recognition
3. ✅ **Set appropriate order**: Group related modules
4. ✅ **Follow design system**: Use 24px margins, 16px spacing
5. ✅ **Handle errors gracefully**: Don't crash the app
6. ✅ **Log important events**: Use logger or app_context.log_event
7. ✅ **Clean up resources**: Use unload hook
8. ✅ **Test in isolation**: Module should work independently
9. ✅ **Document dependencies**: List required modules
10. ✅ **Version your modules**: Update version field on changes

## Future Enhancements

Potential future improvements:
- Hot reload during development
- Dependency resolution and ordering
- Module update notifications
- Module marketplace/registry
- Per-module settings UI
- Inter-module communication API
- Module unload/reload at runtime

## Support

For questions or issues:
1. Check this documentation
2. Review example modules (demo_ui_module, demo_hooks_module)
3. Run tests: `pytest tests/test_module_autoloader.py -v`
4. Check application logs
5. Review DESIGN_SYSTEM.md for styling guidelines
