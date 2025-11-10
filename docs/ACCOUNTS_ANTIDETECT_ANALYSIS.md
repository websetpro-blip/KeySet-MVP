# АНАЛИЗ ВКЛАДКИ АККАУНТЫ - АНТИДЕТЕКТ СИСТЕМА

## РЕЗЮМЕ

**Текущая реализация: 40% от полноценного антидетекта**

### ✅ ЧТО УЖЕ РАБОТАЕТ (40%):
- База данных с моделями Account и Proxy ✅
- REST API endpoints для CRUD операций ✅
- UI с 5 вкладками настроек (Основное, Сеть, Fingerprint, Капча, Прокси) ✅
- Парсинг прокси с 5 источников ✅
- Тестирование прокси ✅
- Предустановки fingerprint (Россия/Казахстан) ✅
- LocalStorage автосохранение ✅
- Валидация email и прокси ✅
- Toast уведомления ✅

### ❌ ЧТО КРИТИЧНО НЕ ХВАТАЕТ (60%):

#### 🔥 ПРИОРИТЕТ 1 - Обход банов Яндекса:
1. **Canvas/WebGL/AudioContext реальный спуфинг** (20%)
   - Сейчас: только чекбоксы в UI, без реальной подмены
   - Нужно: инжект скриптов в браузер через CDP

2. **Интеграция с Playwright/браузером** (15%)
   - Сейчас: endpoint `/api/accounts/{id}/launch` возвращает mock
   - Нужно: реальный запуск Chrome с антидетект настройками

3. **Автогенерация fingerprints** (10%)
   - Сейчас: кнопка "Сгенерировать" не делает ничего реального
   - Нужно: библиотека реалистичных User-Agent, генерация уникальных отпечатков

4. **Timezone/Locale по IP прокси** (5%)
   - Сейчас: ручной выбор timezone
   - Нужно: автоопределение через geolocation API

#### ⚠️ ПРИОРИТЕТ 2 - Стабильность:
5. Chrome Profile Isolation (5%)
6. Cookies Import/Export UI (3%)
7. WebRTC Leak Protection (2%)

---

## 1. ЧТО УЖЕ ЕСТЬ (детально)

### Backend (База данных и API)

**Файл: `backend/db.py`**
- **Строки 33-72**: Модель `Account`:
  ```python
  id, name, profile_path, proxy, proxy_id, proxy_strategy,
  cookies, captcha_key, status, captcha_tries,
  created_at, updated_at, last_used_at, cooldown_until, notes
  ```

- **Строки 141-168**: Модель `Proxy`:
  ```python
  id, host, port, username, password, proxy_type,
  status, country, speed_ms, created_at, updated_at, last_checked_at
  ```

**Файл: `backend/main.py`**
- **Строки 146-200**: Accounts CRUD endpoints
- **Строки 315-360**: Proxy endpoints (list, test, parse)

### Frontend (React UI)

**Файл: `frontend/src/modules/accounts/types.ts`**
```typescript
interface Account {
  email: string;
  password: string;
  profilePath?: string;
  proxy?: string;
  fingerprint: FingerprintPreset;  // russia_standard/kazakhstan_standard/no_spoofing
}
```

**Файл: `frontend/src/modules/accounts/components/AccountSidebar.tsx`**
- **5 вкладок настроек:**
  1. Основное - email, пароль, профиль Chrome
  2. Сеть - прокси (HTTP/HTTPS/SOCKS5), тест
  3. Fingerprint - User-Agent, timezone, locale, разрешение, чекбоксы Canvas/WebGL/Audio
  4. Капча - сервис, API ключ
  5. Менеджер прокси - парсинг, тестирование, ротация

### Оригинальный код (legacy)

**Файл: `ГОТОВЫЕ_МОДУЛИ/аккаунты/keyset-v2-fixed/script.js`**
- **Реализовано 16/16 функций:**
  - Парсинг прокси с 5 источников
  - Тестирование прокси через API
  - Fingerprint предустановки
  - Генерация случайного fingerprint (mock)
  - Проверка на CreepJS (mock)
  - LocalStorage автосохранение
  - Валидация email/proxy
  - Toast уведомления

---

## 2. ЧТО НЕ ХВАТАЕТ (критично)

### 🔥 Canvas Fingerprinting - НЕТ РЕАЛИЗАЦИИ

**Проблема:**
- Есть чекбокс "Canvas спуфинг" в UI
- НО: нет реального механизма подмены canvas отпечатков
- Яндекс детектирует одинаковые canvas с одного IP = бан

