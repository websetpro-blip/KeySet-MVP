# -*- coding: utf-8 -*-
"""
Tests for module autoloader functionality.
"""
import json
import tempfile
from pathlib import Path
from unittest import mock

import pytest
from PySide6.QtWidgets import QApplication, QWidget

from app.module_autoloader import (
    ModuleAutoloader,
    ModuleMetadata,
    LoadedModule,
    create_autoloader,
)


@pytest.fixture
def qapp():
    """Create QApplication instance for tests"""
    app = QApplication.instance()
    if app is None:
        app = QApplication([])
    return app


@pytest.fixture
def temp_modules_dir(tmp_path):
    """Create temporary modules directory"""
    modules_dir = tmp_path / "modules"
    modules_dir.mkdir()
    return modules_dir


@pytest.fixture
def temp_config_path(tmp_path):
    """Create temporary config file"""
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    config_path = config_dir / "modules.json"
    config_path.write_text(json.dumps({"disabled": []}))
    return config_path


class TestModuleMetadata:
    """Tests for ModuleMetadata dataclass"""
    
    def test_valid_metadata_with_entry(self):
        """Test creating valid metadata with entry point"""
        metadata = ModuleMetadata(
            id="test_module",
            title="Test Module",
            entry="test.widget:create"
        )
        assert metadata.id == "test_module"
        assert metadata.title == "Test Module"
        assert metadata.entry == "test.widget:create"
        assert metadata.enabled is True
        assert metadata.order == 100
    
    def test_valid_metadata_with_ui(self):
        """Test creating valid metadata with UI file"""
        metadata = ModuleMetadata(
            id="test_ui",
            title="Test UI",
            ui="widget.ui"
        )
        assert metadata.ui == "widget.ui"
    
    def test_invalid_metadata_no_entry_or_ui(self):
        """Test that metadata without entry or ui raises error"""
        with pytest.raises(ValueError, match="must have either 'entry' or 'ui'"):
            ModuleMetadata(
                id="invalid",
                title="Invalid"
            )
    
    def test_metadata_with_optional_fields(self):
        """Test metadata with all optional fields"""
        metadata = ModuleMetadata(
            id="full_module",
            title="Full Module",
            entry="module:create",
            icon="🎨",
            version="2.0.0",
            order=50,
            enabled=False,
            description="Test description",
            dependencies=["dep1", "dep2"]
        )
        assert metadata.icon == "🎨"
        assert metadata.version == "2.0.0"
        assert metadata.order == 50
        assert metadata.enabled is False
        assert metadata.description == "Test description"
        assert metadata.dependencies == ["dep1", "dep2"]


