from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence, Optional
import json

from services import accounts as account_service
from services import frequency as frequency_service
from services.chrome_launcher import ChromeLauncher
from services.multiparser_manager import MultiParserManager

logger = logging.getLogger(__name__)

# Статусы аккаунтов, которые считаются рабочими для мультипарсера.
# Важно: 'error' здесь тоже считаем допустимым, чтобы аккаунты
# не "выпадали" из пула из‑за временных сбоев.
WORKING_STATUSES = {"ok", "cooldown", "error"}


@dataclass(slots=True)
class _ProfileSpec:
    email: str
    profile_path: Path
    proxy: str | None
    fingerprint: str | None = None


def _extract_fingerprint(account) -> Optional[str]:
    """
    Достать пресет fingerprint из account.notes (если там лежит JSON).

    Используем ту же идею, что и на фронтенде:
    extras = JSON(notes); extras.fingerprint -> строковый пресет.
    """
    raw_notes = getattr(account, "notes", None) or ""
    if not raw_notes:
        return None
    try:
        payload = json.loads(raw_notes)
    except Exception:
        return None
    if isinstance(payload, dict):
        value = payload.get("fingerprint")
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _normalize_phrases(phrases: Iterable[str]) -> list[str]:
    cleaned: list[str] = []
    seen: set[str] = set()
    for phrase in phrases:
        candidate = (phrase or "").strip()
        if not candidate or candidate in seen:
            continue
        seen.add(candidate)
        cleaned.append(candidate)
    return cleaned


def _normalize_regions(regions: Sequence[int]) -> list[int]:
    normalized: list[int] = []
    seen: set[int] = set()
    for region in regions:
        try:
            region_id = int(region)
        except (TypeError, ValueError):
            continue
        if region_id in seen:
            continue
        seen.add(region_id)
        normalized.append(region_id)
    if not normalized:
        normalized = [225]
    return normalized


def _split_phrases(phrases: list[str], slots: int) -> list[list[str]]:
    if slots <= 0:
        return []
    total = len(phrases)
    if total == 0:
        return [[] for _ in range(slots)]
    base = total // slots
    remainder = total % slots
    batches: list[list[str]] = []
    start = 0
    for idx in range(slots):
        extra = 1 if idx < remainder else 0
        end = start + base + extra
        batches.append(phrases[start:end])
        start = end
    return batches


def _load_profiles() -> list[_ProfileSpec]:
    candidates: list[_ProfileSpec] = []
    accounts = account_service.list_accounts()
    for account in accounts:
        status = getattr(account, "status", "ok") or "ok"
        if status not in WORKING_STATUSES:
            continue
        proxy_value = getattr(account, "proxy", None)
        if not proxy_value:
            logger.warning("Account %s skipped: proxy is not configured", account.name)
            continue
        profile_path = ChromeLauncher._normalise_profile_path(account.profile_path, account.name)
        if not profile_path.exists():
            logger.warning("Profile path %s for %s not found, skipping", profile_path, account.name)
            continue
        fingerprint = _extract_fingerprint(account)
        candidates.append(
            _ProfileSpec(
                email=account.name,
                profile_path=profile_path,
                proxy=proxy_value,
                fingerprint=fingerprint,
            )
        )
    return candidates


def _format_rows(
    phrases: list[str],
    merged: dict[str, dict],
    region_id: int,
) -> list[dict]:
    rows: list[dict] = []
    for phrase in phrases:
        bucket = merged.get(phrase, {})
        total = bucket.get("total", {})
        ws = int(total.get("ws", 0)) if isinstance(total, dict) else 0
        qws = int(total.get("qws", 0)) if isinstance(total, dict) else 0
        bws = int(total.get("bws", 0)) if isinstance(total, dict) else 0
        status = "OK" if any((ws, qws, bws)) else "no_data"
        rows.append(
            {
                "phrase": phrase,
                "ws": ws,
                "qws": qws,
                "bws": bws,
                "status": status,
                "region": region_id,
            }
        )
    return rows


def collect_frequency_multi(
    phrases: list[str],
    *,
    regions: list[int],
) -> list[dict]:
    normalized_phrases = _normalize_phrases(phrases)
    if not normalized_phrases:
        return []

    region_plan = _normalize_regions(regions)
    profiles = _load_profiles()
    if not profiles:
        raise RuntimeError("Не найдены рабочие аккаунты. Добавьте аккаунты во вкладке «Аккаунты».")

    rows: list[dict] = []
    for region_id in region_plan:
        max_workers = len(profiles)
        manager = MultiParserManager(max_workers=max_workers)
        try:
            batches = _split_phrases(normalized_phrases, max_workers)
            profile_payload: list[dict] = []
            for profile, batch in zip(profiles, batches):
                if not batch:
                    continue
                profile_payload.append(
                    {
                        "email": profile.email,
                        "profile_path": str(profile.profile_path),
                        "proxy": profile.proxy,
                        "fingerprint": profile.fingerprint,
                        "phrases": batch,
                        "region_id": region_id,
                    }
                )
            if not profile_payload:
                logger.warning("No phrases scheduled for region %s", region_id)
                continue

            task_ids = manager.submit_tasks(profile_payload, None)
            completed = manager.wait_for_completion(task_ids, timeout=3600)
            if not completed:
                logger.warning("Multiparser timeout for region %s", region_id)
            merged = manager.merge_results(task_ids)
            formatted = _format_rows(normalized_phrases, merged, region_id)
            rows.extend(formatted)
            if frequency_service:
                try:
                    frequency_service.upsert_results(formatted, region_id)
                except Exception as exc:  # pragma: no cover - diagnostics
                    logger.warning("Failed to persist Wordstat results for region %s: %s", region_id, exc)
        finally:
            manager.stop()

    return rows


__all__ = ["collect_frequency_multi"]
