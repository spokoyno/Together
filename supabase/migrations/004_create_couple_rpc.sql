-- Reliable couple creation with automatic invitation token.
-- Also allows profile self-insert if signup trigger was not applied yet.

create policy "profiles_insert_self"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create or replace function public.create_couple(
  p_relationship_started_on date
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_token text;
  v_token_hash text;
  v_display_name text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if exists (
    select 1 from public.couple_members
    where user_id = v_user_id
  ) then
    raise exception 'already_in_couple';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_user_id
  ) then
    select nullif(trim(raw_user_meta_data->>'display_name'), '')
    into v_display_name
    from auth.users
    where id = v_user_id;

    insert into public.profiles (id, display_name)
    values (v_user_id, coalesce(v_display_name, 'Пользователь'));
  end if;

  insert into public.couples (created_by, relationship_started_on)
  values (v_user_id, p_relationship_started_on)
  returning id into v_couple_id;

  insert into public.couple_members (couple_id, user_id)
  values (v_couple_id, v_user_id);

  v_token := rtrim(
    translate(encode(gen_random_bytes(32), 'base64'), '+/', '-_'),
    '='
  );
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');

  insert into public.invitations (couple_id, created_by, token_hash, expires_at)
  values (
    v_couple_id,
    v_user_id,
    v_token_hash,
    now() + interval '7 days'
  );

  return json_build_object(
    'couple_id', v_couple_id,
    'invitation_token', v_token
  );
end;
$$;

create or replace function public.create_invitation()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_member_count integer;
  v_token text;
  v_token_hash text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select couple_id
  into v_couple_id
  from public.couple_members
  where user_id = v_user_id;

  if not found then
    raise exception 'not_in_couple';
  end if;

  select count(*)
  into v_member_count
  from public.couple_members
  where couple_id = v_couple_id;

  if v_member_count >= 2 then
    raise exception 'couple_complete';
  end if;

  v_token := rtrim(
    translate(encode(gen_random_bytes(32), 'base64'), '+/', '-_'),
    '='
  );
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');

  insert into public.invitations (couple_id, created_by, token_hash, expires_at)
  values (
    v_couple_id,
    v_user_id,
    v_token_hash,
    now() + interval '7 days'
  );

  return json_build_object('invitation_token', v_token);
end;
$$;

revoke all on function public.create_couple(date) from public;
grant execute on function public.create_couple(date) to authenticated;

revoke all on function public.create_invitation() from public;
grant execute on function public.create_invitation() to authenticated;
