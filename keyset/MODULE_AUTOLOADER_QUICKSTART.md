# Module Autoloader - Quick Start Guide

## 🚀 5-Minute Quick Start

### What is it?
A system that automatically loads modules from `modules/` directory as tabs in the KeySet application.

### Quick Demo

**1. Enable a demo module** (1 minute)

Edit `modules/demo_hooks_module/module.json`:
```json
{
  "enabled": true  ← Change false to true
}
```

**2. Run the app**
```bash
python3 run_keyset.pyw
```

**3. See the result**
- New tab appears: "🎯 Demo Hooks"
- Log message: "Demo hooks module initialized!"

That's it! 🎉

---

## 📝 Create Your First Module (5 minutes)

### Step 1: Create Directory
```bash
mkdir modules/hello_world
```

### Step 2: Create module.json
Create `modules/hello_world/module.json`:
```json
{
  "id": "hello_world",
  "title": "Hello World",
  "icon": "👋",
  "entry": "modules.hello_world.widget:create",
  "enabled": true
}
```

### Step 3: Create widget.py
Create `modules/hello_world/widget.py`:
```python
# -*- coding: utf-8 -*-
from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel, QPushButton

def create(parent=None):
    widget = QWidget(parent)
    layout = QVBoxLayout(widget)
    layout.setContentsMargins(24, 24, 24, 24)
    layout.setSpacing(16)
    
    label = QLabel("👋 Hello from my first module!")
    label.setStyleSheet("font-size: 16px;")
    layout.addWidget(label)
    
    button = QPushButton("🎉 Click Me!")
    button.clicked.connect(lambda: parent.log_event("Hello button clicked!") if parent else None)
    layout.addWidget(button)
    
    layout.addStretch()
    return widget
```

### Step 4: Restart App
```bash
python3 run_keyset.pyw
```

**Result**: New "👋 Hello World" tab appears!

---

## 🎯 Common Patterns

### Pattern 1: Simple Info Display
```python
def create(parent=None):
    widget = QWidget(parent)
    layout = QVBoxLayout(widget)
    layout.addWidget(QLabel("Module content here"))
    return widget
```

### Pattern 2: With Button Actions
```python
def create(parent=None):
    widget = QWidget(parent)
    layout = QVBoxLayout(widget)
    
    button = QPushButton("Action")
    button.clicked.connect(lambda: do_something(parent))
    layout.addWidget(button)
    
    return widget

def do_something(parent):
    parent.log_event("Action performed!")
```

### Pattern 3: With Init Hook
Create `__init__.py`:
```python
def init(app_context):
    app_context.log_event("Module ready!")

def unload():
    print("Cleanup")
```

---

## ⚙️ Configuration

### Disable a Module

**Option 1**: In `modules/my_module/module.json`
```json
{
  "enabled": false
}
```

**Option 2**: In `config/modules.json`
```json
{
  "disabled": ["my_module"]
}
```

### Change Tab Order
```json
{
  "order": 10  ← Lower = appears first
}
```

---

## 🎨 Design Guidelines

### Layout Spacing
```python
layout.setContentsMargins(24, 24, 24, 24)  # Always 24px
layout.setSpacing(16)                       # Always 16px
```

### Card Containers
```python
group = QGroupBox("Card Title")
group.setProperty("card", True)  # Makes it a card
```

### Buttons
```python
button = QPushButton("🔔 Button")
button.setProperty("secondary", True)  # Gray button
# or
button.setProperty("danger", True)     # Red button
```

---

## 🐛 Troubleshooting

### Module Not Loading?
1. Check `enabled: true` in module.json
2. Verify not in `config/modules.json` disabled list
3. Check app logs for errors

### Function Not Found?
Ensure function name matches entry:
```json
{
  "entry": "modules.my_module.widget:create"
                                      ^^^^^^
}
```
```python
def create(parent=None):  # Must match!
    ...
```

### Import Error?
Check entry path:
```
modules.my_module.widget:create
        ^^^^^^^^^ 
        Must match directory name
```

---

## 📚 More Information

- **Full Guide**: See `MODULE_AUTOLOADER_README.md`
- **Tutorial**: See `ADDING_NEW_MODULE_EXAMPLE.md`
- **Examples**: Check `modules/demo_hooks_module/`

---

## ✅ Validation

Test your module system:
```bash
python3 validate_module_system.py
```

Should see:
```
✅ All validations passed!
```

---

## 🎓 Next Steps

1. ✅ Created first module
2. ⬜ Add custom styling
3. ⬜ Add lifecycle hooks
4. ⬜ Connect to database
5. ⬜ Add user interactions

**Happy coding!** 🚀

---

## 📞 Quick Reference

### module.json Template
```json
{
  "id": "module_id",
  "title": "Tab Title",
  "icon": "🎨",
  "entry": "modules.module_id.widget:create",
  "order": 100,
  "enabled": true
}
```

### widget.py Template
```python
# -*- coding: utf-8 -*-
from PySide6.QtWidgets import QWidget, QVBoxLayout

def create(parent=None):
    widget = QWidget(parent)
    layout = QVBoxLayout(widget)
    layout.setContentsMargins(24, 24, 24, 24)
    layout.setSpacing(16)
    
    # Add your widgets here
    
    return widget
```

### File Structure
```
modules/
└── my_module/
    ├── module.json   ← Config
    ├── widget.py     ← UI code
    └── __init__.py   ← Hooks (optional)
```

That's all you need to know to get started! 🎉
