# 11. РџРѕС‚РѕРєРё РґР°РЅРЅС‹С… KeySet-MVP

> **Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ Р¶РёР·РЅРµРЅРЅРѕРіРѕ С†РёРєР»Р° РґР°РЅРЅС‹С…: UI в†’ API в†’ Parser в†’ DB в†’ UI**

## рџ“‹ РЎРѕРґРµСЂР¶Р°РЅРёРµ

- [Р¦РµР»СЊ](#С†РµР»СЊ)
- [Р”Р»СЏ РєРѕРіРѕ](#РґР»СЏ-РєРѕРіРѕ)
- [РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹](#СЃРІСЏР·Р°РЅРЅС‹Рµ-РґРѕРєСѓРјРµРЅС‚С‹)
- [РћР±С‰Р°СЏ СЃС…РµРјР° РїРѕС‚РѕРєР° РґР°РЅРЅС‹С…](#РѕР±С‰Р°СЏ-СЃС…РµРјР°-РїРѕС‚РѕРєР°-РґР°РЅРЅС‹С…)
- [Р”РёР°РіСЂР°РјРјР° РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕСЃС‚Рё](#РґРёР°РіСЂР°РјРјР°-РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕСЃС‚Рё)
- [РћСЃРЅРѕРІРЅС‹Рµ СЃС†РµРЅР°СЂРёРё](#РѕСЃРЅРѕРІРЅС‹Рµ-СЃС†РµРЅР°СЂРёРё)
- [РЎРЅРёРїРїРµС‚С‹ РєРѕРґР°](#СЃРЅРёРїРїРµС‚С‹-РєРѕРґР°)
- [РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё](#С‚РёРїРѕРІС‹Рµ-РѕС€РёР±РєРё)
- [Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚](#Р±С‹СЃС‚СЂС‹Р№-СЃС‚Р°СЂС‚)
- [TL;DR](#tldr)
- [Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ](#С‡РµРє-Р»РёСЃС‚-РїСЂРёРјРµРЅРµРЅРёСЏ)

---

## Р¦РµР»СЊ

Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ РїРѕС‚РѕРєРѕРІ РґР°РЅРЅС‹С… KeySet-MVP: РѕС‚ РІРІРѕРґР° С„СЂР°Р· РІ UI РґРѕ СЃРѕС…СЂР°РЅРµРЅРёСЏ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ РІ Р‘Р” Рё РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ РІ Р°РЅР°Р»РёС‚РёРєРµ.

## Р”Р»СЏ РєРѕРіРѕ

- Tech Lead РґР»СЏ РѕС†РµРЅРєРё end-to-end РїРѕС‚РѕРєР°
- Backend Рё frontend СЂР°Р·СЂР°Р±РѕС‚С‡РёРєРё
- QA РґР»СЏ С‚РµСЃС‚РёСЂРѕРІР°РЅРёСЏ СЃРєРІРѕР·РЅС‹С… СЃС†РµРЅР°СЂРёРµРІ
- Data analysts РґР»СЏ РїРѕРЅРёРјР°РЅРёСЏ РёСЃС‚РѕС‡РЅРёРєРѕРІ РґР°РЅРЅС‹С…

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [06_PARSING.md](./06_PARSING.md) вЂ” РїР°СЂСЃРёРЅРі СЃРёСЃС‚РµРјР°
- [10_API_INTEGRATION.md](./10_API_INTEGRATION.md) вЂ” API РёРЅС‚РµРіСЂР°С†РёСЏ
- [01_DATABASE.md](./01_DATABASE.md) вЂ” СЃС‚СЂСѓРєС‚СѓСЂР° Р‘Р”
- [09_TABS_OVERVIEW.md](./09_TABS_OVERVIEW.md) вЂ” UI РјРѕРґСѓР»Рё

---

## РћР±С‰Р°СЏ СЃС…РµРјР° РїРѕС‚РѕРєР° РґР°РЅРЅС‹С…

```mermaid
graph TD
    A[Frontend UI] -->|GraphQL/REST| B[API Layer]
    B -->|Commands| C[Task Queue]
    C -->|Tasks| D[Parsing Workers]
    D -->|CDP Requests| E[Yandex Wordstat]
    E -->|Responses| D
    D -->|Results| F[Database]
    F -->|Queries| G[Analytics Engine]
    G -->|Data| A
    F -->|Exports| H[CSV/XLSX]
```

---

## Р”РёР°РіСЂР°РјРјР° РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕСЃС‚Рё

```mermaid
sequenceDiagram
    participant UI as Frontend UI
    participant API as API Server
    participant Worker as Parsing Worker
    participant DB as Database
    participant WS as WebSocket
    participant YA as Yandex API
    
    UI->>API: POST /api/wordstat/start (phrases, region_id)
    API->>Worker: enqueue task
    Worker->>YA: fetch frequency
    YA-->>Worker: frequency JSON
    Worker->>DB: save freq_results
    Worker->>WS: send progress update
    WS-->>UI: real-time updates
    UI->>API: GET /api/data/phrases
    API->>DB: query results
    DB-->>API: rows
    API-->>UI: table data
```

---

## РћСЃРЅРѕРІРЅС‹Рµ СЃС†РµРЅР°СЂРёРё

### 1. Р—Р°РїСѓСЃРє РїР°СЂСЃРёРЅРіР°
- РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РІРІРѕРґРёС‚ СЃРїРёСЃРѕРє С„СЂР°Р·
- Р’С‹Р±РёСЂР°РµС‚ СЂРµРіРёРѕРЅ Рё Р°РєРєР°СѓРЅС‚С‹
- UI РѕС‚РїСЂР°РІР»СЏРµС‚ Р·Р°РїСЂРѕСЃ `/api/wordstat/start`
- API СЃРѕР·РґР°С‘С‚ Р·Р°РґР°С‡Сѓ РІ РѕС‡РµСЂРµРґРё
- Worker СЂР°СЃРїСЂРµРґРµР»СЏРµС‚ С„СЂР°Р·С‹ РїРѕ Р°РєРєР°СѓРЅС‚Р°Рј

### 2. РћР±СЂР°Р±РѕС‚РєР° СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ
- Worker РїРѕР»СѓС‡Р°РµС‚ РѕС‚РІРµС‚С‹ РѕС‚ Yandex API
- РџР°СЂСЃРёС‚ JSON Рё СЃРѕС…СЂР°РЅСЏРµС‚ РґР°РЅРЅС‹Рµ РІ С‚Р°Р±Р»РёС†Сѓ `freq_results`
- РћС‚РїСЂР°РІР»СЏРµС‚ РѕР±РЅРѕРІР»РµРЅРёСЏ С‡РµСЂРµР· WebSocket
- API РїСЂРµРґРѕСЃС‚Р°РІР»СЏРµС‚ СЂРµР·СѓР»СЊС‚Р°С‚С‹ С‡РµСЂРµР· `/api/data/phrases`

### 3. РђРЅР°Р»РёС‚РёРєР°
- Analytics Tab Р·Р°РїСЂР°С€РёРІР°РµС‚ Р°РіСЂРµРіРёСЂРѕРІР°РЅРЅС‹Рµ РґР°РЅРЅС‹Рµ
- РСЃРїРѕР»СЊР·СѓРµС‚ РїРѕРєР°Р·Р°С‚РµР»Рё РґР»СЏ РіСЂР°С„РёРєРѕРІ Рё РѕС‚С‡С‘С‚РѕРІ

---

## РЎРЅРёРїРїРµС‚С‹ РєРѕРґР°

### РџРѕСЃС‚Р°РЅРѕРІРєР° Р·Р°РґР°С‡Рё РїР°СЂСЃРёРЅРіР°

```python
# С„Р°Р№Р»: keyset/services/multiparser_manager.py:375-397
def create_task(
    self, 
    profile_email: str,
    profile_path: str,
    proxy_uri: Optional[str],
    phrases: List[str]
) -> ParsingTask:
    """РЎРѕР·РґР°С‚СЊ РЅРѕРІСѓСЋ Р·Р°РґР°С‡Сѓ РїР°СЂСЃРёРЅРіР°"""
    task_id = f"{profile_email}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    task = ParsingTask(
        task_id=task_id,
        profile_email=profile_email,
        profile_path=Path(profile_path),
        proxy_uri=proxy_uri,
        phrases=phrases
    )
    
    with self._lock:
        self.tasks[task_id] = task
        
    logger.info(f"Created task {task_id} for {profile_email} with {len(phrases)} phrases")
    return task
```

### РЎРѕС…СЂР°РЅРµРЅРёРµ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ РІ Р‘Р”

```python
# С„Р°Р№Р»: backend/db.py:110-138
class FrequencyResult(Base):
    """Frequency parsing result model"""

    __tablename__ = "freq_results"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Phrase and region
    mask = Column(String(500), nullable=False, index=True)
    region = Column(Integer, nullable=True, index=True)

    # Frequencies
    freq_total = Column(Integer, default=0)  # Broad match (WS)
    freq_quotes = Column(Integer, default=0)  # Phrase match ("WS")
    freq_exact = Column(Integer, default=0)  # Exact match (!WS)

    # Metadata
    group = Column(String(255))  # Group for organization
    status = Column(String(50), default="queued")
    attempts = Column(Integer, default=0)
    error = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint("mask", "region", name="uq_mask_region"),)
```

### WebSocket РѕР±РЅРѕРІР»РµРЅРёРµ (РєРѕРЅС†РµРїС‚)

```python
# С„Р°Р№Р»: backend/main.py (РїСЂРёРјРµСЂ РѕС‚РїСЂР°РІРєРё СЃРѕРѕР±С‰РµРЅРёСЏ)
async def send_parsing_update(websocket: WebSocket, task_id: str, progress: int):
    """РћС‚РїСЂР°РІРёС‚СЊ РѕР±РЅРѕРІР»РµРЅРёРµ СЃС‚Р°С‚СѓСЃР° РїР°СЂСЃРёРЅРіР° С‡РµСЂРµР· WebSocket"""
    message = {
        "type": "parsing_progress",
        "task_id": task_id,
        "progress": progress,
        "timestamp": datetime.utcnow().isoformat()
    }
    await websocket.send_json(message)
```

### Frontend Р·Р°РїСЂРѕСЃ РґР°РЅРЅС‹С…

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

---

## РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё / РљР°Рє С‡РёРЅРёС‚СЊ

### вќЊ РћС€РёР±РєР°: "Data not syncing between tabs"

**РџСЂРёС‡РёРЅР°:** РќРµС‚ РїРѕРґРїРёСЃРєРё РЅР° WebSocket РёР»Рё Zustand store РЅРµ РѕР±РЅРѕРІР»СЏРµС‚СЃСЏ.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕРґРєР»СЋС‡РµРЅРёРµ Рє `ws://localhost:8000/ws` Рё РѕР±СЂР°Р±Р°С‚С‹РІР°Р№С‚Рµ СЃРѕР±С‹С‚РёСЏ РІ `useEffect`.
2. РћР±РЅРѕРІР»СЏР№С‚Рµ store С‡РµСЂРµР· `useStore.setState` РІРЅСѓС‚СЂРё `ws.onmessage`.
3. Р”РѕР±Р°РІСЊС‚Рµ fallback: СЂР°Р· РІ 30 СЃРµРє Р·Р°РїСЂР°С€РёРІР°Р№С‚Рµ `/api/data/phrases` РµСЃР»Рё WebSocket РѕС‚РєР»СЋС‡С‘РЅ.

### вќЊ РћС€РёР±РєР°: "Stale data in analytics"

**РџСЂРёС‡РёРЅР°:** РљСЌС€РёСЂРѕРІР°РЅРёРµ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ Р±РµР· РёРЅРІР°Р»РёРґРёСЂРѕРІР°РЅРёСЏ.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. Р”РѕР±Р°РІСЊС‚Рµ timestamp РїРѕСЃР»РµРґРЅРµР№ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё Рё РїСЂРѕРІРµСЂСЏР№С‚Рµ РµРіРѕ РїРµСЂРµРґ РѕС‚РѕР±СЂР°Р¶РµРЅРёРµРј РіСЂР°С„РёРєРѕРІ.
2. РЎР±СЂР°СЃС‹РІР°Р№С‚Рµ memoized РґР°РЅРЅС‹Рµ РІ Analytics Module РїСЂРё РЅРѕРІРѕРј СЃРѕР±С‹С‚РёРё WS.
3. Р’ backend РґРѕР±Р°РІСЊС‚Рµ ETag/Last-Modified Р·Р°РіРѕР»РѕРІРєРё РґР»СЏ Р°РіСЂРµРіРёСЂРѕРІР°РЅРЅС‹С… СЌРЅРґРїРѕРёРЅС‚РѕРІ.

### вќЊ РћС€РёР±РєР°: "Missing region_id in results"

**РџСЂРёС‡РёРЅР°:** `region_id` РЅРµ РїРµСЂРµРґР°РЅ РґРѕ РїР°СЂСЃРёРЅРіР°.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. РќР° С„СЂРѕРЅС‚Рµ РґРµР»Р°Р№С‚Рµ `ensureRegion()` Рё Р·Р°РїСЂРµС‰Р°Р№С‚Рµ Р·Р°РїСѓСЃРє Р±РµР· region.
2. Р’ API С‚СЂРµР±СѓР№С‚Рµ `regions` РІ `CollectRequest` (РІР°Р»РёРґР°С‚РѕСЂ СѓР¶Рµ РїСЂРёРІРѕРґРёР» Рє [225]).
3. Р’ worker Р»РѕРіРёСЂСѓР№С‚Рµ payload Р·Р°РґР°С‡Рё Рё Р·Р°РІРµСЂРЅРёС‚Рµ СЃРѕС…СЂР°РЅРµРЅРёРµ РІ assert: `assert region_id is not None`.

---

## Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚

### 1. РўСЂР°СЃСЃРёСЂРѕРІРєР° РїРѕС‚РѕРєР° РґР°РЅРЅС‹С…

```mermaid
graph LR
    UI[UI] --> API[API]
    API --> Worker[Worker]
    Worker --> DB[DB]
    DB --> UI
```

### 2. РџСЂРѕРІРµСЂРєР° РґР°РЅРЅС‹С… РІ Р‘Р”

```sql
SELECT phrase, shows, region_id
FROM freq_results
ORDER BY created_at DESC
LIMIT 20;
```

### 3. РџРѕРґРїРёСЃРєР° РЅР° WebSocket

```typescript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateDataStore(data);
};
```

---

## TL;DR

- **UI в†’ API в†’ Worker в†’ DB в†’ UI** вЂ” РѕСЃРЅРѕРІРЅРѕР№ С†РёРєР» РґР°РЅРЅС‹С…
- **WebSocket** вЂ” real-time РѕР±РЅРѕРІР»РµРЅРёСЏ СЃС‚Р°С‚СѓСЃРѕРІ
- **freq_results** вЂ” РѕСЃРЅРѕРІРЅР°СЏ С‚Р°Р±Р»РёС†Р° СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ
- **region_id** вЂ” РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ РїР°СЂР°РјРµС‚СЂ РґР»СЏ РІСЃРµС… Р·Р°РїРёСЃРµР№
- **Zustand** вЂ” СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ РґР°РЅРЅС‹С… РјРµР¶РґСѓ РІРєР»Р°РґРєР°РјРё

---

## Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ

- [ ] UI РєРѕСЂСЂРµРєС‚РЅРѕ РѕС‚РїСЂР°РІР»СЏРµС‚ РґР°РЅРЅС‹Рµ РЅР° API
- [ ] API РІР°Р»РёРґРёСЂСѓРµС‚ payload Р·Р°РґР°С‡Рё
- [ ] Worker СЃРѕС…СЂР°РЅСЏРµС‚ СЂРµР·СѓР»СЊС‚Р°С‚С‹ РІ Р‘Р”
- [ ] WebSocket РѕР±РЅРѕРІР»РµРЅРёСЏ РґРѕС…РѕРґСЏС‚ РґРѕ UI
- [ ] Analytics РїРѕР»СѓС‡Р°РµС‚ Р°РєС‚СѓР°Р»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ
- [ ] region_id РїСЂРёСЃСѓС‚СЃС‚РІСѓРµС‚ РІ РєР°Р¶РґРѕР№ Р·Р°РїРёСЃРё
- [ ] РћС€РёР±РєРё Р»РѕРіРёСЂСѓСЋС‚СЃСЏ РЅР° РІСЃРµС… СЌС‚Р°РїР°С…
- [ ] РўРµСЃС‚С‹ РїРѕРєСЂС‹РІР°СЋС‚ РІРµСЃСЊ РїРѕС‚РѕРє РґР°РЅРЅС‹С…
- [ ] Р­РєСЃРїРѕСЂС‚РёСЂСѓРµС‚ РґР°РЅРЅС‹Рµ РІ CSV/XLSX
- [ ] РњРµС‚СЂРёРєРё РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚Рё СЃРѕР±РёСЂР°СЋС‚СЃСЏ

---

**РџРѕСЃР»РµРґРЅРµРµ РѕР±РЅРѕРІР»РµРЅРёРµ:** 2024-11-10

**РЎР»РµРґСѓСЋС‰РёР№ С€Р°Рі:** [12_PRODUCTION_WINDOWS_BUILD.md](./12_PRODUCTION_WINDOWS_BUILD.md) вЂ” Production СЃР±РѕСЂРєР° Windows
