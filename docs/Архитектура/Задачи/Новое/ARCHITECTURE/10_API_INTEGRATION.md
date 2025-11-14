# 10. API РёРЅС‚РµРіСЂР°С†РёСЏ KeySet-MVP

> **Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ REST API: FastAPI endpoints, WebSocket real-time, РёРЅС‚РµРіСЂР°С†РёСЏ СЃ Yandex**

## рџ“‹ РЎРѕРґРµСЂР¶Р°РЅРёРµ

- [Р¦РµР»СЊ](#С†РµР»СЊ)
- [Р”Р»СЏ РєРѕРіРѕ](#РґР»СЏ-РєРѕРіРѕ)
- [РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹](#СЃРІСЏР·Р°РЅРЅС‹Рµ-РґРѕРєСѓРјРµРЅС‚С‹)
- [РђСЂС…РёС‚РµРєС‚СѓСЂР° API](#Р°СЂС…РёС‚РµРєС‚СѓСЂР°-api)
- [Р”РёР°РіСЂР°РјРјР° СЌРЅРґРїРѕРёРЅС‚РѕРІ](#РґРёР°РіСЂР°РјРјР°-СЌРЅРґРїРѕРёРЅС‚РѕРІ)
- [REST API endpoints](#rest-api-endpoints)
- [РЎРЅРёРїРїРµС‚С‹ РєРѕРґР°](#СЃРЅРёРїРїРµС‚С‹-РєРѕРґР°)
- [РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё](#С‚РёРїРѕРІС‹Рµ-РѕС€РёР±РєРё)
- [Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚](#Р±С‹СЃС‚СЂС‹Р№-СЃС‚Р°СЂС‚)
- [TL;DR](#tldr)
- [Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ](#С‡РµРє-Р»РёСЃС‚-РїСЂРёРјРµРЅРµРЅРёСЏ)

---

## Р¦РµР»СЊ

Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ REST API KeySet-MVP: FastAPI endpoints РґР»СЏ СѓРїСЂР°РІР»РµРЅРёСЏ Р°РєРєР°СѓРЅС‚Р°РјРё, Р·Р°РїСѓСЃРєР° РїР°СЂСЃРёРЅРіР°, РїРѕР»СѓС‡РµРЅРёСЏ РґР°РЅРЅС‹С…, WebSocket РґР»СЏ real-time РѕР±РЅРѕРІР»РµРЅРёР№.

## Р”Р»СЏ РєРѕРіРѕ

- Backend СЂР°Р·СЂР°Р±РѕС‚С‡РёРєРё РґР»СЏ СЂР°СЃС€РёСЂРµРЅРёСЏ API
- Frontend СЂР°Р·СЂР°Р±РѕС‚С‡РёРєРё РґР»СЏ РёРЅС‚РµРіСЂР°С†РёРё
- QA РґР»СЏ С‚РµСЃС‚РёСЂРѕРІР°РЅРёСЏ API
- DevOps РґР»СЏ РЅР°СЃС‚СЂРѕР№РєРё deployment

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [08_FRONTEND_STRUCTURE.md](./08_FRONTEND_STRUCTURE.md) вЂ” frontend РєР»РёРµРЅС‚
- [06_PARSING.md](./06_PARSING.md) вЂ” РїР°СЂСЃРёРЅРі СЃРёСЃС‚РµРјР°
- [11_DATA_FLOW.md](./11_DATA_FLOW.md) вЂ” РїРѕС‚РѕРєРё РґР°РЅРЅС‹С…
- [01_DATABASE.md](./01_DATABASE.md) вЂ” РјРѕРґРµР»Рё РґР°РЅРЅС‹С…

---

## РђСЂС…РёС‚РµРєС‚СѓСЂР° API

```mermaid
graph TD
    A[Frontend Client] -->|HTTP/REST| B[FastAPI Server]
    A -->|WebSocket| C[WS Handler]
    
    B --> D1[/api/accounts]
    B --> D2[/api/data]
    B --> D3[/api/wordstat]
    B --> D4[/api/proxy]
    B --> D5[/api/regions]
    
    D1 --> E[Database Layer]
    D2 --> E
    D3 --> F[Parsing Worker]
    
    F --> G[TurboParser]
    G --> H[Yandex Wordstat API]
    
    C -->|updates| A
    F -->|progress| C
```

---

## Р”РёР°РіСЂР°РјРјР° СЌРЅРґРїРѕРёРЅС‚РѕРІ

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as FastAPI
    participant DB as Database
    participant Worker as Parser Worker
    participant YA as Yandex API
    participant WS as WebSocket
    
    FE->>API: GET /api/accounts
    API->>DB: SELECT * FROM accounts
    DB-->>API: accounts list
    API-->>FE: JSON response
    
    FE->>API: POST /api/wordstat/start
    API->>Worker: init parsing task
    Worker->>YA: fetch frequency data
    Worker->>WS: send progress update
    WS-->>FE: real-time update
    YA-->>Worker: results
    Worker->>DB: INSERT freq_results
    API-->>FE: task_id
```

---

## REST API endpoints

### Accounts Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | РЎРїРёСЃРѕРє РІСЃРµС… Р°РєРєР°СѓРЅС‚РѕРІ |
| POST | `/api/accounts` | РЎРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚ |
| PUT | `/api/accounts/{id}` | РћР±РЅРѕРІРёС‚СЊ Р°РєРєР°СѓРЅС‚ |
| DELETE | `/api/accounts/{id}` | РЈРґР°Р»РёС‚СЊ Р°РєРєР°СѓРЅС‚ |
| POST | `/api/accounts/{id}/test` | РўРµСЃС‚ РїРѕРґРєР»СЋС‡РµРЅРёСЏ |

### Data Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data/phrases` | РЎРїРёСЃРѕРє С„СЂР°Р· |
| GET | `/api/data/groups` | РЎРїРёСЃРѕРє РіСЂСѓРїРї |
| POST | `/api/data/import` | РРјРїРѕСЂС‚ CSV |
| DELETE | `/api/data/phrases/{id}` | РЈРґР°Р»РёС‚СЊ С„СЂР°Р·Сѓ |

### Parsing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wordstat/start` | Р—Р°РїСѓСЃРє РїР°СЂСЃРёРЅРіР° |
| GET | `/api/wordstat/status/{task_id}` | РЎС‚Р°С‚СѓСЃ Р·Р°РґР°С‡Рё |
| POST | `/api/wordstat/stop/{task_id}` | РћСЃС‚Р°РЅРѕРІРёС‚СЊ РїР°СЂСЃРёРЅРі |

### Proxy Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/proxy` | РЎРїРёСЃРѕРє РїСЂРѕРєСЃРё |
| POST | `/api/proxy/test` | РўРµСЃС‚ РїСЂРѕРєСЃРё |

### Geo System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/regions` | РЎРїРёСЃРѕРє СЂРµРіРёРѕРЅРѕРІ |
| GET | `/api/regions/{id}` | Р”РµС‚Р°Р»Рё СЂРµРіРёРѕРЅР° |

---

## РЎРЅРёРїРїРµС‚С‹ РєРѕРґР°

### FastAPI router (accounts)

```python
# С„Р°Р№Р»: backend/routers/accounts.py:138-157
@router.get("", response_model=List[AccountPayload])
def list_accounts() -> List[AccountPayload]:
    """Р’РµСЂРЅСѓС‚СЊ Р°РєРєР°СѓРЅС‚С‹ РёР· СЃС‚Р°СЂРѕР№ Р‘Р” Р±РµР· РјРѕРєРѕРІ."""
    if legacy_accounts is None:
        raise HTTPException(
            status_code=500,
            detail="РЎРµСЂРІРёСЃ Р°РєРєР°СѓРЅС‚РѕРІ РЅРµРґРѕСЃС‚СѓРїРµРЅ. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ РєР°С‚Р°Р»РѕРі keyset/ РїСЂРёСЃСѓС‚СЃС‚РІСѓРµС‚.",
        )
    try:
        rows = legacy_accounts.list_accounts()
    except Exception as exc:
        logger.exception("Failed to load accounts from legacy service: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    payload = [
        _serialize_account(record)
        for record in rows
        if getattr(record, "profile_path", None)
    ]
    return payload
```

### FastAPI router (wordstat)

```python
# С„Р°Р№Р»: backend/routers/wordstat.py:234-275
@router.post("/collect", response_model=list[CollectResponseRow])
def collect_frequency(payload: CollectRequest) -> list[CollectResponseRow]:
    """Р—Р°РїСѓСЃС‚РёС‚СЊ TurboWordstatParser Рё РІРµСЂРЅСѓС‚СЊ С‡Р°СЃС‚РѕС‚С‹."""
    modes = payload.modes.enabled()
    if not any(modes.values()):
        raise HTTPException(status_code=422, detail="Р’С‹Р±РµСЂРёС‚Рµ С…РѕС‚СЏ Р±С‹ РѕРґРёРЅ СЂРµР¶РёРј С‡Р°СЃС‚РѕС‚РЅРѕСЃС‚Рё.")

    _ensure_wordstat_available()
    try:
        results = wordstat_bridge.collect_frequency(
            payload.phrases,
            modes=modes,
            regions=payload.regions,
            profile=payload.profile,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Wordstat parser crashed: %s", exc)
        raise HTTPException(status_code=500, detail="Wordstat parser error") from exc

    region_id = payload.regions[0] if payload.regions else None
    response: list[CollectResponseRow] = []
    for row in results or []:
        response.append(
            CollectResponseRow(
                phrase=str(row.get("phrase") or "").strip(),
                ws=_safe_int(row.get("ws")),
                qws=_safe_int(row.get("qws")),
                bws=_safe_int(row.get("bws")),
                status=str(row.get("status") or "OK"),
                region=region_id,
            )
        )

    if region_id is not None and results:
        try:
            frequency_service.upsert_results(results, region_id)
        except Exception as exc:
            logger.warning("Failed to persist Wordstat results: %s", exc)

    return response
```

### WebSocket handler (РєРѕРЅС†РµРїС‚)

```python
# С„Р°Р№Р»: backend/main.py (РїСЂРёРјРµСЂ WebSocket СЌРЅРґРїРѕРёРЅС‚Р°)
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # РћР±СЂР°Р±РѕС‚РєР° РєРѕРјР°РЅРґ РѕС‚ РєР»РёРµРЅС‚Р°
            await websocket.send_json({"status": "ok", "message": "Command received"})
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
```

### Frontend API client

```typescript
// С„Р°Р№Р»: frontend/src/modules/data/api/data.ts:66-80
export function fetchPhrases(params: FetchPhraseParams = {}): Promise<PhraseListResponse> {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.q) query.set('q', params.q);
  if (params.cursor !== undefined && params.cursor !== null) {
    query.set('cursor', String(params.cursor));
  }
  if (params.sort) query.set('sort', params.sort);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<PhraseListResponse>(`/phrases${suffix}`);
}
```

### Yandex API РёРЅС‚РµРіСЂР°С†РёСЏ

```python
# С„Р°Р№Р»: keyset/workers/turbo_parser_working.py:203-232
async def handle_response(response):
    if "/wordstat/api" not in response.url or response.status != 200:
        return
    data = await _parse_wordstat_json(response)
    if not data:
        return
    _normalize_wordstat_payload(data)

    phrase = fix_mojibake(_extract_phrase_from_request(response) or "")
    items = (data.get("table") or {}).get("items") or []
    if not phrase and items:
        phrase = fix_mojibake(items[0].get("phrase") or "").strip()
    if not phrase:
        return

    freq = data.get("totalValue")
    if freq is None and items:
        freq = items[0].get("count") or items[0].get("value")

    try:
        frequency = int(str(freq).replace(" ", "")) if freq is not None else None
    except Exception:
        frequency = None

    if frequency is None:
        return

    async with results_lock:
        results[phrase] = frequency
    log(f"    [+] {phrase}: {frequency:,}")
```

---

## РџСЂРёРјРµСЂС‹ Р·Р°РїСЂРѕСЃРѕРІ Рё РѕС‚РІРµС‚РѕРІ

### GET /api/accounts - РЎРїРёСЃРѕРє Р°РєРєР°СѓРЅС‚РѕРІ

**Р—Р°РїСЂРѕСЃ:**
```bash
curl -X GET http://localhost:8000/api/accounts \
  -H "Accept: application/json"
```

**РћС‚РІРµС‚ 200 OK:**
```json
[
  {
    "id": 1,
    "email": "user@yandex.ru",
    "password": "",
    "secretAnswer": "РўРµСЃС‚РѕРІР°СЏ Р·Р°РјРµС‚РєР°",
    "profilePath": "C:\\AI\\yandex\\.profiles\\user1",
    "status": "active",
    "proxy": "123.45.67.89:8080",
    "proxyUsername": "proxyuser",
    "proxyPassword": "",
    "proxyType": "http",
    "fingerprint": "no_spoofing",
    "lastLaunch": "2 С‡ РЅР°Р·Р°Рґ",
    "authStatus": "РђРІС‚РѕСЂРёР·РѕРІР°РЅ",
    "lastLogin": "2024-11-10 14:30",
    "profileSize": "вЂ”"
  }
]
```

**РћС‚РІРµС‚ 500 Internal Server Error:**
```json
{
  "detail": "РЎРµСЂРІРёСЃ Р°РєРєР°СѓРЅС‚РѕРІ РЅРµРґРѕСЃС‚СѓРїРµРЅ. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ РєР°С‚Р°Р»РѕРі keyset/ РїСЂРёСЃСѓС‚СЃС‚РІСѓРµС‚."
}
```

### GET /api/wordstat/regions - РЎРїРёСЃРѕРє СЂРµРіРёРѕРЅРѕРІ

**Р—Р°РїСЂРѕСЃ:**
```bash
curl -X GET http://localhost:8000/api/wordstat/regions \
  -H "Accept: application/json"
```

**РћС‚РІРµС‚ 200 OK:**
```json
[
  {
    "id": 225,
    "name": "Р РѕСЃСЃРёСЏ",
    "path": "Р РѕСЃСЃРёСЏ",
    "parentId": null,
    "depth": 0,
    "hasChildren": true
  },
  {
    "id": 213,
    "name": "РњРѕСЃРєРІР°",
    "path": "Р РѕСЃСЃРёСЏ / РњРѕСЃРєРІР°",
    "parentId": 225,
    "depth": 1,
    "hasChildren": true
  },
  {
    "id": 2,
    "name": "РЎР°РЅРєС‚-РџРµС‚РµСЂР±СѓСЂРі",
    "path": "Р РѕСЃСЃРёСЏ / РЎР°РЅРєС‚-РџРµС‚РµСЂР±СѓСЂРі",
    "parentId": 225,
    "depth": 1,
    "hasChildren": false
  }
]
```

### POST /api/wordstat/collect - Р—Р°РїСѓСЃРє РїР°СЂСЃРёРЅРіР°

**Р—Р°РїСЂРѕСЃ:**
```bash
curl -X POST http://localhost:8000/api/wordstat/collect \
  -H "Content-Type: application/json" \
  -d '{
    "phrases": ["РєСѓРїРёС‚СЊ РєРІР°СЂС‚РёСЂСѓ", "Р°СЂРµРЅРґР° РґРѕРјР°"],
    "modes": {"ws": true, "qws": false, "bws": false},
    "regions": [213],
    "profile": null
  }'
```

**РћС‚РІРµС‚ 200 OK:**
```json
[
  {
    "phrase": "РєСѓРїРёС‚СЊ РєРІР°СЂС‚РёСЂСѓ",
    "ws": 125000,
    "qws": null,
    "bws": null,
    "status": "OK",
    "region": 213
  },
  {
    "phrase": "Р°СЂРµРЅРґР° РґРѕРјР°",
    "ws": 89000,
    "qws": null,
    "bws": null,
    "status": "OK",
    "region": 213
  }
]
```

**РћС‚РІРµС‚ 422 Validation Error:**
```json
{
  "detail": [
    {
      "loc": ["body", "phrases"],
      "msg": "РџРµСЂРµРґР°Р№С‚Рµ С…РѕС‚СЏ Р±С‹ РѕРґРЅСѓ С„СЂР°Р·Сѓ РґР»СЏ РїР°СЂСЃРёРЅРіР°.",
      "type": "value_error"
    }
  ]
}
```

**РћС‚РІРµС‚ 502 Bad Gateway:**
```json
{
  "detail": "TurboParser РЅРµ СЃРјРѕРі РїРѕРґРєР»СЋС‡РёС‚СЊСЃСЏ Рє Yandex API. РџСЂРѕРІРµСЂСЊС‚Рµ cookies Рё РїСЂРѕС„РёР»СЊ."
}
```

### GET /api/data/phrases - РџРѕР»СѓС‡РµРЅРёРµ С„СЂР°Р· (СЃ РїР°РіРёРЅР°С†РёРµР№)

**Р—Р°РїСЂРѕСЃ:**
```bash
curl -X GET "http://localhost:8000/api/data/phrases?limit=100&cursor=500&sort=ws_desc" \
  -H "Accept: application/json"
```

**РћС‚РІРµС‚ 200 OK:**
```json
{
  "items": [
    {
      "id": 501,
      "phrase": "РєСѓРїРёС‚СЊ РєРІР°СЂС‚РёСЂСѓ РјРѕСЃРєРІР°",
      "ws": 150000,
      "qws": 120000,
      "bws": 5000,
      "status": "OK",
      "group": "РЅРµРґРІРёР¶РёРјРѕСЃС‚СЊ",
      "region": 213,
      "updatedAt": "2024-11-10T12:00:00Z"
    },
    {
      "id": 502,
      "phrase": "СЃРЅСЏС‚СЊ РєРІР°СЂС‚РёСЂСѓ С†РµРЅС‚СЂ",
      "ws": 98000,
      "qws": 75000,
      "bws": 3200,
      "status": "OK",
      "group": "Р°СЂРµРЅРґР°",
      "region": 213,
      "updatedAt": "2024-11-10T12:05:00Z"
    }
  ],
  "nextCursor": 600,
  "hasMore": true
}
```

**РћС‚РІРµС‚ 404 Not Found:**
```json
{
  "detail": "Cursor not found or expired"
}
```

### POST /api/data/import - РРјРїРѕСЂС‚ CSV

**Р—Р°РїСЂРѕСЃ:**
```bash
curl -X POST http://localhost:8000/api/data/import \
  -H "Content-Type: multipart/form-data" \
  -F "file=@phrases.csv"
```

**РћС‚РІРµС‚ 200 OK:**
```json
{
  "imported": 1500,
  "skipped": 50,
  "duplicates": 25,
  "errors": []
}
```

**РћС‚РІРµС‚ 400 Bad Request:**
```json
{
  "detail": "Invalid CSV format: missing 'phrase' column"
}
```

### GET /api/data/export - Р­РєСЃРїРѕСЂС‚ РІ CSV

**Р—Р°РїСЂРѕСЃ:**
```bash
curl -X GET "http://localhost:8000/api/data/export?format=csv&group=РЅРµРґРІРёР¶РёРјРѕСЃС‚СЊ" \
  -H "Accept: text/csv" \
  -o export.csv
```

**РћС‚РІРµС‚ 200 OK (Content-Type: text/csv):**
```csv
phrase,ws,qws,bws,status,region
РєСѓРїРёС‚СЊ РєРІР°СЂС‚РёСЂСѓ РјРѕСЃРєРІР°,150000,120000,5000,OK,213
СЃРЅСЏС‚СЊ РєРІР°СЂС‚РёСЂСѓ С†РµРЅС‚СЂ,98000,75000,3200,OK,213
```

**РћС‚РІРµС‚ 204 No Content:**
```
(РїСѓСЃС‚РѕР№ РѕС‚РІРµС‚ - РЅРµС‚ РґР°РЅРЅС‹С… РґР»СЏ СЌРєСЃРїРѕСЂС‚Р°)
```

---

## РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё / РљР°Рє С‡РёРЅРёС‚СЊ

### вќЊ РћС€РёР±РєР°: "CORS policy blocking requests"

**РџСЂРёС‡РёРЅР°:** CORS РЅРµ РЅР°СЃС‚СЂРѕРµРЅ РЅР° backend.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. Р’ `backend/main.py` РґРѕР±Р°РІСЊС‚Рµ `CORSMiddleware` СЃ whitelists РґР»СЏ С„СЂРѕРЅС‚РµРЅРґ-URL.
2. Р”Р»СЏ production РїСЂРѕРїРёС€РёС‚Рµ РєРѕРЅРєСЂРµС‚РЅС‹Р№ origin (РЅР°РїСЂРёРјРµСЂ, `https://panel.keyset.ru`).
3. Р•СЃР»Рё С‚СЂРµР±СѓСЋС‚СЃСЏ cookies, РІРєР»СЋС‡РёС‚Рµ `allow_credentials=True` Рё РїСЂРѕРєРѕРЅС‚СЂРѕР»РёСЂСѓР№С‚Рµ, С‡С‚Рѕ proxy РЅРµ РѕС‚Р±СЂР°СЃС‹РІР°РµС‚ Р·Р°РіРѕР»РѕРІРєРё.

### вќЊ РћС€РёР±РєР°: "422 Validation Error"

**РџСЂРёС‡РёРЅР°:** РќРµРєРѕСЂСЂРµРєС‚РЅР°СЏ СЃС‚СЂСѓРєС‚СѓСЂР° request body РёР»Рё РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‚ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. РЎРІРµСЂСЊС‚Рµ JSON СЃ Pydantic-РјРѕРґРµР»СЏРјРё (`CollectRequest`, `AccountPayload`).
2. РќР° С„СЂРѕРЅС‚Рµ РїСЂРѕРІРµСЂСЊС‚Рµ, С‡С‚Рѕ С„РѕСЂРјС‹ РІР°Р»РёРґРёСЂСѓСЋС‚СЃСЏ РґРѕ РѕС‚РїСЂР°РІРєРё (Zod/React Hook Form).
3. Р›РѕРіРёСЂСѓР№С‚Рµ `exc.errors()` Рё РІРѕР·РІСЂР°С‰Р°Р№С‚Рµ РїРѕРЅСЏС‚РЅС‹Рµ СЃРѕРѕР±С‰РµРЅРёСЏ РєР»РёРµРЅС‚Сѓ.

### вќЊ РћС€РёР±РєР°: "WebSocket connection failed"

**РџСЂРёС‡РёРЅР°:** WS endpoint РЅРµРґРѕСЃС‚СѓРїРµРЅ, РЅРµРІРµСЂРЅС‹Р№ URL РёР»Рё Р±Р»РѕРєРёСЂРѕРІРєР° proxy.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ backend Р·Р°РїСѓС‰РµРЅ Рё РјР°СЂС€СЂСѓС‚ `/ws` Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ.
2. РџСЂРѕРІРµСЂСЊС‚Рµ URL: `ws://localhost:8000/ws` (РґР»СЏ production РёСЃРїРѕР»СЊР·СѓР№С‚Рµ `wss://`).
3. Р•СЃР»Рё СЃС‚РѕРёС‚ nginx/Traefik, РїСЂРѕР±СЂРѕСЃСЊС‚Рµ Р·Р°РіРѕР»РѕРІРєРё `Upgrade` Рё `Connection: upgrade`.

---

## Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚

### 1. Р—Р°РїСѓСЃРє FastAPI СЃРµСЂРІРµСЂР°

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 2. РўРµСЃС‚ API endpoint

```bash
curl http://localhost:8000/api/accounts
```

### 3. Frontend API client

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// РџРѕР»СѓС‡РёС‚СЊ Р°РєРєР°СѓРЅС‚С‹
const accounts = await api.get('/accounts');
```

### 4. WebSocket connection

```typescript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

---

## TL;DR

- **FastAPI** вЂ” СЃРѕРІСЂРµРјРµРЅРЅС‹Р№ async framework
- **REST endpoints** вЂ” CRUD РґР»СЏ РІСЃРµС… СЃСѓС‰РЅРѕСЃС‚РµР№
- **WebSocket** вЂ” real-time РѕР±РЅРѕРІР»РµРЅРёСЏ
- **Pydantic** вЂ” РІР°Р»РёРґР°С†РёСЏ request/response
- **CORS** вЂ” РЅР°СЃС‚СЂРѕРµРЅ РґР»СЏ frontend
- **Yandex API** вЂ” РёРЅС‚РµРіСЂР°С†РёСЏ С‡РµСЂРµР· CDP

---

## Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ

- [ ] FastAPI СЃРµСЂРІРµСЂ Р·Р°РїСѓС‰РµРЅ
- [ ] CORS РЅР°СЃС‚СЂРѕРµРЅ РґР»СЏ frontend origin
- [ ] Р’СЃРµ endpoints РѕС‚РґР°СЋС‚ РєРѕСЂСЂРµРєС‚РЅС‹Р№ JSON
- [ ] Pydantic СЃС…РµРјС‹ РІР°Р»РёРґРёСЂСѓСЋС‚ РґР°РЅРЅС‹Рµ
- [ ] WebSocket handler СЂРµР°Р»РёР·РѕРІР°РЅ
- [ ] Error handling РґРѕР±Р°РІР»РµРЅ РІРѕ РІСЃРµ endpoints
- [ ] Р›РѕРіРёСЂРѕРІР°РЅРёРµ Р·Р°РїСЂРѕСЃРѕРІ РЅР°СЃС‚СЂРѕРµРЅРѕ
- [ ] Rate limiting РЅР°СЃС‚СЂРѕРµРЅ (РµСЃР»Рё РЅСѓР¶РµРЅ)
- [ ] API РґРѕРєСѓРјРµРЅС‚Р°С†РёСЏ РґРѕСЃС‚СѓРїРЅР° (/docs)
- [ ] Frontend СѓСЃРїРµС€РЅРѕ РїРѕРґРєР»СЋС‡Р°РµС‚СЃСЏ Рє API

---

**РџРѕСЃР»РµРґРЅРµРµ РѕР±РЅРѕРІР»РµРЅРёРµ:** 2024-11-10

**РЎР»РµРґСѓСЋС‰РёР№ С€Р°Рі:** [11_DATA_FLOW.md](./11_DATA_FLOW.md) вЂ” РџРѕС‚РѕРєРё РґР°РЅРЅС‹С…
