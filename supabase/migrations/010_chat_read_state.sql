-- Track last read timestamp for chat unread badges.

create table public.chat_read_state (
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, couple_id)
);

alter table public.chat_read_state enable row level security;

create policy "chat_read_state_select_own"
on public.chat_read_state for select
to authenticated
using (user_id = auth.uid());

create policy "chat_read_state_insert_own"
on public.chat_read_state for insert
to authenticated
with check (user_id = auth.uid() and public.is_couple_member(couple_id));

create policy "chat_read_state_update_own"
on public.chat_read_state for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and public.is_couple_member(couple_id));
