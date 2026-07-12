-- Secure pairing RPCs and tighter couple_members insert policy.

drop policy if exists "members_insert_self" on public.couple_members;

create policy "members_insert_as_creator"
on public.couple_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and not exists (
    select 1 from public.couple_members existing
    where existing.user_id = auth.uid()
  )
  and exists (
    select 1 from public.couples c
    where c.id = couple_id
      and c.created_by = auth.uid()
  )
);

create policy "couples_update_members"
on public.couples for update
to authenticated
using (public.is_couple_member(id))
with check (public.is_couple_member(id));

create or replace function public.accept_invitation(invitation_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.invitations%rowtype;
  v_user_id uuid := auth.uid();
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

  select *
  into v_invitation
  from public.invitations
  where token_hash = encode(digest(invitation_token, 'sha256'), 'hex')
    and accepted_at is null
    and expires_at > now();

  if not found then
    raise exception 'invalid_or_expired_invitation';
  end if;

  insert into public.couple_members (couple_id, user_id)
  values (v_invitation.couple_id, v_user_id);

  update public.invitations
  set accepted_at = now()
  where id = v_invitation.id;

  return v_invitation.couple_id;
end;
$$;

create or replace function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = public
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
end;
$$;

revoke all on function public.accept_invitation(text) from public;
grant execute on function public.accept_invitation(text) to authenticated;

revoke all on function public.leave_couple() from public;
grant execute on function public.leave_couple() to authenticated;
