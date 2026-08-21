# Spec.md — VetTidy MVP

**Purpose of this document:** this is a build brief for Claude Code. It defines what to build, in what order, and why — every requirement below traces back to a specific complaint or gap found in competitive research (see `pet-health-app-research.md` and `pet-app-mvp-data-model.md` if included in this repo). Where a decision hasn't been confirmed by the founder, it's marked **[ASSUMPTION]** — flag it back to the founder before treating it as final, but proceed with the stated default so the build isn't blocked.

---

## 1. Problem, Solution, Vision

**Problem:** Existing pet health record apps each solve one job — memory-keeping, shared daily care logging, clinical record storage, or vet-visit management — but none combine all four. Owners end up running two or more apps side by side, re-entering the same pet's information in each.

**Solution:** One app, one data model, four jobs. A pet's profile, documents, medications, and history live in a single place that supports casual memory-keeping and rigorous medical record-keeping without forcing the user to pick a lane up front.

**Business model:** Freemium.

- **Free tier** — the core trust-building loop: pet profiles, a reliable document vault, and vaccination tracking with reminders. Free, unlimited use, single-user (no shared caregivers).
- **Premium tier** (paid, subscription) — the full package: everything in Free, plus multi-caregiver Pack sharing, medication tracking with per-caregiver dose logging, weight tracking with trend charts, and one-tap PDF export of the full pet record.

---

## 2. Non-Negotiable Design Principles

These come directly from competitor research. Do not deviate from these without flagging it back to the founder first.

1. **The document vault must never silently fail.** The single most trust-breaking complaint found across competitor reviews was unreliable file upload. Every upload must be queued locally, retried automatically on reconnect, and visibly show its status (pending / synced / failed) to the user — never a silent failure.
2. **Sync must be real, not fake.** A competitor's "sync" turned out to be manual push/pull between devices, which a reviewer called worse than no sync because it creates false confidence in stale data. Pack sharing (premium) must use real-time sync (Supabase Realtime), not an export/import pattern.
3. **Species is a variable, not a hardcoded assumption.** Do not build a dog/cat-only data model. Species is free-text with a curated autocomplete list, not a fixed enum. This was a stated reason a reviewer chose one competitor over others.
4. **Tracking fields are clinical, not borrowed from human wellness apps.** Where symptom/behavior tracking exists (post-MVP, see §10), fields must be things a vet would actually ask about (appetite, energy, mobility) — never generic mood categories like "happy/sad" lifted from a meditation app.
5. **Schema migrations must never lose user data.** A competitor pushed an "upgrade" that broke paid users' existing data and removed functionality they'd paid a lifetime fee for. Every schema change must be backward-compatible or have an explicit, tested data-preservation migration path.
6. **No live veterinary practice-management (PIMS) integration.** This consistently breaks even for well-funded competitors. Position the vet-visit feature as the owner's own record, exportable as PDF/CSV — never as a live sync promise the app can't keep.
7. **Never trap the user in a repeating error state.** A top competitor has a recurring, still-unresolved complaint of infinite "there was an error, try again" loops. Every error state must have a clear recovery path (retry button, human-readable message, or graceful degradation) — never a dead end.

---

## 3. Tech Stack & Architecture

