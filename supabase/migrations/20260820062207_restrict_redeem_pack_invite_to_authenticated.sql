revoke execute on function public.redeem_pack_invite(text) from anon;
revoke execute on function public.redeem_pack_invite(text) from public;
grant execute on function public.redeem_pack_invite(text) to authenticated;
