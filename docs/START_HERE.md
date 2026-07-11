# Начни здесь

## Цель

Получить первый приватный тестовый запуск без оплаты:

- локальная разработка в Cursor;
- Next.js PWA;
- Supabase для Auth и Postgres;
- приватный GitHub;
- Vercel для тестовой ссылки.

## Последовательность

### 1. Установи

- Node.js LTS;
- Git;
- Cursor;
- браузер;
- аккаунты GitHub, Supabase и Vercel.

### 2. Открой проект

```bash
npm install
npm run dev
```

### 3. Проверь качество

```bash
npm run typecheck
npm run lint
npm run build
```

### 4. Запусти Cursor-аудит

Открой `prompts/00_CURSOR_PROJECT_AUDIT.md`, скопируй промпт в Cursor Agent и разреши только чтение на первом шаге.

### 5. Подключи сервисы

Используй по очереди:
- `prompts/02_SUPABASE_SETUP.md`;
- `prompts/03_GITHUB_SETUP.md`;
- `prompts/04_VERCEL_SETUP.md`.

## Не делай

- не вставляй service role key в клиентский код;
- не отправляй секреты Cursor или в публичный чат;
- не коммить `.env.local`;
- не проси Cursor реализовать всё приложение одним запросом;
- не отключай RLS ради устранения ошибки;
- не добавляй реальных пользователей до проверки приватности.
