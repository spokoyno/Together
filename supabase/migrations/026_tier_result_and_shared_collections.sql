-- Tier list: optional profile result URL. Public shared collections with likes and views.

alter table public.tier_list_challenges
  add column if not exists result_url text check (result_url is null or char_length(result_url) between 8 and 500);

create table if not exists public.shared_collections (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('movie', 'game', 'tv_series', 'cartoon_series', 'anime', 'book')),
  title text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 500),
  author_id uuid not null references public.profiles(id) on delete cascade,
  view_count integer not null default 0 check (view_count >= 0),
  like_count integer not null default 0 check (like_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.shared_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.shared_collections(id) on delete cascade,
  external_id text,
  title text not null check (char_length(title) between 1 and 200),
  poster_path text,
  subtitle text check (subtitle is null or char_length(subtitle) <= 200),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.shared_collection_likes (
  collection_id uuid not null references public.shared_collections(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (collection_id, user_id)
);

create index if not exists shared_collections_kind_created_idx
  on public.shared_collections (kind, created_at desc);

create index if not exists shared_collections_kind_views_idx
  on public.shared_collections (kind, view_count desc);

create index if not exists shared_collections_kind_likes_idx
  on public.shared_collections (kind, like_count desc);

create or replace function public.sync_shared_collection_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.shared_collections
    set like_count = like_count + 1
    where id = new.collection_id;
  elsif tg_op = 'DELETE' then
    update public.shared_collections
    set like_count = greatest(0, like_count - 1)
    where id = old.collection_id;
  end if;
  return null;
end;
$$;

drop trigger if exists shared_collection_likes_count on public.shared_collection_likes;
create trigger shared_collection_likes_count
after insert or delete on public.shared_collection_likes
for each row execute function public.sync_shared_collection_like_count();

create or replace function public.record_shared_collection_view(p_collection_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  update public.shared_collections
  set view_count = view_count + 1
  where id = p_collection_id;
end;
$$;

alter table public.shared_collections enable row level security;
alter table public.shared_collection_items enable row level security;
alter table public.shared_collection_likes enable row level security;

create policy "shared_collections_select_authenticated"
on public.shared_collections for select to authenticated
using (true);

create policy "shared_collections_insert_own"
on public.shared_collections for insert to authenticated
with check (author_id = auth.uid());

create policy "shared_collections_update_own"
on public.shared_collections for update to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "shared_collections_delete_own"
on public.shared_collections for delete to authenticated
using (author_id = auth.uid());

create policy "shared_collection_items_select_authenticated"
on public.shared_collection_items for select to authenticated
using (true);

create policy "shared_collection_items_insert_own"
on public.shared_collection_items for insert to authenticated
with check (
  collection_id in (select id from public.shared_collections where author_id = auth.uid())
);

create policy "shared_collection_items_delete_own"
on public.shared_collection_items for delete to authenticated
using (
  collection_id in (select id from public.shared_collections where author_id = auth.uid())
);

create policy "shared_collection_likes_select_authenticated"
on public.shared_collection_likes for select to authenticated
using (true);

create policy "shared_collection_likes_insert_own"
on public.shared_collection_likes for insert to authenticated
with check (user_id = auth.uid());

create policy "shared_collection_likes_delete_own"
on public.shared_collection_likes for delete to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete on public.shared_collections to authenticated;
grant select, insert, delete on public.shared_collection_items to authenticated;
grant select, insert, delete on public.shared_collection_likes to authenticated;
grant execute on function public.record_shared_collection_view(uuid) to authenticated;
