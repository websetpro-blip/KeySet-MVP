# -*- coding: utf-8 -*-
"""
Fingerprint Application Hook - Применение отпечатков браузера
Модуль для пост-инициализации контекста с антидетектом
"""

import json
import random
from pathlib import Path
from typing import Optional, Dict, Any

from playwright.async_api import BrowserContext, Page


class FingerprintApplier:
    """Класс для применения отпечатков к браузеру"""
    
    def __init__(self):
        self.fingerprints_file = Path(__file__).parent.parent.parent / "app" / "data" / "fingerprints.json"
        self.fingerprints = self._load_fingerprints()
    
    def _load_fingerprints(self) -> Dict[str, Any]:
        """Загрузить отпечатки из файла"""
        if self.fingerprints_file.exists():
            try:
                return json.loads(self.fingerprints_file.read_text(encoding="utf-8"))
            except Exception:
                pass
        return {}
    
    def get_fingerprint(self, email: str) -> Optional[Dict[str, Any]]:
        """Получить отпечаток для аккаунта"""
        return self.fingerprints.get(email)
    
    async def apply_fingerprint(self, context: BrowserContext, email: str) -> bool:
        """Применить отпечаток к контексту браузера"""
        fingerprint = self.get_fingerprint(email)
        if not fingerprint:
            return False
        
        try:
            # User Agent
            if fingerprint.get("user_agent"):
                await context.set_extra_http_headers({
                    "User-Agent": fingerprint["user_agent"]
                })
            
            # Geolocation
            if fingerprint.get("geo"):
                geo = fingerprint["geo"]
                await context.set_geolocation({
                    "latitude": geo["lat"],
                    "longitude": geo["lon"],
                    "accuracy": geo.get("accuracy", 100)
                })
                await context.grant_permissions(["geolocation"])
            
            # Timezone
            if fingerprint.get("timezone"):
                # Timezone устанавливается через аргументы браузера при запуске
                pass
            
            # Locale и языки
            if fingerprint.get("languages"):
                languages = fingerprint["languages"]
                await context.set_extra_http_headers({
                    "Accept-Language": ", ".join(languages)
                })
            
            # Применение JavaScript для дополнительно маскировки
            await self._apply_client_hints(context, fingerprint)
            
            # Canvas и WebGL спуфинг
            if fingerprint.get("canvas", False):
                await self._setup_canvas_spoofing(context)
            
            if fingerprint.get("webgl", False):
                await self._setup_webgl_spoofing(context, fingerprint)
            
            # Audio спуфинг
            if fingerprint.get("audio", False):
                await self._setup_audio_spoofing(context)
            
            return True
            
        except Exception as e:
            print(f"[Fingerprint] Error applying fingerprint for {email}: {e}")
            return False
    
    async def _apply_client_hints(self, context: BrowserContext, fingerprint: Dict[str, Any]):
        """Применить Client Hints для маскировки"""
        platform = fingerprint.get("platform", "Win32")
        user_agent = fingerprint.get("user_agent", "")
        
        # Определить версию Chrome из User Agent
        chrome_version = "120.0.0.0"  # по умолчанию
        if "Chrome/" in user_agent:
            try:
                chrome_part = user_agent.split("Chrome/")[1].split(" ")[0]
                chrome_version = chrome_part
            except Exception:
                pass
        
        client_hints_script = f"""
        Object.defineProperty(navigator, 'userAgentData', {{
            get: () => ({{
                brands: [
                    {{brand: 'Chromium', version: '{chrome_version}'}},
                    {{brand: 'Google Chrome', version: '{chrome_version}'}},
                    {{brand: 'Not;A=Brand', version: '99.0.0.0'}}
                ],
                mobile: false,
                platform: '{platform}',
                architecture: 'x86',
                bitness: '64',
                model: '',
                platformVersion: '10.0.0'
            }}),
            configurable: true
        }});
        """
        
        # Применить ко всем страницам
        for page in context.pages:
            await page.add_init_script(client_hints_script)
        
        # Применять к новым страницам
        context.on('page', lambda page: page.add_init_script(client_hints_script))
    
    async def _setup_canvas_spoofing(self, context: BrowserContext):
        """Настроить Canvas спуфинг"""
        canvas_script = """
        // Canvas fingerprint randomization
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
        
        HTMLCanvasElement.prototype.toDataURL = function(...args) {
            const dataURL = originalToDataURL.apply(this, args);
            // Add small random variations
            if (Math.random() < 0.1) {
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.01)`;
                ctx.fillRect(0, 0, 1, 1);
                return originalToDataURL.apply(canvas, args);
            }
            return dataURL;
        };
        
        CanvasRenderingContext2D.prototype.getImageData = function(...args) {
            const imageData = originalGetImageData.apply(this, args);
            if (Math.random() < 0.01) {
                // Add tiny noise
                for (let i = 0; i < imageData.data.length; i += 4) {
                    imageData.data[i] += Math.random() * 2 - 1;
                    imageData.data[i + 1] += Math.random() * 2 - 1;
                    imageData.data[i + 2] += Math.random() * 2 - 1;
                }
            }
            return imageData;
        };
        """
        
        for page in context.pages:
            await page.add_init_script(canvas_script)
        
        context.on('page', lambda page: page.add_init_script(canvas_script))
    
    async def _setup_webgl_spoofing(self, context: BrowserContext, fingerprint: Dict[str, Any]):
        """Настроить WebGL спуфинг"""
        vendor = fingerprint.get("webgl_vendor", "Google Inc.")
        renderer = fingerprint.get("webgl_renderer", "ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0 drv_31.0.15.4176)")
        
        webgl_script = f"""
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {{
            if (parameter === 37445) {{ // UNMASKED_VENDOR_WEBGL
                return '{vendor}';
            }}
            if (parameter === 37446) {{ // UNMASKED_RENDERER_WEBGL
                return '{renderer}';
            }}
            return getParameter.call(this, parameter);
        }};
        
        // Для WebGL2
        if (typeof WebGL2RenderingContext !== 'undefined') {{
            const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
            WebGL2RenderingContext.prototype.getParameter = function(parameter) {{
                if (parameter === 37445) {{
                    return '{vendor}';
                }}
                if (parameter === 37446) {{
                    return '{renderer}';
                }}
                return getParameter2.call(this, parameter);
            }};
        }}
        """
        
        for page in context.pages:
            await page.add_init_script(webgl_script)
        
        context.on('page', lambda page: page.add_init_script(webgl_script))
    
    async def _setup_audio_spoofing(self, context: BrowserContext):
        """Настроить Audio контекст спуфинг"""
        audio_script = """
        // Audio context fingerprint randomization
        const originalCreateOscillator = AudioContext.prototype.createOscillator;
        AudioContext.prototype.createOscillator = function(...args) {
            const oscillator = originalCreateOscillator.apply(this, args);
            const originalStart = oscillator.start;
            oscillator.start = function(...args) {
                // Add tiny frequency variation
                if (oscillator.frequency && oscillator.frequency.value) {
                    oscillator.frequency.value += (Math.random() - 0.5) * 0.001;
                }
                return originalStart.apply(this, args);
            };
            return oscillator;
        };
        
        // Randomize audio fingerprint
        if (typeof AudioContext !== 'undefined') {
            const originalGetChannelData = AudioBuffer.prototype.getChannelData;
            AudioBuffer.prototype.getChannelData = function(...args) {
                const data = originalGetChannelData.apply(this, args);
                if (Math.random() < 0.01) {
                    for (let i = 0; i < data.length; i++) {
                        data[i] += (Math.random() - 0.5) * 0.00001;
                    }
                }
                return data;
            };
        }
        """
        
        for page in context.pages:
            await page.add_init_script(audio_script)
        
        context.on('page', lambda page: page.add_init_script(audio_script))


