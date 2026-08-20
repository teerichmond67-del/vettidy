# VetTidy — Privacy Policy

**Effective & last updated:** August 20, 2026
**Applies to:** VetTidy (iOS & Android)

> **Founder note:** this policy is drafted directly from the app's actual data
> flows for MVP development and store-submission testing. The app name,
> contact address, and legal entity below are placeholders — replace them and
> have this reviewed by qualified legal counsel before it is published for
> real users.
>
> A published, hosted copy of this policy (with formatting) lives at:
> https://claude.ai/code/artifact/dec1c160-e02c-41ee-b7f3-7cadc162030e
> — that's the URL to put in App Store Connect / Google Play Console until
> you host a permanent version on your own domain.

## 1. Information we collect

Everything below is information you or a caregiver you've invited enters
directly into the app. We don't buy data about you from anyone else.

**Account information** — your email address, and however you chose to sign
in (email & password, or Sign in with Apple / Google).

**Pet profiles & health records** — whatever you choose to record for each
pet: name, species, breed, sex, birthdate, microchip ID, vaccination
history, medications and dose logs, and weight entries.

**Documents & photos** — files or photos you upload (vet records, receipts,
certificates) and any photo you attach to a pet's profile.

**Household (Pack) sharing** — if you invite a caregiver, their email
becomes visible to your household, and yours becomes visible to theirs. We
also record who logged each medication dose and when, by design — it's how
the app prevents two caregivers from double-dosing a pet.

**Subscription status** — whether your household has an active Premium
subscription. Billing itself is handled entirely by Apple, Google, and our
subscription platform (RevenueCat) — we never see or store your card
details.

**What we deliberately don't collect** — no third-party analytics or
advertising SDKs are integrated into this app. Reminder notifications are
scheduled locally on your device — they aren't routed through a remote push
server, so no push token is collected or transmitted.

## 2. How we use it

- To store and display your pets' records, and keep them synced in real
  time across everyone in your household who you've invited.
- To schedule the vaccination and medication reminders you set up, on your
  own device.
- To confirm your subscription status and unlock Premium features.
- To respond if you contact us for support.

We do not use your data to serve ads, and we do not sell it.

## 3. Who we share it with

We share data in two situations only:

**With your household** — anyone you explicitly invite into a pet's care
team can see the records for that household, scoped to the access level you
give them (full access as a Caregiver, or read-only as a Sitter). Nothing
is visible to anyone outside a household you've chosen to share with.

**With service providers who run the app:**

| Provider | What they handle |
|---|---|
| Supabase | Database, authentication, and file storage (hosted in Singapore) |
| RevenueCat | Subscription and purchase status |
| Apple / Google | Sign-in (if you choose it) and app store billing |

These providers process data on our behalf under their own security
commitments — none of them are permitted to use your data for their own
purposes.

## 4. Storage & security

Your records live in a Postgres database with row-level security enforced
at the database layer, not just in the app — meaning a request for data
outside your own household is rejected by the database itself. Uploaded
documents sit in a private storage bucket and are only ever served through
short-lived, authenticated links, never a public URL.

## 5. Your choices & rights

- **Edit or delete anything you've entered** — pets, documents, vaccination
  and medication records, weight entries, and pending invitations —
  directly in the app, at any time.
- **Revoke camera or photo library access** at any time from your device's
  settings.
- **Delete your account.** Self-service account deletion isn't built into
  the app yet — contact us below and we'll delete your account and its
  data.

## 6. Children's privacy

VetTidy isn't directed at children, and we don't knowingly collect
information from anyone under 13. If you believe a child has created an
account, contact us and we'll remove it.

## 7. Changes to this policy

If this policy changes in a way that matters, we'll update the date at the
top of this page. Continuing to use the app after a change means you've
seen it.

## 8. Contact us

Questions, requests, or a deletion request — reach us at
`privacy@vettidy.com` *(domain is registered — set up mailbox/forwarding
for this address before submission)*.
