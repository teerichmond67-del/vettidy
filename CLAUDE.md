# CLAUDE.md — Build Instructions for Pet Health & Care App

This file guides Claude Code while building this project. Read `Spec.md` in full before writing any code — it is the source of truth for scope, data model, and flows.

## Project

A freemium mobile app that unifies pet memory-keeping, document storage, vaccination/medication tracking, and multi-caregiver sharing in one data model. See `Spec.md` for the complete spec, including the seven non-negotiable design principles in §2 — read those before touching the document vault, sync, or species fields in particular.

## Stack

- **React Native + Expo (managed workflow), TypeScript** — **[ASSUMPTION, unconfirmed by founder — see Spec.md §13]**
- **React Navigation** for navigation
- **Supabase**: Postgres (data), Auth (email + Apple + Google sign-in), Storage (documents/photos), Realtime (Pack sharing sync) — **[ASSUMPTION, unconfirmed by founder]**
- **RevenueCat** for subscriptions/IAP (StoreKit2 + Play Billing behind one entitlement check) — **[ASSUMPTION, unconfirmed by founder]**
- **Expo Notifications** for vaccination/medication reminders
- **Expo EAS Build** for cloud iOS/Android builds — this environment cannot compile native binaries locally; use `expo-dev-client` for local iteration
- Charting library for the weight trend chart: `react-native-svg`-based (e.g. `react-native-svg-charts` or similar) — pick whichever renders a clean line chart with as few as 2 points

## Build Order (do not skip ahead — each phase should be independently testable)

1. **Project scaffolding**: Expo + TypeScript init, folder structure, ESLint/Prettier, Supabase project connection, env vars (see below), navigation skeleton with empty screens wired up.
2. **Auth**: email + Apple Sign-In + Google Sign-In via Supabase Auth. On first sign-in, auto-create a `pack` with the user as `owner`.
3. **Pet profiles (Free)**: full CRUD, species free-text + autocomplete (never a locked enum/dropdown), deceased/archive state (never hard-delete without explicit user confirmation).
4. **Document vault (Free)**: the highest-risk, highest-priority feature per research — build and stress-test the local upload queue and retry-on-reconnect logic before moving on. Every upload must visibly show Pending / Synced / Failed status; never a silent failure.
5. **Vaccination tracking + reminders (Free)**: CRUD + Expo push notification scheduling from `next_due_date`.
6. **Entitlement system + RevenueCat integration**: wire up subscription check, paywall screen, and the four contextual paywall triggers (Spec.md §4) _before_ building the premium features themselves, so each one is gated as it's built rather than retrofitted.
7. **Pack sharing (Premium)**: invite flow (link or email), roles (`owner` / `caregiver` / `sitter_view_only`), Supabase Realtime subscriptions for live updates — no manual sync step, ever.
8. **Medication tracking + dose logging (Premium)**: CRUD + per-caregiver dose log (who logged what, when) + reminders.
9. **Weight tracking + trend chart (Premium)**.
10. **PDF export (Premium)**: full pet record via native share sheet.
11. **Polish pass**: empty/loading/error states audit (confirm principle #7 — no repeating unrecoverable error loops — is upheld everywhere), accessibility pass (Dynamic Type, VoiceOver/TalkBack labels, 44x44pt touch targets), offline-banner UX.
12. **Store submission prep**: app icons, screenshots, App Store Connect + Google Play Console metadata, privacy policy page, EAS Build production builds.

## Conventions

- Species is always free text with curated autocomplete suggestions — never a fixed enum. Do not add a dog/cat-only assumption anywhere in the data model or UI.
- `sitter_view_only` Pack members must be denied both client-side (UI hidden) _and_ server-side (RLS policy) — client-side hiding alone is not real security.
- RLS pattern: a user may read/write a row only if they have a `pack_members` row for that `pack_id` (joined through `pets.pack_id` for pet-scoped tables). Apply this to every pack-scoped table — see Spec.md §5.
- `dose_logs.logged_by` and `sync_status` exist specifically to prevent double-dosing and support the offline write queue — never bypass or backfill these fields with placeholder values.
- Only the document-upload path and dose-log entries get the offline write queue (queue, retry-on-reconnect, visible status). Everything else assumes connectivity for MVP — show an "you're offline" banner rather than building silent offline editing elsewhere. This is a deliberate scope boundary (Spec.md §3); do not expand it without flagging it back first.
- Any schema change must be backward-compatible or ship with an explicit, tested data-preservation migration. Never ship a destructive migration without a backup step.
- Every error state (network, upload, sync) needs a specific human-readable message and a retry action or graceful degradation — never a generic error that can loop indefinitely.
- Keep pricing out of hardcoded values — fetch it as RevenueCat remote config.
- Treat `[ASSUMPTION]` markers in `Spec.md` as defaults to build against, not confirmed decisions — surface them to the founder at natural checkpoints (e.g. before store submission), don't silently treat them as locked.

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-side only (edge functions), never bundled into the client
REVENUECAT_API_KEY_IOS=
REVENUECAT_API_KEY_ANDROID=
EXPO_PUBLIC_APPLE_SIGNIN_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_SIGNIN_CLIENT_ID=
```

## Explicitly Out of Scope (do not build unless asked)

Live vet practice-management (PIMS) integration, AI-powered symptom triage, structured daily SymptomLog tracking, journal/memory entries with milestones, standalone appointment scheduling, expense tracking, marketplace/classifieds, B2B tooling, livestock/breeding fields, full offline-first CRDT sync. See `Spec.md` §10.

## When Something in Spec.md Is Ambiguous

Stop and ask rather than guessing on: anything touching Pack permission scoping (RLS + role checks), the document upload queue/retry logic, and entitlement/paywall gating — these are the parts most likely to cause real data leaks, silent data loss, or a broken monetization path if built wrong.