# Глобальный экземпляр для использования в turbo_parser_improved.py
_fingerprint_applier = None


def get_fingerprint_applier() -> FingerprintApplier:
    """Получить экземпляр применителя отпечатков"""
    global _fingerprint_applier
    if _fingerprint_applier is None:
        _fingerprint_applier = FingerprintApplier()
    return _fingerprint_applier


async def apply_fingerprint_post_init(context: BrowserContext, email: str) -> bool:
    """
    Хук для применения отпечатка после инициализации контекста.
    Вызывать после создания контекста в turbo_parser_improved.py
    
    Usage:
        context = await p.chromium.launch_persistent_context(...)
        await apply_fingerprint_post_init(context, account_name)
    """
    applier = get_fingerprint_applier()
    return await applier.apply_fingerprint(context, email)


def get_browser_args_for_fingerprint(email: str) -> list:
    """
    Получить аргументы браузера для отпечатка
    Вызывать при запуске launch_persistent_context
    
    Usage:
        args = ["--start-maximized", ...]
        args.extend(get_browser_args_for_fingerprint(email))
        context = await p.chromium.launch_persistent_context(..., args=args)
    """
    applier = get_fingerprint_applier()
    fingerprint = applier.get_fingerprint(email)
    
    if not fingerprint:
        return []
    
    args = []
    
    # Timezone
    if fingerprint.get("timezone"):
        args.append(f"--timezone={fingerprint['timezone']}")
    
    # Language
    if fingerprint.get("languages"):
        languages = fingerprint["languages"]
        args.append(f"--lang={languages[0]}")
        args.append(f"--accept-lang={','.join(languages)}")
    
    # Screen size
    if fingerprint.get("screen"):
        screen = fingerprint["screen"]
        args.append(f"--window-size={screen['width']},{screen['height']}")
        
        # Device scale factor
        if screen.get("scale", 1.0) != 1.0:
            args.append(f"--force-device-scale-factor={screen['scale']}")
    
    # Platform simulation
    platform = fingerprint.get("platform", "Win32")
    if "Mac" in platform:
        args.extend([
            "--os-name=macOS",
            "--os-version=10.15.7"
        ])
    elif "Android" in platform:
        args.extend([
            "--os-name=Android",
            "--os-version=13"
        ])
    
    return args