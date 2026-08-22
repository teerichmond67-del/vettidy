create function public.redeem_pack_invite(invite_code text)
returns pack_members
language plpgsql
security definer
set search_path = public
as $$
declare
  invite pack_invites;
  new_membership pack_members;
begin
  select * into invite from pack_invites where code = invite_code;

  if invite is null then
    raise exception 'Invite not found.';
  end if;

  if invite.used_at is not null then
    raise exception 'This invite has already been used.';
  end if;

  if invite.expires_at < now() then
    raise exception 'This invite has expired.';
  end if;

  if exists (
    select 1 from pack_members where pack_id = invite.pack_id and user_id = auth.uid()
  ) then
    raise exception 'You are already a member of this pack.';
  end if;

  insert into pack_members (pack_id, user_id, role)
  values (invite.pack_id, auth.uid(), invite.role)
  returning * into new_membership;

  update pack_invites set used_at = now(), used_by = auth.uid() where id = invite.id;

  return new_membership;
end;
$$;

revoke all on function public.redeem_pack_invite(text) from public;
grant execute on function public.redeem_pack_invite(text) to authenticated;