| Layer                   | Choice                                                        | Notes                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client framework        | **React Native + Expo (managed workflow), TypeScript**        | **[ASSUMPTION — not yet confirmed by founder]** Single codebase for iOS + Android, which matters given this needs to ship to both stores.                                                                                                                                                                                           |
| Backend                 | **Supabase** (Postgres + Auth + Storage + Realtime)           | **[ASSUMPTION — not yet confirmed by founder]** Gives Postgres (good relational fit for this data model), row-level security for Pack permission scoping, Storage for documents/photos, and Realtime for genuine Pack sync (principle #2 above).                                                                                    |
| Navigation              | React Navigation                                              | Standard for Expo/RN apps.                                                                                                                                                                                                                                                                                                          |
| Subscriptions / IAP     | **RevenueCat**                                                | **[ASSUMPTION]** Wraps StoreKit2 (iOS) and Play Billing (Android) behind one API and one entitlement check. Building raw store billing twice is a large, error-prone lift for an MVP; RevenueCat is the de facto standard here. Confirm with founder before committing, since it does add a small revenue share.                    |
| Push notifications      | Expo Notifications                                            | For vaccination/medication reminders.                                                                                                                                                                                                                                                                                               |
| Local write reliability | **Pragmatic write queue, not full offline-first sync engine** | See note below — this is a deliberate scope decision.                                                                                                                                                                                                                                                                               |
| Cloud builds            | **Expo EAS Build**                                            | This build environment can write the full codebase but cannot compile a native iOS or Android binary locally. EAS Build is Expo's cloud build service — it produces installable/submittable binaries for both stores without requiring local Xcode or Android Studio. Use `expo-dev-client` for local iteration during development. |

### On "offline-first" — a deliberate scope decision

A fully offline-first app with conflict-free replicated data (CRDT-style sync, e.g. via a local SQLite store synced against Supabase) is a substantial engineering investment and is **out of scope for MVP**. Instead, MVP implements a **targeted write queue** for the highest-risk operations specifically called out in research:

- Document uploads (queue, retry-on-reconnect, visible status)
- Dose log entries (queue if offline, sync on reconnect)

Everything else (profile edits, reminders, etc.) can assume connectivity for MVP, with a clear "you're offline" banner rather than pretending to support full offline editing. This is a smaller, honest promise that's actually reliable — directly avoiding the trap of a fake-sync complaint.

---

## 4. Entitlement Model (Free vs. Premium)

| Feature                                      |         Free          | Premium |
| -------------------------------------------- | :-------------------: | :-----: |
| Pet profiles (multi-pet, multi-species)      |          ✅           |   ✅    |
| Document vault (upload, view, retry queue)   |          ✅           |   ✅    |
| Vaccination tracking + due-date reminders    |          ✅           |   ✅    |
| PDF export of full pet record                |          ❌           |   ✅    |
| Pack sharing (multi-caregiver, real-time)    | ❌ (single-user only) |   ✅    |
| Medication tracking + per-caregiver dose log |          ❌           |   ✅    |
| Weight tracking + trend chart                |          ❌           |   ✅    |

**[ASSUMPTION]** No cap on number of pets or documents in the free tier — the gate is on _capabilities_ (sharing, medication, weight, export), not usage volume. This is a product-positioning choice, not a technical constraint; confirm with founder, since a usage cap (e.g., "1 pet free, unlimited on Premium") is a very reasonable alternative and easy to implement if preferred.

**[ASSUMPTION]** Pricing itself (monthly/annual amount) is not set here — treat it as a remote config value fetched from RevenueCat, not hardcoded, so it can change without a new app release.

### Paywall trigger points

Show the paywall screen when a free-tier user:

- Taps "Invite a caregiver" (Pack sharing)
- Taps "Add medication"
- Taps "Weight" tab on a pet profile
- Taps "Export PDF"

Each trigger should show a specific, contextual paywall message (e.g., "Track medications and never worry about a double dose — upgrade to Premium"), not a generic "upgrade now" screen.

---

## 5. Data Model

Full entity rationale is in `pet-app-mvp-data-model.md`. Below is the concrete schema for what MVP actually needs to build (Free + Premium P0 scope). Postgres/Supabase syntax; RLS = Row Level Security policy note.

```sql
-- Managed by Supabase Auth already: auth.users

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
-- RLS: a user can only read/write rows where they are a member of the pack_id in question.

create table pets (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid references packs(id) on delete cascade,
  name text not null,
  species text not null, -- free text + client-side curated autocomplete, NOT an enum
  breed text,
  sex text,
  birthdate date,
  is_estimated_age boolean default false,
  microchip_id text,
  photo_path text, -- storage object path in the documents bucket, not a URL; sign on read
  status text not null default 'active' check (status in ('active', 'deceased')),
  created_at timestamptz default now()
);
-- RLS: scoped via pack_id membership.

create table documents (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  file_path text not null, -- Supabase Storage path
  file_type text,
  title text,
  linked_type text, -- 'vaccination' | 'medical_record' | 'standalone'
  linked_id uuid, -- nullable, polymorphic reference
  upload_status text not null default 'pending' check (upload_status in ('pending','synced','failed')),
  ocr_extracted_date date, -- nullable, user-confirmable
  created_at timestamptz default now()
);
-- RLS: scoped via pets.pack_id membership (join).

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
  schedule_rule text, -- e.g. RRULE-style recurrence string
  start_date date,
  end_date date, -- nullable = ongoing
  active boolean default true,
  created_at timestamptz default now()
);

create table dose_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid references medications(id) on delete cascade,
  logged_by uuid references auth.users(id) not null, -- critical: who logged it, prevents double-dosing
  status text not null check (status in ('given','skipped')),
  logged_at timestamptz default now(),
  sync_status text not null default 'synced' check (sync_status in ('pending','synced')) -- for offline write queue
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
```

**RLS policy pattern (apply to every pack-scoped table):** a user may `select`/`insert`/`update`/`delete` a row only if they have a `pack_members` row for the same `pack_id` (via a join through `pets.pack_id` for tables keyed on `pet_id`). `sitter_view_only` role gets `select`-only policies.

---

## 6. Screens / Navigation Map

```
Auth Stack
├── Sign Up / Sign In (email + Apple Sign-In + Google Sign-In)
└── Onboarding → Create first pet profile

Main Tab Navigator
├── Home (pet list, add pet button)
├── Pet Detail (per selected pet)
│   ├── Overview tab (photo, basic info, upcoming reminders)
│   ├── Documents tab (vault: list, upload, status indicators, retry failed)
│   ├── Vaccinations tab (list, add/edit, reminder scheduling)
│   ├── Medications tab [PREMIUM] (list, dose log, per-caregiver history)
│   ├── Weight tab [PREMIUM] (entries + trend chart)
│   └── Export PDF button [PREMIUM]
├── Pack (Caregivers) [PREMIUM]
│   ├── Member list + roles
│   └── Invite flow (link or email invite)
├── Settings
│   ├── Account
│   ├── Subscription management (RevenueCat-managed)
│   └── Notification preferences
└── Paywall (modal, triggered contextually — see §4)
```

---

## 7. Feature Specs — Free Tier

### 7.1 Pet Profiles

- User can create, edit, and delete pet profiles.
- Species field: free text input with autocomplete suggestions (dog, cat, rabbit, bird, hamster, reptile, etc.) — never a locked dropdown.
- Multiple pets per account, no cap **[ASSUMPTION — confirm]**.
- Deceased pets: a "mark as deceased" action moves the pet to an archived/memorial state — never hard-deleted unless the user explicitly chooses to delete.

**Acceptance criteria:** a user can create a pet of a species not in the default list (e.g., "axolotl") without the app breaking or defaulting to "other."

### 7.2 Document Vault

- Upload photo or file, attach optional title and link to a vaccination record (optional).
- Upload queues locally if offline; retries automatically on reconnect.
- Visible status badge per document: Pending / Synced / Failed (with manual retry button on Failed).
- View, download, and delete documents.

**Acceptance criteria:** a user can start an upload while offline, background the app, reconnect later, and find the document successfully synced without re-initiating the upload manually.

### 7.3 Vaccination Tracking + Reminders

- Add a vaccination record: name, date administered, next due date, administering vet (free text), optional linked document.
- Push notification reminder generated automatically from `next_due_date` (e.g., 7 days and 1 day before).
- List view sorted by next due date, with overdue items visually flagged.

**Acceptance criteria:** a user receives a push notification for an upcoming vaccination without manually configuring a separate reminder.

---

## 8. Feature Specs — Premium Tier

### 8.1 Pack Sharing (Multi-Caregiver)

- Pack owner can invite additional caregivers via shareable link or email.
- Roles: `owner` (full access), `caregiver` (full access except deleting the pack or removing other members), `sitter_view_only` (read-only).
- All Pack members see real-time updates (Supabase Realtime subscription) — no manual sync step, ever.

**Acceptance criteria:** two devices logged in as different Pack members both see a new dose-log entry within a few seconds of it being logged, with no user action required to "sync."

### 8.2 Medication Tracking + Dose Logging

- Add medication: name, dosage, schedule, start/end date.
- "Mark as given" / "mark as skipped" action, timestamped and tagged with which caregiver logged it.
- Dose history view shows who logged what, when — directly preventing the double-dosing scenario that motivated this feature.
- Reminders generated from schedule.

**Acceptance criteria:** if Caregiver A logs a dose as given, Caregiver B's device (same Pack) shows that dose as already given, before Caregiver B attempts to log it themselves.

### 8.3 Weight Tracking + Trend Chart

- Manually log weight entries (value + unit + date).
- Trend chart view (simple line chart, e.g. via `react-native-svg`-based charting library) showing weight over time.

**Acceptance criteria:** chart correctly renders with as few as 2 data points and handles unit consistency (kg vs lb) without silent conversion errors.

### 8.4 PDF Export

- One-tap export of a pet's full record (profile, vaccinations, medications, weight history) to a shareable PDF.
- Uses the native share sheet (email, AirDrop, save to Files, etc.) — no promise of direct clinic system integration (per principle #6).

**Acceptance criteria:** exported PDF is legible, includes all vaccination and medication data, and can be opened on a device with no other app installed (i.e., it's a standard PDF, not a proprietary format).

---

## 9. Non-Functional Requirements

- **Error handling:** every network or upload failure shows a specific, human-readable message and a retry action — never a generic error that repeats indefinitely (principle #7).
- **Accessibility:** support Dynamic Type / font scaling, VoiceOver/TalkBack labels on all interactive elements, minimum touch target size 44x44pt.
- **Permission scoping:** `sitter_view_only` Pack members must not see the Settings/billing screen or be able to remove other members — enforce both client-side (UI hiding) and server-side (RLS policy), since client-side alone is not real security.
- **Data migration safety:** any schema change ships with a migration script that preserves existing user data; no destructive migrations without an explicit backup step.
- **Performance:** pet list and document vault should remain responsive with at least 500 documents across a household's pets (test with seeded data, not just a handful of records).

---

## 10. Explicitly Out of Scope for MVP

Do not build these — they were deliberately excluded based on research findings:

- Live veterinary practice-management system (PIMS) integration (breaks reliably even for funded competitors — see principle #6)
- AI-powered symptom triage or "what changed" summaries (needs a real usage base of logged data first; revisit post-launch)
- Structured daily SymptomLog / appetite-energy-mobility tracking (valuable, but P1 — add after MVP validates the core loop)
- Journal/memory entries with milestones (P1 — completes the "four jobs" vision but isn't required to prove the core premium value proposition)
- Standalone appointment/vet-visit scheduling screen (P1)
- Expense tracking (P1)
- Marketplace/classifieds features
- B2B/business tooling for groomers, shelters, trainers
- Livestock/exotic specialty breeding-record fields
- Full offline-first CRDT sync engine (see §3 — targeted write queue only)

---

## 11. Build Order (Phased Plan for Claude Code)

Work through these phases in order. Each phase should be independently testable before moving to the next.

1. **Project scaffolding** — Expo + TypeScript init, folder structure, ESLint/Prettier config, Supabase project connection, environment variable setup, navigation skeleton (empty screens wired up).
2. **Auth** — Sign up/sign in with email, Apple Sign-In, Google Sign-In. On first sign-in, auto-create a `pack` with the user as `owner`.
3. **Pet profiles (Free)** — full CRUD, species autocomplete, deceased/archive state.
4. **Document vault (Free)** — this is the highest-risk, highest-priority feature. Build and stress-test the upload queue and retry logic before moving on — this is the single most important thing to get right per the research.
5. **Vaccination tracking + reminders (Free)** — CRUD + Expo push notification scheduling.
6. **Entitlement system + RevenueCat integration** — wire up subscription check, paywall screen, contextual paywall triggers (§4). Build this before the premium features themselves so each premium feature can be gated as it's built, rather than retrofitted.
7. **Pack sharing (Premium)** — invite flow, roles, Supabase Realtime subscriptions for live updates.
8. **Medication tracking + dose logging (Premium)** — CRUD + per-caregiver dose log + reminders.
9. **Weight tracking + trend chart (Premium)**.
10. **PDF export (Premium)**.
11. **Polish pass** — empty states, loading states, error states audit (confirm principle #7 is upheld everywhere), accessibility pass, offline-banner UX.
12. **Store submission prep** — app icons, screenshots, App Store Connect + Google Play Console listing metadata, privacy policy page, EAS Build production builds.

---

## 12. "MVP Done" Acceptance Checklist

- [ ] A free-tier user can sign up, create a pet of any species, and receive a vaccination reminder — entirely without hitting a paywall.
- [ ] A document uploaded while offline syncs automatically on reconnect, with no data loss and no silent failure.
- [ ] A free-tier user tapping any premium feature sees a specific, contextual paywall — not a generic upgrade screen.
- [ ] Two Pack members on separate devices see each other's dose-log entries within seconds, with zero manual sync action.
- [ ] No screen in the app can produce a repeating, unrecoverable error loop — every failure state has a retry or clear next step.
- [ ] A pet profile can be created with a species outside the default autocomplete list.
- [ ] Exported PDF opens correctly on a device with no other app installed.
- [ ] Production builds succeed via EAS Build for both iOS and Android.

---

## 13. Open Decisions for the Founder

These don't block starting the build, but should be confirmed before store submission:

1. Tech stack and backend (§3) — currently assumed as React Native/Expo + Supabase; confirm or override.
2. Free-tier usage caps, if any (§4) — currently assumed as uncapped (capability-gated only, not volume-gated).
3. Premium pricing (monthly/annual amount) — to be set in RevenueCat/App Store Connect/Play Console, not hardcoded.
4. App name and branding/visual identity — not yet defined; a placeholder name and neutral design system should be used until this is confirmed.
5. RevenueCat vs. building raw StoreKit2/Play Billing directly — RevenueCat recommended for MVP speed, confirm founder is comfortable with its revenue share.
