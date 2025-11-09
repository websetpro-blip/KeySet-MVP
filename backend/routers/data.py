from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from keyset.services import frequency as frequency_service


router = APIRouter(prefix="/api/data", tags=["data"])


class PhraseRow(BaseModel):
    id: int
    phrase: str
    ws: int
    qws: int
    bws: int
    region: int
    status: str
    group: Optional[str] = None
    updatedAt: Optional[datetime] = None


class GroupRow(BaseModel):
    id: str
    slug: str
    name: str
    parentId: Optional[str] = None
    color: str
    type: str
    locked: bool = False
    comment: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


@router.get("/phrases", response_model=List[PhraseRow])
def list_phrases(
    *,
    limit: int = Query(500, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None, description="Фильтр по части фразы"),
    status: Optional[str] = Query(None, description="Статус записи (queued/ok/error/etc)"),
) -> List[PhraseRow]:
    status_filter = status if status and status != "all" else None
    raw_rows = frequency_service.list_results(status=status_filter, limit=limit + offset)

    if search:
        needle = search.strip().lower()
        raw_rows = [row for row in raw_rows if needle in (row.get("mask") or "").lower() or needle in (row.get("group") or "").lower()]

    sliced = raw_rows[offset:offset + limit]

    return [
        PhraseRow(
            id=row.get("id", idx),
            phrase=row.get("mask", ""),
            ws=row.get("freq_total", 0) or 0,
            qws=row.get("freq_quotes", 0) or 0,
            bws=row.get("freq_exact", 0) or 0,
            region=row.get("region", 225) or 225,
            status=row.get("status", "queued") or "queued",
            group=row.get("group") or None,
            updatedAt=row.get("updated_at"),
        )
        for idx, row in enumerate(sliced, start=1 + offset)
    ]


@router.get("/groups", response_model=List[GroupRow])
def list_groups() -> List[GroupRow]:
    groups = frequency_service.get_all_groups()
    return [
        GroupRow(
            id=name,
            slug=name,
            name=name,
            parentId=None,
            color="#6366f1",
            type="frequency",
            locked=False,
            comment=None,
            createdAt=None,
            updatedAt=None,
        )
        for name in groups
    ]


class EnqueuePayload(BaseModel):
    phrases: List[str]
    region: int = 225


class IdsPayload(BaseModel):
    ids: List[int]


class GroupUpdatePayload(BaseModel):
    ids: List[int]
    group: Optional[str] = None


@router.post("/phrases/enqueue")
def enqueue_phrases(payload: EnqueuePayload) -> dict:
    normalized = [phrase.strip() for phrase in payload.phrases if phrase and phrase.strip()]
    if not normalized:
        raise HTTPException(status_code=422, detail="Список фраз пуст.")
    inserted = frequency_service.enqueue_masks(normalized, payload.region)
    return {"inserted": inserted}


@router.post("/phrases/delete")
def delete_phrases(payload: IdsPayload) -> dict:
    deleted = frequency_service.delete_results(payload.ids)
    return {"deleted": deleted}


@router.post("/phrases/clear")
def clear_phrases() -> dict:
    frequency_service.clear_results()
    return {"status": "ok"}


@router.post("/phrases/group")
def update_phrase_group(payload: GroupUpdatePayload) -> dict:
    updated = frequency_service.update_group(payload.ids, payload.group)
    return {"updated": updated}
