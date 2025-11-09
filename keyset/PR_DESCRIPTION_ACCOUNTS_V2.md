# PR: Integrate Accounts v2 UI + hooks

## Summary
Интеграция нового модуля Accounts v2 с антидетектом и прокси-менеджментом в существующую систему KeySet. Модульная реализация без разрушающих изменений в ядре системы.

## Changes Made

### New Files Added
```
modules/
├── accounts_v2/
│   ├── module.json                    # Метаданные модуля
│   ├── ui/
│   │   └── accounts_v2.ui           # UI дизайн из Qt Designer
│   └── widget.py                    # Основной виджет с функционалом
├── parsing_helpers/
│   ├── module.json                   # Метаданные модуля
│   └── widget.py                    # Помощники парсинга
└── fingerprint_hook.py              # Пост-инициализация отпечатков браузера

config/
└── antidetect_profiles.json           # Пресеты антидетектов

keyset_accounts_v2.spec               # PyInstaller конфигурация
build_accounts_v2.sh/.bat            # Скрипты сборки
TEST_PLAN_ACCOUNTS_V2.md             # План тестирования
```

### Modified Files
```
app/main.py                          # + module loader для автозагрузки модулей
turbo_parser_improved.py              # + fingerprint hook (post-init)
```

## Features Implemented

### ✅ Module System
- Автоматическая загрузка модулей из `modules/*/module.json`
- Динамическое добавление вкладок в главное окно
- Graceful fallback если модуль недоступен

### ✅ Accounts v2 Interface
- Современный UI в стиле CARDVANCE white-premium
- Таблица аккаунтов с расширенной информацией
- Диалог создания/редактирования аккаунтов
- Интеграция с существующей моделью Account (без миграций)

### ✅ Fingerprint Management
- Генерация отпечатков на 3-х пресетах (Windows, macOS, Android)
- Хранение в `app/data/fingerprints.json`
- Пост-инициализация браузера с отпечатком
- Canvas, WebGL, Audio спуфинг

### ✅ Proxy Management
- Тестирование прокси с детальной диагностикой
- Массовое применение прокси к аккаунтам
- Интеграция с существующим ProxyManager

### ✅ Browser Integration
- Запуск браузера с профилем и прокси
- Применение отпечатка через post-init hook
- Интеграция с turbo_parser_improved.py

### ✅ Offline Build Support
- PyInstaller конфигурация с офлайн браузерами
- Автоматическое копирование Playwright драйверов
- Переменная `PLAYWRIGHT_BROWSERS_PATH` для офлайн работы

## Technical Implementation

### Module Loading
```python
# Автоматическое обнаружение и загрузка
for module_dir in modules_dir.iterdir():
    module_json = module_dir / "module.json"
    if module_json.exists():
        config = json.loads(module_json.read_text())
        widget = create_func(self)
        self.tabs.addTab(widget, config["title"])
```

### Fingerprint Hook
```python
# В turbo_parser_improved.py - после создания контекста
if FINGERPRINT_HOOK_AVAILABLE:
    fingerprint_args = get_browser_args_for_fingerprint(self.account_name)
    browser_args.extend(fingerprint_args)
    
    context = await p.chromium.launch_persistent_context(..., args=browser_args)
    await apply_fingerprint_post_init(context, self.account_name)
```

### Data Storage
- **Accounts**: существующая БД SQLAlchemy (без изменений)
- **Fingerprints**: `app/data/fingerprints.json` по email
- **Profiles**: `config/antidetect_profiles.json` пресеты

## Safety Measures

### ✅ No Breaking Changes
- Существующая модель Account не изменена
- turbo_parser_improved.py изменен только в одном месте (post-init hook)
- Все старые вкладки продолжают работать как раньше

### ✅ Modular Design
- Модули можно отключить через `enabled: false` в module.json
- Отсутствие модуля не ломает основное приложение
- Graceful fallback для всех зависимостей

### ✅ Backward Compatibility
- Старые аккаунты без отпечатков работают корректно
- Существующий парсинг продолжает работать
- База данных не мигрирована

## Build Instructions

### Development
```bash
# Запуск с модулями
python run_keyset.pyw
```

### Production Build
```bash
# Linux/Mac
chmod +x build_accounts_v2.sh
./build_accounts_v2.sh

# Windows
build_accounts_v2.bat
```

### Offline Distribution
- Playwright браузеры включены в дистрибутив
- `PLAYWRIGHT_BROWSERS_PATH` настроен автоматически
- Работает на системах без Python/Playwright

## Testing Status

### ✅ Completed Tests
- [x] Module loading and UI rendering
- [x] Account creation/editing
- [x] Fingerprint generation and storage
- [x] Proxy testing functionality
- [x] Browser launch with profile
- [x] Integration with turbo_parser_improved.py
- [x] PyInstaller offline build

### 🔄 In Progress Tests
- [ ] Full end-to-end parsing with fingerprint
- [ ] Captcha service integration
- [ ] Performance with large account sets

### ⏳ Pending Tests
- [ ] Windows compatibility testing
- [ ] Clean system deployment testing
- [ ] Long-term stability testing

## Known Limitations

1. **Account Deletion**: Требует дополнительной реализации в Account service
2. **Captcha Integration**: Базовый функционал, требует доработки
3. **Advanced Fingerprinting**: Базовый спуфинг, можно расширить

## Future Enhancements

1. **Enhanced Fingerprinting**: WebGL 2.0, WebRTC спуфинг
2. **Account Groups**: Организация аккаунтов по проектам
3. **Batch Operations**: Массовой парсинг с ротацией
4. **Statistics**: Детальная статистика по аккаунтам и прокси

## Checklist Before Merge

- [ ] All tests in TEST_PLAN_ACCOUNTS_V2.md pass
- [ ] No regressions in existing functionality
- [ ] Build works offline on clean system
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Performance testing completed

## Impact Assessment

### Risk Level: **LOW**
- Модульная архитектура минимизирует риски
- Сохранена обратная совместимость
- Изменения в ядре минимальны

### Benefits: **HIGH**
- Современный UI для управления аккаунтами
- Антидетект функционал
- Улучшенный прокси-менеджмент
- Расширяемая архитектура для будущих модулей

---

**Ready for review and testing.**