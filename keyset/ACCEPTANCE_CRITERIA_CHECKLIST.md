# Module Autoloader - Acceptance Criteria Checklist

This document maps the ticket's acceptance criteria to the implementation.

## ✅ Acceptance Criteria

### 1. On app start, modules/*/module.json are discovered and loaded as tabs

**Status**: ✅ IMPLEMENTED

**Evidence**:
- `app/module_autoloader.py`: `discover_modules()` method scans `modules/*/module.json`
- `app/main.py`: `_load_modules()` calls autoloader and mounts tabs
- **Test**: Run `python3 test_autoloader_integration.py` - all modules discovered
- **Validation**: `validate_module_system.py` confirms all metadata files valid

**Code Location**:
```python
# app/module_autoloader.py lines 95-133
def discover_modules(self) -> list[tuple[Path, ModuleMetadata]]:
    """Discover all modules in modules/ directory."""
    ...
```

---

### 2. Both Python widget and .ui modules are supported

**Status**: ✅ IMPLEMENTED

**Evidence**:
- **Python widgets**: `_load_python_widget()` method (lines 200-242)
- **.ui files**: `_load_ui_widget()` method (lines 244-312)
- **Demo**: `demo_ui_module` uses .ui file, `demo_hooks_module` uses Python

**Code Location**:
```python
# Python widget loading
def _load_python_widget(self, entry: str, app_context: Any = None) -> QWidget:
    # lines 200-242

# UI file loading
def _load_ui_widget(self, module_dir: Path, ui_path: str) -> QWidget:
    # lines 244-312
```

**Test Cases**:
- `tests/test_module_autoloader.py::test_load_python_widget_success`
- `tests/test_module_autoloader.py::test_load_ui_widget` (mocked)

---

### 3. Existing tabs remain unchanged; modules can be disabled via config

**Status**: ✅ IMPLEMENTED

**Evidence**:
- **Existing tabs unchanged**: `app/main.py` adds module tabs AFTER built-in tabs (lines 204-207)
- **Config-based disable**: `config/modules.json` with `disabled` array
- **Module-level disable**: `enabled` field in `module.json`

**Tab Order**:
1. Аккаунты (built-in)
2. Парсинг (built-in)
3. Маски (built-in)
4. **→ Modules here** (by order field)

**Config Files**:
- `config/modules.json`: Global disable list
- `modules/*/module.json`: Per-module `enabled` field

**Test Cases**:
- `tests/test_module_autoloader.py::test_discover_modules_skip_disabled_in_config`
- `tests/test_module_autoloader.py::test_discover_modules_skip_disabled_in_module_json`

---

### 4. Errors in a module do not crash the app; clear logs are produced

**Status**: ✅ IMPLEMENTED

**Evidence**:
- All module loading wrapped in try-except blocks
- Errors logged with full traceback
- Failed modules return `None` and are skipped
- App continues loading other modules

**Code Location**:
```python
# app/module_autoloader.py lines 161-198
def load_module(self, module_dir: Path, metadata: ModuleMetadata, app_context: Any = None):
    try:
        # ... load module
    except Exception as e:
        logger.error(f"✗ Failed to load module {metadata.id}: {e}", exc_info=True)
        return None  # Don't crash, just skip
```

**Logging Examples**:
- `"✓ Loaded module: accounts_v2 (🔑 Аккаунты v2)"`
- `"✗ Failed to load module broken_module: ImportError: ..."`
- `"Module test_module disabled in config"`

**Test Cases**:
- `tests/test_module_autoloader.py::test_error_handling_in_load_module`

---

### 5. Works in a PyInstaller build with bundled resources

**Status**: ✅ IMPLEMENTED

**Evidence**:
- `.ui` file loader checks multiple sources:
  1. Filesystem (development)
  2. `sys._MEIPASS` (PyInstaller bundle)
  3. `pkgutil.get_data` (package data)
- `keyset_accounts_v2.spec` updated with:
  - All modules in `datas`
  - `app.module_autoloader` in `hiddenimports`

