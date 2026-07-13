-- Query indexes for dashboard, plans, memories filters.

create index if not exists plans_couple_status_created_idx
  on public.plans (couple_id, status, created_at desc);

create index if not exists moods_couple_user_created_idx
  on public.moods (couple_id, user_id, created_at desc);

create index if not exists memories_couple_happened_idx
  on public.memories (couple_id, happened_on desc nulls last, created_at desc);

create index if not exists profiles_avatar_path_idx
  on public.profiles (id)
  where avatar_path is not null;
