-- Pair flow: validate invitations, switch incomplete pairs, cleanup on leave.

create or replace function public.validate_invitation(invitation_token text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_invitation public.invitations%rowtype;
  v_member_count integer;
begin
  select *
  into v_invitation
  from public.invitations
  where token_hash = encode(digest(invitation_token, 'sha256'), 'hex');

  if not found then
    return json_build_object('valid', false, 'reason', 'invalid');
  end if;

  if v_invitation.accepted_at is not null then
    return json_build_object('valid', false, 'reason', 'accepted');
  end if;

  if v_invitation.expires_at <= now() then
    return json_build_object('valid', false, 'reason', 'expired');
  end if;

  select count(*)
  into v_member_count
  from public.couple_members
  where couple_id = v_invitation.couple_id;

  if v_member_count >= 2 then
    return json_build_object('valid', false, 'reason', 'couple_full');
  end if;

  return json_build_object('valid', true, 'couple_id', v_invitation.couple_id);
end;
$$;

create or replace function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
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

  delete from public.couple_members
  where user_id = v_user_id and couple_id = v_couple_id;

  update public.invitations
  set expires_at = now()
  where couple_id = v_couple_id
    and accepted_at is null
    and expires_at > now();
end;
$$;

create or replace function public.leave_and_accept_invitation(invitation_token text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_invitation public.invitations%rowtype;
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_member_count integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select couple_id
  into v_couple_id
  from public.couple_members
  where user_id = v_user_id;

  if found then
    select count(*)
    into v_member_count
    from public.couple_members
    where couple_id = v_couple_id;

    if v_member_count >= 2 then
      raise exception 'couple_complete';
    end if;

    delete from public.couple_members
    where user_id = v_user_id and couple_id = v_couple_id;

    update public.invitations
    set expires_at = now()
    where couple_id = v_couple_id
      and accepted_at is null
      and expires_at > now();
  end if;

  select *
  into v_invitation
  from public.invitations
  where token_hash = encode(digest(invitation_token, 'sha256'), 'hex')
    and accepted_at is null
    and expires_at > now();

  if not found then
    raise exception 'invalid_or_expired_invitation';
  end if;

  select count(*)
  into v_member_count
  from public.couple_members
  where couple_id = v_invitation.couple_id;

  if v_member_count >= 2 then
    raise exception 'couple_full';
  end if;

  insert into public.couple_members (couple_id, user_id)
  values (v_invitation.couple_id, v_user_id);

  update public.invitations
  set accepted_at = now()
  where id = v_invitation.id;

  return v_invitation.couple_id;
end;
$$;
