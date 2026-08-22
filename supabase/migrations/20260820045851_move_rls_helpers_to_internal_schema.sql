drop policy "Pack members can view their pack" on packs;
drop policy "Pack owner can update pack" on packs;
drop policy "Pack owner can delete pack" on packs;

drop policy "Pack members can view membership list" on pack_members;
drop policy "Pack owner can invite members" on pack_members;
drop policy "Pack owner can update member roles" on pack_members;
drop policy "Pack owner can remove members" on pack_members;

drop policy "Pack members can view pets" on pets;
drop policy "Owner and caregiver can insert pets" on pets;
drop policy "Owner and caregiver can update pets" on pets;
drop policy "Owner and caregiver can delete pets" on pets;

drop policy "Pack members can view documents" on documents;
drop policy "Owner and caregiver can insert documents" on documents;
drop policy "Owner and caregiver can update documents" on documents;
drop policy "Owner and caregiver can delete documents" on documents;

drop policy "Pack members can view vaccinations" on vaccinations;
drop policy "Owner and caregiver can insert vaccinations" on vaccinations;
drop policy "Owner and caregiver can update vaccinations" on vaccinations;
drop policy "Owner and caregiver can delete vaccinations" on vaccinations;

drop policy "Pack members can view medications" on medications;
drop policy "Owner and caregiver can insert medications" on medications;
drop policy "Owner and caregiver can update medications" on medications;
drop policy "Owner and caregiver can delete medications" on medications;

drop policy "Pack members can view dose logs" on dose_logs;
drop policy "Owner and caregiver can log a dose" on dose_logs;

drop policy "Pack members can view weight entries" on weight_entries;
drop policy "Owner and caregiver can insert weight entries" on weight_entries;
drop policy "Owner and caregiver can update weight entries" on weight_entries;
drop policy "Owner and caregiver can delete weight entries" on weight_entries;

drop policy "Pack members can view reminders" on reminders;
drop policy "Owner and caregiver can insert reminders" on reminders;
drop policy "Owner and caregiver can update reminders" on reminders;
drop policy "Owner and caregiver can delete reminders" on reminders;

drop function medication_pack_role(uuid);
drop function pet_pack_role(uuid);
drop function pack_role(uuid);

create schema if not exists internal;
grant usage on schema internal to authenticated;

create function internal.pack_role(target_pack_id uuid)
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

create function internal.pet_pack_role(target_pet_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select internal.pack_role(pack_id) from pets where id = target_pet_id;
$$;

create function internal.medication_pack_role(target_medication_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select internal.pet_pack_role(pet_id) from medications where id = target_medication_id;
$$;

grant execute on function internal.pack_role(uuid) to authenticated;
grant execute on function internal.pet_pack_role(uuid) to authenticated;
grant execute on function internal.medication_pack_role(uuid) to authenticated;

create policy "Pack members can view their pack" on packs for select using (internal.pack_role(id) is not null);
create policy "Pack owner can update pack" on packs for update using (internal.pack_role(id) = 'owner');
create policy "Pack owner can delete pack" on packs for delete using (internal.pack_role(id) = 'owner');

create policy "Pack members can view membership list" on pack_members for select using (internal.pack_role(pack_id) is not null);
create policy "Pack owner can invite members" on pack_members for insert with check (internal.pack_role(pack_id) = 'owner');
create policy "Pack owner can update member roles" on pack_members for update using (internal.pack_role(pack_id) = 'owner');
create policy "Pack owner can remove members" on pack_members for delete using (internal.pack_role(pack_id) = 'owner');

create policy "Pack members can view pets" on pets for select using (internal.pack_role(pack_id) is not null);
create policy "Owner and caregiver can insert pets" on pets for insert with check (internal.pack_role(pack_id) in ('owner', 'caregiver'));
create policy "Owner and caregiver can update pets" on pets for update using (internal.pack_role(pack_id) in ('owner', 'caregiver'));
create policy "Owner and caregiver can delete pets" on pets for delete using (internal.pack_role(pack_id) in ('owner', 'caregiver'));

create policy "Pack members can view documents" on documents for select using (internal.pet_pack_role(pet_id) is not null);
create policy "Owner and caregiver can insert documents" on documents for insert with check (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));
create policy "Owner and caregiver can update documents" on documents for update using (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));
create policy "Owner and caregiver can delete documents" on documents for delete using (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));

create policy "Pack members can view vaccinations" on vaccinations for select using (internal.pet_pack_role(pet_id) is not null);
create policy "Owner and caregiver can insert vaccinations" on vaccinations for insert with check (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));
create policy "Owner and caregiver can update vaccinations" on vaccinations for update using (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));
create policy "Owner and caregiver can delete vaccinations" on vaccinations for delete using (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));

create policy "Pack members can view medications" on medications for select using (internal.pet_pack_role(pet_id) is not null);
create policy "Owner and caregiver can insert medications" on medications for insert with check (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));
create policy "Owner and caregiver can update medications" on medications for update using (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));
create policy "Owner and caregiver can delete medications" on medications for delete using (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));

create policy "Pack members can view dose logs" on dose_logs for select using (internal.medication_pack_role(medication_id) is not null);
create policy "Owner and caregiver can log a dose" on dose_logs for insert with check (internal.medication_pack_role(medication_id) in ('owner', 'caregiver') and logged_by = auth.uid());

create policy "Pack members can view weight entries" on weight_entries for select using (internal.pet_pack_role(pet_id) is not null);
create policy "Owner and caregiver can insert weight entries" on weight_entries for insert with check (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));
create policy "Owner and caregiver can update weight entries" on weight_entries for update using (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));
create policy "Owner and caregiver can delete weight entries" on weight_entries for delete using (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));

create policy "Pack members can view reminders" on reminders for select using (internal.pet_pack_role(pet_id) is not null);
create policy "Owner and caregiver can insert reminders" on reminders for insert with check (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));
create policy "Owner and caregiver can update reminders" on reminders for update using (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));
create policy "Owner and caregiver can delete reminders" on reminders for delete using (internal.pet_pack_role(pet_id) in ('owner', 'caregiver'));
