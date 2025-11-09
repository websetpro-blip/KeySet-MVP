# Интеграция парсера вглубь в keyset

## Что сделано

### 1. Создан парсер вглубь
- `workers/deep_parser.py` - асинхронный парсер левой колонки Wordstat
- `workers/deep_parser_worker.py` - Qt воркер для интеграции с UI

### 2. Особенности парсера

**Отличия от turbo_parser_improved.py:**
- `turbo_parser_improved.py` - снимает **частотность** (WS/QWS/BWS)
- `deep_parser.py` - собирает **вложенные фразы** из левой колонки

**Параметры:**
- `seeds` - начальные маски (фразы для парсинга)
- `depth` - глубина (1 = только прямые запросы, 2 = +1 уровень вглубь)
- `min_shows` - минимальный порог показов (10, 1 и т.д.)
- `expand_min` - минимальный порог для расширения на следующий уровень
- `topk` - топ-K фраз для расширения
- `lr` - ID региона

**Логика работы:**
1. Открывает браузеры для всех аккаунтов сразу
2. Для каждой маски парсит левую колонку Wordstat
3. Фильтрует по порогу показов
4. Если глубина > 1, берет топ-K фраз и парсит их тоже
5. Возвращает список результатов

## Осталось доделать

### В `app/tabs/parsing_tab.py`:

1. Добавить импорт:
```python
from ...workers.deep_parser_worker import DeepParserWorker
from ...core.settings import DEFAULT_PROFILES_ROOT
```

2. Заменить метод `_on_batch_collect_requested`:

```python
def _on_batch_collect_requested(self, phrases: List[str], settings: dict):
    """Обработка запроса пакетного сбора фраз"""
    if not phrases:
        self._append_log("❌ Нет фраз для парсинга")
        return

    # Получаем профили автоматически из БД
    selected_profiles = self._get_selected_profiles()
    if not selected_profiles:
        QMessageBox.warning(self, "Ошибка", "Нет активных аккаунтов в БД!\\n\\nДобавьте аккаунты на вкладку 'Аккаунты'.")
        return

    # Нормализуем настройки
    normalized = self._normalize_wordstat_settings(settings)
    self._last_settings = normalized

    # Параметры
    region_ids = normalized.get("regions", [225])
    region_id = region_ids[0] if region_ids else 225
    region_names = normalized.get("region_names", ["Россия (225)"])
    threshold = settings.get("threshold", 10)

    # Логи
    self._append_log("=" * 70)
    self._append_log("📦 ПАКЕТНЫЙ СБОР ФРАЗ ВГЛУБЬ (левая колонка)")
    self._append_log(f"📝 Масок для сбора: {len(phrases)}")
    self._append_log(f"📊 Профилей: {len(selected_profiles)}")
    self._append_log(f"🌍 Регион: {', '.join(region_names)}")
    self._append_log(f"📊 Порог показов: {threshold}")
    self._append_log(f"📂 Глубина: 1 (можно добавить настройку)")

    # Профили
    self._append_log("👥 Профили:")
    for i, prof in enumerate(selected_profiles, 1):
        email = prof.get("email", "unknown")
        proxy = prof.get("proxy", "без прокси")
        self._append_log(f"   {i}. {email} → {proxy}")

    self._append_log("=" * 70)

    # Запускаем парсинг вглубь
    self._run_deep_parsing(phrases, selected_profiles, region_id, threshold)
```

3. Добавить метод `_run_deep_parsing`:

```python
def _run_deep_parsing(self, phrases: List[str], profiles: List[dict], region_id: int, threshold: int):
    """Запустить парсинг вглубь"""
    from pathlib import Path

    # Подготовка аккаунтов для deep_parser
    accounts = []
    for prof in profiles:
        accounts.append({
            "name": prof.get("email", "unknown"),
            "proxy": prof.get("proxy")
        })

    # Директория профилей
    profiles_dir = Path(DEFAULT_PROFILES_ROOT).resolve()

    # Создаем воркер
    self._deep_worker = DeepParserWorker(
        seeds=phrases,
        accounts=accounts,
        profiles_dir=profiles_dir,
        depth=1,  # Можно добавить в настройки BatchCollectDialog
        min_shows=threshold,
        expand_min=threshold * 10,  # Автоматически: порог * 10
        topk=50,  # Топ-50 фраз для расширения
        region_id=region_id,
        parent=self
    )

    # Подключаем сигналы
    self._deep_worker.log_signal.connect(self._append_log)
    self._deep_worker.progress_signal.connect(self._on_deep_progress)
    self._deep_worker.finished_signal.connect(self._on_deep_finished)
    self._deep_worker.error_signal.connect(self._on_deep_error)

    # Запускаем
    self._append_log("🚀 Запуск парсинга вглубь...")
    self._deep_worker.start()
```

4. Добавить обработчики сигналов:

```python
def _on_deep_progress(self, current: int, total: int):
    """Обработка прогресса deep парсинга"""
    percent = int((current / total) * 100) if total > 0 else 0
    self._append_log(f"⏳ Прогресс: {current}/{total} ({percent}%)")

def _on_deep_finished(self, results: List[Dict[str, Any]]):
    """Обработка завершения deep парсинга"""
    self._append_log(f"✅ Парсинг завершен! Собрано фраз: {len(results)}")

    # Добавляем результаты в таблицу
    for result in results:
        phrase = result.get("phrase", "")
        shows = result.get("shows", 0)
        level = result.get("level", 1)
        parent = result.get("parent", "")

        # Добавляем в таблицу
        self._insert_phrase_row(phrase, status="OK", checked=False)

        # Логируем
        if level == 1:
            self._append_log(f"  • {phrase} ({shows} показов)")
        else:
            self._append_log(f"    ↳ [{level}] {phrase} ({shows} показов) ← {parent}")

    self._renumber_rows()
    self._append_log(f"📊 Все фразы добавлены в таблицу")

def _on_deep_error(self, error_msg: str):
    """Обработка ошибки deep парсинга"""
    self._append_log(f"❌ {error_msg}")
    QMessageBox.critical(self, "Ошибка парсинга", error_msg)
```

## Параметры в BatchCollectDialog

Можно добавить поля в `app/dialogs/batch_collect_dialog.py`:
- Глубина парсинга (SpinBox от 1 до 5)
- Порог для расширения (по умолчанию порог * 10)
- Топ-K фраз для расширения

## Тестирование

1. Запустить приложение
2. Нажать "📦 Пакет"
3. Выбрать регион (например, Омск)
4. Ввести маску (например, "ремонт квартир")
5. Порог показов: 10
6. Нажать "Начать сбор"
7. Должны открыться браузеры
8. В журнале видно логи: "найдено фраз", "браузер готов" и т.д.
9. Результаты добавляются в таблицу

## Примечание

Deep парсер открывает браузеры **не headless** (видимые), чтобы видеть что происходит. Это можно изменить в `deep_parser.py` строка 272:
```python
"headless": False,  # Поставить True для скрытого режима
```

---

**Дата:** 2025-10-31
**Автор:** Claude Code
