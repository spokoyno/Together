-- Color palettes (replacing light/dark) and UI locale.

alter table public.profiles drop constraint if exists profiles_theme_preference_check;

update public.profiles
set theme_preference = case
  when theme_preference in ('blue', 'purple', 'emerald', 'amber', 'pink') then theme_preference
  when theme_preference = 'dark' then 'pink'
  else 'pink'
end;

alter table public.profiles
  add constraint profiles_theme_preference_check
  check (theme_preference is null or theme_preference in ('pink', 'blue', 'purple', 'emerald', 'amber'));

alter table public.profiles
  add column if not exists locale text not null default 'en';

alter table public.profiles drop constraint if exists profiles_locale_check;

alter table public.profiles
  add constraint profiles_locale_check
  check (locale in ('en', 'uk', 'es', 'de', 'it', 'zh', 'hi', 'pt', 'ja', 'tr', 'fr', 'ko'));
