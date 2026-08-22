create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_pack_id uuid;
begin
  insert into packs (name)
  values (coalesce(split_part(new.email, '@', 1), 'My') || '''s Pack')
  returning id into new_pack_id;

  insert into pack_members (pack_id, user_id, role)
  values (new_pack_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
