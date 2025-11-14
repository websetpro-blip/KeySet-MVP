# 08. РЎС‚СЂСѓРєС‚СѓСЂР° С„СЂРѕРЅС‚РµРЅРґР° KeySet-MVP (React Router v7)

> **Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ Р°СЂС…РёС‚РµРєС‚СѓСЂС‹ frontend: React 19 + TypeScript + Vite + Zustand**

## рџ“‹ РЎРѕРґРµСЂР¶Р°РЅРёРµ

- [Р¦РµР»СЊ](#С†РµР»СЊ)
- [Р”Р»СЏ РєРѕРіРѕ](#РґР»СЏ-РєРѕРіРѕ)
- [РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹](#СЃРІСЏР·Р°РЅРЅС‹Рµ-РґРѕРєСѓРјРµРЅС‚С‹)
- [РђСЂС…РёС‚РµРєС‚СѓСЂР° frontend](#Р°СЂС…РёС‚РµРєС‚СѓСЂР°-frontend)
- [Р”РёР°РіСЂР°РјРјР° РјРѕРґСѓР»РµР№](#РґРёР°РіСЂР°РјРјР°-РјРѕРґСѓР»РµР№)
- [РўРµС…РЅРѕР»РѕРіРёС‡РµСЃРєРёР№ СЃС‚РµРє](#С‚РµС…РЅРѕР»РѕРіРёС‡РµСЃРєРёР№-СЃС‚РµРє)
- [РЎРЅРёРїРїРµС‚С‹ РєРѕРґР°](#СЃРЅРёРїРїРµС‚С‹-РєРѕРґР°)
- [РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё](#С‚РёРїРѕРІС‹Рµ-РѕС€РёР±РєРё)
- [Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚](#Р±С‹СЃС‚СЂС‹Р№-СЃС‚Р°СЂС‚)
- [TL;DR](#tldr)
- [Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ](#С‡РµРє-Р»РёСЃС‚-РїСЂРёРјРµРЅРµРЅРёСЏ)

---

## Р¦РµР»СЊ

Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ СЃС‚СЂСѓРєС‚СѓСЂС‹ frontend РїСЂРёР»РѕР¶РµРЅРёСЏ KeySet-MVP: РјРѕРґСѓР»СЊРЅР°СЏ Р°СЂС…РёС‚РµРєС‚СѓСЂР°, routing React Router v7, state management С‡РµСЂРµР· Zustand, UI РєРѕРјРїРѕРЅРµРЅС‚С‹ РЅР° Р±Р°Р·Рµ Radix UI.

## Р”Р»СЏ РєРѕРіРѕ

- Frontend СЂР°Р·СЂР°Р±РѕС‚С‡РёРєРё, СЂР°Р±РѕС‚Р°СЋС‰РёРµ СЃ UI
- Tech Lead РґР»СЏ Р°СЂС…РёС‚РµРєС‚СѓСЂРЅС‹С… СЂРµС€РµРЅРёР№
- QA РґР»СЏ РїРѕРЅРёРјР°РЅРёСЏ СЃС‚СЂСѓРєС‚СѓСЂС‹ РїСЂРёР»РѕР¶РµРЅРёСЏ
- DevOps РґР»СЏ РЅР°СЃС‚СЂРѕР№РєРё СЃР±РѕСЂРєРё

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [09_TABS_OVERVIEW.md](./09_TABS_OVERVIEW.md) вЂ” РѕР±Р·РѕСЂ РІРєР»Р°РґРѕРє UI
- [10_API_INTEGRATION.md](./10_API_INTEGRATION.md) вЂ” РёРЅС‚РµРіСЂР°С†РёСЏ СЃ backend
- [11_DATA_FLOW.md](./11_DATA_FLOW.md) вЂ” РїРѕС‚РѕРєРё РґР°РЅРЅС‹С…

---

## РђСЂС…РёС‚РµРєС‚СѓСЂР° frontend

```mermaid
graph TD
    A[App.tsx] -->|Router v7| B[Layout]
    
    B --> C1[Accounts Module]
    B --> C2[Data Module]
    B --> C3[Masks Module]
    B --> C4[Analytics Module]
    
    C1 --> D[Zustand Store]
    C2 --> D
    C3 --> D
    C4 --> D
    
    D -->|API calls| E[FastAPI Backend]
    E -->|responses| D
    
    C1 --> F[UI Components]
    C2 --> F
    C3 --> F
    C4 --> F
    
    F --> G[Radix UI + Tailwind]
```

---

## Р”РёР°РіСЂР°РјРјР° РјРѕРґСѓР»РµР№

```mermaid
graph LR
    subgraph Frontend
        A[React 19] --> B[React Router v7]
        B --> C[Pages/Routes]
        
        C --> D1[/accounts]
        C --> D2[/data]
        C --> D3[/masks]
        C --> D4[/analytics]
        
        E[Zustand Stores] --> E1[accountsStore]
        E --> E2[dataStore]
        E --> E3[masksStore]
        
        F[Components] --> F1[AccountsTable]
        F --> F2[DataGrid]
        F --> F3[MasksEditor]
        
        G[UI Kit] --> G1[Radix UI]
        G --> G2[Tailwind CSS]
        G --> G3[Lucide Icons]
    end
```

---

## РўРµС…РЅРѕР»РѕРіРёС‡РµСЃРєРёР№ СЃС‚РµРє

### Core
- **React 19.1.1** вЂ” UI Р±РёР±Р»РёРѕС‚РµРєР°
- **TypeScript 5.9.3** вЂ” С‚РёРїРёР·Р°С†РёСЏ
- **Vite 7.1.7** вЂ” СЃР±РѕСЂС‰РёРє

### Routing
- **React Router v7.9.5** вЂ” РјР°СЂС€СЂСѓС‚РёР·Р°С†РёСЏ

### State Management
- **Zustand 5.0.8** вЂ” РіР»РѕР±Р°Р»СЊРЅС‹Р№ state

### UI Components
- **Radix UI** вЂ” headless РєРѕРјРїРѕРЅРµРЅС‚С‹
- **Tailwind CSS** вЂ” СЃС‚РёР»РёР·Р°С†РёСЏ
- **Lucide React** вЂ” РёРєРѕРЅРєРё

### Data & Forms
- **TanStack Table 8.21.3** вЂ” С‚Р°Р±Р»РёС†С‹
- **React Hook Form 7.66.0** вЂ” С„РѕСЂРјС‹
- **Zod 4.1.12** вЂ” РІР°Р»РёРґР°С†РёСЏ

### Utilities
- **date-fns 4.1.0** вЂ” СЂР°Р±РѕС‚Р° СЃ РґР°С‚Р°РјРё
- **XLSX 0.18.5** вЂ” СЌРєСЃРїРѕСЂС‚ РІ Excel
- **PapaParse 5.5.3** вЂ” CSV РїР°СЂСЃРёРЅРі

---

## РЎРЅРёРїРїРµС‚С‹ РєРѕРґР°

### Р“Р»Р°РІРЅР°СЏ СЃС‚СЂСѓРєС‚СѓСЂР° РїСЂРёР»РѕР¶РµРЅРёСЏ

```typescript
// С„Р°Р№Р»: frontend/src/App.tsx:1-21
import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import AccountsModule from "./modules/accounts";
import MasksModule from "./modules/masks";
import DataModule from "./modules/data";
import AnalyticsModule from "./modules/analytics";

export function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/accounts" replace />} />
        <Route path="/accounts" element={<AccountsModule />} />
        <Route path="/masks" element={<MasksModule />} />
        <Route path="/data/*" element={<DataModule />} />
        <Route path="/analytics/*" element={<AnalyticsModule />} />
      </Routes>
    </AppLayout>
  );
}
```

### Zustand store СЃ persistence

```typescript
// С„Р°Р№Р»: frontend/src/modules/data/store/useStore.ts:35-78
const initialState: Omit<AppState, 'history'> = {
  phrases: [],
  groups: [],
  stopwords: [],
  filters: {},
  savedFilters: [],
  columnVisibility: {
    phrase: true,
    ws: true,
    qws: true,
    bws: true,
    status: true,
    dateAdded: false,
  },
  selectedPhraseIds: new Set(),
  selectedGroupId: null,
  activeGroupIds: new Set(),
  activityLog: [],
  processProgress: 0,
  processCurrent: 0,
  processTotal: 0,
  columnOrder: [],
  columnPinning: {},
  viewTemplates: [],
  searchMasks: [
    { id: '1', name: 'Google', url: 'https://www.google.com/search?q={QUERY}' },
    { id: '2', name: 'Yandex', url: 'https://yandex.ru/search/?text={QUERY}' },
  ],
  phraseColors: {},
  groupColors: {},
  pinnedPhraseIds: new Set(),
  footerStats: {},
  markedPhraseIds: new Set(),
  pinnedGroupIds: new Set(),
  snapshots: [],
  exportPresets: [],
  phraseTags: [],
  version: 5,
  isDataLoaded: false,
  isDataLoading: false,
  dataError: null,
  phrasesCursor: null,
};
```

### React Router v7 РјР°СЂС€СЂСѓС‚С‹

```typescript
// С„Р°Р№Р»: frontend/src/App.tsx:10-18
<AppLayout>
  <Routes>
    <Route path="/" element={<Navigate to="/accounts" replace />} />
    <Route path="/accounts" element={<AccountsModule />} />
    <Route path="/masks" element={<MasksModule />} />
    <Route path="/data/*" element={<DataModule />} />
    <Route path="/analytics/*" element={<AnalyticsModule />} />
  </Routes>
</AppLayout>
```

### РџСЂРёРјРµСЂ РјРѕРґСѓР»СЏ (Accounts)

```typescript
// С„Р°Р№Р»: frontend/src/modules/accounts/index.tsx:14-45
export default function AccountsModule() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AccountsFilters>({
    search: "",
    status: "",
    onlyWithProxy: false,
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (loadError) {
      setAccounts([]);
      setError(
        (loadError as Error).message ||
          "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р°РєРєР°СѓРЅС‚С‹. РџСЂРѕРІРµСЂСЊС‚Рµ backend."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);
```

### API client РёРЅС‚РµРіСЂР°С†РёСЏ

```typescript
// С„Р°Р№Р»: frontend/src/modules/accounts/api.ts:1-19
import type { Account } from "./types";

const BASE_URL = "/api/accounts";

export async function fetchAccounts(): Promise<Account[]> {
  const response = await fetch(BASE_URL, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Accounts API error (${response.status})`);
  }

  return (await response.json()) as Account[];
}
```

---

## РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё / РљР°Рє С‡РёРЅРёС‚СЊ

### вќЊ РћС€РёР±РєР°: "Cannot read property of undefined" РІ Zustand

**РџСЂРёС‡РёРЅР°:** Store РЅРµ РёРЅРёС†РёР°Р»РёР·РёСЂРѕРІР°РЅ РёР»Рё РґР°РЅРЅС‹Рµ РµС‰С‘ РЅРµ Р·Р°РіСЂСѓР¶РµРЅС‹.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. РРЅРёС†РёР°Р»РёР·РёСЂСѓР№С‚Рµ `initialState` РІСЃРµРјРё РїРѕР»СЏРјРё (СЃРј. `useStore.ts`) Рё РёР·Р±РµРіР°Р№С‚Рµ `undefined`.
2. Р’ РєРѕРјРїРѕРЅРµРЅС‚Р°С… РёСЃРїРѕР»СЊР·СѓР№С‚Рµ `const phrase = store.phrases?.[index] ?? null` Рё РїСЂРѕРІРµСЂСЏР№С‚Рµ `isDataLoaded`.
3. РџРѕРјРЅРёС‚Рµ, С‡С‚Рѕ `persist` middleware С‡РёС‚Р°РµС‚ state Р°СЃРёРЅС…СЂРѕРЅРЅРѕ вЂ” РІС‹РІРѕРґРёС‚Рµ UI-С€Р°Р±Р»РѕРЅ РґРѕ Р·Р°РІРµСЂС€РµРЅРёСЏ РіРёРґСЂР°С‚Р°С†РёРё (`useEffect`).

### вќЊ РћС€РёР±РєР°: "React Router v7 navigation not working"

**РџСЂРёС‡РёРЅР°:** РќРµРєРѕСЂСЂРµРєС‚РЅР°СЏ РЅР°СЃС‚СЂРѕР№РєР° routes РёР»Рё basename.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ `<AppLayout>` РѕР±РѕСЂР°С‡РёРІР°РµС‚ `<Routes>`, Р° `<BrowserRouter>` РёРЅРёС†РёР°Р»РёР·РёСЂРѕРІР°РЅ РІ `main.tsx`.
2. Р”Р»СЏ СЂРµРґРёСЂРµРєС‚РѕРІ РёСЃРїРѕР»СЊР·СѓР№С‚Рµ `<Navigate to="/accounts" replace />`, Р° РЅРµ `useNavigate` РІ СЌС„С„РµРєС‚Р°С….
3. Р’ desktop-СЃР±РѕСЂРєРµ РёСЃРїРѕР»СЊР·СѓР№С‚Рµ `basename={window.__KEYSET_BASE__ ?? '/'}` С‡С‚РѕР±С‹ СЂРѕСѓС‚РёРЅРі СЃРѕРІРїР°РґР°Р» СЃ РїСѓС‚СЏРјРё РІ Inno Setup.

### вќЊ РћС€РёР±РєР°: "Hydration mismatch"

**РџСЂРёС‡РёРЅР°:** РќРµСЃРѕРѕС‚РІРµС‚СЃС‚РІРёРµ РјРµР¶РґСѓ SSR Рё client-side СЂРµРЅРґРµСЂРѕРј.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. Р’С‹РЅРµСЃРёС‚Рµ РѕРїРµСЂР°С†РёРё СЃ `window`/`localStorage` РІ `useEffect`.
2. Р—Р°С„РёРєСЃРёСЂСѓР№С‚Рµ С‡Р°СЃРѕРІРѕР№ РїРѕСЏСЃ/С„РѕСЂРјР°С‚ РґР°С‚ РїСЂРё РіРµРЅРµСЂР°С†РёРё `initialState`, С‡С‚РѕР±С‹ СЃРµСЂРІРµСЂ Рё РєР»РёРµРЅС‚ СЃРѕРІРїР°РґР°Р»Рё.
3. РСЃРїРѕР»СЊР·СѓР№С‚Рµ `suppressHydrationWarning` РІРѕ РІСЂРµРјСЏ РѕС‚Р»Р°РґРєРё Рё Р»РѕРіРёСЂСѓР№С‚Рµ СЂР°СЃС…РѕР¶РґРµРЅРёСЏ.

---

## Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚

### 1. РЈСЃС‚Р°РЅРѕРІРєР° Р·Р°РІРёСЃРёРјРѕСЃС‚РµР№

```bash
cd frontend
npm install
```

### 2. Р—Р°РїСѓСЃРє dev СЃРµСЂРІРµСЂР°

```bash
npm run dev
# РћС‚РєСЂРѕРµС‚СЃСЏ РЅР° http://localhost:5173
```

### 3. РЎРѕР·РґР°РЅРёРµ РЅРѕРІРѕРіРѕ РјРѕРґСѓР»СЏ

```typescript
// src/modules/mymodule/MyModule.tsx
import { useMyStore } from '@/stores/myStore';

export const MyModule = () => {
  const { data, fetchData } = useMyStore();
  
  return <div>My Module</div>;
};
```

### 4. Р”РѕР±Р°РІР»РµРЅРёРµ РјР°СЂС€СЂСѓС‚Р°

```typescript
// src/routes.tsx
{
  path: '/mymodule',
  element: <MyModule />
}
```

---

## TL;DR

- **React 19** вЂ” СЃРѕРІСЂРµРјРµРЅРЅР°СЏ РІРµСЂСЃРёСЏ React
- **React Router v7** вЂ” РјР°СЂС€СЂСѓС‚РёР·Р°С†РёСЏ
- **Zustand** вЂ” РїСЂРѕСЃС‚РѕР№ Рё Р±С‹СЃС‚СЂС‹Р№ state management
- **Radix UI** вЂ” headless РєРѕРјРїРѕРЅРµРЅС‚С‹ РґР»СЏ РґРѕСЃС‚СѓРїРЅРѕСЃС‚Рё
- **Vite** вЂ” Р±С‹СЃС‚СЂР°СЏ СЃР±РѕСЂРєР° Рё HMR
- **TypeScript** вЂ” С‚РёРїРѕР±РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ

---

## Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ

- [ ] Node.js 18+ СѓСЃС‚Р°РЅРѕРІР»РµРЅ
- [ ] Р—Р°РІРёСЃРёРјРѕСЃС‚Рё СѓСЃС‚Р°РЅРѕРІР»РµРЅС‹ (npm install)
- [ ] Vite dev server Р·Р°РїСѓСЃРєР°РµС‚СЃСЏ
- [ ] React Router РјР°СЂС€СЂСѓС‚С‹ РЅР°СЃС‚СЂРѕРµРЅС‹
- [ ] Zustand stores СЃРѕР·РґР°РЅС‹ РґР»СЏ РјРѕРґСѓР»РµР№
- [ ] API client РЅР°СЃС‚СЂРѕРµРЅ РґР»СЏ backend
- [ ] TypeScript РєРѕРЅС„РёРі РєРѕСЂСЂРµРєС‚РЅС‹Р№
- [ ] Tailwind CSS СЂР°Р±РѕС‚Р°РµС‚
- [ ] Radix UI РєРѕРјРїРѕРЅРµРЅС‚С‹ РїРѕРґРєР»СЋС‡РµРЅС‹
- [ ] Build РїСЂРѕС…РѕРґРёС‚ Р±РµР· РѕС€РёР±РѕРє (npm run build)

---

**РџРѕСЃР»РµРґРЅРµРµ РѕР±РЅРѕРІР»РµРЅРёРµ:** 2024-11-10

**РЎР»РµРґСѓСЋС‰РёР№ С€Р°Рі:** [09_TABS_OVERVIEW.md](./09_TABS_OVERVIEW.md) вЂ” РћР±Р·РѕСЂ РІРєР»Р°РґРѕРє UI
