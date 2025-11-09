# -*- coding: utf-8 -*-
"""
Demo module with lifecycle hooks.
"""
import logging

logger = logging.getLogger(__name__)


def init(app_context):
    """
    Lifecycle hook called after module widget is created.
    
    Args:
        app_context: The main window instance
    """
    logger.info("Demo hooks module: init() called")
    if hasattr(app_context, 'log_event'):
        app_context.log_event("Demo hooks module initialized!", level="INFO")


def unload():
    """
    Lifecycle hook called when application is closing.
    """
    logger.info("Demo hooks module: unload() called")
