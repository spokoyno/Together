-- User theme preference, saved chat messages and personal notes.

alter table public.profiles
  add column theme_preference text check (theme_preference in ('light', 'dark'));

create table public.chat_saved_messages (
  user_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, message_id)
);

create index chat_saved_messages_user_couple_idx
  on public.chat_saved_messages (user_id, couple_id, saved_at desc);

alter table public.chat_saved_messages enable row level security;

create policy "chat_saved_messages_select_own"
on public.chat_saved_messages for select
to authenticated
using (user_id = auth.uid());

create policy "chat_saved_messages_insert_own"
on public.chat_saved_messages for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_couple_member(couple_id)
  and exists (
    select 1
    from public.messages m
    where m.id = message_id
      and m.couple_id = chat_saved_messages.couple_id
  )
);

create policy "chat_saved_messages_delete_own"
on public.chat_saved_messages for delete
to authenticated
using (user_id = auth.uid());

create table public.chat_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chat_notes_user_couple_idx
  on public.chat_notes (user_id, couple_id, updated_at desc);

alter table public.chat_notes enable row level security;

create policy "chat_notes_select_own"
on public.chat_notes for select
to authenticated
using (user_id = auth.uid());

create policy "chat_notes_insert_own"
on public.chat_notes for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_couple_member(couple_id)
);

create policy "chat_notes_update_own"
on public.chat_notes for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and public.is_couple_member(couple_id));

create policy "chat_notes_delete_own"
on public.chat_notes for delete
to authenticated
using (user_id = auth.uid());
