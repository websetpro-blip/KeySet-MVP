# Database Schema Fix Instructions

## Problem
The database schema in `backend/db.py` has hardcoded `region=225` values that need to be made nullable.

## What Needs to Change
- **Task class**: `region = Column(Integer, default=225)` → `region = Column(Integer, nullable=True)`
- **FrequencyResult class**: `region = Column(Integer, default=225, index=True)` → `region = Column(Integer, nullable=True, index=True)`

## Available Fix Scripts

I've created **4 different tools** to apply this fix. Choose ONE:

### Option 1: EXECUTE_FIX.py (Recommended)
**Simplest & most reliable**

```bash
cd C:\AI\yandex\KeySet-MVP
python EXECUTE_FIX.py
```

### Option 2: APPLY_FIX_NOW.py
**Uses Dev API (requires requests library)**

```bash
cd C:\AI\yandex\KeySet-MVP
pip install requests # if not already installed
python APPLY_FIX_NOW.py
```

### Option 3: fix_db_now.py
**Basic version**

```bash
cd C:\AI\yandex\KeySet-MVP
python fix_db_now.py
```

### Option 4: fix_region.html
**Interactive HTML tool (open in PyWebView app)**

Open `fix_region.html` in the PyWebView application and click "Fix Now!"

## After Running the Fix

1. ✅ You should see "SUCCESS" message
2. ⚠️ **RESTART the backend service**:
   ```powershell
   .\scripts\start_comet_bridge.ps1
   ```
3. ✅ Verify backend health: Navigate to `/api/health`

## Verification

After applying the fix, you can verify the changes by reading the file:

```bash
python -c "import json; print(open('backend/db.py', 'r', encoding='utf-8').read().count('nullable=True'))"
```

Should return at least 2 (two replacements made).

## Next Steps

After the database schema is fixed:
1. Port parsing functionality from old KeySet
2. Add region selector to frontend
3. Connect parsing backend to UI