**Что нужно:**
```javascript
// Инжект в браузер через CDP
const CANVAS_NOISE_SCRIPT = `
(function() {
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const noise = %NOISE_SEED%;  // Уникальное число

  HTMLCanvasElement.prototype.toDataURL = function() {
    const ctx = this.getContext('2d');
    const imageData = ctx.getImageData(0, 0, this.width, this.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = imageData.data[i] + noise;
    }
    ctx.putImageData(imageData, 0, 0);
    return originalToDataURL.apply(this, arguments);
  };
})();
`;
```

**Файлы для правки:**
- Создать `backend/fingerprint_injector.py`
- Создать `backend/browser_launcher.py`
- Изменить `backend/main.py` строка 203-216

---

### 🔥 WebGL Fingerprinting - НЕТ РЕАЛИЗАЦИИ

**Проблема:**
- Яндекс проверяет WebGL параметры (vendor, renderer)
- Одинаковая видеокарта на всех "разных устройствах" = подозрительно

**Что нужно:**
```javascript
const WEBGL_SPOOF_SCRIPT = `
(function() {
  const getParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(parameter) {
    if (parameter === 37445) return '%VENDOR%';  // Intel/NVIDIA/AMD
    if (parameter === 37446) return '%RENDERER%';  // Модель GPU
    return getParameter.apply(this, arguments);
  };
})();
`;
```

**Генерация уникальных vendors:**
```python
WEBGL_VENDORS = [
    ("Google Inc. (Intel)", "ANGLE (Intel, Intel(R) UHD Graphics 620)"),
    ("Google Inc. (NVIDIA)", "ANGLE (NVIDIA, NVIDIA GeForce GTX 1650)"),
    ("Google Inc. (AMD)", "ANGLE (AMD, AMD Radeon RX 5700)"),
]
```

---

### 🔥 Browser Automation - ЗАГЛУШКА

**Проблема:**
```python
# backend/main.py строка 203-216
@app.post("/api/accounts/{id}/launch")
def launch_account(account_id: int):
    # TODO: Integrate with playwright/browser launcher
    return {"status": "launched", "message": "Browser launched"}  # MOCK!
```

**Что нужно:**
```python
# backend/browser_launcher.py
from playwright.async_api import async_playwright

async def launch_account_browser(account: Account, fingerprint: dict):
    async with async_playwright() as p:
        browser = await p.chromium.launch_persistent_context(
            user_data_dir=account.profile_path,
            headless=False,
            proxy={"server": account.proxy},
            viewport={"width": fingerprint["screen"]["width"],
                      "height": fingerprint["screen"]["height"]},
            user_agent=fingerprint["user_agent"],
            timezone_id=fingerprint["timezone"],
            locale=fingerprint["locale"],
        )

        # Инжект антидетект скриптов
        page = await browser.new_page()
        await page.add_init_script(CANVAS_NOISE_SCRIPT.replace('%NOISE_SEED%', str(fingerprint["canvas_noise"])))
        await page.add_init_script(WEBGL_SPOOF_SCRIPT.replace('%VENDOR%', fingerprint["webgl_vendor"]))
        await page.goto("https://wordstat.yandex.ru")

        return browser
```

**Зависимости:**
```bash
pip install playwright
playwright install chromium
```

---

### 🔥 User-Agent генерация - ЧАСТИЧНО

**Проблема:**
- Есть поле ввода User-Agent
- НО: нет библиотеки реалистичных UA
- НО: нет проверки соответствия UA и WebGL/Platform

**Что нужно:**
```python
# backend/user_agents.py
import random

CHROME_VERSIONS = range(120, 125)  # Актуальные
WINDOWS_VERSIONS = ["10.0", "11.0"]

def generate_russian_ua() -> str:
    chrome = random.choice(CHROME_VERSIONS)
    win = random.choice(WINDOWS_VERSIONS)
    return f"Mozilla/5.0 (Windows NT {win}; Win64; x64) AppleWebKit/537.36 Chrome/{chrome}.0.0.0 Safari/537.36"

def validate_ua_consistency(ua: str, platform: str, webgl: str) -> bool:
    # Проверка соответствий
    if "Windows" in ua and "Linux" in platform:
        return False  # НЕСООТВЕТСТВИЕ
    return True
```

---

### 🔥 Timezone/Locale - РУЧНОЙ ВВОД

**Проблема:**
- Timezone выбирается вручную
- Может не соответствовать IP прокси
- Яндекс проверяет: timezone RU + IP Kazakhstan = подозрительно

**Что нужно:**
```python
# backend/geolocation.py
import httpx

async def get_proxy_geolocation(proxy_url: str) -> dict:
    async with httpx.AsyncClient(proxies=proxy_url) as client:
        response = await client.get('https://ipapi.co/json/')
        data = response.json()
        return {
            "timezone": data["timezone"],  # Europe/Moscow
            "locale": get_locale_for_country(data["country_code"]),  # ru-RU
            "country": data["country_code"],
        }
```

