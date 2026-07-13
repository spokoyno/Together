-- Books, polls, in-app notifications, tier comments, feed timestamps, dashboard panels.

alter table public.profiles
  add column if not exists dashboard_panels jsonb;

alter table public.movie_entries
  add column if not exists watched_at timestamptz;

create table if not exists public.book_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  added_by uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  author text check (char_length(author) <= 120),
  rating integer check (rating between 1 and 10),
  review text check (char_length(review) <= 1000),
  finished_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.tier_list_comments (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.tier_list_challenges(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.partner_polls (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.poll_questions (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.partner_polls(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 1 and 300),
  allows_text boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.poll_questions(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 120),
  sort_order integer not null default 0
);

create table if not exists public.poll_answers (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.partner_polls(id) on delete cascade,
  question_id uuid not null references public.poll_questions(id) on delete cascade,
  respondent_id uuid not null references public.profiles(id) on delete cascade,
  option_id uuid references public.poll_options(id) on delete set null,
  text_answer text check (char_length(text_answer) <= 500),
  created_at timestamptz not null default now(),
  unique (poll_id, question_id, respondent_id)
);

create table if not exists public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('tier_challenge', 'poll_invite', 'mood_change', 'event_reminder')),
  title text not null check (char_length(title) between 1 and 160),
  body text check (char_length(body) <= 300),
  link_path text check (char_length(link_path) <= 200),
  reference_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists in_app_notifications_user_unread_idx
  on public.in_app_notifications (user_id, read_at, created_at desc);

alter table public.book_entries enable row level security;
alter table public.tier_list_comments enable row level security;
alter table public.partner_polls enable row level security;
alter table public.poll_questions enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_answers enable row level security;
alter table public.in_app_notifications enable row level security;

create policy "book_entries_members_all"
on public.book_entries for all to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id) and added_by = auth.uid());

create policy "tier_list_comments_members_all"
on public.tier_list_comments for all to authenticated
using (
  challenge_id in (
    select id from public.tier_list_challenges where public.is_couple_member(couple_id)
  )
)
with check (
  challenge_id in (
    select id from public.tier_list_challenges where public.is_couple_member(couple_id)
  )
  and author_id = auth.uid()
);

create policy "partner_polls_members_select"
on public.partner_polls for select to authenticated
using (public.is_couple_member(couple_id));

create policy "partner_polls_members_insert"
on public.partner_polls for insert to authenticated
with check (
  public.is_couple_member(couple_id)
  and creator_id = auth.uid()
  and target_user_id <> auth.uid()
);

create policy "partner_polls_members_update"
on public.partner_polls for update to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "poll_questions_members_all"
on public.poll_questions for all to authenticated
using (
  poll_id in (select id from public.partner_polls where public.is_couple_member(couple_id))
)
with check (
  poll_id in (select id from public.partner_polls where public.is_couple_member(couple_id))
);

create policy "poll_options_members_all"
on public.poll_options for all to authenticated
using (
  question_id in (
    select pq.id from public.poll_questions pq
    join public.partner_polls pp on pp.id = pq.poll_id
    where public.is_couple_member(pp.couple_id)
  )
)
with check (
  question_id in (
    select pq.id from public.poll_questions pq
    join public.partner_polls pp on pp.id = pq.poll_id
    where public.is_couple_member(pp.couple_id)
  )
);

create policy "poll_answers_members_all"
on public.poll_answers for all to authenticated
using (
  poll_id in (select id from public.partner_polls where public.is_couple_member(couple_id))
)
with check (
  poll_id in (select id from public.partner_polls where public.is_couple_member(couple_id))
  and respondent_id = auth.uid()
);

create policy "in_app_notifications_recipient_select"
on public.in_app_notifications for select to authenticated
using (user_id = auth.uid() and public.is_couple_member(couple_id));

create policy "in_app_notifications_recipient_update"
on public.in_app_notifications for update to authenticated
using (user_id = auth.uid() and public.is_couple_member(couple_id))
with check (user_id = auth.uid() and public.is_couple_member(couple_id));

create policy "in_app_notifications_system_insert"
on public.in_app_notifications for insert to authenticated
with check (public.is_couple_member(couple_id));

grant select, insert, update, delete on public.book_entries to authenticated;
grant select, insert, update, delete on public.tier_list_comments to authenticated;
grant select, insert, update on public.partner_polls to authenticated;
grant select, insert, update, delete on public.poll_questions to authenticated;
grant select, insert, update, delete on public.poll_options to authenticated;
grant select, insert, update, delete on public.poll_answers to authenticated;
grant select, insert, update on public.in_app_notifications to authenticated;
