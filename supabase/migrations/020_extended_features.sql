-- Extended hub: books status, onboarding, travel, chores, countdowns, habits, daily questions seed.

-- book_entries: want/read flow like movies
alter table public.book_entries
  add column if not exists status text not null default 'want'
    check (status in ('want', 'read'));

alter table public.book_entries
  add column if not exists read_at timestamptz;

alter table public.book_entries
  add column if not exists ratings jsonb not null default '{}'::jsonb;

alter table public.book_entries
  add column if not exists reviews jsonb not null default '{}'::jsonb;

drop policy if exists "book_entries_members_all" on public.book_entries;

create policy "book_entries_members_select"
on public.book_entries for select to authenticated
using (public.is_couple_member(couple_id));

create policy "book_entries_members_insert"
on public.book_entries for insert to authenticated
with check (public.is_couple_member(couple_id) and added_by = auth.uid());

create policy "book_entries_members_update"
on public.book_entries for update to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "book_entries_members_delete"
on public.book_entries for delete to authenticated
using (public.is_couple_member(couple_id) and added_by = auth.uid());

-- profiles: onboarding and distance
alter table public.profiles
  add column if not exists partner_distance text
    check (partner_distance is null or partner_distance in ('long_distance', 'nearby', 'living_together'));

alter table public.profiles
  add column if not exists onboarding_step text not null default 'profile'
    check (onboarding_step in ('profile', 'invite', 'distance', 'done'));

-- travel_plans
create table if not exists public.travel_plans (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  country text not null check (char_length(country) between 1 and 80),
  description text check (char_length(description) <= 500),
  planned_date date,
  status text not null default 'planned' check (status in ('planned', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- household_chores
create table if not exists public.household_chores (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  due_date date,
  assigned_to uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'done')),
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- countdown_events
create table if not exists public.countdown_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  target_date date not null,
  show_on_dashboard boolean not null default true,
  created_at timestamptz not null default now()
);

-- habits
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text check (char_length(description) <= 500),
  motivation text check (char_length(motivation) <= 500),
  planned_date date,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now()
);

-- in_app_notifications: add daily_answer type
alter table public.in_app_notifications
  drop constraint if exists in_app_notifications_type_check;

alter table public.in_app_notifications
  add constraint in_app_notifications_type_check
  check (type in ('tier_challenge', 'poll_invite', 'mood_change', 'event_reminder', 'daily_answer'));

-- seed questions if empty
do $$
begin
  if (select count(*) from public.questions) = 0 then
    insert into public.questions (prompt, category, is_active) values
      ('Что ты больше всего ценишь в наших отношениях?', 'couple', true),
      ('Какой общий момент из прошлой недели тебе запомнился?', 'couple', true),
      ('Что бы ты хотел(а) сделать вместе в ближайший месяц?', 'couple', true),
      ('Как я могу сделать твой день лучше?', 'couple', true),
      ('О чём ты мечтал(а) в детстве и до сих пор хочешь попробовать?', 'couple', true),
      ('Какой маленький жест от меня тебе особенно приятен?', 'couple', true),
      ('Если бы мы могли мгновенно оказаться где угодно на выходные, куда бы ты поехал(а)?', 'couple', true);
  end if;
end $$;

-- RLS
alter table public.travel_plans enable row level security;
alter table public.household_chores enable row level security;
alter table public.countdown_events enable row level security;
alter table public.habits enable row level security;

create policy "travel_plans_members_select"
on public.travel_plans for select to authenticated
using (public.is_couple_member(couple_id));

create policy "travel_plans_members_insert"
on public.travel_plans for insert to authenticated
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "travel_plans_members_update"
on public.travel_plans for update to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "travel_plans_members_delete"
on public.travel_plans for delete to authenticated
using (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "household_chores_members_select"
on public.household_chores for select to authenticated
using (public.is_couple_member(couple_id));

create policy "household_chores_members_insert"
on public.household_chores for insert to authenticated
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "household_chores_members_update"
on public.household_chores for update to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "household_chores_members_delete"
on public.household_chores for delete to authenticated
using (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "countdown_events_members_select"
on public.countdown_events for select to authenticated
using (public.is_couple_member(couple_id));

create policy "countdown_events_members_insert"
on public.countdown_events for insert to authenticated
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "countdown_events_members_update"
on public.countdown_events for update to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "countdown_events_members_delete"
on public.countdown_events for delete to authenticated
using (public.is_couple_member(couple_id));

create policy "habits_members_select"
on public.habits for select to authenticated
using (public.is_couple_member(couple_id));

create policy "habits_members_insert"
on public.habits for insert to authenticated
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "habits_members_update"
on public.habits for update to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "habits_members_delete"
on public.habits for delete to authenticated
using (public.is_couple_member(couple_id) and created_by = auth.uid());

grant select, insert, update, delete on public.travel_plans to authenticated;
grant select, insert, update, delete on public.household_chores to authenticated;
grant select, insert, update, delete on public.countdown_events to authenticated;
grant select, insert, update, delete on public.habits to authenticated;
