#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple integration test for module autoloader.
Tests basic functionality without requiring Qt GUI.
"""
import json
import sys
from pathlib import Path

def test_module_json_files():
    """Test that all module.json files are valid"""
    print("Testing module.json files...")
    
    modules_dir = Path(__file__).parent / "modules"
    
    for module_dir in modules_dir.iterdir():
        if not module_dir.is_dir():
            continue
        if module_dir.name.startswith(('.', '__')):
            continue
        
        module_json = module_dir / "module.json"
        if not module_json.exists():
            continue
        
        try:
            data = json.loads(module_json.read_text(encoding="utf-8"))
            
            # Check required fields
            assert "id" in data, f"Missing 'id' in {module_json}"
            assert "title" in data, f"Missing 'title' in {module_json}"
            assert "entry" in data or "ui" in data, f"Missing 'entry' or 'ui' in {module_json}"
            
            print(f"  ✓ {module_dir.name}/module.json valid")
        except Exception as e:
            print(f"  ✗ {module_dir.name}/module.json: {e}")
            sys.exit(1)
    
    print()

def test_config_json():
    """Test that config/modules.json is valid"""
    print("Testing config/modules.json...")
    
    config_file = Path(__file__).parent / "config" / "modules.json"
    
    try:
        data = json.loads(config_file.read_text(encoding="utf-8"))
        assert "disabled" in data, "Missing 'disabled' field"
        assert isinstance(data["disabled"], list), "'disabled' must be a list"
        print(f"  ✓ config/modules.json valid")
        print()
    except Exception as e:
        print(f"  ✗ config/modules.json: {e}")
        sys.exit(1)

def test_module_structure():
    """Test that modules have required files"""
    print("Testing module structure...")
    
    modules_dir = Path(__file__).parent / "modules"
    
    for module_dir in modules_dir.iterdir():
        if not module_dir.is_dir():
            continue
        if module_dir.name.startswith(('.', '__')):
            continue
        
        module_json = module_dir / "module.json"
        if not module_json.exists():
            continue
        
        data = json.loads(module_json.read_text(encoding="utf-8"))
        
        # Check entry point file exists if Python entry
        if "entry" in data:
            entry = data["entry"]
            # Extract module path
            if ":" in entry:
                module_path = entry.split(":")[0]
            else:
                module_path = ".".join(entry.split(".")[:-1])
            
            # Check if it's a local module
            if module_path.startswith("modules."):
                parts = module_path.split(".")[1:]  # Remove 'modules.'
                expected_file = module_dir / (parts[-1] + ".py")
                
                if expected_file.exists():
                    print(f"  ✓ {module_dir.name} has {expected_file.name}")
                else:
                    print(f"  ⚠ {module_dir.name} missing {expected_file.name} (may use package)")
        
        # Check UI file exists if UI entry
        if "ui" in data:
            ui_path = module_dir / data["ui"]
            if ui_path.exists():
                print(f"  ✓ {module_dir.name} has {data['ui']}")
            else:
                print(f"  ✗ {module_dir.name} missing {data['ui']}")
                sys.exit(1)
    
    print()

def test_imports():
    """Test that module_autoloader can be imported (syntax check)"""
    print("Testing imports...")
    
    try:
        # Add project to path
        project_root = Path(__file__).parent
        if str(project_root) not in sys.path:
            sys.path.insert(0, str(project_root))
        
        # Test syntax by compiling
        import py_compile
        autoloader_path = project_root / "app" / "module_autoloader.py"
        py_compile.compile(str(autoloader_path), doraise=True)
        print(f"  ✓ app/module_autoloader.py syntax valid")
        
        main_path = project_root / "app" / "main.py"
        py_compile.compile(str(main_path), doraise=True)
        print(f"  ✓ app/main.py syntax valid")
        
        print()
    except Exception as e:
        print(f"  ✗ Import failed: {e}")
        sys.exit(1)

def test_demo_modules():
    """Test that demo modules are properly configured"""
    print("Testing demo modules...")
    
    modules_dir = Path(__file__).parent / "modules"
    
    # Check demo_ui_module
    demo_ui = modules_dir / "demo_ui_module"
    if demo_ui.exists():
        assert (demo_ui / "module.json").exists()
        assert (demo_ui / "demo.ui").exists()
        print("  ✓ demo_ui_module properly configured")
    
    # Check demo_hooks_module
    demo_hooks = modules_dir / "demo_hooks_module"
    if demo_hooks.exists():
        assert (demo_hooks / "module.json").exists()
        assert (demo_hooks / "widget.py").exists()
        assert (demo_hooks / "__init__.py").exists()
        print("  ✓ demo_hooks_module properly configured")
    
    print()

def main():
    """Run all tests"""
    print("="*60)
    print("Module Autoloader Integration Test")
    print("="*60)
    print()
    
    test_module_json_files()
    test_config_json()
    test_module_structure()
    test_imports()
    test_demo_modules()
    
    print("="*60)
    print("✓ All tests passed!")
    print("="*60)

if __name__ == "__main__":
    main()
