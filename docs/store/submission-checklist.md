# Store Submission Checklist

Tracks Spec.md §12's "Production builds succeed via EAS Build for both iOS
and Android" and CLAUDE.md's phase 12 (store submission prep). Everything
in this repo/config is done; everything below the line needs your own
accounts and hardware, since none of it is reachable from this dev
environment.

## Done in this repo

- [x] **App icon & Android adaptive icon** — paw-with-checkmark mark on
      forest green (`assets/icon.png`, `assets/android-icon-foreground.png`),
      generated to match the confirmed VetTidy name and differentiate from
      competitors' plain paw-print icons.
- [x] **Splash screen** — configured via `expo-splash-screen`, using the
      same mark on a matching background.
- [x] **Bundle identifier / package name** — `com.vettidy.app` for
      both `ios.bundleIdentifier` and `android.package`, matching the
      confirmed app name (VetTidy). **Still worth a final sanity check
      before your first real submission — see the warning below, since
      this is effectively permanent once you submit.**
- [x] **Build numbers** — `ios.buildNumber: "1"`, `android.versionCode: 1`.
- [x] **iOS export-compliance flag** — `ITSAppUsesNonExemptEncryption:
      false` set, so App Store Connect won't prompt for an encryption
      questionnaire on every build (the app only uses standard HTTPS/TLS).
- [x] **Camera & photo library usage descriptions** — specific,
      review-friendly strings via the `expo-image-picker` config plugin
      (generic ones risk Apple rejection).
- [x] **`eas.json`** — development / preview / production build profiles.
- [x] **Privacy policy** — drafted from the app's actual data flows, not
      generic boilerplate. Saved as `docs/privacy-policy.md` and hosted at
      `/privacy` on the `website/` static site (see Domain section below);
      also still live as an Artifact at
      https://claude.ai/code/artifact/dec1c160-e02c-41ee-b7f3-7cadc162030e
      as a fallback.
- [x] **Store listing copy** — `docs/store/app-store-listing.md` and
      `docs/store/play-store-listing.md`, including Apple's App Privacy
      answers and Google's Data Safety form answers.
- [x] **Marketing/privacy/support site** — `website/` (home, `/privacy`,
      `/support`), deployed to Vercel at https://vettidy.vercel.app.
      Custom domain not yet attached — see Domain section below.

## ⚠️ Before your first real submission

**Bundle identifier / package name is effectively permanent.** Once an app
is submitted under `com.vettidy.app`, changing it later means starting
over as a *new* app listing (losing reviews, install counts, ASO
history). `com.vettidy.app` is already the reverse form of the registered
domain (`vettidy.com` → `com.vettidy`) with an `.app` suffix, so no change
needed there.

## Domain (vettidy.com)

- [x] **Registered** — via Namecheap.
- [x] **Hosting** — `website/` deployed to Vercel, live at
      https://vettidy.vercel.app (project `vettidy` under the `RICH`
      team). Home, `/privacy`, `/support`.
- [x] **Email forwarding** — `privacy@vettidy.com` and `support@vettidy.com`
      forward via Namecheap's free email forwarding (confirmed working with
      a real end-to-end test). MX records point to
      `eforward*.registrar-servers.com`.
- [ ] **DNS (web hosting)** — `vettidy.com`'s `A` record still points to
      Namecheap's default parking IP (`192.64.119.109`), not Vercel. To
      connect it:
      1. In the [Vercel dashboard](https://vercel.com/rich-101a/vettidy/settings/domains),
         add `vettidy.com` as a domain on the `vettidy` project.
      2. At Namecheap, in `vettidy.com`'s DNS settings, add:
         - `A` record, host `@`, value `76.76.21.21`
         - `CNAME` record, host `www`, value `cname.vercel-dns-0.com`
      3. Vercel will show the exact records to use if these have changed —
         trust what its dashboard says over this file.
      4. This is separate from email forwarding (already done, above) — an
         `A` record for `@` doesn't affect the MX records already in place.
      Once live, swap the `https://vettidy.vercel.app` references in
      `docs/store/app-store-listing.md` and `docs/store/play-store-listing.md`
      for `https://vettidy.com`.
- [ ] **Universal Links (iOS) / App Links (Android)** — not wired up yet.
      The app's own deep-link routing is fixed (`src/navigation/linking.ts`
      handles `vettidy://invite/CODE`), but the *domain-backed* version
      (`https://vettidy.com/invite/...`) additionally needs your Apple Team
      ID and the app's Android signing SHA-256 fingerprint to generate
      `apple-app-site-association` / `assetlinks.json` — neither exists
      until the EAS/Apple Developer steps below are done.

## Needs your own accounts / hardware — not reachable from here

1. **Apple Developer Program** ($99/yr) and **Google Play Console** ($25
   one-time) — create these under the account that will own the app long
   term.
2. **Expo/EAS account** — `npx eas login`, then link the project:
   ```bash
   npx eas init
   ```
3. **Production builds:**
   ```bash
   npx eas build --platform ios --profile production
   npx eas build --platform android --profile production
   ```
   First iOS build will walk you through Apple credentials (or generate
   them via EAS). First Android build generates a keystore — **let EAS
   manage it** unless you already have one; losing a self-managed keystore
   permanently blocks future updates to that app.
4. **Real screenshots** — from the resulting build, on an actual device or
   simulator (this dev environment has no display to capture from). Apple
   needs 6.7" and 6.5" iPhone sizes at minimum; Google needs at least 2 per
   supported form factor.
5. **Replace every placeholder** in `docs/store/app-store-listing.md`,
   `docs/store/play-store-listing.md`, and `docs/privacy-policy.md` —
   support email, marketing URL, and the app name itself once branding is
   confirmed.
6. **Submit:**
   ```bash
   npx eas submit --platform ios --profile production
   npx eas submit --platform android --profile production
   ```
