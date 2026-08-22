insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Object paths are structured as {pack_id}/{pet_id}/{document_id}-{filename},
-- so the first path segment gives pack_id for the same internal.pack_role()
-- check used on the documents table itself (phase 1 migration).

create policy "Pack members can view their documents"
on storage.objects for select
using (
  bucket_id = 'documents'
  and internal.pack_role((split_part(name, '/', 1))::uuid) is not null
);

create policy "Owner and caregiver can upload documents"
on storage.objects for insert
with check (
  bucket_id = 'documents'
  and internal.pack_role((split_part(name, '/', 1))::uuid) in ('owner', 'caregiver')
);

create policy "Owner and caregiver can update documents"
on storage.objects for update
using (
  bucket_id = 'documents'
  and internal.pack_role((split_part(name, '/', 1))::uuid) in ('owner', 'caregiver')
);

create policy "Owner and caregiver can delete documents"
on storage.objects for delete
using (
  bucket_id = 'documents'
  and internal.pack_role((split_part(name, '/', 1))::uuid) in ('owner', 'caregiver')
);
