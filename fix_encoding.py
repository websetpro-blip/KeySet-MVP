# -*- coding: utf-8 -*-
"""Fix UTF-8 encoding in backend/routers/accounts.py"""

def fix_accounts_encoding():
    file_path = r"C:\AI\yandex\KeySet-MVP\backend\routers\accounts.py"

    # Read file as bytes
    with open(file_path, 'rb') as f:
        content_bytes = f.read()

    # Decode as UTF-8 (the file is already UTF-8)
    content = content_bytes.decode('utf-8')

    # Replace mojibake patterns with correct Russian text
    replacements = {
        'Ð\x90Ð²Ñ\x82Ð¾Ñ\x80Ð¸Ð·Ð¾Ð²Ð°Ð½': 'Авторизован',
        'Ð\x92 Ñ\x80Ð°Ð±Ð¾Ñ\x82Ðµ': 'В работе',
        'Ð¢Ñ\x80ÐµÐ±Ñ\x83ÐµÑ\x82Ñ\x81Ñ\x8f ÐºÐ°Ð¿Ñ\x87Ð°': 'Требуется капча',
        'Ð\x97Ð°Ð±Ð»Ð¾ÐºÐ¸Ñ\x80Ð¾Ð²Ð°Ð½': 'Заблокирован',
        'Ð\x9eÑ\x88Ð¸Ð±ÐºÐ°': 'Ошибка',
        'Ð\x9dÐµÐ¸Ð·Ð²ÐµÑ\x81Ñ\x82Ð½Ð¾': 'Неизвестно',
        'Ð\x92ÐµÑ\x80Ð½Ñ\x83Ñ\x82Ñ\x8c': 'Вернуть',
    }

    # Apply replacements
    for bad, good in replacements.items():
        content = content.replace(bad, good)

    # Write back as UTF-8
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"OK: Fixed encoding in {file_path}")

if __name__ == "__main__":
    fix_accounts_encoding()
