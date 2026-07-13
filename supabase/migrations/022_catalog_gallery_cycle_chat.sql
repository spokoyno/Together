-- Catalog panels (games, TV, cartoons, anime), gallery comments, menstrual cycle, partner nickname, message delete.

create type public.catalog_kind as enum ('game', 'tv_series', 'cartoon_series', 'anime');

create table if not exists public.catalog_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  added_by uuid not null references public.profiles(id) on delete cascade,
  kind public.catalog_kind not null,
  external_id integer not null,
  title text not null check (char_length(title) between 1 and 160),
  poster_url text,
  status text not null default 'want' check (status in ('want', 'completed')),
  ratings jsonb not null default '{}'::jsonb,
  reviews jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (couple_id, kind, external_id)
);

create index if not exists catalog_entries_couple_kind_idx
  on public.catalog_entries (couple_id, kind, created_at desc);

alter table public.catalog_entries enable row level security;

create policy "catalog_entries_members_select"
on public.catalog_entries for select to authenticated
using (public.is_couple_member(couple_id));

create policy "catalog_entries_members_insert"
on public.catalog_entries for insert to authenticated
with check (public.is_couple_member(couple_id) and added_by = auth.uid());

create policy "catalog_entries_members_update"
on public.catalog_entries for update to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "catalog_entries_members_delete"
on public.catalog_entries for delete to authenticated
using (public.is_couple_member(couple_id));

grant select, insert, update, delete on public.catalog_entries to authenticated;

create table if not exists public.gallery_comments (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.couple_gallery(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists gallery_comments_gallery_idx
  on public.gallery_comments (gallery_id, created_at asc);

alter table public.gallery_comments enable row level security;

create policy "gallery_comments_members_select"
on public.gallery_comments for select to authenticated
using (
  gallery_id in (
    select id from public.couple_gallery where public.is_couple_member(couple_id)
  )
);

create policy "gallery_comments_members_insert"
on public.gallery_comments for insert to authenticated
with check (
  author_id = auth.uid()
  and gallery_id in (
    select id from public.couple_gallery where public.is_couple_member(couple_id)
  )
);

grant select, insert on public.gallery_comments to authenticated;

alter table public.profiles
  add column if not exists partner_nickname text check (char_length(partner_nickname) <= 40);

create table if not exists public.menstrual_cycles (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  tracked_by uuid not null references public.profiles(id) on delete cascade,
  last_period_start date,
  cycle_length_days int not null default 28 check (cycle_length_days between 20 and 45),
  period_length_days int not null default 5 check (period_length_days between 2 and 10),
  updated_at timestamptz not null default now()
);

alter table public.menstrual_cycles enable row level security;

create policy "menstrual_cycles_members_select"
on public.menstrual_cycles for select to authenticated
using (public.is_couple_member(couple_id));

create policy "menstrual_cycles_tracked_by_upsert"
on public.menstrual_cycles for insert to authenticated
with check (
  public.is_couple_member(couple_id)
  and tracked_by = auth.uid()
);

create policy "menstrual_cycles_tracked_by_update"
on public.menstrual_cycles for update to authenticated
using (public.is_couple_member(couple_id) and tracked_by = auth.uid())
with check (public.is_couple_member(couple_id) and tracked_by = auth.uid());

grant select, insert, update on public.menstrual_cycles to authenticated;

drop policy if exists "messages_members_delete_own" on public.messages;

create policy "messages_members_delete_own"
on public.messages for delete to authenticated
using (public.is_couple_member(couple_id) and sender_id = auth.uid());

grant delete on public.messages to authenticated;
