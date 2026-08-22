-- Security-definer helpers so RLS policies can check pack membership
-- without recursively re-triggering RLS on pack_members.

create or replace function pack_role(target_pack_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from pack_members
  where pack_id = target_pack_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function pet_pack_role(target_pet_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select pack_role(pack_id) from pets where id = target_pet_id;
$$;

create or replace function medication_pack_role(target_medication_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select pet_pack_role(pet_id) from medications where id = target_medication_id;
$$;

-- packs: members can view; only the owner can update/delete.
-- No client-side insert policy — packs are created server-side
-- (service role) as part of the first-sign-in flow.
alter table packs enable row level security;

create policy "Pack members can view their pack"
  on packs for select
  using (pack_role(id) is not null);

create policy "Pack owner can update pack"
  on packs for update
  using (pack_role(id) = 'owner');

create policy "Pack owner can delete pack"
  on packs for delete
  using (pack_role(id) = 'owner');

-- pack_members: members can view the roster; only the owner can
-- invite, change roles, or remove members (spec §8.1).
alter table pack_members enable row level security;

create policy "Pack members can view membership list"
  on pack_members for select
  using (pack_role(pack_id) is not null);

create policy "Pack owner can invite members"
  on pack_members for insert
  with check (pack_role(pack_id) = 'owner');

create policy "Pack owner can update member roles"
  on pack_members for update
  using (pack_role(pack_id) = 'owner');

create policy "Pack owner can remove members"
  on pack_members for delete
  using (pack_role(pack_id) = 'owner');

-- pets: any pack member can view (incl. sitter_view_only);
-- only owner/caregiver can write.
alter table pets enable row level security;

create policy "Pack members can view pets"
  on pets for select
  using (pack_role(pack_id) is not null);

create policy "Owner and caregiver can insert pets"
  on pets for insert
  with check (pack_role(pack_id) in ('owner', 'caregiver'));

create policy "Owner and caregiver can update pets"
  on pets for update
  using (pack_role(pack_id) in ('owner', 'caregiver'));

create policy "Owner and caregiver can delete pets"
  on pets for delete
  using (pack_role(pack_id) in ('owner', 'caregiver'));

-- documents
alter table documents enable row level security;

create policy "Pack members can view documents"
  on documents for select
  using (pet_pack_role(pet_id) is not null);

create policy "Owner and caregiver can insert documents"
  on documents for insert
  with check (pet_pack_role(pet_id) in ('owner', 'caregiver'));

create policy "Owner and caregiver can update documents"
  on documents for update
  using (pet_pack_role(pet_id) in ('owner', 'caregiver'));

create policy "Owner and caregiver can delete documents"
  on documents for delete
  using (pet_pack_role(pet_id) in ('owner', 'caregiver'));

-- vaccinations
alter table vaccinations enable row level security;

create policy "Pack members can view vaccinations"
  on vaccinations for select
  using (pet_pack_role(pet_id) is not null);

create policy "Owner and caregiver can insert vaccinations"
  on vaccinations for insert
  with check (pet_pack_role(pet_id) in ('owner', 'caregiver'));

create policy "Owner and caregiver can update vaccinations"
  on vaccinations for update
  using (pet_pack_role(pet_id) in ('owner', 'caregiver'));

create policy "Owner and caregiver can delete vaccinations"
  on vaccinations for delete
  using (pet_pack_role(pet_id) in ('owner', 'caregiver'));

-- medications
alter table medications enable row level security;

create policy "Pack members can view medications"
  on medications for select
  using (pet_pack_role(pet_id) is not null);

create policy "Owner and caregiver can insert medications"
  on medications for insert
  with check (pet_pack_role(pet_id) in ('owner', 'caregiver'));

create policy "Owner and caregiver can update medications"
  on medications for update
  using (pet_pack_role(pet_id) in ('owner', 'caregiver'));

create policy "Owner and caregiver can delete medications"
  on medications for delete
  using (pet_pack_role(pet_id) in ('owner', 'caregiver'));

-- dose_logs: an append-only audit trail. Any pack member can view;
-- owner/caregiver can log a dose but only as themselves
-- (logged_by must match the caller). No update/delete policy —
-- dose history must stay tamper-proof to actually prevent
-- double-dosing (spec §8.2).
alter table dose_logs enable row level security;

create policy "Pack members can view dose logs"
  on dose_logs for select
  using (medication_pack_role(medication_id) is not null);

create policy "Owner and caregiver can log a dose"
  on dose_logs for insert
  with check (
    medication_pack_role(medication_id) in ('owner', 'caregiver')
    and logged_by = auth.uid()
  );

-- weight_entries
alter table weight_entries enable row level security;

create policy "Pack members can view weight entries"
  on weight_entries for select
  using (pet_pack_role(pet_id) is not null);

create policy "Owner and caregiver can insert weight entries"
  on weight_entries for insert
  with check (pet_pack_role(pet_id) in ('owner', 'caregiver'));

create policy "Owner and caregiver can update weight entries"
  on weight_entries for update
  using (pet_pack_role(pet_id) in ('owner', 'caregiver'));

create policy "Owner and caregiver can delete weight entries"
  on weight_entries for delete
  using (pet_pack_role(pet_id) in ('owner', 'caregiver'));

-- reminders
alter table reminders enable row level security;

create policy "Pack members can view reminders"
  on reminders for select
  using (pet_pack_role(pet_id) is not null);

create policy "Owner and caregiver can insert reminders"
  on reminders for insert
  with check (pet_pack_role(pet_id) in ('owner', 'caregiver'));

create policy "Owner and caregiver can update reminders"
  on reminders for update
  using (pet_pack_role(pet_id) in ('owner', 'caregiver'));

create policy "Owner and caregiver can delete reminders"
  on reminders for delete
  using (pet_pack_role(pet_id) in ('owner', 'caregiver'));
