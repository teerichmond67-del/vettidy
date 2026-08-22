# VetTidy — Decommission & Revival Notes

**Status as of 2026-08-21:** Project paused. Not being actively pursued. The Supabase backend (project `pet-health-app`, ref `yxexgphnenejnwnzicyy`) is being deleted from the Supabase dashboard.

This doc exists so a future revival doesn't start from zero. Everything needed to stand the backend back up is now captured in this repo — nothing important lived only in the Supabase dashboard.

## What's actually being lost when the Supabase project is deleted

- The Postgres database: 11 tables (`packs`, `pack_members`, `pets`, `documents`, `vaccinations`, `medications`, `dose_logs`, `weight_entries`, `reminders`, `profiles`, `pack_invites`), their RLS policies, and the `internal.*` helper functions/triggers.
- Supabase Auth: 1 user (`test@vettidy.com`, a disposable test account — not a real user, safe to lose).
- Supabase Storage: the `documents` bucket (currently empty — the one test pet photo uploaded during development was deleted as part of testing cleanup).
- **Real data lost: none.** No real users ever signed up; the only account and the only pet record were both test data created and cleaned up during this session.

## What is NOT affected (lives outside Supabase, keeps existing/costing money unless separately canceled)

- **Domain** — `vettidy.com`, registered via Namecheap. Renews independently; deleting Supabase doesn't touch the registration.
- **DNS** — points at Vercel for the marketing site. Stays as-is.
- **Vercel deployment** — the static marketing site (`website/`) keeps serving. It doesn't call Supabase directly, so it won't break, but its "Sign Up" / "Get the App" messaging will be pointing at an app that can no longer create accounts once the backend is gone.
- **Email forwarding** — `privacy@`/`support@` → your inbox, set up via Namecheap forwarding. Independent of Supabase, keeps working.
- **GitHub repo** — [teerichmond67-del/vettidy](https://github.com/teerichmond67-del/vettidy), public. All source code is safe regardless of what happens to Supabase.

## Everything needed to revive it

1. **Create a new Supabase project.**
2. **Run the schema.** All 14 migrations that used to exist only on the remote database are now saved at [`supabase/migrations/`](../supabase/migrations/) in this repo, in order:
   - `20260820045556_initial_schema.sql`
   - `20260820045659_row_level_security.sql`
   - `20260820045851_move_rls_helpers_to_internal_schema.sql`
   - `20260820050747_auto_create_pack_on_signup.sql`
   - `20260820051010_move_signup_trigger_to_internal_schema.sql`
   - `20260820054743_documents_storage_bucket.sql`
   - `20260820062055_add_profiles_table.sql`
   - `20260820062106_add_pack_invites_table.sql`
   - `20260820062117_add_redeem_pack_invite_function.sql`
   - `20260820062134_enable_realtime_for_pack_sharing.sql`
   - `20260820062207_restrict_redeem_pack_invite_to_authenticated.sql`
   - `20260820063238_enable_realtime_for_medications.sql`
   - `20260820063952_enable_realtime_for_weight_entries.sql`
   - `20260821011529_rename_pets_photo_url_to_photo_path.sql`

   Either link the Supabase CLI and run `supabase db push`, or paste each file into the SQL Editor in order, or hand them to a future Claude session with Supabase MCP access and ask it to apply them in order via `apply_migration`.
3. **Update `.env.local`** with the new project's `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (template at `.env.local.example`).
4. **Re-point the domain/deployment** — no action needed; Vercel and Namecheap DNS were never tied to the old Supabase project ID.
5. **Two things were never finished the first time around** — worth fixing on revival rather than re-discovering the hard way:
   - **Auth email delivery.** This project was still on Supabase's default shared mailer, which is aggressively rate-limited and not viable for real signups (this is what was actively blocking Forgot Password / new signups at the time of decommissioning). Configure custom SMTP (Authentication → Emails → SMTP Settings) — Resend was the intended provider; `RESEND_API_KEY` was never actually set.
   - **OAuth providers.** Apple and Google sign-in buttons exist in the UI but neither provider was enabled in Supabase Auth (`EXPO_PUBLIC_APPLE_SIGNIN_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_SIGNIN_CLIENT_ID` are both blank). Google specifically was confirmed failing with `provider is not enabled`.

## Feature state at time of pause

Confirmed built and working this session: rebrand to VetTidy, landing page, local Android dev build, sign-up/sign-in (email/password), pack creation + invites, pet CRUD including photo upload/display, tab navigation, Change Password (fully verified incl. a live round-trip sign-in), Forgot Password UI flow (verified against the live API; the "tap the email link" leg was never live-tested due to the mailer issue above).

For the full intended feature set, see `Spec.md` §11 (Build Order) and §12 (MVP Done Acceptance Checklist) — that checklist wasn't re-verified item-by-item as part of this decommission, so treat it as the source of truth for what's actually finished versus still open on revival, not this note.
