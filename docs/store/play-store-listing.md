# Google Play Console Listing — Draft

> Placeholder copy, written against the actual MVP feature set. Swap the
> app name once real branding (Spec.md §13, open decision #4) is confirmed
> — everything else here should still hold.

## App name (30 char max)

```
VetTidy
```

## Short description (80 char max)

```
Vaccine & medication reminders, shared records, one place for every pet.
```

## Full description (4000 char max)

```
Stop juggling three different apps for one pet.

VetTidy keeps a pet's profile, documents, vaccination history, and
medical records in a single place — built for owners who want both the
casual memory-keeping and the rigorous record-keeping, without picking a
lane.

FREE, FOREVER
• Unlimited pet profiles — any species, not just dogs and cats
• A document vault that never loses an upload, even if you're offline when
  you take the photo. It queues locally and syncs the moment you reconnect.
• Vaccination tracking with automatic reminders, 7 days and 1 day before
  each vaccine is due

PREMIUM
• Share a pet's care with your household in real time — invite a partner,
  family member, or pet sitter with view-only access, and everyone sees
  updates instantly, no manual sync step
• Medication tracking with a shared dose log, so you always know if someone
  already gave today's dose before you give it again
• Weight tracking with a trend chart over time
• One-tap PDF export of a pet's full record to hand to a new vet or share
  by email

Built on the details that matter: your data is scoped so only the people
you invite can see it, uploads are never silently dropped, and species is
never limited to a hardcoded list — axolotls and bearded dragons welcome.

VetTidy does not connect to your vet's practice-management system —
your records stay your own, exportable and shareable on your terms.
```

## Category

- **Application type:** Medical, or Health & Fitness (confirm which
  performs better for a records-management app during submission)

## Contact details

```
Email:   privacy@vettidy.com   (domain registered — set up mailbox/forwarding)
Website: https://vettidy.com    (domain registered — not hosted yet)
```

## Privacy Policy URL

```
https://claude.ai/code/artifact/dec1c160-e02c-41ee-b7f3-7cadc162030e
```
Replace with a permanent URL on your own domain before submitting for real.
See `docs/privacy-policy.md` for the source content.

## Data safety section — expected answers

Google's Data Safety form asks about each data type individually. Answers
below match what the app actually does.

| Data type | Collected? | Shared with third parties? | Purpose |
|---|---|---|---|
| Email address | Yes | No | Account management |
| Photos | Yes | No | App functionality |
| Health info (pet vaccination/medication/weight records) | Yes | No | App functionality |
| Purchase history | Yes | Yes — RevenueCat, Apple/Google (billing only) | App functionality |
| App activity / analytics | No | — | Not collected — no analytics SDK is integrated |
| Device or other identifiers | No | — | Not collected — no advertising SDK is integrated |

**Is data encrypted in transit?** Yes (HTTPS/TLS to Supabase).
**Can users request data deletion?** Yes, by contacting support (see
`docs/privacy-policy.md` §5) — self-service in-app deletion is a known gap,
not yet built.
**Is this data collection required or optional?** Required for core
functionality — the app is a records-keeping tool and can't function
without an account and the records you choose to enter.

## Content rating questionnaire — expected answers

No violence, no sexual content, no profanity, no controlled substances, no
gambling, no user-generated content visible outside an invited household.
Expected rating: **Everyone**.

## Release notes (first submission)

```
Welcome to VetTidy! This is our first release.
```
