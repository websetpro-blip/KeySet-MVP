# -*- coding: utf-8 -*-
"""
Module autoloader for KeySet modular architecture.
Scans modules/*/module.json and loads widgets dynamically.
"""
from __future__ import annotations

import importlib
import json
import logging
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Optional

from PySide6.QtCore import QFile, QIODevice
from PySide6.QtUiTools import QUiLoader
from PySide6.QtWidgets import QWidget

logger = logging.getLogger(__name__)


@dataclass
class ModuleMetadata:
    """Module metadata from module.json"""
    id: str
    title: str
    entry: Optional[str] = None
    ui: Optional[str] = None
    icon: Optional[str] = None
    version: str = "1.0.0"
    order: int = 100
    enabled: bool = True
    description: str = ""
    dependencies: list[str] = None

    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = []
        
        # Validate that at least one of entry or ui is provided
        if not self.entry and not self.ui:
            raise ValueError(f"Module {self.id} must have either 'entry' or 'ui' field")


@dataclass
class LoadedModule:
    """A loaded module with its widget and metadata"""
    metadata: ModuleMetadata
    widget: QWidget
    module_dir: Path
    init_hook: Optional[Callable] = None
    unload_hook: Optional[Callable] = None


class ModuleAutoloader:
    """Autoloader for discovering and loading modules from modules/ directory"""
    
    def __init__(self, modules_dir: Path, config_path: Optional[Path] = None):
        """
        Initialize the autoloader.
        
        Args:
            modules_dir: Path to modules directory
            config_path: Path to modules.json config (optional)
        """
        self.modules_dir = modules_dir
        self.config_path = config_path
        self.loaded_modules: list[LoadedModule] = []
        self._disabled_modules: set[str] = set()
        self._load_config()
    
    def _load_config(self) -> None:
        """Load modules configuration from config/modules.json"""
        if not self.config_path or not self.config_path.exists():
            return
        
        try:
            config = json.loads(self.config_path.read_text(encoding="utf-8"))
            self._disabled_modules = set(config.get("disabled", []))
            logger.info(f"Loaded module config, disabled: {self._disabled_modules}")
        except Exception as e:
            logger.warning(f"Failed to load module config: {e}")
    
    def discover_modules(self) -> list[tuple[Path, ModuleMetadata]]:
        """
        Discover all modules in modules/ directory.
        
        Returns:
            List of (module_dir, metadata) tuples sorted by order/title
        """
        if not self.modules_dir.exists():
            logger.warning(f"Modules directory not found: {self.modules_dir}")
            return []
        
        discovered = []
        
        for module_dir in self.modules_dir.iterdir():
            if not module_dir.is_dir():
                continue
            
            # Skip __pycache__ and hidden directories
            if module_dir.name.startswith(('.', '__')):
                continue
            
            module_json = module_dir / "module.json"
            if not module_json.exists():
                logger.debug(f"Skipping {module_dir.name}: no module.json")
                continue
            
            try:
                metadata = self._load_metadata(module_json)
                
                # Check if disabled in config
                if metadata.id in self._disabled_modules:
                    logger.info(f"Module {metadata.id} disabled in config")
                    continue
                
                # Check if disabled in module.json
                if not metadata.enabled:
                    logger.info(f"Module {metadata.id} disabled in module.json")
                    continue
                
                discovered.append((module_dir, metadata))
                logger.info(f"Discovered module: {metadata.id} ({metadata.title})")
                
            except Exception as e:
                logger.error(f"Failed to load metadata for {module_dir.name}: {e}", exc_info=True)
                continue
        
        # Sort by order, then by title
        discovered.sort(key=lambda x: (x[1].order, x[1].title))
        
        return discovered
    
    def _load_metadata(self, module_json: Path) -> ModuleMetadata:
        """Load and validate module metadata from module.json"""
        try:
            data = json.loads(module_json.read_text(encoding="utf-8"))
        except Exception as e:
            raise ValueError(f"Invalid JSON in {module_json}: {e}")
        
        # Validate required fields
        if "id" not in data:
            raise ValueError(f"Missing required field 'id' in {module_json}")
        if "title" not in data:
            raise ValueError(f"Missing required field 'title' in {module_json}")
        
        # Create metadata object (will validate entry/ui)
        return ModuleMetadata(
            id=data["id"],
            title=data["title"],
            entry=data.get("entry"),
            ui=data.get("ui"),
            icon=data.get("icon"),
            version=data.get("version", "1.0.0"),
            order=data.get("order", 100),
            enabled=data.get("enabled", True),
            description=data.get("description", ""),
            dependencies=data.get("dependencies", []),
        )
    
    def load_module(self, module_dir: Path, metadata: ModuleMetadata, app_context: Any = None) -> Optional[LoadedModule]:
        """
        Load a single module and return LoadedModule or None on error.
        
        Args:
            module_dir: Path to module directory
            metadata: Module metadata
            app_context: Application context passed to init hook
        
        Returns:
            LoadedModule instance or None if loading failed
        """
        try:
            # Load widget
            if metadata.ui:
                widget = self._load_ui_widget(module_dir, metadata.ui)
            elif metadata.entry:
                widget = self._load_python_widget(metadata.entry, app_context)
            else:
                raise ValueError(f"Module {metadata.id} has neither entry nor ui")
            
            # Load lifecycle hooks if Python module
            init_hook = None
            unload_hook = None
            
            if metadata.entry:
                try:
                    # Try to import module package to get hooks
                    module_package = self._get_module_package(metadata.entry)
                    if module_package:
                        mod = importlib.import_module(module_package)
                        init_hook = getattr(mod, "init", None)
                        unload_hook = getattr(mod, "unload", None)
                except Exception as e:
                    logger.debug(f"No lifecycle hooks for {metadata.id}: {e}")
            
            loaded = LoadedModule(
                metadata=metadata,
                widget=widget,
                module_dir=module_dir,
                init_hook=init_hook,
                unload_hook=unload_hook,
            )
            
            # Call init hook if available
            if init_hook and callable(init_hook):
                try:
                    init_hook(app_context)
                    logger.info(f"Called init hook for {metadata.id}")
                except Exception as e:
                    logger.error(f"Error in init hook for {metadata.id}: {e}", exc_info=True)
            
            self.loaded_modules.append(loaded)
            logger.info(f"✓ Loaded module: {metadata.id} ({metadata.title})")
            return loaded
            
        except Exception as e:
            logger.error(f"✗ Failed to load module {metadata.id}: {e}", exc_info=True)
            return None
    
    def _load_python_widget(self, entry: str, app_context: Any = None) -> QWidget:
        """
        Load widget from Python entry point.
        
        Entry format: "module.path:function_name" or "module.path.function_name"
        
        Args:
            entry: Entry point string
            app_context: Application context to pass to factory function
        
        Returns:
            QWidget instance
        """
        # Support both ":" and "." as separator
        if ":" in entry:
            module_path, func_name = entry.rsplit(":", 1)
        else:
            module_path, func_name = entry.rsplit(".", 1)
        
        # Import module
        try:
            module = importlib.import_module(module_path)
        except ImportError as e:
            raise ImportError(f"Cannot import module {module_path}: {e}")
        
        # Get factory function
        if not hasattr(module, func_name):
            raise AttributeError(f"Module {module_path} has no attribute {func_name}")
        
        factory = getattr(module, func_name)
        if not callable(factory):
            raise TypeError(f"{module_path}.{func_name} is not callable")
        
        # Call factory with various signatures
        widget = None
        for signature in [
            lambda: factory(app_context),
            lambda: factory(),
        ]:
            try:
                widget = signature()
                break
            except TypeError:
                continue
        
        if widget is None:
            raise RuntimeError(f"Failed to create widget from {entry}")
        
        if not isinstance(widget, QWidget):
            raise TypeError(f"{entry} did not return a QWidget")
        
        return widget
    
    def _load_ui_widget(self, module_dir: Path, ui_path: str) -> QWidget:
        """
        Load widget from .ui file.
        
        Supports both filesystem and bundled resources.
        
        Args:
            module_dir: Path to module directory
            ui_path: Relative path to .ui file within module
        
        Returns:
            QWidget instance loaded from .ui file
        """
        # Try filesystem first
        ui_file_path = module_dir / ui_path
        
        if ui_file_path.exists():
            return self._load_ui_from_path(ui_file_path)
        
        # Try bundled resource (PyInstaller)
        if getattr(sys, 'frozen', False):
            # Running in PyInstaller bundle
            base_path = Path(sys._MEIPASS)  # type: ignore
            bundled_path = base_path / "modules" / module_dir.name / ui_path
            
            if bundled_path.exists():
                return self._load_ui_from_path(bundled_path)
        
        # Try using pkgutil for package data
        try:
            import pkgutil
            module_name = f"modules.{module_dir.name}"
            ui_data = pkgutil.get_data(module_name, ui_path)
            if ui_data:
                return self._load_ui_from_bytes(ui_data)
        except Exception as e:
            logger.debug(f"Could not load UI via pkgutil: {e}")
        
        raise FileNotFoundError(f"UI file not found: {ui_path} in {module_dir}")
    
    def _load_ui_from_path(self, path: Path) -> QWidget:
        """Load .ui file from filesystem path"""
        ui_file = QFile(str(path))
        if not ui_file.open(QIODevice.ReadOnly):
            raise IOError(f"Cannot open UI file: {path}")
        
        loader = QUiLoader()
        widget = loader.load(ui_file)
        ui_file.close()
        
        if not widget:
            raise RuntimeError(f"Failed to load UI from {path}")
        
        return widget
    
    def _load_ui_from_bytes(self, data: bytes) -> QWidget:
        """Load .ui file from bytes (for bundled resources)"""
        from PySide6.QtCore import QBuffer, QByteArray
        
        byte_array = QByteArray(data)
        buffer = QBuffer(byte_array)
        buffer.open(QIODevice.ReadOnly)
        
        loader = QUiLoader()
        widget = loader.load(buffer)
        buffer.close()
        
        if not widget:
            raise RuntimeError("Failed to load UI from bytes")
        
        return widget
    
    def _get_module_package(self, entry: str) -> Optional[str]:
        """
        Extract module package name from entry point.
        
        E.g., "modules.accounts_v2.widget.create" -> "modules.accounts_v2"
        """
        if ":" in entry:
            module_path, _ = entry.rsplit(":", 1)
        else:
            module_path, _ = entry.rsplit(".", 1)
        
        # Get the top-level module package (modules.xxx)
        parts = module_path.split(".")
        if len(parts) >= 2:
            return ".".join(parts[:2])
        return None
    
    def load_all_modules(self, app_context: Any = None) -> list[LoadedModule]:
        """
        Discover and load all modules.
        
        Args:
            app_context: Application context to pass to modules
        
        Returns:
            List of successfully loaded modules
        """
        discovered = self.discover_modules()
        loaded = []
        
        for module_dir, metadata in discovered:
            result = self.load_module(module_dir, metadata, app_context)
            if result:
                loaded.append(result)
        
        logger.info(f"Loaded {len(loaded)}/{len(discovered)} modules")
        return loaded
    
    def unload_all_modules(self) -> None:
        """Unload all modules and call their unload hooks"""
        for module in self.loaded_modules:
            if module.unload_hook and callable(module.unload_hook):
                try:
                    module.unload_hook()
                    logger.info(f"Called unload hook for {module.metadata.id}")
                except Exception as e:
                    logger.error(f"Error in unload hook for {module.metadata.id}: {e}", exc_info=True)
        
        self.loaded_modules.clear()
        logger.info("Unloaded all modules")


def create_autoloader(modules_dir: Optional[Path] = None, config_path: Optional[Path] = None) -> ModuleAutoloader:
    """
    Factory function to create ModuleAutoloader with default paths.
    
    Args:
        modules_dir: Path to modules directory (default: project_root/modules)
        config_path: Path to modules.json config (default: project_root/config/modules.json)
    
    Returns:
        ModuleAutoloader instance
    """
    if modules_dir is None:
        # Detect project root
        current_file = Path(__file__).resolve()
        project_root = current_file.parent.parent
        modules_dir = project_root / "modules"
    
    if config_path is None:
        project_root = modules_dir.parent
        config_path = project_root / "config" / "modules.json"
    
    return ModuleAutoloader(modules_dir, config_path)
