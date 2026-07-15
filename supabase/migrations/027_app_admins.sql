-- App administrators: can delete shared collections (Community picks).
-- Managed only via Supabase SQL Editor / service role, not from the app UI.

create table if not exists public.app_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

create policy "app_admins_select_self"
on public.app_admins for select to authenticated
using (user_id = auth.uid());

grant select on public.app_admins to authenticated;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins where user_id = auth.uid()
  );
$$;

grant execute on function public.is_app_admin() to authenticated;

drop policy if exists "shared_collections_delete_own" on public.shared_collections;

create policy "shared_collections_delete_admin"
on public.shared_collections for delete to authenticated
using (public.is_app_admin());
