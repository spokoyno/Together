-- Chat: replies, voice messages, likes; moods: custom emoji/label

alter table public.messages
  add column if not exists reply_to_id uuid references public.messages(id) on delete set null,
  add column if not exists audio_path text;

alter table public.messages drop constraint if exists messages_content_check;

alter table public.messages add constraint messages_content_check check (
  (body is not null and char_length(trim(body)) > 0)
  or (image_path is not null and char_length(trim(image_path)) > 0)
  or (audio_path is not null and char_length(trim(audio_path)) > 0)
);

create index if not exists messages_reply_to_idx on public.messages (reply_to_id);

create table if not exists public.message_likes (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists message_likes_message_idx on public.message_likes (message_id);

alter table public.message_likes enable row level security;

create policy "message_likes_members_select"
on public.message_likes for select
to authenticated
using (
  exists (
    select 1
    from public.messages m
    where m.id = message_id
      and public.is_couple_member(m.couple_id)
  )
);

create policy "message_likes_members_insert"
on public.message_likes for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.messages m
    where m.id = message_id
      and public.is_couple_member(m.couple_id)
  )
);

create policy "message_likes_members_delete"
on public.message_likes for delete
to authenticated
using (user_id = auth.uid());

alter table public.moods
  add column if not exists custom_label text check (custom_label is null or char_length(custom_label) between 1 and 40),
  add column if not exists custom_emoji text check (custom_emoji is null or char_length(custom_emoji) between 1 and 8);