**Интеграция в UI:**
```typescript
// При вводе прокси автоматически определять timezone
const handleProxyChange = async (proxyUrl: string) => {
  const geo = await fetch('/api/proxy/geolocate', {
    method: 'POST',
    body: JSON.stringify({ proxy: proxyUrl }),
  }).then(r => r.json());

  setAccount({
    ...account,
    proxy: proxyUrl,
    timezone: geo.timezone,  // Автозаполнение
    locale: geo.locale,
  });
};
```

---

## 3. ПЛАН РЕАЛИЗАЦИИ

### Приоритет 1 (КРИТИЧНО - 2-3 недели):

#### ✅ Задача 1.1: Browser Launcher
**Файлы:**
- Создать `backend/browser_launcher.py`
- Изменить `backend/main.py` строка 203-216

**Зависимости:**
```bash
pip install playwright httpx
playwright install chromium
```

**Код:**
```python
async def launch_account_browser(account: Account, fingerprint_config: dict):
    async with async_playwright() as p:
        browser = await p.chromium.launch_persistent_context(
            user_data_dir=account.profile_path or f"profiles/account_{account.id}",
            headless=False,
            proxy={"server": account.proxy} if account.proxy else None,
            viewport={"width": fingerprint_config["width"], "height": fingerprint_config["height"]},
            user_agent=fingerprint_config["user_agent"],
            timezone_id=fingerprint_config["timezone"],
            locale=fingerprint_config["locale"],
        )
        return browser
```

---

#### ✅ Задача 1.2: Canvas/WebGL/Audio Spoofing
**Файлы:**
- Создать `backend/fingerprint_injector.py`

**Код:**
```python
CANVAS_NOISE_SCRIPT = """
(function() {
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const noise = %NOISE_SEED%;

    HTMLCanvasElement.prototype.toDataURL = function() {
        const ctx = this.getContext('2d');
        const imageData = ctx.getImageData(0, 0, this.width, this.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = imageData.data[i] + noise;
        }
        ctx.putImageData(imageData, 0, 0);
        return originalToDataURL.apply(this, arguments);
    };
})();
"""

WEBGL_SPOOF_SCRIPT = """
(function() {
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return '%VENDOR%';
        if (parameter === 37446) return '%RENDERER%';
        return getParameter.apply(this, arguments);
    };
})();
"""

def inject_fingerprint_scripts(page, fingerprint_config):
    await page.add_init_script(CANVAS_NOISE_SCRIPT.replace('%NOISE_SEED%', str(fingerprint_config["canvas_noise"])))
    await page.add_init_script(WEBGL_SPOOF_SCRIPT.replace('%VENDOR%', fingerprint_config["webgl_vendor"]))
```

---

#### ✅ Задача 1.3: Fingerprint Generator
**Файлы:**
- Создать `backend/fingerprint_generator.py`
- Добавить endpoint `POST /api/fingerprint/generate`

**Код:**
```python
import random

def generate_fingerprint(preset: str, proxy_country: str = None) -> dict:
    if preset == "russia_standard":
        return {
            "user_agent": generate_russian_ua(),
            "timezone": "Europe/Moscow",
            "locale": "ru-RU",
            "canvas_noise": random.randint(0, 10),
            "webgl_vendor": "Google Inc. (Intel)",
            "webgl_renderer": random.choice([
                "ANGLE (Intel, Intel(R) UHD Graphics 620)",
                "ANGLE (Intel, Intel(R) HD Graphics 530)",
            ]),
            "audio_noise": random.random() * 0.0001,
            "screen": {"width": 1920, "height": 1080},
            "hardware_concurrency": random.choice([4, 8]),
        }
    # ... аналогично для kazakhstan_standard
```

---

#### ✅ Задача 1.4: Geolocation по IP
**Файлы:**
- Создать `backend/geolocation.py`
- Добавить endpoint `POST /api/proxy/geolocate`

**Код:**
```python
async def get_proxy_geolocation(proxy_url: str) -> dict:
    async with httpx.AsyncClient(proxies=proxy_url) as client:
        response = await client.get('https://ipapi.co/json/')
        data = response.json()
        return {
            "country": data["country_code"],
            "timezone": data["timezone"],
            "locale": get_locale_for_country(data["country_code"]),
        }
```

---

### Приоритет 2 (ВАЖНО - 1-2 недели):

#### ✅ Задача 2.1: Chrome Profile Management
- Автосоздание изолированных профилей
- Очистка кэша при превышении размера

#### ✅ Задача 2.2: Cookies Import/Export UI
- Добавить textarea для JSON cookies
- Кнопки импорт/экспорт

