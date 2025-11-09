# -*- coding: utf-8 -*-
"""
Demo module widget with lifecycle hooks.
"""
from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel, QPushButton, QGroupBox


def create(parent=None):
    """
    Factory function to create the demo widget.
    
    Args:
        parent: Parent widget (typically MainWindow)
    
    Returns:
        QWidget instance
    """
    widget = QWidget(parent)
    
    layout = QVBoxLayout(widget)
    layout.setContentsMargins(24, 24, 24, 24)
    layout.setSpacing(16)
    
    # Group box card
    group = QGroupBox("🎯 Demo Hooks Module")
    group.setProperty("card", True)
    group_layout = QVBoxLayout(group)
    group_layout.setContentsMargins(24, 24, 24, 24)
    group_layout.setSpacing(16)
    
    # Info label
    label = QLabel(
        "This module demonstrates lifecycle hooks.\n"
        "Check the logs to see init() and unload() calls!"
    )
    label.setWordWrap(True)
    group_layout.addWidget(label)
    
    # Test button
    button = QPushButton("🔔 Test Button")
    button.setProperty("secondary", True)
    button.clicked.connect(lambda: parent.log_event("Demo button clicked!") if parent else None)
    group_layout.addWidget(button)
    
    group_layout.addStretch()
    
    layout.addWidget(group)
    layout.addStretch()
    
    return widget
