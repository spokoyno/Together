-- Mood irritated, movies status, shopping, wishlist, partner facts, gallery, tier challenges.

alter type public.mood_level add value if not exists 'irritated';

alter table public.movie_entries
  alter column tmdb_id drop not null;

alter table public.movie_entries
  add column if not exists status text not null default 'want'
    check (status in ('want', 'watched'));

alter table public.movie_entries
  add column if not exists source_message_id uuid references public.messages(id) on delete set null;

alter table public.movie_entries
  add column if not exists reviews jsonb not null default '{}'::jsonb;

alter table public.movie_entries
  drop constraint if exists movie_entries_couple_id_tmdb_id_key;

create unique index if not exists movie_entries_couple_tmdb_unique
  on public.movie_entries (couple_id, tmdb_id)
  where tmdb_id is not null;

create table if not exists public.movie_collections (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.movie_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.movie_collections(id) on delete cascade,
  movie_entry_id uuid references public.movie_entries(id) on delete cascade,
  title text check (char_length(title) between 1 and 160),
  tmdb_id integer,
  poster_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.shopping_notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  status text not null default 'open' check (status in ('open', 'closed')),
  closed_by uuid references public.profiles(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text check (char_length(description) <= 500),
  media_path text,
  status text not null default 'open' check (status in ('open', 'fulfilled')),
  fulfilled_by uuid references public.profiles(id) on delete set null,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_facts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  trait text not null check (char_length(trait) between 1 and 80),
  description text not null check (char_length(description) between 1 and 200),
  created_at timestamptz not null default now()
);

create table if not exists public.couple_gallery (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  media_path text not null,
  caption text check (char_length(caption) <= 200),
  created_at timestamptz not null default now()
);

create table if not exists public.tier_list_challenges (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  challenger_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  tier_list_url text not null check (char_length(tier_list_url) between 8 and 500),
  tier_list_title text not null check (char_length(tier_list_title) between 1 and 160),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  result_image_path text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.movie_collections enable row level security;
alter table public.movie_collection_items enable row level security;
alter table public.shopping_notes enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.partner_facts enable row level security;
alter table public.couple_gallery enable row level security;
alter table public.tier_list_challenges enable row level security;

create policy "movie_collections_members_all"
on public.movie_collections for all to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "movie_collection_items_members_all"
on public.movie_collection_items for all to authenticated
using (
  collection_id in (select id from public.movie_collections where public.is_couple_member(couple_id))
)
with check (
  collection_id in (select id from public.movie_collections where public.is_couple_member(couple_id))
);

create policy "shopping_notes_members_all"
on public.shopping_notes for all to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "shopping_notes_close"
on public.shopping_notes for update to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "wishlist_items_members_select"
on public.wishlist_items for select to authenticated
using (public.is_couple_member(couple_id));

create policy "wishlist_items_members_insert"
on public.wishlist_items for insert to authenticated
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "wishlist_items_members_update"
on public.wishlist_items for update to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "partner_facts_members_all"
on public.partner_facts for all to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id) and author_id = auth.uid());

create policy "couple_gallery_members_all"
on public.couple_gallery for all to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "tier_challenges_members_select"
on public.tier_list_challenges for select to authenticated
using (public.is_couple_member(couple_id));

create policy "tier_challenges_members_insert"
on public.tier_list_challenges for insert to authenticated
with check (
  public.is_couple_member(couple_id)
  and challenger_id = auth.uid()
  and target_user_id <> auth.uid()
);

create policy "tier_challenges_target_update"
on public.tier_list_challenges for update to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

grant select, insert, update, delete on public.movie_collections to authenticated;
grant select, insert, update, delete on public.movie_collection_items to authenticated;
grant select, insert, update, delete on public.shopping_notes to authenticated;
grant select, insert, update, delete on public.wishlist_items to authenticated;
grant select, insert, update, delete on public.partner_facts to authenticated;
grant select, insert, update, delete on public.couple_gallery to authenticated;
grant select, insert, update on public.tier_list_challenges to authenticated;
