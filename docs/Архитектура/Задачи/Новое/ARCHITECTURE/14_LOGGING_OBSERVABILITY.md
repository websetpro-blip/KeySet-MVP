# 14. Logging & Observability KeySet-MVP

> **Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ СЃРёСЃС‚РµРјС‹ Р»РѕРіРёСЂРѕРІР°РЅРёСЏ Рё РјРѕРЅРёС‚РѕСЂРёРЅРіР°: Python logging, metrics, debugging**

## рџ“‹ РЎРѕРґРµСЂР¶Р°РЅРёРµ

- [Р¦РµР»СЊ](#С†РµР»СЊ)
- [Р”Р»СЏ РєРѕРіРѕ](#РґР»СЏ-РєРѕРіРѕ)
- [РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹](#СЃРІСЏР·Р°РЅРЅС‹Рµ-РґРѕРєСѓРјРµРЅС‚С‹)
- [РђСЂС…РёС‚РµРєС‚СѓСЂР° Р»РѕРіРёСЂРѕРІР°РЅРёСЏ](#Р°СЂС…РёС‚РµРєС‚СѓСЂР°-Р»РѕРіРёСЂРѕРІР°РЅРёСЏ)
- [Р”РёР°РіСЂР°РјРјР° РїРѕС‚РѕРєРѕРІ Р»РѕРіРѕРІ](#РґРёР°РіСЂР°РјРјР°-РїРѕС‚РѕРєРѕРІ-Р»РѕРіРѕРІ)
- [РЈСЂРѕРІРЅРё Р»РѕРіРёСЂРѕРІР°РЅРёСЏ](#СѓСЂРѕРІРЅРё-Р»РѕРіРёСЂРѕРІР°РЅРёСЏ)
- [РЎРЅРёРїРїРµС‚С‹](#СЃРЅРёРїРїРµС‚С‹)
- [РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё](#С‚РёРїРѕРІС‹Рµ-РѕС€РёР±РєРё)
- [Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚](#Р±С‹СЃС‚СЂС‹Р№-СЃС‚Р°СЂС‚)
- [TL;DR](#tldr)
- [Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ](#С‡РµРє-Р»РёСЃС‚-РїСЂРёРјРµРЅРµРЅРёСЏ)

---

## Р¦РµР»СЊ

Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ СЃРёСЃС‚РµРјС‹ Р»РѕРіРёСЂРѕРІР°РЅРёСЏ KeySet-MVP: СЃС‚СЂСѓРєС‚СѓСЂРёСЂРѕРІР°РЅРЅС‹Рµ Р»РѕРіРё, РјРѕРЅРёС‚РѕСЂРёРЅРі РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚Рё, debugging РїР°СЂСЃРµСЂР°, Р°РЅР°Р»РёР· РѕС€РёР±РѕРє.

## Р”Р»СЏ РєРѕРіРѕ

- Backend СЂР°Р·СЂР°Р±РѕС‚С‡РёРєРё РґР»СЏ debugging
- DevOps РґР»СЏ РјРѕРЅРёС‚РѕСЂРёРЅРіР° РІ production
- QA РґР»СЏ Р°РЅР°Р»РёР·Р° Р±Р°РіРѕРІ
- Support РґР»СЏ РїРѕРјРѕС‰Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЏРј

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [06_PARSING.md](./06_PARSING.md) вЂ” Р»РѕРіРё РїР°СЂСЃРµСЂР°
- [13_SECURITY_NOTES.md](./13_SECURITY_NOTES.md) вЂ” Р±РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ Р»РѕРіРѕРІ
- [12_PRODUCTION_WINDOWS_BUILD.md](./12_PRODUCTION_WINDOWS_BUILD.md) вЂ” Р»РѕРіРё РІ production

---

## РђСЂС…РёС‚РµРєС‚СѓСЂР° Р»РѕРіРёСЂРѕРІР°РЅРёСЏ

```mermaid
graph TD
    A[Application Code] --> B[Python Logging]
    
    B --> C1[Console Handler]
    B --> C2[File Handler]
    B --> C3[Rotating File Handler]
    
    C1 --> D[stdout/stderr]
    C2 --> E[logs/app.log]
    C3 --> F[logs/keyset.log.1]
    
    E --> G[Log Aggregator]
    F --> G
    
    G --> H[Analysis Tools]
    H --> I[Metrics Dashboard]
```

---

## Р”РёР°РіСЂР°РјРјР° РїРѕС‚РѕРєРѕРІ Р»РѕРіРѕРІ

```mermaid
sequenceDiagram
    participant Code as Application Code
    participant Logger as Python Logger
    participant Handler as File Handler
    participant Parser as Log Parser
    participant Monitor as Monitoring Dashboard
    
    Code->>Logger: logger.info("Parsing started")
    Logger->>Handler: write to file
    Handler->>Handler: rotate if needed
    Handler->>Parser: tail -f logs/app.log
    Parser->>Monitor: send metrics
    Monitor-->>Code: alert on error
```

---

## РЈСЂРѕРІРЅРё Р»РѕРіРёСЂРѕРІР°РЅРёСЏ

| РЈСЂРѕРІРµРЅСЊ | РџСЂРёРјРµРЅРµРЅРёРµ | РџСЂРёРјРµСЂ |
|---------|-----------|--------|
| DEBUG | Р”РµС‚Р°Р»СЊРЅР°СЏ РёРЅС„РѕСЂРјР°С†РёСЏ РґР»СЏ debugging | "Phrase queue: 523 items" |
| INFO | РћР±С‹С‡РЅС‹Р№ С…РѕРґ СЂР°Р±РѕС‚С‹ | "Parsing started for account X" |
| WARNING | РџРѕС‚РµРЅС†РёР°Р»СЊРЅС‹Рµ РїСЂРѕР±Р»РµРјС‹ | "Proxy slow response time: 3s" |
| ERROR | РћС€РёР±РєРё С‚СЂРµР±СѓСЋС‰РёРµ РІРЅРёРјР°РЅРёСЏ | "CDP session failed for tab 5" |
| CRITICAL | РљСЂРёС‚РёС‡РµСЃРєРёРµ РѕС€РёР±РєРё | "Database connection lost" |

---

## РЎРЅРёРїРїРµС‚С‹

### РќР°СЃС‚СЂРѕР№РєР° Р»РѕРіРёСЂРѕРІР°РЅРёСЏ

```python
# С„Р°Р№Р»: TBD:TBD-TBD
```

### Logger РІ РїР°СЂСЃРµСЂРµ

```python
# С„Р°Р№Р»: keyset/workers/turbo_parser_working.py:TBD-TBD
```

### Rotation handler

```python
# С„Р°Р№Р»: backend/main.py:TBD-TBD
```

### Structured logging

```python
# С„Р°Р№Р»: TBD:TBD-TBD
```

### Metrics СЃР±РѕСЂ

```python
# С„Р°Р№Р»: TBD:TBD-TBD
```

---

## РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё

### вќЊ РћС€РёР±РєР°: "Р›РѕРіРё Р·Р°С…Р»Р°РјР»РµРЅС‹ DEBUG СЃРѕРѕР±С‰РµРЅРёСЏРјРё"

**Р РµС€РµРЅРёРµ:**
```python
logging.basicConfig(level=logging.INFO)  # РёР»Рё WARNING РґР»СЏ production
```

### вќЊ РћС€РёР±РєР°: "Р›РѕРіРё РЅРµ СЂРѕС‚РёСЂСѓСЋС‚СЃСЏ"

**Р РµС€РµРЅРёРµ:**
```python
from logging.handlers import RotatingFileHandler

handler = RotatingFileHandler(
    'logs/app.log',
    maxBytes=10*1024*1024,  # 10 MB
    backupCount=5
)
```

### вќЊ РћС€РёР±РєР°: "Р§СѓРІСЃС‚РІРёС‚РµР»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ РІ Р»РѕРіР°С…"

**Р РµС€РµРЅРёРµ:**
```python
def sanitize_log(message: str) -> str:
    # РњР°СЃРєРёСЂРѕРІР°С‚СЊ РїР°СЂРѕР»Рё, С‚РѕРєРµРЅС‹, cookies
    return re.sub(r'password=\S+', 'password=***', message)
```

---

## Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚

### 1. РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ Р»РѕРіРёСЂРѕРІР°РЅРёСЏ

```python
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

handler = logging.FileHandler('logs/app.log')
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
handler.setFormatter(formatter)
logger.addHandler(handler)
```

### 2. РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РІ РєРѕРґРµ

```python
logger.info("Parsing started for phrase: %s", phrase)
logger.warning("Proxy timeout exceeded")
logger.error("Failed to parse phrase: %s", phrase, exc_info=True)
```

### 3. РџСЂРѕСЃРјРѕС‚СЂ Р»РѕРіРѕРІ

```bash
# Tail Р»РѕРіРѕРІ РІ СЂРµР°Р»СЊРЅРѕРј РІСЂРµРјРµРЅРё
tail -f logs/app.log

# Р¤РёР»СЊС‚СЂР°С†РёСЏ РѕС€РёР±РѕРє
grep ERROR logs/app.log

# РџРѕРґСЃС‡С‘С‚ РѕС€РёР±РѕРє
grep -c ERROR logs/app.log
```

---

## TL;DR

- **Python logging** вЂ” СЃС‚Р°РЅРґР°СЂС‚РЅР°СЏ Р±РёР±Р»РёРѕС‚РµРєР°
- **Rotation** вЂ” Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ СЂРѕС‚Р°С†РёСЏ С„Р°Р№Р»РѕРІ
- **Structured logs** вЂ” JSON С„РѕСЂРјР°С‚ РґР»СЏ РїР°СЂСЃРёРЅРіР°
- **Metrics** вЂ” РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ Рё РѕС€РёР±РєРё
- **Sanitization** вЂ” РѕС‡РёСЃС‚РєР° С‡СѓРІСЃС‚РІРёС‚РµР»СЊРЅС‹С… РґР°РЅРЅС‹С…

---

## Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ

- [ ] Logging РЅР°СЃС‚СЂРѕРµРЅ РЅР° РІСЃРµС… СѓСЂРѕРІРЅСЏС… РїСЂРёР»РѕР¶РµРЅРёСЏ
- [ ] РЈСЂРѕРІРµРЅСЊ Р»РѕРіРѕРІ РЅР°СЃС‚СЂРѕРµРЅ (DEBUG/INFO/WARNING)
- [ ] Rotation handler РЅР°СЃС‚СЂРѕРµРЅ (maxBytes, backupCount)
- [ ] Р§СѓРІСЃС‚РІРёС‚РµР»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ РјР°СЃРєРёСЂСѓСЋС‚СЃСЏ
- [ ] Structured logging (JSON) РІРєР»СЋС‡С‘РЅ
- [ ] Р›РѕРіРё РїР°СЂСЃРµСЂР° РІРєР»СЋС‡Р°СЋС‚ context (account, phrase, region)
- [ ] Error tracking РёРЅС‚РµРіСЂРёСЂРѕРІР°РЅ
- [ ] Metrics СЃРѕР±РёСЂР°СЋС‚СЃСЏ (РїР°СЂСЃРёРЅРі rate, errors)
- [ ] РњРѕРЅРёС‚РѕСЂРёРЅРі РЅР°СЃС‚СЂРѕРµРЅ РґР»СЏ РєСЂРёС‚РёС‡РµСЃРєРёС… РѕС€РёР±РѕРє
- [ ] Р›РѕРіРё Р°СЂС…РёРІРёСЂСѓСЋС‚СЃСЏ Рё РѕС‡РёС‰Р°СЋС‚СЃСЏ СЂРµРіСѓР»СЏСЂРЅРѕ

---

**РџРѕСЃР»РµРґРЅРµРµ РѕР±РЅРѕРІР»РµРЅРёРµ:** 2024-11-10

**РЎР»РµРґСѓСЋС‰РёР№ С€Р°Рі:** [15_MIGRATIONS_AND_SCHEMA_VERSIONING.md](./15_MIGRATIONS_AND_SCHEMA_VERSIONING.md) вЂ” РњРёРіСЂР°С†РёРё Р‘Р”