**Code Location**:
```python
# app/module_autoloader.py lines 244-312
def _load_ui_widget(self, module_dir: Path, ui_path: str) -> QWidget:
    # Try filesystem
    if ui_file_path.exists():
        return self._load_ui_from_path(ui_file_path)
    
    # Try PyInstaller bundle
    if getattr(sys, 'frozen', False):
        bundled_path = base_path / "modules" / module_dir.name / ui_path
        if bundled_path.exists():
            return self._load_ui_from_path(bundled_path)
    
    # Try package data
    ui_data = pkgutil.get_data(module_name, ui_path)
    ...
```

**PyInstaller Configuration**:
```python
# keyset_accounts_v2.spec
datas=[
    (str(ROOT_DIR / "modules" / "accounts_v2"), "modules/accounts_v2"),
    (str(ROOT_DIR / "modules" / "parsing_helpers"), "modules/parsing_helpers"),
    ...
],
hiddenimports=[
    "app.module_autoloader",
    "modules.accounts_v2",
    "modules.parsing_helpers",
    ...
]
```

**Validation**: `validate_module_system.py` checks PyInstaller spec

---

## ✅ Scope Requirements

### 1. Module metadata and discovery

**Status**: ✅ IMPLEMENTED

**Schema**:
```json
{
  "id": "module_id",           // Required: unique identifier
  "title": "Module Title",     // Required: display name
  "entry": "module.path:func", // Required if no ui
  "ui": "widget.ui",           // Required if no entry
  "icon": "🎨",                // Optional: emoji icon
  "version": "1.0.0",          // Optional: defaults to "1.0.0"
  "order": 100,                // Optional: defaults to 100
  "enabled": true,             // Optional: defaults to true
  "description": "...",        // Optional: description
  "dependencies": []           // Optional: list of module IDs
}
```

**Validation**:
- `ModuleMetadata` dataclass validates schema (lines 23-48)
- `_load_metadata()` validates required fields (lines 135-158)
- Unit tests for valid/invalid metadata

---

### 2. Loading strategies

**Status**: ✅ IMPLEMENTED

**Python Entry**:
- Format: `"modules.package.widget:create"` or `"modules.package.widget.create"`
- Dynamically imports and calls factory function
- Passes `app_context` (MainWindow) to factory
- Multiple signature attempts for compatibility

**UI Entry**:
- Loads `.ui` files with `QUiLoader`
- Works from filesystem or bundled resources
- Applies global theme automatically

**Theme Application**:
- Global QSS (`styles/modern.qss`) applied in `app/main.py::_apply_qss()`
- All widgets inherit theme automatically
- Design system guidelines in documentation

---

### 3. Lifecycle hooks

**Status**: ✅ IMPLEMENTED

**Hooks Supported**:
- `init(app_context)`: Called after widget creation, before tab mount
- `unload()`: Called on application close

**Hook Discovery**:
```python
# app/module_autoloader.py lines 177-185
try:
    module_package = self._get_module_package(metadata.entry)
    if module_package:
        mod = importlib.import_module(module_package)
        init_hook = getattr(mod, "init", None)
        unload_hook = getattr(mod, "unload", None)
except Exception as e:
    logger.debug(f"No lifecycle hooks for {metadata.id}: {e}")
```

**Error Isolation**:
- Hook errors logged, don't prevent module load
- `unload_all_modules()` calls all unload hooks safely

**Example**:
```python
# modules/demo_hooks_module/__init__.py
def init(app_context):
    logger.info("Module initialized")
    app_context.log_event("Demo module ready!")

def unload():
    logger.info("Module cleanup")
```

**Test Cases**:
- `tests/test_module_autoloader.py::test_lifecycle_hooks_called`

---

### 4. Mounting into UI

**Status**: ✅ IMPLEMENTED

**Tab Addition**:
```python
# app/main.py lines 223-234
for loaded in loaded_modules:
    # Build tab title with optional icon
    tab_title = loaded.metadata.title
    if loaded.metadata.icon:
        tab_title = f"{loaded.metadata.icon} {loaded.metadata.title}"
    
    # Add tab to main window
    self.tabs.addTab(loaded.widget, tab_title)
```

**Tab Order**:
1. Existing tabs: Аккаунты, Парсинг, Маски
2. Modules sorted by `order` (ascending), then `title` (alphabetically)

**Enable/Disable**:
- `config/modules.json`: `{"disabled": ["module_id"]}`
- `module.json`: `{"enabled": false}`

---

### 5. Configuration and resilience

**Status**: ✅ IMPLEMENTED

