"""
Seed database with test accounts for development
"""
import json
from datetime import datetime, timedelta

from db import SessionLocal, create_account

# Test accounts data
TEST_ACCOUNTS = [
    {
        "name": "test1@yandex.ru",
        "profile_path": "/profiles/test1",
        "proxy": "192.168.1.100:8080",
        "status": "ok",
        "notes": json.dumps({
            "password": "password123",
            "secretAnswer": "Москва",
            "proxyUsername": "user1",
            "proxyPassword": "pass1",
            "proxyType": "http",
            "fingerprint": "russia_standard",
            "lastLaunch": "5 минут назад",
            "authStatus": "Авторизован",
            "lastLogin": "2025-10-31 01:00:00",
            "profileSize": "45.2 МБ",
        }),
    },
    {
        "name": "test2@yandex.ru",
        "profile_path": "/profiles/test2",
        "proxy": "",
        "status": "ok",
        "notes": json.dumps({
            "password": "password456",
            "secretAnswer": "Зимний сад",
            "proxyUsername": "",
            "proxyPassword": "",
            "proxyType": "http",
            "fingerprint": "no_spoofing",
            "lastLaunch": "1 час назад",
            "authStatus": "Неавторизован",
            "lastLogin": "2025-10-30 15:30:00",
            "profileSize": "32.1 МБ",
        }),
    },
    {
        "name": "test3@yandex.ru",
        "profile_path": "/profiles/test3",
        "proxy": "192.168.1.101:8080",
        "status": "error",
        "notes": json.dumps({
            "password": "password789",
            "secretAnswer": "Чита",
            "proxyUsername": "user3",
            "proxyPassword": "pass3",
            "proxyType": "socks5",
            "fingerprint": "kazakhstan_standard",
            "lastLaunch": "вчера",
            "authStatus": "Ошибка авторизации",
            "lastLogin": "2025-10-30 08:15:00",
            "profileSize": "28.7 МБ",
        }),
    },
    {
        "name": "spam_protector@yandex.ru",
        "profile_path": "/profiles/spam_protector",
        "proxy": "proxy.kz:3128",
        "status": "ok",
        "notes": json.dumps({
            "password": "secure123",
            "secretAnswer": "Ответ на вопрос",
            "proxyUsername": "kz_user",
            "proxyPassword": "kz_pass",
            "proxyType": "socks5",
            "fingerprint": "kazakhstan_standard",
            "lastLaunch": "сейчас",
            "authStatus": "Авторизован",
            "lastLogin": "2025-10-31 01:00:21",
            "profileSize": "67.8 МБ",
        }),
    },
    {
        "name": "alex_ivanov@yandex.ru",
        "profile_path": "/profiles/alex_ivanov",
        "proxy": "10.0.0.50:1080",
        "status": "ok",
        "notes": json.dumps({
            "password": "ivanov2023",
            "secretAnswer": "Барселона",
            "proxyUsername": "alex",
            "proxyPassword": "proxy_pass",
            "proxyType": "http",
            "fingerprint": "russia_standard",
            "lastLaunch": "2 минуты назад",
            "authStatus": "Авторизован",
            "lastLogin": "2025-10-31 00:58:21",
            "profileSize": "52.3 МБ",
        }),
    },
    {
        "name": "novosibirsk_user@yandex.ru",
        "profile_path": "/profiles/novosibirsk_user",
        "proxy": "",
        "status": "ok",
        "notes": json.dumps({
            "password": "novosib2023",
            "secretAnswer": "Сибирь",
            "proxyUsername": "",
            "proxyPassword": "",
            "proxyType": "http",
            "fingerprint": "russia_standard",
            "lastLaunch": "30 минут назад",
            "authStatus": "Авторизован",
            "lastLogin": "2025-10-31 00:30:21",
            "profileSize": "41.5 МБ",
        }),
    },
]


def seed_database():
    """Seed database with test accounts"""
    db = SessionLocal()
    try:
        # Check if accounts already exist
        from db import get_accounts

        existing = get_accounts(db)
        if existing:
            print(f"⚠ Database already has {len(existing)} accounts")
            response = input("Clear and reseed? (y/N): ")
            if response.lower() != "y":
                print("Seeding cancelled")
                return

            # Clear existing accounts
            for account in existing:
                db.delete(account)
            db.commit()
            print("✓ Cleared existing accounts")

        # Create test accounts
        for account_data in TEST_ACCOUNTS:
            account = create_account(db, **account_data)
            print(f"✓ Created account: {account.name}")

        print(f"\n✅ Successfully seeded {len(TEST_ACCOUNTS)} test accounts")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
