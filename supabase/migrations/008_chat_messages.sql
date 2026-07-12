-- Private couple chat messages.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_couple_created_idx
  on public.messages (couple_id, created_at desc);

alter table public.messages enable row level security;

create policy "messages_members_select"
on public.messages for select
to authenticated
using (public.is_couple_member(couple_id));

create policy "messages_members_insert"
on public.messages for insert
to authenticated
with check (
  public.is_couple_member(couple_id)
  and sender_id = auth.uid()
);

alter publication supabase_realtime add table public.messages;
