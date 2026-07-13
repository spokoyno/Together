-- Poll scoring: mark correct options and store result score on completion.

alter table public.poll_options
  add column if not exists is_correct boolean not null default false;

alter table public.partner_polls
  add column if not exists score_correct smallint,
  add column if not exists score_total smallint;
