# Инструкция по исправлению базы данных

## Проблема

В файле `backend/db.py` поле `region` жестко задано значением 225 (Россия). Нужно сделать его nullable (необязательным), чтобы пользователь мог выбирать регион.

## Что нужно изменить

1. В классе **Task**:
   - Было: `region = Column(Integer, default=225)`
   - Станет: `region = Column(Integer, nullable=True)`

2. В классе **FrequencyResult**:
   - Было: `region = Column(Integer, default=225, index=True)`
   - Станет: `region = Column(Integer, nullable=True, index=True)`

## Как применить исправление

### Шаг 1: Запустите скрипт исправления

```bash
cd C:\AI\yandex\KeySet-MVP\Временные файлы
python FIX_DB_NOW.py
```

Вы должны увидеть:
- ✅ Changes applied
- ✅ SUCCESS! backend/db.py has been fixed!
- ⚠️ RESTART backend to apply changes

### Шаг 2: Перезапустите бэкенд

```powershell
cd C:\AI\yandex\KeySet-MVP
.\scripts\start_comet_bridge.ps1
```

### Шаг 3: Проверьте работу бэкенда

Откройте в браузере: `/api/health`

Должно вернуть: `{"status":"ok"}`

## Дальше

После исправления базы данных нужно:

1. ✅ Портировать функционал парсинга из старого KeySet
2. ✅ Добавить выбор региона в интерфейс
3. ✅ Подключить кнопку "Начать парсинг" к бэкенду