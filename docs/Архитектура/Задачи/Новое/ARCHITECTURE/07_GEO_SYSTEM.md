# 07. Р“РµРѕРіСЂР°С„РёС‡РµСЃРєР°СЏ СЃРёСЃС‚РµРјР° KeySet-MVP

> **Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ СЃРёСЃС‚РµРјС‹ СЂР°Р±РѕС‚С‹ СЃ СЂРµРіРёРѕРЅР°РјРё: 4414+ РіРµРѕ, CDP-РїР°С‚С‡РёРЅРі, GeoSelector РІРёРґР¶РµС‚**

## рџ“‹ РЎРѕРґРµСЂР¶Р°РЅРёРµ

- [Р¦РµР»СЊ](#С†РµР»СЊ)
- [Р”Р»СЏ РєРѕРіРѕ](#РґР»СЏ-РєРѕРіРѕ)
- [РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹](#СЃРІСЏР·Р°РЅРЅС‹Рµ-РґРѕРєСѓРјРµРЅС‚С‹)
- [РђСЂС…РёС‚РµРєС‚СѓСЂР° РіРµРѕСЃРёСЃС‚РµРјС‹](#Р°СЂС…РёС‚РµРєС‚СѓСЂР°-РіРµРѕСЃРёСЃС‚РµРјС‹)
- [Р”РёР°РіСЂР°РјРјР°](#РґРёР°РіСЂР°РјРјР°)
- [РЎС‚СЂСѓРєС‚СѓСЂР° regions.json](#СЃС‚СЂСѓРєС‚СѓСЂР°-regionsjson)
- [РЎРЅРёРїРїРµС‚С‹ РєРѕРґР°](#СЃРЅРёРїРїРµС‚С‹-РєРѕРґР°)
- [РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё](#С‚РёРїРѕРІС‹Рµ-РѕС€РёР±РєРё)
- [Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚](#Р±С‹СЃС‚СЂС‹Р№-СЃС‚Р°СЂС‚)
- [TL;DR](#tldr)
- [Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ](#С‡РµРє-Р»РёСЃС‚-РїСЂРёРјРµРЅРµРЅРёСЏ)

---

## Р¦РµР»СЊ

Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ РіРµРѕРіСЂР°С„РёС‡РµСЃРєРѕР№ СЃРёСЃС‚РµРјС‹ KeySet-MVP: РґРµСЂРµРІРѕ РёР· 4414+ СЂРµРіРёРѕРЅРѕРІ Yandex, Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ РїРѕРґСЃС‚Р°РЅРѕРІРєР° region_id РІ API Р·Р°РїСЂРѕСЃС‹ С‡РµСЂРµР· CDP, UI РІРёРґР¶РµС‚ РІС‹Р±РѕСЂР° СЂРµРіРёРѕРЅР°.

## Р”Р»СЏ РєРѕРіРѕ

- Frontend СЂР°Р·СЂР°Р±РѕС‚С‡РёРєРё, СЂР°Р±РѕС‚Р°СЋС‰РёРµ СЃ GeoSelector
- Backend СЂР°Р·СЂР°Р±РѕС‚С‡РёРєРё РґР»СЏ CDP-РїР°С‚С‡РёРЅРіР°
- QA РґР»СЏ С‚РµСЃС‚РёСЂРѕРІР°РЅРёСЏ СЂР°Р±РѕС‚С‹ СЂРµРіРёРѕРЅРѕРІ
- Product managers РґР»СЏ РїРѕРЅРёРјР°РЅРёСЏ coverage

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [06_PARSING.md](./06_PARSING.md) вЂ” РїР°СЂСЃРёРЅРі СЃ СѓС‡РµС‚РѕРј СЂРµРіРёРѕРЅР°
- [11_DATA_FLOW.md](./11_DATA_FLOW.md) вЂ” РїРѕС‚РѕРє РґР°РЅРЅС‹С… СЃ СЂРµРіРёРѕРЅРѕРј
- [08_FRONTEND_STRUCTURE.md](./08_FRONTEND_STRUCTURE.md) вЂ” UI РєРѕРјРїРѕРЅРµРЅС‚С‹

---

## РђСЂС…РёС‚РµРєС‚СѓСЂР° РіРµРѕСЃРёСЃС‚РµРјС‹

```mermaid
graph TD
    A[regions.json 4414+ СЂРµРіРёРѕРЅРѕРІ] -->|Р·Р°РіСЂСѓР·РєР°| B[Backend GeoService]
    A -->|Р·Р°РіСЂСѓР·РєР°| C[Frontend GeoStore]
    
    B -->|API| D[/api/regions]
    C -->|РІРёРґР¶РµС‚| E[GeoSelector UI]
    
    E -->|РІС‹Р±РѕСЂ| F[region_id]
    F -->|РїРµСЂРµРґР°С‡Р°| G[РџР°СЂСЃРёРЅРі Р·Р°РґР°С‡Р°]
    
    G -->|Р·Р°РїСѓСЃРє| H[TurboParser]
    H -->|CDP РїРµСЂРµС…РІР°С‚| I[Browser Tab]
    
    I -->|РїР°С‚С‡РёРЅРі| J[Yandex API Р·Р°РїСЂРѕСЃ]
    J -->|lr=region_id| K[?lr=213&text=С„СЂР°Р·Р°]
    
    K -->|Р·Р°РїСЂРѕСЃ| L[Yandex Wordstat]
    L -->|СЂРµР·СѓР»СЊС‚Р°С‚С‹ РґР»СЏ СЂРµРіРёРѕРЅР°| M[freq_results]
```

---

## Р”РёР°РіСЂР°РјРјР°

**РџРѕС‚РѕРє РІС‹Р±РѕСЂР° Рё РїСЂРёРјРµРЅРµРЅРёСЏ СЂРµРіРёРѕРЅР°:**

```mermaid
sequenceDiagram
    participant UI as GeoSelector UI
    participant Store as Zustand Store
    participant API as FastAPI /api/wordstat
    participant Parser as TurboParser
    participant CDP as Chrome CDP
    participant YA as Yandex API
    
    UI->>Store: selectRegion(213)
    Store->>Store: update region_id
    UI->>API: POST /start {region_id: 213}
    API->>Parser: init with region_id
    Parser->>CDP: enable Network intercept
    CDP->>CDP: modify request URL
    CDP->>YA: add ?lr=213&region=213
    YA-->>CDP: data for Moscow region
    CDP-->>Parser: parsed results
```

---

## РЎС‚СЂСѓРєС‚СѓСЂР° regions.json

```json
{
  "regions": [
    {
      "id": 213,
      "name": "РњРѕСЃРєРІР°",
      "parent_id": 1,
      "type": "city"
    },
    {
      "id": 2,
      "name": "РЎР°РЅРєС‚-РџРµС‚РµСЂР±СѓСЂРі",
      "parent_id": 10174,
      "type": "city"
    }
  ]
}
```

---

## РЎРЅРёРїРїРµС‚С‹ РєРѕРґР°

### GeoSelector РІРёРґР¶РµС‚

```python
# С„Р°Р№Р»: keyset/app/widgets/geo_selector.py:98-132
def normalize_regions_tree(raw_root: dict) -> RegionModel:
    """РџСЂРµРѕР±СЂР°Р·РѕРІР°С‚СЊ РІР»РѕР¶РµРЅРЅС‹Р№ JSON РІ РїР»РѕСЃРєРѕРµ РїСЂРµРґСЃС‚Р°РІР»РµРЅРёРµ СЃ РёРЅРґРµРєСЃР°РјРё."""

    flat: List[RegionRow] = []
    by_id: Dict[int, RegionRow] = {}
    children: Dict[int, List[int]] = {}

    def walk(node: dict, trail: List[str], depth: int, parent_id: Optional[int]) -> None:
        try:
            node_id = int(node["value"])
        except (KeyError, TypeError, ValueError):
            return
        label = str(node.get("label") or "").strip()
        if not label:
            return

        branch = trail + [label]
        row = RegionRow(
            id=node_id,
            name=label,
            path=" / ".join(branch),
            parent_id=parent_id,
            depth=depth,
        )
        flat.append(row)
        by_id[node_id] = row
        if parent_id is not None:
            children.setdefault(parent_id, []).append(node_id)

        for child in node.get("children") or []:
            walk(child, branch, depth + 1, node_id)

    walk(raw_root, [], 0, None)
    return RegionModel(flat=flat, by_id=by_id, children=children)
```

### CDP РїР°С‚С‡РёРЅРі region РїР°СЂР°РјРµС‚СЂРѕРІ

```python
# С„Р°Р№Р»: keyset/workers/cdp_frequency_runner.py:125-151
def replay_export_http(self, masks: list[str], export_url_template: str, region: int = 225) -> list[dict]:
    """
    Р РµРїР»РµРёРј Р·Р°РїСЂРѕСЃ СЌРєСЃРїРѕСЂС‚Р° РґР»СЏ РєР°Р¶РґРѕР№ РјР°СЃРєРё С‡РµСЂРµР· HTTP
    Р‘Р•Р— Р±СЂР°СѓР·РµСЂР°! Р’ 10 СЂР°Р· Р±С‹СЃС‚СЂРµРµ!
    """
    import time
    import random
    
    if not self.session:
        raise RuntimeError("HTTP session not initialized")
    
    results = []
    
    for idx, mask in enumerate(masks, 1):
        # РџРѕРґСЃС‚Р°РІР»СЏРµРј РјР°СЃРєСѓ РІ URL
        url = export_url_template.replace("{q}", quote(mask))
        url = re.sub(r'words=[^&]*', f'words={quote(mask)}', url)
        
        try:
            resp = self.session.get(url, timeout=30)
            
            if resp.status_code == 200 and "csv" in resp.headers.get("content-type", ""):
                # РџР°СЂСЃРёРј CSV
                freq = self._parse_csv_response(resp.text, mask)
```

### Р—Р°РіСЂСѓР·РєР° regions.json

```python
# С„Р°Р№Р»: keyset/app/widgets/geo_selector.py:88-95
def _load_raw_tree(dataset_path: Path) -> dict:
    if dataset_path.exists():
        try:
            return json.loads(dataset_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            pass
    return _DEFAULT_TREE
```

### GeoTree toggle logic

```python
# С„Р°Р№Р»: keyset/app/widgets/geo_selector.py:148-174
def toggle_region(
    selection: Set[int],
    region_id: int,
    checked: bool,
    model: RegionModel,
) -> Set[int]:
    updated = set(selection)

    def drop_descendants(node_id: int) -> None:
        for child_id in model.children.get(node_id, []):
            updated.discard(child_id)
            drop_descendants(child_id)

    def drop_ancestors(node_id: int) -> None:
        parent = model.by_id.get(node_id).parent_id if node_id in model.by_id else None
        while parent is not None:
            updated.discard(parent)
            parent = model.by_id.get(parent).parent_id if parent in model.by_id else None

    if checked:
        updated.add(region_id)
        drop_descendants(region_id)
        drop_ancestors(region_id)
    else:
        updated.discard(region_id)

    return updated
```

---

## РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё / РљР°Рє С‡РёРЅРёС‚СЊ

### вќЊ РћС€РёР±РєР°: "Region not found"

**РџСЂРёС‡РёРЅР°:** РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ region_id РїРµСЂРµРґР°РЅ РІ API.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. РќР° С„СЂРѕРЅС‚РµРЅРґРµ РїРµСЂРµРґ POST /start РІС‹Р·С‹РІР°Р№С‚Рµ `useGeoStore.getState().ensureRegion()` вЂ” РѕРЅ РІР°Р»РёРґРёСЂСѓРµС‚ РІС‹Р±РѕСЂ.
2. Р’ backend middleware РїСЂРѕРІРµСЂСЏР№С‚Рµ, С‡С‚Рѕ `region_id` РїСЂРёСЃСѓС‚СЃС‚РІСѓРµС‚ РІ `load_region_model(Path('data/regions_tree_full.json'))`; РїСЂРё РѕС‚СЃСѓС‚СЃС‚РІРёРё РІРѕР·РІСЂР°С‰Р°Р№С‚Рµ 422.
3. Р’ Р»РѕРіР°С… `backend/routers/wordstat.py` РІРєР»СЋС‡РёС‚Рµ РїРѕРёСЃРє РґСѓР±Р»РёРєР°С‚РѕРІ Рё РїСѓСЃС‚С‹С… РїСѓС‚РµР№, С‡С‚РѕР±С‹ РІС‹СЏРІРёС‚СЊ РїРѕРІСЂРµР¶РґС‘РЅРЅРѕРµ РґСЂРµРІРѕ.

### вќЊ РћС€РёР±РєР°: "CDP РЅРµ РїРѕРґСЃС‚Р°РІР»СЏРµС‚ region"

**РџСЂРёС‡РёРЅР°:** РџРµСЂРµС…РІР°С‚ Р·Р°РїСЂРѕСЃРѕРІ РЅР°СЃС‚СЂРѕРµРЅ РїРѕСЃР»Рµ navigate.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. РќР°РІРµС€РёРІР°Р№С‚Рµ `page.on("response", ...)` Рё `page.route` РґРѕ РїРµСЂРІРѕРіРѕ `page.goto`.
2. Р”РѕР±Р°РІСЊС‚Рµ `await page.wait_for_load_state("networkidle")` Рё СѓР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ `region` РїРµСЂРµРґР°С‘С‚СЃСЏ РІ `export_url_template`.
3. РџСЂРѕРІРµСЂСЊС‚Рµ, С‡С‚Рѕ РїСЂРё СЂРµРїР»РµРµ `replay_export_http` РїР°СЂР°РјРµС‚СЂ `regions=...` РїРѕРґСЃС‚Р°РІР»СЏРµС‚СЃСЏ РєРѕСЂСЂРµРєС‚РЅРѕ.

### вќЊ РћС€РёР±РєР°: "РќРµРІРµСЂРЅС‹Рµ СЂРµР·СѓР»СЊС‚Р°С‚С‹ РґР»СЏ СЂРµРіРёРѕРЅР°"

**РџСЂРёС‡РёРЅР°:** РљСЌС€РёСЂРѕРІР°РЅРёРµ РЅР° СЃС‚РѕСЂРѕРЅРµ Yandex РёР»Рё СѓСЃС‚Р°СЂРµРІС€РёРµ cookies.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. РџРµСЂРµРґ РїРѕРІС‚РѕСЂРЅС‹Рј Р·Р°РїСѓСЃРєРѕРј РІС‹РїРѕР»РЅСЏР№С‚Рµ `context.clear_cookies()` Рё РѕР±РЅРѕРІР»РµРЅРёРµ РїСЂРѕС„РёР»СЏ С‡РµСЂРµР· `_extract_profile_cookies`.
2. Р”РѕР±Р°РІР»СЏР№С‚Рµ РІ URL РїР°СЂР°РјРµС‚СЂ РєСЌС€-Р±Р°СЃС‚РµСЂР°: `rand=int(time.time())`.
3. Р РѕС‚СѓР№С‚Рµ User-Agent РІ `self.session.headers` (`build_http_session`) Рё РїСЂРѕРІРµСЂСЏР№С‚Рµ, С‡С‚Рѕ РєСѓРєРё СЃРІРµР¶РёРµ.

---

## Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚

### 1. Р—Р°РіСЂСѓР·РєР° СЃРїРёСЃРєР° СЂРµРіРёРѕРЅРѕРІ

```python
from keyset.services.geo_service import GeoService

geo = GeoService()
regions = geo.get_all_regions()
print(f"Loaded {len(regions)} regions")
```

### 2. Р’С‹Р±РѕСЂ СЂРµРіРёРѕРЅР° РІ UI

```typescript
import { useGeoStore } from '@/stores/geo';

const { selectedRegion, setRegion } = useGeoStore();

// Р’С‹Р±СЂР°С‚СЊ РњРѕСЃРєРІСѓ
setRegion(213);
```

### 3. РџР°СЂСЃРёРЅРі СЃ СЂРµРіРёРѕРЅРѕРј

```python
task_id = await manager.start_parsing(
    phrases=["РєСѓРїРёС‚СЊ РєРІР°СЂС‚РёСЂСѓ"],
    account_ids=[1],
    region_id=213  # РњРѕСЃРєРІР°
)
```

---

## TL;DR

- **4414+ СЂРµРіРёРѕРЅРѕРІ** вЂ” РїРѕР»РЅРѕРµ РґРµСЂРµРІРѕ Yandex РіРµРѕР»РѕРєР°С†РёР№
- **CDP-РїР°С‚С‡РёРЅРі** вЂ” Р°РІС‚РѕРїРѕРґСЃС‚Р°РЅРѕРІРєР° lr/region РІ API Р·Р°РїСЂРѕСЃС‹
- **GeoSelector UI** вЂ” СѓРґРѕР±РЅС‹Р№ РІРёРґР¶РµС‚ РІС‹Р±РѕСЂР° СЂРµРіРёРѕРЅР°
- **regions.json** вЂ” РµРґРёРЅС‹Р№ РёСЃС‚РѕС‡РЅРёРє РїСЂР°РІРґС‹ РґР»СЏ РіРµРѕ
- **Р’Р°Р»РёРґР°С†РёСЏ** вЂ” РїСЂРѕРІРµСЂРєР° region_id РЅР° frontend Рё backend

---

## Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ

- [ ] regions.json Р·Р°РіСЂСѓР¶РµРЅ Рё РґРѕСЃС‚СѓРїРµРЅ
- [ ] GeoSelector РІРёРґР¶РµС‚ РїРѕРґРєР»СЋС‡РµРЅ РІ UI
- [ ] CDP РїРµСЂРµС…РІР°С‚ РЅР°СЃС‚СЂРѕРµРЅ РґР»СЏ РїРѕРґСЃС‚Р°РЅРѕРІРєРё СЂРµРіРёРѕРЅР°
- [ ] region_id РїРµСЂРµРґР°РµС‚СЃСЏ С‡РµСЂРµР· РІСЃРµ СЃР»РѕРё (UI в†’ API в†’ Parser)
- [ ] Р’Р°Р»РёРґР°С†РёСЏ region_id СЂРµР°Р»РёР·РѕРІР°РЅР°
- [ ] РўРµСЃС‚С‹ РїРѕРєСЂС‹РІР°СЋС‚ СЂР°Р·РЅС‹Рµ СЂРµРіРёРѕРЅС‹
- [ ] Р›РѕРіРёСЂРѕРІР°РЅРёРµ region_id РІ Р·Р°РїСЂРѕСЃР°С…
- [ ] Fallback РЅР° РґРµС„РѕР»С‚РЅС‹Р№ СЂРµРіРёРѕРЅ РµСЃР»Рё РЅРµ СѓРєР°Р·Р°РЅ
- [ ] UI РїРѕРєР°Р·С‹РІР°РµС‚ РІС‹Р±СЂР°РЅРЅС‹Р№ СЂРµРіРёРѕРЅ
- [ ] Р РµР·СѓР»СЊС‚Р°С‚С‹ РїР°СЂСЃРёРЅРіР° СЃРѕС…СЂР°РЅСЏСЋС‚СЃСЏ СЃ region_id

---

**РџРѕСЃР»РµРґРЅРµРµ РѕР±РЅРѕРІР»РµРЅРёРµ:** 2024-11-10

**РЎР»РµРґСѓСЋС‰РёР№ С€Р°Рі:** [08_FRONTEND_STRUCTURE.md](./08_FRONTEND_STRUCTURE.md) вЂ” РЎС‚СЂСѓРєС‚СѓСЂР° С„СЂРѕРЅС‚РµРЅРґР°
