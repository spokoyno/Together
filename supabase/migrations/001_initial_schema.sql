create extension if not exists pgcrypto;

create type public.plan_status as enum ('active', 'completed', 'cancelled');
create type public.mood_level as enum ('great', 'good', 'neutral', 'low', 'hard');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_path text,
  birthday date,
  timezone text not null default 'Europe/Sofia',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  relationship_started_on date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id),
  unique (user_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.moods (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  level public.mood_level not null,
  energy smallint check (energy between 1 and 5),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 1 and 160),
  details text check (char_length(details) <= 2000),
  category text not null default 'other',
  due_at timestamptz,
  status public.plan_status not null default 'active',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text check (char_length(title) <= 160),
  body text check (char_length(body) <= 4000),
  happened_on date,
  media_path text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (title is not null or body is not null or media_path is not null)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null check (char_length(prompt) between 1 and 500),
  category text not null default 'general',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.daily_questions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  question_date date not null,
  created_at timestamptz not null default now(),
  unique (couple_id, question_date)
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  daily_question_id uuid not null references public.daily_questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer text not null check (char_length(answer) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (daily_question_id, user_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 1 and 160),
  starts_at timestamptz not null,
  recurrence_rule text,
  created_at timestamptz not null default now()
);

create or replace function public.is_couple_member(target_couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members
    where couple_id = target_couple_id
      and user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.invitations enable row level security;
alter table public.moods enable row level security;
alter table public.plans enable row level security;
alter table public.memories enable row level security;
alter table public.questions enable row level security;
alter table public.daily_questions enable row level security;
alter table public.answers enable row level security;
alter table public.events enable row level security;

create policy "profiles_select_self_or_partner"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.couple_members mine
    join public.couple_members theirs on theirs.couple_id = mine.couple_id
    where mine.user_id = auth.uid() and theirs.user_id = profiles.id
  )
);

create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "couples_select_members"
on public.couples for select
to authenticated
using (public.is_couple_member(id));

create policy "couples_insert_authenticated"
on public.couples for insert
to authenticated
with check (created_by = auth.uid());

create policy "members_select_same_couple"
on public.couple_members for select
to authenticated
using (public.is_couple_member(couple_id));

create policy "members_insert_self"
on public.couple_members for insert
to authenticated
with check (user_id = auth.uid());

create policy "invitations_manage_creator"
on public.invitations for all
to authenticated
using (created_by = auth.uid() or public.is_couple_member(couple_id))
with check (created_by = auth.uid() and public.is_couple_member(couple_id));

create policy "questions_read_active"
on public.questions for select
to authenticated
using (is_active = true);

create policy "moods_members_all"
on public.moods for all
to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id) and user_id = auth.uid());

create policy "plans_members_all"
on public.plans for all
to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "memories_members_all"
on public.memories for all
to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "daily_questions_members_all"
on public.daily_questions for all
to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "answers_members_all"
on public.answers for all
to authenticated
using (
  exists (
    select 1
    from public.daily_questions dq
    where dq.id = answers.daily_question_id
      and public.is_couple_member(dq.couple_id)
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.daily_questions dq
    where dq.id = answers.daily_question_id
      and public.is_couple_member(dq.couple_id)
  )
);

create policy "events_members_all"
on public.events for all
to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id) and created_by = auth.uid());