**Graceful Handling**:
- Missing `modules/` directory: Logs warning, continues
- Malformed `module.json`: Logs error, skips module
- Missing entry point: Logs error, skips module
- Import errors: Full traceback logged, skips module

**Logging**:
- Discovery: `"Discovered module: accounts_v2 (🔑 Аккаунты v2)"`
- Success: `"✓ Loaded module: accounts_v2"`
- Skip: `"Module demo_ui_module disabled in config"`
- Error: `"✗ Failed to load module broken: ImportError: ..."`

**Configuration Files**:
- `config/modules.json`: Global settings
- `modules/*/module.json`: Per-module metadata

---

### 6. Packaging (PyInstaller)

**Status**: ✅ IMPLEMENTED

**Spec File Updates**:
```python
# keyset_accounts_v2.spec
datas=[
    # All modules with their UI files and configs
    (str(ROOT_DIR / "modules" / "accounts_v2"), "modules/accounts_v2"),
    (str(ROOT_DIR / "modules" / "parsing_helpers"), "modules/parsing_helpers"),
    (str(ROOT_DIR / "modules" / "demo_ui_module"), "modules/demo_ui_module"),
    (str(ROOT_DIR / "modules" / "demo_hooks_module"), "modules/demo_hooks_module"),
    ...
],
hiddenimports=[
    "app.module_autoloader",
    "modules.accounts_v2",
    "modules.parsing_helpers",
    ...
]
```

**Resource Loading**:
- UI files loaded via multiple fallback methods
- Works in development and frozen builds
- No network or webview required

---

### 7. Tests and PR notes

**Status**: ✅ IMPLEMENTED

**Test Files**:
- `tests/test_module_autoloader.py`: 24 unit tests
- `test_autoloader_integration.py`: Integration tests
- `validate_module_system.py`: Comprehensive validation

**Test Coverage**:
- ✅ Discovery of module.json
- ✅ Loading widget.py:create
- ✅ Loading .ui files (mocked)
- ✅ Error handling for missing entry
- ✅ Lifecycle hooks
- ✅ Configuration
- ✅ Sorting and filtering

**Documentation**:
- `PR_MODULE_AUTOLOADER.md`: Comprehensive PR description
- `MODULE_AUTOLOADER_README.md`: Complete user guide
- `ADDING_NEW_MODULE_EXAMPLE.md`: Step-by-step tutorial

---

## 🎯 Summary

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Module discovery | ✅ | `discover_modules()`, integration tests pass |
| Python & .ui support | ✅ | Both loading strategies implemented |
| Existing tabs unchanged | ✅ | Modules added after built-in tabs |
| Config-based disable | ✅ | `config/modules.json` + `enabled` field |
| Error resilience | ✅ | Try-except blocks, comprehensive logging |
| PyInstaller support | ✅ | Multi-source resource loading, spec updated |
| Tests | ✅ | 24 unit tests + integration tests |
| Documentation | ✅ | 3 comprehensive docs + inline docstrings |

**All acceptance criteria met! ✅**

---

## 📝 Testing Instructions

### Quick Validation
```bash
python3 validate_module_system.py
```

### Integration Tests
```bash
python3 test_autoloader_integration.py
```

### Unit Tests (requires pytest)
```bash
pytest tests/test_module_autoloader.py -v
```

### Manual Testing
1. Enable demo modules: Set `"enabled": true` in `modules/demo_*/module.json`
2. Run app: `python3 run_keyset.pyw`
3. Check for new tabs: "🎨 Demo UI" and "🎯 Demo Hooks"
4. Check logs for init/unload messages

---

## 📚 Documentation

- **User Guide**: `MODULE_AUTOLOADER_README.md` (1000+ lines)
- **Tutorial**: `ADDING_NEW_MODULE_EXAMPLE.md` (350+ lines)
- **PR Description**: `PR_MODULE_AUTOLOADER.md` (550+ lines)
- **API Docs**: Inline docstrings in `app/module_autoloader.py`

---

## 🔄 Reversibility

The implementation is fully reversible:
1. Disable modules: Add to `config/modules.json` disabled list
2. Revert code: Old `_load_modules()` method structure preserved
3. Remove autoloader: Delete `app/module_autoloader.py`, restore old method

**No breaking changes!**
