-- Plans reminders, partner nicknames, rich moments, chat images, storage.

alter table public.plans
  add column remind_enabled boolean not null default false;

alter table public.profiles
  add column notifications_enabled boolean not null default true;

create type public.moment_type as enum ('memory', 'movie', 'cooking', 'photo');

alter table public.memories
  add column moment_type public.moment_type not null default 'memory',
  add column meta jsonb not null default '{}'::jsonb;

alter table public.messages
  add column image_path text,
  alter column body drop not null;

alter table public.messages
  drop constraint if exists messages_body_check;

alter table public.messages
  add constraint messages_content_check check (
    (body is not null and char_length(trim(body)) between 1 and 2000)
    or (image_path is not null and char_length(image_path) > 0)
  );

create table public.partner_nicknames (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 40),
  created_at timestamptz not null default now()
);

create index partner_nicknames_couple_target_idx
  on public.partner_nicknames (couple_id, target_user_id, created_at desc);

alter table public.partner_nicknames enable row level security;

create policy "partner_nicknames_members_select"
on public.partner_nicknames for select
to authenticated
using (public.is_couple_member(couple_id));

create policy "partner_nicknames_members_insert"
on public.partner_nicknames for insert
to authenticated
with check (
  public.is_couple_member(couple_id)
  and author_id = auth.uid()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'couple-media',
  'couple-media',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "couple_media_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'couple-media'
  and (storage.foldername(name))[1] in (
    select couple_id::text
    from public.couple_members
    where user_id = auth.uid()
  )
);

create policy "couple_media_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'couple-media'
  and (storage.foldername(name))[1] in (
    select couple_id::text
    from public.couple_members
    where user_id = auth.uid()
  )
);

create policy "couple_media_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'couple-media'
  and (storage.foldername(name))[1] in (
    select couple_id::text
    from public.couple_members
    where user_id = auth.uid()
  )
);
