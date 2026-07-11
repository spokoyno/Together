# Architecture

## Приложение

- Next.js App Router.
- Server Components по умолчанию.
- Client Components для интерактивных элементов.
- Server Actions или Route Handlers для доверенных мутаций.
- Zod для проверки внешнего ввода.

## Данные

- Supabase Auth.
- PostgreSQL.
- RLS для каждой таблицы публичной схемы.
- Storage позднее, после определения bucket policies.

## Деплой

- приватный GitHub;
- Vercel Preview для веток;
- Vercel Production из `main`;
- переменные окружения отдельно для Development, Preview и Production.

## Границы

UI не считается механизмом авторизации. Даже если кнопка скрыта, Supabase должен запрещать запрос постороннему пользователю.

## Предлагаемая структура

```text
src/
  app/
  components/
    ui/
    features/
  lib/
    supabase/
    validation/
  types/
supabase/
  migrations/
prompts/
docs/
```
