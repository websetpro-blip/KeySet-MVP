# 06. РџР°СЂСЃРёРЅРі СЃРёСЃС‚РµРјС‹ KeySet-MVP

> **Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ Р°СЂС…РёС‚РµРєС‚СѓСЂС‹ РїР°СЂСЃРёРЅРіР° Yandex Wordstat С‡РµСЂРµР· CDP Рё Playwright**

## рџ“‹ РЎРѕРґРµСЂР¶Р°РЅРёРµ

- [Р¦РµР»СЊ](#С†РµР»СЊ)
- [Р”Р»СЏ РєРѕРіРѕ](#РґР»СЏ-РєРѕРіРѕ)
- [РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹](#СЃРІСЏР·Р°РЅРЅС‹Рµ-РґРѕРєСѓРјРµРЅС‚С‹)
- [РђСЂС…РёС‚РµРєС‚СѓСЂР° РїР°СЂСЃРµСЂР°](#Р°СЂС…РёС‚РµРєС‚СѓСЂР°-РїР°СЂСЃРµСЂР°)
- [Р”РёР°РіСЂР°РјРјР° РїРѕС‚РѕРєР°](#РґРёР°РіСЂР°РјРјР°-РїРѕС‚РѕРєР°)
- [РљР»СЋС‡РµРІС‹Рµ РєРѕРјРїРѕРЅРµРЅС‚С‹](#РєР»СЋС‡РµРІС‹Рµ-РєРѕРјРїРѕРЅРµРЅС‚С‹)
- [РЎРЅРёРїРїРµС‚С‹ РєРѕРґР°](#СЃРЅРёРїРїРµС‚С‹-РєРѕРґР°)
- [РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё](#С‚РёРїРѕРІС‹Рµ-РѕС€РёР±РєРё)
- [Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚](#Р±С‹СЃС‚СЂС‹Р№-СЃС‚Р°СЂС‚)
- [TL;DR](#tldr)
- [Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ](#С‡РµРє-Р»РёСЃС‚-РїСЂРёРјРµРЅРµРЅРёСЏ)

---

## Р¦РµР»СЊ

Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ СЃРёСЃС‚РµРјС‹ РїР°СЂСЃРёРЅРіР° KeySet-MVP: TurboParser СЃ CDP РїРµСЂРµС…РІР°С‚РѕРј, РїР°СЂР°Р»Р»РµР»СЊРЅР°СЏ РѕР±СЂР°Р±РѕС‚РєР° 10 РІРєР»Р°РґРѕРє РЅР° Р°РєРєР°СѓРЅС‚, N Р°РєРєР°СѓРЅС‚РѕРІ РѕРґРЅРѕРІСЂРµРјРµРЅРЅРѕ, РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ ~526 С„СЂР°Р·/РјРёРЅСѓС‚Сѓ.

## Р”Р»СЏ РєРѕРіРѕ

- Backend СЂР°Р·СЂР°Р±РѕС‚С‡РёРєРё, СЂР°Р±РѕС‚Р°СЋС‰РёРµ СЃ РїР°СЂСЃРµСЂРѕРј
- DevOps РёРЅР¶РµРЅРµСЂС‹ РґР»СЏ РЅР°СЃС‚СЂРѕР№РєРё РѕРєСЂСѓР¶РµРЅРёСЏ
- QA РґР»СЏ РїРѕРЅРёРјР°РЅРёСЏ РіСЂР°РЅРёС‡РЅС‹С… СЃР»СѓС‡Р°РµРІ
- Tech Lead РґР»СЏ РѕС†РµРЅРєРё РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚Рё

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [02_AUTHENTICATION.md](./02_AUTHENTICATION.md) вЂ” Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёСЏ Рё cookies
- [03_ACCOUNTS_PROFILES.md](./03_ACCOUNTS_PROFILES.md) вЂ” СѓРїСЂР°РІР»РµРЅРёРµ Р°РєРєР°СѓРЅС‚Р°РјРё
- [04_PROXY_CONNECTIONS.md](./04_PROXY_CONNECTIONS.md) вЂ” РїСЂРѕРєСЃРё СЃРёСЃС‚РµРјР°
- [07_GEO_SYSTEM.md](./07_GEO_SYSTEM.md) вЂ” РїРѕРґРјРµРЅР° СЂРµРіРёРѕРЅР°
- [11_DATA_FLOW.md](./11_DATA_FLOW.md) вЂ” РїРѕС‚РѕРєРё РґР°РЅРЅС‹С…
- [14_LOGGING_OBSERVABILITY.md](./14_LOGGING_OBSERVABILITY.md) вЂ” Р»РѕРіРёСЂРѕРІР°РЅРёРµ

---

## РђСЂС…РёС‚РµРєС‚СѓСЂР° РїР°СЂСЃРµСЂР°

```mermaid
graph TD
    A[MultiParsingWorker] -->|N Р°РєРєР°СѓРЅС‚РѕРІ| B1[TurboParser #1]
    A -->|РїР°СЂР°Р»Р»РµР»СЊРЅРѕ| B2[TurboParser #2]
    A -->|РїР°СЂР°Р»Р»РµР»СЊРЅРѕ| B3[TurboParser #N]
    
    B1 -->|10 РІРєР»Р°РґРѕРє| C1[Tab 1]
    B1 --> C2[Tab 2]
    B1 --> C3[Tab 10]
    
    C1 -->|CDP РїРµСЂРµС…РІР°С‚| D[Chrome DevTools Protocol]
    C2 --> D
    C3 --> D
    
    D -->|Р·Р°РїСЂРѕСЃС‹| E[Yandex Wordstat API]
    E -->|JSON РѕС‚РІРµС‚С‹| D
    
    D -->|РїР°СЂСЃРёРЅРі| F[freq_results в†’ DB]
    
    G[Phrases Queue] -->|СЂР°СЃРїСЂРµРґРµР»РµРЅРёРµ| B1
    G --> B2
    G --> B3
```

## Р”РёР°РіСЂР°РјРјР° РїРѕС‚РѕРєР°

**Р–РёР·РЅРµРЅРЅС‹Р№ С†РёРєР» РїР°СЂСЃРёРЅРіР° РѕРґРЅРѕР№ С„СЂР°Р·С‹:**

```mermaid
sequenceDiagram
    participant UI as Frontend UI
    participant API as FastAPI
    participant MP as MultiParsingWorker
    participant TP as TurboParser
    participant Tab as Browser Tab
    participant CDP as Chrome CDP
    participant YA as Yandex API
    participant DB as SQLite DB
    
    UI->>API: POST /api/wordstat/start
    API->>MP: init_parsing_task(phrases, accounts)
    MP->>TP: assign phrases to TurboParser
    TP->>Tab: create 10 parallel tabs
    Tab->>CDP: enable Network & Fetch domains
    CDP->>YA: intercept /api/v2/keyword/frequency
    YA-->>CDP: JSON {shows, clicks, region}
    CDP-->>Tab: parse response
    Tab-->>TP: aggregate results
    TP-->>MP: return stats
    MP-->>DB: INSERT INTO freq_results
    DB-->>API: task completed
    API-->>UI: WebSocket update
```

---

## РљР»СЋС‡РµРІС‹Рµ РєРѕРјРїРѕРЅРµРЅС‚С‹

### 1. TurboParser

РћСЃРЅРѕРІРЅРѕР№ РїР°СЂСЃРµСЂ СЃ РїР°СЂР°Р»Р»РµР»СЊРЅС‹РјРё РІРєР»Р°РґРєР°РјРё.

### 2. MultiParsingWorker

РћСЂРєРµСЃС‚СЂР°С‚РѕСЂ РґР»СЏ N Р°РєРєР°СѓРЅС‚РѕРІ РѕРґРЅРѕРІСЂРµРјРµРЅРЅРѕ.

### 3. CDP (Chrome DevTools Protocol)

РџРµСЂРµС…РІР°С‚ Рё РјРѕРґРёС„РёРєР°С†РёСЏ СЃРµС‚РµРІС‹С… Р·Р°РїСЂРѕСЃРѕРІ.

### 4. Phrase Distribution

РђР»РіРѕСЂРёС‚Рј СЂР°СЃРїСЂРµРґРµР»РµРЅРёСЏ С„СЂР°Р· РјРµР¶РґСѓ РІРєР»Р°РґРєР°РјРё.

---

## РЎРЅРёРїРїРµС‚С‹ РєРѕРґР°

### TurboParser РёРЅРёС†РёР°Р»РёР·Р°С†РёСЏ

```python
# С„Р°Р№Р»: keyset/workers/turbo_parser_working.py:131-154
async with async_playwright() as p:
    # 1. Р—РђРџРЈРЎРљ CHROME
    log("[1/6] Р—Р°РїСѓСЃРє Chrome СЃ РїСЂРѕС„РёР»РµРј wordstat_main...")
    context = await p.chromium.launch_persistent_context(
        user_data_dir="C:\\AI\\yandex\\.profiles\\wordstat_main",
        headless=False,
        channel="chrome",
        args=[
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials'
        ],
        viewport=None,
        locale='ru-RU'
    )
    await context.add_init_script(script=WORDSTAT_FETCH_NORMALIZER_SCRIPT)
    for existing in context.pages:
        await existing.add_init_script(script=WORDSTAT_FETCH_NORMALIZER_SCRIPT)
        try:
            await existing.evaluate(WORDSTAT_FETCH_NORMALIZER_SCRIPT)
        except Exception:
            pass
```

### CDP РїРµСЂРµС…РІР°С‚ Р·Р°РїСЂРѕСЃРѕРІ

```python
# С„Р°Р№Р»: keyset/workers/cdp_frequency_runner.py:60-81
async def on_response(response: Response):
    nonlocal captured_csv_url
    url = response.url
    content_type = response.headers.get("content-type", "")
    
    # Р›РѕРІРёРј CSV РѕС‚ Wordstat
    if "wordstat" in url and ("csv" in content_type or "export" in url or "download" in url):
        print(f"[CDP] РџРѕР№РјР°Р» CSV URL: {url}")
        captured_csv_url = url
        
        # РЎРѕС…СЂР°РЅСЏРµРј С‚РµР»Рѕ РґР»СЏ Р°РЅР°Р»РёР·Р°
        try:
            body = await response.body()
            self.captured_data.append({
                "url": url,
                "type": "csv",
                "body": body.decode("utf-8", "ignore")
            })
        except Exception as e:
            print(f"[CDP] РћС€РёР±РєР° С‡С‚РµРЅРёСЏ CSV: {e}")

page.on("response", on_response)
```

### MultiParsingWorker Р·Р°РїСѓСЃРє

```python
# С„Р°Р№Р»: keyset/services/multiparser_manager.py:399-434
def submit_tasks(self, profiles: List[Dict], phrases: List[str]) -> List[str]:
    """
    РћС‚РїСЂР°РІРёС‚СЊ Р·Р°РґР°С‡Рё РЅР° РІС‹РїРѕР»РЅРµРЅРёРµ
    
    Args:
        profiles: РЎРїРёСЃРѕРє РїСЂРѕС„РёР»РµР№ СЃ РґР°РЅРЅС‹РјРё
        phrases: РЎРїРёСЃРѕРє С„СЂР°Р· РґР»СЏ РїР°СЂСЃРёРЅРіР°
        
    Returns:
        РЎРїРёСЃРѕРє task_id СЃРѕР·РґР°РЅРЅС‹С… Р·Р°РґР°С‡
    """
    task_ids = []
    futures = {}
    
    for profile in profiles:
        # РЎРѕР·РґР°РµРј Р·Р°РґР°С‡Сѓ
        task = self.create_task(
            profile_email=profile['email'],
            profile_path=profile['profile_path'],
            proxy_uri=profile.get('proxy'),
            phrases=phrases
        )
        task_ids.append(task.task_id)
        
        # РћС‚РїСЂР°РІР»СЏРµРј РЅР° РІС‹РїРѕР»РЅРµРЅРёРµ
        future = self.executor.submit(self._run_parser_task, task)
        futures[future] = task.task_id
        
    # Р—Р°РїСѓСЃРєР°РµРј РѕР±СЂР°Р±РѕС‚РєСѓ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ РІ РѕС‚РґРµР»СЊРЅРѕРј РїРѕС‚РѕРєРµ
    threading.Thread(
        target=self._process_futures,
        args=(futures,),
        daemon=True
    ).start()
    
    return task_ids
```

### РђР»РіРѕСЂРёС‚Рј СЂР°СЃРїСЂРµРґРµР»РµРЅРёСЏ С„СЂР°Р·

```python
# С„Р°Р№Р»: keyset/workers/turbo_parser_working.py:296-309
# Р Р°СЃРїСЂРµРґРµР»РµРЅРёРµ С„СЂР°Р· РїРѕ РІРєР»Р°РґРєР°Рј
chunks = []
chunk_size = len(phrases) // len(working_pages)

for i in range(len(working_pages)):
    start_idx = i * chunk_size
    if i == len(working_pages) - 1:
        chunks.append(phrases[start_idx:])
    else:
        chunks.append(phrases[start_idx:start_idx + chunk_size])

log("[OK] Р Р°СЃРїСЂРµРґРµР»РµРЅРёРµ С„СЂР°Р· РїРѕ РІРєР»Р°РґРєР°Рј:")
for i, chunk in enumerate(chunks):
    log(f"  * Р’РєР»Р°РґРєР° {i+1}: {len(chunk)} С„СЂР°Р·")
```

---

## РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё / РљР°Рє С‡РёРЅРёС‚СЊ

### вќЊ РћС€РёР±РєР°: "Chrome process crashed"

**РџСЂРёС‡РёРЅР°:** РќРµС…РІР°С‚РєР° СЂРµСЃСѓСЂСЃРѕРІ РёР»Рё РєРѕРЅС„Р»РёРєС‚ РїСЂРѕС†РµСЃСЃРѕРІ.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. РЈРјРµРЅСЊС€РёС‚СЊ `max_workers` Сѓ `MultiParserManager`, С‡С‚РѕР±С‹ СЃРЅРёР·РёС‚СЊ РєРѕРЅРєСѓСЂРµРЅС‚РЅСѓСЋ РЅР°РіСЂСѓР·РєСѓ.
2. Р—Р°РІРµСЂС€РёС‚СЊ Р·РѕРјР±Рё-РїСЂРѕС†РµСЃСЃС‹ Chrome (`taskkill /IM chrome.exe /F`) Рё РѕС‡РёСЃС‚РёС‚СЊ РІСЂРµРјРµРЅРЅС‹Рµ РїСЂРѕС„РёР»Рё.
3. Р”РѕР±Р°РІРёС‚СЊ РјРѕРЅРёС‚РѕСЂРёРЅРі RAM/CPU Рё СѓРІРµР»РёС‡РёС‚СЊ Р»РёРјРёС‚С‹ Р’Рњ РјРёРЅРёРјСѓРј РґРѕ 6 Р“Р‘ РѕРїРµСЂР°С‚РёРІРЅРѕР№ РїР°РјСЏС‚Рё.

### вќЊ РћС€РёР±РєР°: "CDP session closed unexpectedly"

**РџСЂРёС‡РёРЅР°:** Р’РєР»Р°РґРєР° Р·Р°РєСЂС‹Р»Р°СЃСЊ РёР»Рё Р·Р°РІРёСЃР»Р°.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. РћР±РµСЂРЅСѓС‚СЊ `context.new_page()` Рё `page.goto()` РІ retry СЃ СЌРєСЃРїРѕРЅРµРЅС†РёР°Р»СЊРЅРѕР№ Р·Р°РґРµСЂР¶РєРѕР№.
2. РќР°РІРµС€РёРІР°С‚СЊ РѕР±СЂР°Р±РѕС‚С‡РёРєРё `page.on("response", ...)` РґРѕ РїРµСЂРІРѕРіРѕ `page.goto` Рё РїСЂРѕРІРµСЂСЏС‚СЊ `page.is_closed()` РєР°Р¶РґС‹Рµ 30 СЃРµРєСѓРЅРґ.
3. Р”РµСЂР¶Р°С‚СЊ health-check: РїРµСЂРµСЃРѕР·РґР°РІР°С‚СЊ РІРєР»Р°РґРєСѓ, РµСЃР»Рё `page.context` РїРѕС‚РµСЂСЏР» СЃРѕРµРґРёРЅРµРЅРёРµ.

### вќЊ РћС€РёР±РєР°: "No responses intercepted"

**РџСЂРёС‡РёРЅР°:** CDP РЅРµ СѓСЃРїРµР» РїРѕРґРєР»СЋС‡РёС‚СЊСЃСЏ Рє Network domain.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. Р’С‹Р·С‹РІР°С‚СЊ `page.route`/`page.on` РґРѕ `page.goto` Рё Р¶РґР°С‚СЊ `wait_for_event("response")` СЃ С‚Р°Р№РјР°СѓС‚РѕРј 5 СЃРµРєСѓРЅРґ.
2. РЈР±РµРґРёС‚СЊСЃСЏ, С‡С‚Рѕ `WORDSTAT_FETCH_NORMALIZER_SCRIPT` РґРѕР±Р°РІР»РµРЅ С‡РµСЂРµР· `context.add_init_script` РґРѕ РЅР°РІРёРіР°С†РёРё.
3. РџСЂРѕРІРµСЂРёС‚СЊ С„РёР»СЊС‚СЂ URL: РѕРЅ РґРѕР»Р¶РµРЅ РІРєР»СЋС‡Р°С‚СЊ `/wordstat/api` Рё `statistics/v1/data?format=csv`.

---

## Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚

### 1. Р—Р°РїСѓСЃРє РїР°СЂСЃРёРЅРіР° РёР· Python

```python
from keyset.services.multiparser_manager import MultiParsingManager

manager = MultiParsingManager()
task_id = await manager.start_parsing(
    phrases=["РєСѓРїРёС‚СЊ РєРІР°СЂС‚РёСЂСѓ", "Р°СЂРµРЅРґР° РґРѕРјР°"],
    account_ids=[1, 2, 3],
    region_id=213  # РњРѕСЃРєРІР°
)
```

### 2. Р—Р°РїСѓСЃРє С‡РµСЂРµР· API

```bash
curl -X POST http://localhost:8000/api/wordstat/start \
  -H "Content-Type: application/json" \
  -d '{
    "phrases": ["РєСѓРїРёС‚СЊ РєРІР°СЂС‚РёСЂСѓ"],
    "account_ids": [1],
    "region_id": 213
  }'
```

### 3. РњРѕРЅРёС‚РѕСЂРёРЅРі СЃС‚Р°С‚СѓСЃР°

```python
status = await manager.get_task_status(task_id)
print(f"Processed: {status['processed']}/{status['total']}")
```

---

## TL;DR

- **TurboParser** вЂ” 10 РїР°СЂР°Р»Р»РµР»СЊРЅС‹С… РІРєР»Р°РґРѕРє РЅР° Р°РєРєР°СѓРЅС‚
- **MultiParsingWorker** вЂ” N Р°РєРєР°СѓРЅС‚РѕРІ РѕРґРЅРѕРІСЂРµРјРµРЅРЅРѕ
- **CDP РїРµСЂРµС…РІР°С‚** вЂ” РјРѕРґРёС„РёРєР°С†РёСЏ API Р·Р°РїСЂРѕСЃРѕРІ РЅР° Р»РµС‚Сѓ
- **РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ** вЂ” ~526 С„СЂР°Р·/РјРёРЅСѓС‚Сѓ (5 Р°РєРєР°СѓРЅС‚РѕРІ Г— 10 РІРєР»Р°РґРѕРє)
- **Retry Р»РѕРіРёРєР°** вЂ” Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ РѕР±СЂР°Р±РѕС‚РєР° РѕС€РёР±РѕРє
- **Real-time РѕР±РЅРѕРІР»РµРЅРёСЏ** вЂ” С‡РµСЂРµР· WebSocket

---

## Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ

- [ ] РЈСЃС‚Р°РЅРѕРІР»РµРЅ Chrome/Chromium РІ СЃРёСЃС‚РµРјРµ
- [ ] Playwright СѓСЃС‚Р°РЅРѕРІР»РµРЅ Рё РЅР°СЃС‚СЂРѕРµРЅ
- [ ] CDP РїРµСЂРµС…РІР°С‚ РІРєР»СЋС‡РµРЅ РїРµСЂРµРґ navigate
- [ ] РђРєРєР°СѓРЅС‚С‹ Р°РІС‚РѕСЂРёР·РѕРІР°РЅС‹ Рё РёРјРµСЋС‚ РІР°Р»РёРґРЅС‹Рµ cookies
- [ ] РџСЂРѕРєСЃРё РЅР°СЃС‚СЂРѕРµРЅС‹ (РµСЃР»Рё РёСЃРїРѕР»СЊР·СѓСЋС‚СЃСЏ)
- [ ] Р¤СЂР°Р·С‹ РєРѕСЂСЂРµРєС‚РЅРѕ СЂР°СЃРїСЂРµРґРµР»РµРЅС‹ РјРµР¶РґСѓ РІРєР»Р°РґРєР°РјРё
- [ ] Retry Р»РѕРіРёРєР° СЂРµР°Р»РёР·РѕРІР°РЅР° РґР»СЏ РѕС€РёР±РѕРє
- [ ] Р›РѕРіРёСЂРѕРІР°РЅРёРµ РЅР°СЃС‚СЂРѕРµРЅРѕ РґР»СЏ РѕС‚Р»Р°РґРєРё
- [ ] РўРµСЃС‚С‹ РїРѕРєСЂС‹РІР°СЋС‚ РѕСЃРЅРѕРІРЅС‹Рµ СЃС†РµРЅР°СЂРёРё
- [ ] РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ РѕРїС‚РёРјРёР·РёСЂРѕРІР°РЅР°

---

**РџРѕСЃР»РµРґРЅРµРµ РѕР±РЅРѕРІР»РµРЅРёРµ:** 2024-11-10

**РЎР»РµРґСѓСЋС‰РёР№ С€Р°Рі:** [07_GEO_SYSTEM.md](./07_GEO_SYSTEM.md) вЂ” Р“РµРѕРіСЂР°С„РёС‡РµСЃРєР°СЏ СЃРёСЃС‚РµРјР°
