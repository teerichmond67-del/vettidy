# Store Submission Checklist

Tracks Spec.md §12's "Production builds succeed via EAS Build for both iOS
and Android" and CLAUDE.md's phase 12 (store submission prep). Everything
in this repo/config is done; everything below the line needs your own
accounts and hardware, since none of it is reachable from this dev
environment.

## Done in this repo

- [x] **App icon & Android adaptive icon** — placeholder paw mark on deep
      teal (`assets/icon.png`, `assets/android-icon-foreground.png`),
      generated to replace Expo's generic default. Swap once real branding
      is confirmed (Spec.md §13, open decision #4).
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
      generic boilerplate. Published at
      https://claude.ai/code/artifact/dec1c160-e02c-41ee-b7f3-7cadc162030e
      and saved as `docs/privacy-policy.md`.
- [x] **Store listing copy** — `docs/store/app-store-listing.md` and
      `docs/store/play-store-listing.md`, including Apple's App Privacy
      answers and Google's Data Safety form answers.

## ⚠️ Before your first real submission

**Bundle identifier / package name is effectively permanent.** Once an app
is submitted under `com.vettidy.app`, changing it later means starting
over as a *new* app listing (losing reviews, install counts, ASO
history). If you register a real domain for VetTidy, consider using its
reverse form instead (e.g. `vettidy.app` → `app.vettidy`) before your
first submission — not after.

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
