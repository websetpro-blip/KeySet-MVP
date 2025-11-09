#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprehensive validation for module autoloader system.
Checks all aspects: files, structure, imports, metadata.
"""
import json
import sys
from pathlib import Path


class ValidationError(Exception):
    """Validation error"""
    pass


def validate_file_structure():
    """Validate that all required files exist"""
    print("📁 Validating file structure...")
    
    required_files = [
        "app/module_autoloader.py",
        "config/modules.json",
        "MODULE_AUTOLOADER_README.md",
        "PR_MODULE_AUTOLOADER.md",
        "ADDING_NEW_MODULE_EXAMPLE.md",
        "tests/test_module_autoloader.py",
        "test_autoloader_integration.py",
    ]
    
    for file_path in required_files:
        full_path = Path(__file__).parent / file_path
        if not full_path.exists():
            raise ValidationError(f"Missing required file: {file_path}")
        print(f"  ✓ {file_path}")
    
    print()


def validate_module_directories():
    """Validate module directory structure"""
    print("📂 Validating module directories...")
    
    modules_dir = Path(__file__).parent / "modules"
    
    expected_modules = [
        "accounts_v2",
        "parsing_helpers",
        "demo_ui_module",
        "demo_hooks_module",
    ]
    
    for module_name in expected_modules:
        module_dir = modules_dir / module_name
        if not module_dir.exists():
            raise ValidationError(f"Missing module directory: {module_name}")
        
        module_json = module_dir / "module.json"
        if not module_json.exists():
            raise ValidationError(f"Missing module.json in {module_name}")
        
        print(f"  ✓ {module_name}/")
    
    print()


def validate_module_metadata():
    """Validate all module.json files"""
    print("📋 Validating module metadata...")
    
    modules_dir = Path(__file__).parent / "modules"
    
    required_fields = ["id", "title"]
    
    for module_dir in modules_dir.iterdir():
        if not module_dir.is_dir() or module_dir.name.startswith(('.', '__')):
            continue
        
        module_json = module_dir / "module.json"
        if not module_json.exists():
            continue
        
        try:
            data = json.loads(module_json.read_text(encoding="utf-8"))
            
            # Check required fields
            for field in required_fields:
                if field not in data:
                    raise ValidationError(f"Missing '{field}' in {module_dir.name}/module.json")
            
            # Check entry or ui
            if "entry" not in data and "ui" not in data:
                raise ValidationError(f"Missing 'entry' or 'ui' in {module_dir.name}/module.json")
            
            # Validate entry format if present
            if "entry" in data:
                entry = data["entry"]
                if ":" not in entry and not entry.count(".") >= 2:
                    raise ValidationError(f"Invalid entry format in {module_dir.name}: {entry}")
            
            # Validate optional fields types
            if "enabled" in data and not isinstance(data["enabled"], bool):
                raise ValidationError(f"'enabled' must be boolean in {module_dir.name}")
            
            if "order" in data and not isinstance(data["order"], int):
                raise ValidationError(f"'order' must be integer in {module_dir.name}")
            
            print(f"  ✓ {module_dir.name}/module.json")
            
        except json.JSONDecodeError as e:
            raise ValidationError(f"Invalid JSON in {module_dir.name}/module.json: {e}")
    
    print()


def validate_entry_points():
    """Validate that entry points exist"""
    print("🔗 Validating entry points...")
    
    modules_dir = Path(__file__).parent / "modules"
    
    for module_dir in modules_dir.iterdir():
        if not module_dir.is_dir() or module_dir.name.startswith(('.', '__')):
            continue
        
        module_json = module_dir / "module.json"
        if not module_json.exists():
            continue
        
        data = json.loads(module_json.read_text(encoding="utf-8"))
        
        # Check Python entry point
        if "entry" in data:
            entry = data["entry"]
            
            # Parse entry point
            if ":" in entry:
                module_path, func_name = entry.rsplit(":", 1)
            else:
                module_path, func_name = entry.rsplit(".", 1)
            
            # Check if it's a local module
            if module_path.startswith("modules."):
                # Extract file path
                parts = module_path.split(".")[1:]  # Remove 'modules.'
                
                if len(parts) >= 2:
                    # modules.xxx.widget -> widget.py
                    file_name = parts[-1] + ".py"
                    expected_file = module_dir / file_name
                    
                    if expected_file.exists():
                        # Check function exists
                        content = expected_file.read_text(encoding="utf-8")
                        if f"def {func_name}" not in content:
                            raise ValidationError(
                                f"Function {func_name} not found in {module_dir.name}/{file_name}"
                            )
                        print(f"  ✓ {module_dir.name}: {func_name}() in {file_name}")
                    else:
                        print(f"  ⚠ {module_dir.name}: {file_name} not found (may be package)")
        
        # Check UI file
        if "ui" in data:
            ui_file = module_dir / data["ui"]
            if not ui_file.exists():
                raise ValidationError(f"UI file not found: {module_dir.name}/{data['ui']}")
            print(f"  ✓ {module_dir.name}: {data['ui']}")
    
    print()


def validate_config():
    """Validate config/modules.json"""
    print("⚙️ Validating configuration...")
    
    config_file = Path(__file__).parent / "config" / "modules.json"
    
    try:
        data = json.loads(config_file.read_text(encoding="utf-8"))
        
        if "disabled" not in data:
            raise ValidationError("Missing 'disabled' field in config/modules.json")
        
        if not isinstance(data["disabled"], list):
            raise ValidationError("'disabled' must be a list in config/modules.json")
        
        print(f"  ✓ config/modules.json")
        print(f"    Disabled modules: {data['disabled'] or 'none'}")
        
    except json.JSONDecodeError as e:
        raise ValidationError(f"Invalid JSON in config/modules.json: {e}")
    
    print()


def validate_syntax():
    """Validate Python syntax"""
    print("🐍 Validating Python syntax...")
    
    import py_compile
    
    python_files = [
        "app/module_autoloader.py",
        "app/main.py",
    ]
    
    for file_path in python_files:
        full_path = Path(__file__).parent / file_path
        try:
            py_compile.compile(str(full_path), doraise=True)
            print(f"  ✓ {file_path}")
        except py_compile.PyCompileError as e:
            raise ValidationError(f"Syntax error in {file_path}: {e}")
    
    print()


def validate_pyinstaller_spec():
    """Validate PyInstaller spec includes modules"""
    print("📦 Validating PyInstaller spec...")
    
    spec_file = Path(__file__).parent / "keyset_accounts_v2.spec"
    
    if not spec_file.exists():
        print("  ⚠ keyset_accounts_v2.spec not found (skipping)")
        print()
        return
    
    content = spec_file.read_text(encoding="utf-8")
    
    # Check for module data includes
    if "modules/accounts_v2" not in content:
        print("  ⚠ accounts_v2 not in datas")
    else:
        print("  ✓ accounts_v2 in datas")
    
    if "modules/parsing_helpers" not in content:
        print("  ⚠ parsing_helpers not in datas")
    else:
        print("  ✓ parsing_helpers in datas")
    
    # Check for autoloader import
    if "app.module_autoloader" not in content:
        print("  ⚠ app.module_autoloader not in hiddenimports")
    else:
        print("  ✓ app.module_autoloader in hiddenimports")
    
    print()


def validate_documentation():
    """Validate documentation completeness"""
    print("📚 Validating documentation...")
    
    docs = {
        "MODULE_AUTOLOADER_README.md": [
            "Overview",
            "Module Structure",
            "module.json",
            "Creating Modules",
            "Lifecycle Hooks",
            "PyInstaller",
        ],
        "ADDING_NEW_MODULE_EXAMPLE.md": [
            "Step 1",
            "Step 2",
            "module.json",
            "widget.py",
        ],
        "PR_MODULE_AUTOLOADER.md": [
            "Summary",
            "Changes",
            "Features",
            "Testing",
        ],
    }
    
    for doc_file, required_sections in docs.items():
        full_path = Path(__file__).parent / doc_file
        if not full_path.exists():
            raise ValidationError(f"Missing documentation: {doc_file}")
        
        content = full_path.read_text(encoding="utf-8")
        
        for section in required_sections:
            if section not in content:
                raise ValidationError(f"Missing section '{section}' in {doc_file}")
        
        print(f"  ✓ {doc_file}")
    
    print()


def main():
    """Run all validations"""
    print("=" * 70)
    print("Module Autoloader System Validation")
    print("=" * 70)
    print()
    
    try:
        validate_file_structure()
        validate_module_directories()
        validate_module_metadata()
        validate_entry_points()
        validate_config()
        validate_syntax()
        validate_pyinstaller_spec()
        validate_documentation()
        
        print("=" * 70)
        print("✅ All validations passed!")
        print("=" * 70)
        print()
        print("The module autoloader system is properly configured.")
        print("Ready for testing and deployment.")
        
        return 0
        
    except ValidationError as e:
        print()
        print("=" * 70)
        print(f"❌ Validation Failed: {e}")
        print("=" * 70)
        return 1
    except Exception as e:
        print()
        print("=" * 70)
        print(f"❌ Unexpected Error: {e}")
        print("=" * 70)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