class TestModuleAutoloader:
    """Tests for ModuleAutoloader class"""
    
    def test_create_autoloader(self, temp_modules_dir, temp_config_path):
        """Test creating autoloader instance"""
        autoloader = ModuleAutoloader(temp_modules_dir, temp_config_path)
        assert autoloader.modules_dir == temp_modules_dir
        assert autoloader.config_path == temp_config_path
        assert autoloader.loaded_modules == []
    
    def test_discover_modules_empty_dir(self, temp_modules_dir, temp_config_path):
        """Test discovering modules in empty directory"""
        autoloader = ModuleAutoloader(temp_modules_dir, temp_config_path)
        discovered = autoloader.discover_modules()
        assert discovered == []
    
    def test_discover_modules_with_valid_module(self, temp_modules_dir, temp_config_path):
        """Test discovering a valid module"""
        # Create test module
        module_dir = temp_modules_dir / "test_module"
        module_dir.mkdir()
        
        module_json = {
            "id": "test_module",
            "title": "Test Module",
            "entry": "test.widget:create",
            "enabled": True
        }
        (module_dir / "module.json").write_text(json.dumps(module_json))
        
        autoloader = ModuleAutoloader(temp_modules_dir, temp_config_path)
        discovered = autoloader.discover_modules()
        
        assert len(discovered) == 1
        assert discovered[0][0] == module_dir
        assert discovered[0][1].id == "test_module"
    
    def test_discover_modules_skip_disabled_in_config(self, temp_modules_dir, temp_config_path):
        """Test that disabled modules in config are skipped"""
        # Create test module
        module_dir = temp_modules_dir / "disabled_module"
        module_dir.mkdir()
        
        module_json = {
            "id": "disabled_module",
            "title": "Disabled Module",
            "entry": "test.widget:create",
            "enabled": True
        }
        (module_dir / "module.json").write_text(json.dumps(module_json))
        
        # Disable in config
        temp_config_path.write_text(json.dumps({"disabled": ["disabled_module"]}))
        
        autoloader = ModuleAutoloader(temp_modules_dir, temp_config_path)
        discovered = autoloader.discover_modules()
        
        assert len(discovered) == 0
    
    def test_discover_modules_skip_disabled_in_module_json(self, temp_modules_dir, temp_config_path):
        """Test that modules with enabled=false are skipped"""
        module_dir = temp_modules_dir / "disabled_module"
        module_dir.mkdir()
        
        module_json = {
            "id": "disabled_module",
            "title": "Disabled Module",
            "entry": "test.widget:create",
            "enabled": False
        }
        (module_dir / "module.json").write_text(json.dumps(module_json))
        
        autoloader = ModuleAutoloader(temp_modules_dir, temp_config_path)
        discovered = autoloader.discover_modules()
        
        assert len(discovered) == 0
    
    def test_discover_modules_sorting(self, temp_modules_dir, temp_config_path):
        """Test that modules are sorted by order then title"""
        # Create modules with different orders
        for i, (module_id, order, title) in enumerate([
            ("module_c", 100, "C Module"),
            ("module_a", 10, "A Module"),
            ("module_b", 10, "B Module"),
        ]):
            module_dir = temp_modules_dir / module_id
            module_dir.mkdir()
            
            module_json = {
                "id": module_id,
                "title": title,
                "entry": "test.widget:create",
                "order": order,
                "enabled": True
            }
            (module_dir / "module.json").write_text(json.dumps(module_json))
        
        autoloader = ModuleAutoloader(temp_modules_dir, temp_config_path)
        discovered = autoloader.discover_modules()
        
        assert len(discovered) == 3
        # Should be sorted: A (order 10), B (order 10), C (order 100)
        assert discovered[0][1].id == "module_a"
        assert discovered[1][1].id == "module_b"
        assert discovered[2][1].id == "module_c"
    
    def test_load_metadata_invalid_json(self, temp_modules_dir):
        """Test loading metadata with invalid JSON"""
        module_dir = temp_modules_dir / "invalid_module"
        module_dir.mkdir()
        
        (module_dir / "module.json").write_text("invalid json {")
        
        autoloader = ModuleAutoloader(temp_modules_dir, None)
        
        with pytest.raises(ValueError, match="Invalid JSON"):
            autoloader._load_metadata(module_dir / "module.json")
    
    def test_load_metadata_missing_required_fields(self, temp_modules_dir):
        """Test loading metadata without required fields"""
        module_dir = temp_modules_dir / "invalid_module"
        module_dir.mkdir()
        
        # Missing 'title'
        (module_dir / "module.json").write_text(json.dumps({"id": "test"}))
        
        autoloader = ModuleAutoloader(temp_modules_dir, None)
        
        with pytest.raises(ValueError, match="Missing required field 'title'"):
            autoloader._load_metadata(module_dir / "module.json")
    
    def test_load_python_widget_success(self, qapp, temp_modules_dir, temp_config_path):
        """Test loading a Python widget successfully"""
        # Mock a module with create function
        mock_widget = QWidget()
        
        with mock.patch('importlib.import_module') as mock_import:
            mock_module = mock.MagicMock()
            mock_module.create = lambda: mock_widget
            mock_import.return_value = mock_module
            
            autoloader = ModuleAutoloader(temp_modules_dir, temp_config_path)
            widget = autoloader._load_python_widget("test.widget:create")
            
            assert widget is mock_widget
            mock_import.assert_called_once_with("test.widget")
    
    def test_load_python_widget_with_context(self, qapp, temp_modules_dir, temp_config_path):
        """Test loading Python widget with app context"""
        mock_widget = QWidget()
        app_context = object()
        
        with mock.patch('importlib.import_module') as mock_import:
            mock_module = mock.MagicMock()
            mock_module.create = lambda ctx: mock_widget
            mock_import.return_value = mock_module
            
            autoloader = ModuleAutoloader(temp_modules_dir, temp_config_path)
            widget = autoloader._load_python_widget("test.widget:create", app_context)
            
            assert widget is mock_widget
    
    def test_load_python_widget_module_not_found(self, temp_modules_dir, temp_config_path):
        """Test loading widget when module doesn't exist"""
        autoloader = ModuleAutoloader(temp_modules_dir, temp_config_path)
        
        with pytest.raises(ImportError, match="Cannot import module"):
            autoloader._load_python_widget("nonexistent.module:create")
    
    def test_load_python_widget_function_not_found(self, temp_modules_dir, temp_config_path):
        """Test loading widget when function doesn't exist"""
        with mock.patch('importlib.import_module') as mock_import:
            mock_module = mock.MagicMock()
            del mock_module.create  # Remove the attribute
            mock_import.return_value = mock_module
            
            autoloader = ModuleAutoloader(temp_modules_dir, temp_config_path)
            
            with pytest.raises(AttributeError, match="has no attribute"):
                autoloader._load_python_widget("test.widget:create")
    
    def test_get_module_package(self, temp_modules_dir, temp_config_path):
        """Test extracting module package from entry point"""
        autoloader = ModuleAutoloader(temp_modules_dir, temp_config_path)
        
        # Test with colon separator
        package = autoloader._get_module_package("modules.test_module.widget:create")
        assert package == "modules.test_module"
        
        # Test with dot separator
        package = autoloader._get_module_package("modules.test_module.widget.create")
        assert package == "modules.test_module"
    
    def test_lifecycle_hooks_called(self, qapp, temp_modules_dir, temp_config_path):
        """Test that init and unload hooks are called"""
        mock_widget = QWidget()
        app_context = object()
        
        init_called = []
        unload_called = []
        
        def mock_init(ctx):
            init_called.append(ctx)
        
        def mock_unload():
            unload_called.append(True)
        
        with mock.patch('importlib.import_module') as mock_import:
            # Mock widget module
            mock_widget_module = mock.MagicMock()
            mock_widget_module.create = lambda ctx: mock_widget
            
            # Mock package module with hooks
            mock_package = mock.MagicMock()
            mock_package.init = mock_init
            mock_package.unload = mock_unload
            
            def import_side_effect(name):
                if name.endswith('.widget'):
                    return mock_widget_module
                return mock_package
            
            mock_import.side_effect = import_side_effect
            
            # Create module metadata
            module_dir = temp_modules_dir / "test_module"
            module_dir.mkdir()
            
            metadata = ModuleMetadata(
                id="test_module",
                title="Test",
                entry="modules.test_module.widget:create"
            )
            
            # Load module
            autoloader = ModuleAutoloader(temp_modules_dir, temp_config_path)
            loaded = autoloader.load_module(module_dir, metadata, app_context)
            
            assert loaded is not None
            assert len(init_called) == 1
            assert init_called[0] is app_context
            
            # Unload modules
            autoloader.unload_all_modules()
            assert len(unload_called) == 1
    
    def test_error_handling_in_load_module(self, qapp, temp_modules_dir, temp_config_path):
        """Test that errors in load_module don't crash the autoloader"""
        module_dir = temp_modules_dir / "broken_module"
        module_dir.mkdir()
        
        metadata = ModuleMetadata(
            id="broken_module",
            title="Broken",
            entry="nonexistent.module:create"
        )
        
        autoloader = ModuleAutoloader(temp_modules_dir, temp_config_path)
        loaded = autoloader.load_module(module_dir, metadata)
        
        # Should return None on error, not crash
        assert loaded is None
    
    def test_load_all_modules(self, qapp, temp_modules_dir, temp_config_path):
        """Test loading all modules at once"""
        mock_widget = QWidget()
        
        # Create two test modules
        for module_id in ["module_a", "module_b"]:
            module_dir = temp_modules_dir / module_id
            module_dir.mkdir()
            
            module_json = {
                "id": module_id,
                "title": f"Module {module_id}",
                "entry": f"test.{module_id}:create",
                "enabled": True
            }
            (module_dir / "module.json").write_text(json.dumps(module_json))
        
        with mock.patch('importlib.import_module') as mock_import:
            mock_module = mock.MagicMock()
            mock_module.create = lambda *args: QWidget()
            mock_import.return_value = mock_module
            
            autoloader = ModuleAutoloader(temp_modules_dir, temp_config_path)
            loaded = autoloader.load_all_modules()
            
            assert len(loaded) == 2
            assert all(isinstance(m, LoadedModule) for m in loaded)


class TestCreateAutoloader:
    """Tests for create_autoloader factory function"""
    
    def test_create_autoloader_with_defaults(self):
        """Test creating autoloader with default paths"""
        autoloader = create_autoloader()
        
        assert isinstance(autoloader, ModuleAutoloader)
        assert autoloader.modules_dir.name == "modules"
        assert autoloader.config_path.name == "modules.json"
    
    def test_create_autoloader_with_custom_paths(self, temp_modules_dir, temp_config_path):
        """Test creating autoloader with custom paths"""
        autoloader = create_autoloader(temp_modules_dir, temp_config_path)
        
        assert autoloader.modules_dir == temp_modules_dir
        assert autoloader.config_path == temp_config_path


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
