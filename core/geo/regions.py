from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from core.app_paths import locate_data_file

DATASET_FILENAME = "regions_tree_full.json"
ALLOWED_ROOT_IDS = {225, 159, 149}  # Россия, Казахстан, Беларусь

DEFAULT_ROOTS: list[dict[str, Any]] = [
    {
        "value": 225,
        "label": "Россия",
        "children": [
            {"value": 213, "label": "Москва"},
            {"value": 2, "label": "Санкт-Петербург"},
            {"value": 54, "label": "Новосибирск"},
        ],
    },
    {
        "value": 159,
        "label": "Казахстан",
        "children": [
            {"value": 163, "label": "Алматы"},
            {"value": 162, "label": "Астана"},
        ],
    },
    {
        "value": 149,
        "label": "Беларусь",
        "children": [
            {"value": 157, "label": "Минск"},
            {"value": 188, "label": "Гомель"},
        ],
    },
]


@dataclass(frozen=True)
class RegionRow:
    """Flattened representation of a region node."""

    id: int
    name: str
    path: str
    parent_id: Optional[int]
    depth: int
    has_children: bool


def _read_dataset(dataset_path: Path) -> Any:
    try:
        return json.loads(dataset_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return DEFAULT_ROOTS


def _extract_allowed_roots(nodes: Iterable[dict]) -> list[dict]:
    matches: list[dict] = []

    def walk(node: dict) -> None:
        try:
            node_id = int(node.get("value"))
        except (TypeError, ValueError, AttributeError):
            node_id = None

        if node_id in ALLOWED_ROOT_IDS:
            matches.append(node)
            return

        for child in node.get("children") or []:
            walk(child)

    for entry in nodes:
        walk(entry)
    return matches


def _load_raw_tree() -> List[dict]:
    dataset = locate_data_file(DATASET_FILENAME)
    if dataset is None:
        return DEFAULT_ROOTS

    payload = _read_dataset(dataset)
    if isinstance(payload, list):
        roots = payload
    else:
        roots = [payload]

    allowed = _extract_allowed_roots(roots)
    return allowed if allowed else DEFAULT_ROOTS


def _walk_tree(tree: Iterable[dict]) -> List[RegionRow]:
    rows: List[RegionRow] = []

    def walk(node: dict, trail: List[str], depth: int, parent_id: Optional[int]) -> None:
        try:
            node_id = int(node["value"])
        except (KeyError, TypeError, ValueError):
            return
        label = str(node.get("label") or "").strip()
        if not label:
            return

        children = node.get("children") or []
        branch = trail + [label]
        row = RegionRow(
            id=node_id,
            name=label,
            path=" / ".join(branch),
            parent_id=parent_id,
            depth=depth,
            has_children=bool(children),
        )
        rows.append(row)
        for child in children:
            walk(child, branch, depth + 1, node_id)

    for entry in tree:
        walk(entry, [], 0, None)
    return rows


@lru_cache(maxsize=1)
def load_region_tree() -> List[dict]:
    """Return the original nested tree (list of dicts) used in legacy UI."""
    return _load_raw_tree()


@lru_cache(maxsize=1)
def load_region_rows() -> List[Dict[str, Any]]:
    """Return flattened region rows with the same structure as legacy GeoSelector."""
    rows = _walk_tree(load_region_tree())
    return [
        {
            "id": row.id,
            "name": row.name,
            "path": row.path,
            "parentId": row.parent_id,
            "depth": row.depth,
            "hasChildren": row.has_children,
        }
        for row in rows
    ]


__all__ = ["RegionRow", "load_region_tree", "load_region_rows"]