#### ✅ Задача 2.3: WebRTC Leak Protection
- Инжект скриптов блокировки WebRTC
- Chrome flags: `--disable-webrtc-hw-encoding`

---

## 4. ОБНОВЛЕНИЕ БАЗЫ ДАННЫХ

### Добавить поля в модель Account:

```python
# backend/db.py строка 33
class Account(Base):
    # ... существующие поля

    # Новые поля для антидетекта
    user_agent = Column(String(500))
    timezone = Column(String(100))
    locale = Column(String(50))
    screen_width = Column(Integer, default=1920)
    screen_height = Column(Integer, default=1080)
    canvas_noise = Column(Integer, default=0)
    webgl_vendor = Column(String(255))
    webgl_renderer = Column(String(255))
    audio_noise = Column(Float, default=0.0)
    hardware_concurrency = Column(Integer, default=8)
    color_depth = Column(Integer, default=24)
```

**Миграция:**
```bash
# Пересоздать базу или добавить ALTER TABLE
ALTER TABLE accounts ADD COLUMN user_agent VARCHAR(500);
ALTER TABLE accounts ADD COLUMN timezone VARCHAR(100);
# ...
```

---

## 5. ОБНОВЛЕНИЕ FRONTEND

### Изменить типы:

```typescript
// frontend/src/modules/accounts/types.ts
export interface Account {
  // ... существующие

  // Новые для антидетекта
  userAgent?: string;
  timezone?: string;
  locale?: string;
  screenWidth?: number;
  screenHeight?: number;
  canvasNoise?: number;
  webglVendor?: string;
  webglRenderer?: string;
  audioNoise?: number;
  hardwareConcurrency?: number;
  colorDepth?: number;
}
```

### Обновить UI вкладки Fingerprint:

```typescript
// frontend/src/modules/accounts/components/AccountSidebar.tsx

// Заменить чекбоксы на активные
<label className="checkbox-label">
  <input
    type="checkbox"
    checked={account.canvasNoise > 0}
    onChange={handleToggleCanvas}
  />
  Canvas спуфинг
  {account.canvasNoise > 0 && <span>Шум: {account.canvasNoise}</span>}
</label>

// Добавить реальные обработчики
const handleGenerateFingerprint = async () => {
  const response = await fetch('/api/fingerprint/generate', {
    method: 'POST',
    body: JSON.stringify({
      preset: account.fingerprint,
      proxyCountry: extractCountryFromProxy(account.proxy),
    }),
  });

  const fingerprint = await response.json();
  setAccount({ ...account, ...fingerprint });
};
```

---

## 6. ИТОГОВАЯ ОЦЕНКА

### Текущий статус: 40%

**Что есть:**
- ✅ База данных и API (10%)
- ✅ UI структура (10%)
- ✅ Парсинг прокси (10%)
- ✅ Валидация и LocalStorage (10%)

**Что не хватает:**
- ❌ Canvas/WebGL/Audio спуфинг (20%)
- ❌ Browser Launcher интеграция (15%)
- ❌ Fingerprint генератор (10%)
- ❌ Timezone по IP (5%)

### Время до production-ready:

**Приоритет 1 (критично):** 2-3 недели (1 разработчик)
**Приоритет 2 (важно):** 1-2 недели
**Итого:** 4-6 недель

### Следующие шаги:

1. **Установить Playwright:**
   ```bash
   cd backend
   pip install playwright httpx
   playwright install chromium
   ```

2. **Создать модули:**
   ```bash
   touch backend/browser_launcher.py
   touch backend/fingerprint_injector.py
   touch backend/fingerprint_generator.py
   touch backend/geolocation.py
   ```

3. **Реализовать Приоритет 1:**
   - Browser Launcher
   - Fingerprint Injector
   - Generator
   - Geolocation

4. **Тестировать:**
   - Запустить аккаунт через новый launcher
   - Проверить на CreepJS: https://abrahamjuliot.github.io/creepjs/
   - Убедиться что fingerprint уникален

---

## ЗАКЛЮЧЕНИЕ

**Вкладка Аккаунты имеет солидный фундамент (40%), но критично не хватает реального антидетекта (60%).**

**Основные проблемы:**
1. Нет реального Canvas/WebGL/Audio спуфинга
2. Браузер не запускается с антидетект настройками
3. Fingerprints не генерируются автоматически
4. Timezone не определяется по IP прокси

**Для обхода банов Яндекса нужно реализовать Приоритет 1 (~2-3 недели работы).**

После этого система будет готова для:
- Парсинга частотности без банов
- Открутки промокодов с новыми аккаунтами
- Создания "уникальных пользователей с разных ПК"
