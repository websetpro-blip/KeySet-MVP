from __future__ import annotations

from datetime import datetime
from typing import List, Optional
import csv
import io

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from keyset.services import frequency as frequency_service


router = APIRouter(prefix="/api/data", tags=["data"])


class PhraseRow(BaseModel):
    id: int
    phrase: str
    ws: int
    wsQuotes: int
    wsExact: int
    freq: int
    freqQuotes: int
    freqExact: int
    region: int
    status: str
    group: Optional[str] = None
    updatedAt: Optional[datetime] = None
    source: str = "Wordstat"


class PhraseListResponse(BaseModel):
    items: List[PhraseRow]
    nextCursor: Optional[int] = None


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


@router.get("/phrases", response_model=PhraseListResponse)
def list_phrases(
    *,
    limit: int = Query(500, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None, description="Фильтр по части фразы"),
    status: Optional[str] = Query(None, description="Статус записи (queued/ok/error/etc)"),
    q: Optional[str] = Query(None, description="Поиск по маске (alias search)"),
    cursor: Optional[int] = Query(None, description="ID для кейсет-пагинации"),
    sort: Optional[str] = Query(None, description="Направление сортировки, например updatedAt:desc"),
) -> PhraseListResponse:
    status_filter = status if status and status != "all" else None
    query = search or q
    sort_field = "updatedAt"
    sort_order = "desc"
    if sort:
        field, _, direction = sort.partition(":")
        if field:
            sort_field = field
        if direction:
            sort_order = direction
    raw_rows = frequency_service.list_results(status=status_filter, limit=(limit + offset + 1))

    if query:
        needle = query.strip().lower()
        raw_rows = [
            row
            for row in raw_rows
            if needle in (row.get("mask") or "").lower()
            or needle in (row.get("group") or "").lower()
        ]

    # apply sort
    reverse = sort_order.lower() != "asc"
    key_fn = (
        (lambda r: (r.get("updated_at"), r.get("id")))
        if sort_field == "updatedAt"
        else (lambda r: (r.get("id"),))
    )
    raw_rows.sort(key=key_fn, reverse=reverse)

    # keyset pagination
    if cursor is not None:
        if reverse:
            raw_rows = [row for row in raw_rows if (row.get("id") or 0) < cursor]
        else:
            raw_rows = [row for row in raw_rows if (row.get("id") or 0) > cursor]

    sliced = raw_rows[offset : offset + limit + 1]
    has_more = len(sliced) > limit
    sliced = sliced[:limit]
    next_cursor = (sliced[-1].get("id") if sliced and has_more else None)

    items = [
        PhraseRow(
            id=row.get("id", idx),
            phrase=row.get("mask", ""),
            ws=row.get("freq_total", 0) or 0,
            wsQuotes=row.get("freq_quotes", 0) or 0,
            wsExact=row.get("freq_exact", 0) or 0,
            freq=row.get("freq_total", 0) or 0,
            freqQuotes=row.get("freq_quotes", 0) or 0,
            freqExact=row.get("freq_exact", 0) or 0,
            region=row.get("region", 225) or 225,
            status=row.get("status", "queued") or "queued",
            group=row.get("group") or None,
            updatedAt=row.get("updated_at"),
        )
        for idx, row in enumerate(sliced, start=1 + offset)
    ]
    return PhraseListResponse(items=items, nextCursor=next_cursor)


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


@router.post("/delete")
def delete_phrases_root(payload: IdsPayload) -> dict:
    return delete_phrases(payload)


@router.get("/export")
def export_phrases(
    *,
    limit: int = Query(5000, ge=1, le=25000),
    status: Optional[str] = Query(None, description="Статус записей для экспорта"),
) -> StreamingResponse:
    """Выгрузить фразы в CSV, чтобы UI мог скачать файл без падения."""
    status_filter = status if status and status != "all" else None
    rows = frequency_service.export_results(limit=limit, status=status_filter)
    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=";")
    writer.writerow(["id", "phrase", "WS", "\"WS\"", "!WS", "group", "region", "status", "updatedAt"])
    for row in rows:
        writer.writerow([
            row.id,
            row.mask,
            row.freq_total,
            getattr(row, "freq_quotes", 0),
            row.freq_exact,
            getattr(row, "group", "") or "",
            row.region,
            row.status,
            row.updated_at.isoformat() if row.updated_at else "",
        ])
    buffer.seek(0)
    headers = {
        "Content-Disposition": "attachment; filename=data_export.csv"
    }
    return StreamingResponse(buffer, media_type="text/csv", headers=headers)
