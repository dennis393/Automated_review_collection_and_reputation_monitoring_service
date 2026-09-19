# Reviews Frontend

Фронтенд (React + Vite + TypeScript) для API из вашей OpenAPI-спецификации.

## Запуск

```bash
npm install
npm run dev
```

Приложение поднимется на `http://localhost:5173`.

## Настройка backend URL

Адрес API задаётся в файле `.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

Поменяйте на реальный адрес вашего FastAPI-сервера (в проде — на https-домен).

## Что реализовано

- **Auth**: регистрация (`/register`), логин (`/token`, OAuth2 password flow), хранение JWT в `localStorage`, автоподстановка `Authorization: Bearer` во все запросы, редирект на `/login` при 401.
- **Компании**: создание, просмотр списка, переименование (`/Create_company`, `/View_company`, `/rename_company/{id}`).
- **Филиалы**: создание, список, редактирование названия/адреса, удаление (`/add_filial`, `/get_filials`, `/update_name_or_address/{id}`, `/delete_filial/{id}`).
- **Источники отзывов**: выбор филиала → список источников, создание (по URL или Shop ID в зависимости от платформы), редактирование URL/активности, удаление (`/sources`, `/get_sourses/{filial_id}`, `/update_url_or_active_filial/{id}`, `/delete_sourse/{id}`).
- **Маркетплейсы (credentials)**: подключение (с полями client_id/campaign_id/business_id/shop_id по платформе), список, обновление токена, отключение (`/create_credential`, `/get_credential`, `/update_token_marketpalces/{id}`, `/disconnect_marketplace/{id}`).
- **Отзывы + AI-черновики**: список отзывов с черновиками ответов, просмотр, редактирование текста ответа, одобрение/отклонение (`/get_reviews_with_draft`, `/update_ai_draft/{id}`).
- **Telegram**: страница с токеном для подключения бота (`/telegram/token`).

## Структура

```
src/
  api/         — axios-клиент и функции для каждого раздела API
  context/     — AuthContext (текущий пользователь, login/logout)
  components/  — Layout, ProtectedRoute, Modal, Alert
  pages/       — страницы приложения
  types/       — TypeScript-типы из OpenAPI-схемы
```

## Сборка для продакшена

```bash
npm run build
```

Собранные файлы окажутся в `dist/`.
