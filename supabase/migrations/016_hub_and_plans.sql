-- Plans surprise flag, hub tables: comments, movies, cooking, compliments.

alter table public.plans
  add column if not exists is_surprise boolean not null default false;

create table public.moment_comments (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index moment_comments_memory_idx on public.moment_comments (memory_id, created_at);

create table public.movie_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  added_by uuid not null references public.profiles(id) on delete cascade,
  tmdb_id integer not null,
  title text not null check (char_length(title) between 1 and 160),
  poster_path text,
  ratings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (couple_id, tmdb_id)
);

create table public.cooking_dishes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  recipe text check (char_length(recipe) <= 4000),
  media_path text,
  status text not null default 'planned' check (status in ('planned', 'cooked')),
  cooked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.cooking_logs (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.cooking_dishes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text check (char_length(body) <= 500),
  media_path text,
  created_at timestamptz not null default now()
);

create table public.compliments (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now()
);

create table public.compliment_draw_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  last_draw_at timestamptz
);

alter table public.moment_comments enable row level security;
alter table public.movie_entries enable row level security;
alter table public.cooking_dishes enable row level security;
alter table public.cooking_logs enable row level security;
alter table public.compliments enable row level security;
alter table public.compliment_draw_state enable row level security;

create policy "moment_comments_members_all"
on public.moment_comments for all to authenticated
using (
  memory_id in (select id from public.memories where public.is_couple_member(couple_id))
)
with check (
  author_id = auth.uid()
  and memory_id in (select id from public.memories where public.is_couple_member(couple_id))
);

create policy "movie_entries_members_all"
on public.movie_entries for all to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id) and added_by = auth.uid());

create policy "cooking_dishes_members_all"
on public.cooking_dishes for all to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "cooking_logs_members_all"
on public.cooking_logs for all to authenticated
using (
  dish_id in (select id from public.cooking_dishes where public.is_couple_member(couple_id))
)
with check (
  author_id = auth.uid()
  and dish_id in (select id from public.cooking_dishes where public.is_couple_member(couple_id))
);

create policy "compliments_members_select"
on public.compliments for select to authenticated
using (public.is_couple_member(couple_id));

create policy "compliments_members_insert"
on public.compliments for insert to authenticated
with check (
  public.is_couple_member(couple_id)
  and author_id = auth.uid()
  and target_user_id <> auth.uid()
);

create policy "compliments_target_delete"
on public.compliments for delete to authenticated
using (target_user_id = auth.uid());

create policy "compliment_draw_state_own"
on public.compliment_draw_state for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
