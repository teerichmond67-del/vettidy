create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view profiles of their pack-mates"
  on profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from pack_members pm1
      join pack_members pm2 on pm1.pack_id = pm2.pack_id
      where pm1.user_id = auth.uid() and pm2.user_id = profiles.id
    )
  );

-- Extend the existing signup trigger (phase 2) to also mirror the user's
-- email into profiles, so pack-mates can be shown by email in the UI.
-- auth.users itself is never exposed to PostgREST/the client.
create or replace function internal.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_pack_id uuid;
begin
  insert into profiles (id, email)
  values (new.id, new.email);

  insert into packs (name)
  values (coalesce(split_part(new.email, '@', 1), 'My') || '''s Pack')
  returning id into new_pack_id;

  insert into pack_members (pack_id, user_id, role)
  values (new_pack_id, new.id, 'owner');

  return new;
end;
$$;
