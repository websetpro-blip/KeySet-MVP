export type AccountStatus = "active" | "needs_login" | "error" | "working";

export interface AccountRecord {
  id: number;
  email: string;
  status: AccountStatus;
  proxy: string;
  fingerprint: string;
  lastLaunch: string;
  authStatus: string;
  lastLogin: string;
  profileSize: string;
}

export const accountsMock: AccountRecord[] = [
  {
    id: 1,
    email: "test1@yandex.ru",
    status: "active",
    proxy: "192.168.1.100:8080",
    fingerprint: "russia_standard",
    lastLaunch: "5 минут назад",
    authStatus: "Авторизован",
    lastLogin: "2025-10-31 01:00:00",
    profileSize: "45.2 МБ",
  },
  {
    id: 2,
    email: "test2@yandex.ru",
    status: "needs_login",
    proxy: "-",
    fingerprint: "no_spoofing",
    lastLaunch: "1 час назад",
    authStatus: "Неавторизован",
    lastLogin: "2025-10-30 15:30:00",
    profileSize: "32.1 МБ",
  },
  {
    id: 3,
    email: "test3@yandex.ru",
    status: "working",
    proxy: "10.0.0.18:9050",
    fingerprint: "kz_ultra",
    lastLaunch: "3 часа назад",
    authStatus: "В работе",
    lastLogin: "2025-10-28 12:14:00",
    profileSize: "28.4 МБ",
  },
  {
    id: 4,
    email: "ops-team@yandex.ru",
    status: "error",
    proxy: "172.16.10.12:8080",
    fingerprint: "ru_headless",
    lastLaunch: "11 минут назад",
    authStatus: "Ошибка подключения",
    lastLogin: "2025-10-26 18:00:00",
    profileSize: "51.9 МБ",
  },
];

export const proxySummary = {
  active: 23,
  dead: 5,
  avgPing: "420 ms",
};

export const quickActions = [
  { label: "Обновить статусы", description: "Пересканировать выбранные аккаунты" },
  { label: "Массовый запуск", description: "Одновременно открыть 5 браузеров" },
  { label: "Проверить авторизацию", description: "Проверить логины/пароли" },
  { label: "Экспорт списка", description: "Выгрузка CSV/JSON" },
];

export const historyMock = [
  { time: "09:43", description: "Аккаунт test1@yandex.ru успешно запущен" },
  { time: "09:15", description: "Перезапуск браузера (порт 9224)" },
  { time: "08:52", description: "Проверка авторизации для ops-team@yandex.ru" },
  { time: "08:17", description: "Импортировано 12 новых аккаунтов" },
];
