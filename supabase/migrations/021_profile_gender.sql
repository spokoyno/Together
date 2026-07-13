create type public.profile_gender as enum ('female', 'male', 'other');

alter table public.profiles
  add column if not exists gender public.profile_gender;
