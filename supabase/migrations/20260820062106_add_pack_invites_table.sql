create table pack_invites (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid references packs(id) on delete cascade,
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  role text not null check (role in ('caregiver', 'sitter_view_only')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  used_by uuid references auth.users(id)
);

alter table pack_invites enable row level security;

create policy "Pack members can view pack invites"
  on pack_invites for select
  using (internal.pack_role(pack_id) is not null);

create policy "Pack owner can create invites"
  on pack_invites for insert
  with check (internal.pack_role(pack_id) = 'owner' and created_by = auth.uid());

create policy "Pack owner can delete invites"
  on pack_invites for delete
  using (internal.pack_role(pack_id) = 'owner');
