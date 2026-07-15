# Администраторы приложения

Администраторы могут **удалять подборки Community picks** (общие коллекции фильмов, игр, сериалов и т.д.). Обычные пользователи могут создавать и лайкать подборки, но не удалять чужие.

Список админов хранится в таблице `public.app_admins` и **не редактируется из интерфейса приложения** — только через Supabase.

## Как добавить свой аккаунт администратором

### 1. Откройте Supabase Dashboard

Проект → **SQL Editor** → **New query**.

### 2. Узнайте UUID пользователя

**Вариант A — по email** (удобнее):

```sql
select id, email from auth.users where email = 'ваш@email.com';
```

**Вариант B** — в Dashboard: **Authentication** → **Users** → скопируйте **User UID**.

### 3. Добавьте себя в админы

```sql
insert into public.app_admins (user_id)
select id from auth.users where email = 'ваш@email.com'
on conflict (user_id) do nothing;
```

Или с явным UUID:

```sql
insert into public.app_admins (user_id)
values ('00000000-0000-0000-0000-000000000000')
on conflict (user_id) do nothing;
```

### 4. Проверка

Выйдите из приложения и войдите снова (или обновите страницу с подборками). На карточках Community picks у админа появится кнопка удаления (корзина → «Удалить»).

Проверка в SQL:

```sql
select a.user_id, u.email, a.created_at
from public.app_admins a
join auth.users u on u.id = a.user_id;
```

## Как снять права администратора

```sql
delete from public.app_admins
where user_id = (select id from auth.users where email = 'ваш@email.com');
```

## Локальная разработка

Примените миграцию:

```bash
npm run db:push
```

Если проект ещё не привязан к Supabase CLI:

```bash
npx supabase link --project-ref ВАШ_PROJECT_REF
npm run db:push
```

Либо выполните SQL из файла `supabase/migrations/027_app_admins.sql` вручную в SQL Editor.

## Безопасность

- Удаление подборок разрешено на уровне **RLS** (`shared_collections_delete_admin`), а не только в UI.
- Таблица `app_admins` доступна пользователям только на **чтение своей строки** (чтобы приложение могло показать кнопку удаления).
- Добавлять и удалять админов может только **service role** или SQL Editor в Dashboard.
