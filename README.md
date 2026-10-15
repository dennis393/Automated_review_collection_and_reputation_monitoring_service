# Replyo AI — мониторинг отзывов и автоответы через Telegram

B2B SaaS-сервис для бизнеса: следит за новыми отзывами на картах и маркетплейсах,
мгновенно присылает уведомление в Telegram и готовый черновик ответа от LLM.
Вся работа — внутри Telegram: регистрация, управление филиалами и источниками —
через Mini App, реакция на отзывы (одобрить/отредактировать/отклонить) — прямо в чате с ботом.

## Возможности

- **Вход без пароля** — авторизация через `initData` Telegram Mini App (HMAC-проверка подписи бот-токеном), без email/пароля
- **Telegram Mini App** — онбординг, дашборд со статистикой, управление филиалами и источниками мониторинга, подключение маркетплейсов, просмотр отзывов
- **Telegram-бот** — push-уведомление о новом отзыве с черновиком ответа, инлайн-кнопки Одобрить / Отклонить / Редактировать, FSM для правки текста прямо в чате
- **LLM-генерация ответов** — черновик ответа на отзыв с учётом названия/описания компании, платформы, рейтинга и выбранного стиля (официальный/дружелюбный/нейтральный)
- **Интеграции с маркетплейсами** — Wildberries, Ozon, Yandex Market (официальные Seller API), шифрование токенов продавцов (Fernet)
- **Фоновый воркер** — периодически опрашивает подключённые источники, пишет новые отзывы, с защитой от дублей и изоляцией ошибок одного источника от остальных

## Технологии

| Слой | Технология |
|---|---|
| Backend API | FastAPI, SQLAlchemy 2 (async) + asyncpg, Alembic |
| База данных | PostgreSQL |
| Telegram-бот | aiogram v3 |
| Mini App | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| LLM | OpenAI API |
| Авторизация | JWT + Telegram `initData` (HMAC-SHA256) |
| Шифрование | `cryptography` (Fernet) — токены маркетплейсов |
| Контейнеризация | Docker, Docker Compose |

## Архитектура

```
                      ┌──────────────┐
                      │  Mini App    │  (React, открывается в Telegram)
                      └──────┬───────┘
                             │ HTTPS / JWT
                      ┌──────▼───────┐
                      │  FastAPI API │◄──────────┐
                      └──────┬───────┘           │
                             │                    │ читает/пишет
                      ┌──────▼───────┐            │
                      │  PostgreSQL  │◄───────────┤
                      └──────┬───────┘            │
                             │                    │
              ┌──────────────┼────────────┐       │
       ┌──────▼──────┐              ┌─────▼──────┐
       │ Telegram-бот │              │   Worker   │
       │  (aiogram)   │              │ (парсеры/  │
       │  уведомления │              │  маркетпл.)│
       └──────────────┘              └────────────┘
```

Четыре независимых процесса (`api`, `bot`, `worker`, `postgres`), связь — только через общую БД: воркер пишет найденные отзывы → бот подхватывает неотправленные, зовёт LLM и шлёт уведомление → Mini App и чат бота показывают один и тот же актуальный статус.

## Структура репозитория

```
├── API_Dev_B/            # FastAPI backend, auth, Telegram-бот
│   ├── main.py            # точка входа API
│   ├── orm.py              # SQLAlchemy-модели
│   ├── routs.py            # REST-эндпоинты
│   ├── secure.py           # JWT, Telegram initData, Fernet
│   └── tg_bot.py            # aiogram-бот
├── Dev_A/                 # Воркер, парсеры, LLM
│   ├── worker.py            # фоновый цикл опроса источников
│   ├── dispatcher.py        # роутинг платформ (карты / маркетплейсы)
│   ├── parsers/
│   │   ├── maps/              # Яндекс.Карты, 2ГИС, Google (заложено на будущее)
│   │   └── marketplaces/      # Wildberries, Ozon, Yandex Market, Uzum
│   └── llm/
│       └── draft_generator.py # генерация черновика ответа
├── frontend/               # Telegram Mini App (React + Vite)
├── alembic/                 # миграции БД
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## Быстрый старт (Docker)

```bash
cp .env.example .env     # заполнить реальными значениями
docker compose up --build

# применить миграции (первый запуск):
docker compose exec web alembic upgrade head
```

Поднимутся 4 сервиса: `db` (Postgres, порт `5433`), `web` (API, порт `8000`), `bot`, `worker`.

## Локальная разработка (без Docker)

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements-api.txt -r requirements-worker.txt

alembic upgrade head

cd API_Dev_B && uvicorn main:app --reload --port 8000   # API
python API_Dev_B/tg_bot.py                                 # бот
python Dev_A/worker.py                                      # воркер

cd frontend && npm install && npm run dev                 # Mini App
```

Для тестирования Mini App внутри настоящего Telegram локально нужен HTTPS-туннель (например, `ngrok`) — Telegram не откроет Mini App по `http://localhost`.

## Переменные окружения

См. `.env.example` — ключевые:

| Переменная | Назначение |
|---|---|
| `DATABASE_*` (`DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME`, `DB_PORT`) | подключение к Postgres |
| `SECRET_KEY`, `ALGORITHM`, `LIVE_MINUTES_TOKEN` | JWT |
| `ENCRYPTION_KEY` | Fernet-шифрование токенов маркетплейсов |
| `TG_BOT_TOKEN` | токен бота от @BotFather |
| `MINI_APP_URL` | HTTPS-адрес фронтенда, который открывает кнопка бота |
| `OPENAI_TOKEN` | ключ OpenAI API для генерации черновиков |
| `MAP_PARSE_INTERVAL`, `MARKETPLACE_PARSE_INTERVAL` | интервалы опроса источников (минуты) |

## Роли в команде

- **Dev A** — воркер, диспетчер платформ, парсеры карт/маркетплейсов, LLM-генерация
- **Dev B** — backend API, авторизация, Telegram-бот, Mini App

## Статус проекта

Пет-проект, развивается локально (без деплоя на прод-сервер). Осознанно не реализовано:
- Парсинг карт (Яндекс.Карты/2ГИС/Google) — защита антибот/CSRF-сессиями, отложено
- Uzum Market — нет публичного API отзывов
- Полный прод-деплой (VPS, домен)
