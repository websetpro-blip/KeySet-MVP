"""Playwright configuration for portable build."""
import os
from .app_paths import BROWSERS, PROFILES

# Set Playwright browsers path to portable runtime/browsers directory
os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(BROWSERS)


def get_profile_dir(account_id: int) -> str:
    """Get profile directory for a specific account."""
    profile_path = PROFILES / f"acc_{account_id}"
    profile_path.mkdir(parents=True, exist_ok=True)
    return str(profile_path)


__all__ = ["get_profile_dir"]
