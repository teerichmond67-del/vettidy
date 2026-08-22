create table packs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table pack_members (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid references packs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'caregiver', 'sitter_view_only')),
  created_at timestamptz default now(),
  unique (pack_id, user_id)
);

create table pets (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid references packs(id) on delete cascade,
  name text not null,
  species text not null,
  breed text,
  sex text,
  birthdate date,
  is_estimated_age boolean default false,
  microchip_id text,
  photo_url text,
  status text not null default 'active' check (status in ('active', 'deceased')),
  created_at timestamptz default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  file_path text not null,
  file_type text,
  title text,
  linked_type text,
  linked_id uuid,
  upload_status text not null default 'pending' check (upload_status in ('pending','synced','failed')),
  ocr_extracted_date date,
  created_at timestamptz default now()
);

create table vaccinations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets(id) on delete cascade,
  vaccine_name text not null,
  date_administered date,
  next_due_date date,
  administering_vet text,
  document_id uuid references documents(id),
  created_at timestamptz default now()
);

create table medications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets(id) on delete cascade,
  name text not null,
  dosage text,
  schedule_rule text,
  start_date date,
  end_date date,
  active boolean default true,
  created_at timestamptz default now()
);

create table dose_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid references medications(id) on delete cascade,
  logged_by uuid references auth.users(id) not null,
  status text not null check (status in ('given','skipped')),
  logged_at timestamptz default now(),
  sync_status text not null default 'synced' check (sync_status in ('pending','synced'))
);

create table weight_entries (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets(id) on delete cascade,
  weight numeric not null,
  unit text not null check (unit in ('kg','lb')),
  recorded_at date not null,
  created_at timestamptz default now()
);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets(id) on delete cascade,
  type text not null check (type in ('vaccination','medication','custom')),
  linked_type text,
  linked_id uuid,
  due_at timestamptz not null,
  recurrence_rule text,
  created_at timestamptz default now()
);
