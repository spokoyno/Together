# Deployment

## GitHub

- только приватный repository;
- `main` — production;
- feature branches — Preview;
- перед первым push проверить `git status` и `git diff --cached`.

## Vercel

Импортировать GitHub repository.
Добавить:
- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
- `NEXT_PUBLIC_APP_URL`.

Переменные должны быть настроены отдельно для:
- Development;
- Preview;
- Production.

## Supabase redirects

Добавить:
- `http://localhost:3000/**`;
- production URL;
- нужные Vercel Preview URL patterns только после проверки официального формата в панели/документации.

## После деплоя

- открыть production;
- зарегистрировать тестового пользователя;
- проверить callback;
- проверить выход;
- проверить данные A/B/C;
- проверить мобильную установку PWA.
