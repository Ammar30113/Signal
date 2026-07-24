# Signal Production Readiness

## Competitor Gaps To Avoid

- Do not put emergency access behind a paywall.
- Do not claim perfect blocking; blockers are friction, not recovery.
- Do not use surveillance screenshots or default accountability partners.
- Do not use fake lifetime discounts, confusing restore flows, or aggressive paywalls.
- Do not ship unmoderated community in v1.

## Free vs Pro

Free forever:

- SOS 5/10-minute timer
- Pause timer
- Basic check-ins
- Slip review
- Custom redirect protocols
- Weekly review and basic pattern summary
- App lock
- Export/delete privacy controls

Signal Pro:

- High-risk reminders
- Advanced trend comparisons and guided weekly planning
- Expanded protocol templates and recovery playbooks
- Future encrypted backup

Target pricing:

- Monthly: `$4.99`
- Annual: `$34.99`
- Trial: 7 days

## Billing Notes

v1 ships fully free. The RevenueCat integration is **built but dormant** — it stays completely inert (and Expo Go keeps working) until a RevenueCat public SDK key is set.

Already wired:

- `react-native-purchases@^10.3` (autolinks on prebuild; no config plugin needed)
- `utils/purchases.ts` — wrapper with a lazy dynamic import; the native SDK is only loaded when a key is configured
- `constants/revenuecat.ts` — `REVENUECAT_IOS_API_KEY` / `REVENUECAT_ANDROID_API_KEY` (empty = off), `PRO_ENTITLEMENT_ID = "pro"`, manage-subscription deep link
- `app/paywall.tsx` — offerings list, purchase, restore, manage-subscription, privacy link
- Store: `entitlement` is synced from RevenueCat (with a customer-info listener) only when billing is enabled; `refreshEntitlement()` exposed
- Settings: a Pro entry that appears only when `isProBillingEnabled()` is true

## EAS Update Notes

OTA updates are configured with `expo-updates`, `updates.url`, and EAS build channels:

- `development` profile -> `development` channel
- `preview` and `preview-simulator` profiles -> `preview` channel
- `production` profile -> `production` channel

Use OTA only for JavaScript, asset, and copy changes that are compatible with the same native runtime. Native dependency changes, native config changes, widgets, permissions, and SDK changes still require a new EAS build and App Store submission.

Publish commands:

- Preview/internal test: `eas update --channel preview --message "Describe the change"`
- Production patch: `eas update --channel production --message "Describe the change"`

To enable Pro (v1.1):

1. Create the RevenueCat project; add the iOS + Android apps; set the `pro` entitlement and an offering with monthly + annual packages.
2. Create the App Store Connect + Google Play subscription products and attach them in RevenueCat. (Keep the App Store Connect subscription already created — do not delete it; attach it to the v1.1 submission.)
3. Paste the public SDK keys into `constants/revenuecat.ts`.
4. Re-add feature gates on Pro-only screens (the gating on advanced Pattern insights was removed for the free launch).
5. Build a dev/EAS build (RevenueCat cannot run in Expo Go) and QA purchase, restore, cancel, expired subscription, no-network entitlement, and reinstall.

---

## Current Release Status

**Live on the App Store: v1.0.2. Working tree: v1.0.3, unreleased.**

- Live listing verified at https://apps.apple.com/us/app/signal-urge-reset/id6776899029 — v1.0.2, Free, 18+, Health & Fitness, released ~July 9, 2026.
- iOS `1.0.2` build `13` came from EAS build `8598e4c0-045d-46a9-9747-c6a03fd8bd6d` (commit `fb1ba2d`).
- A production EAS Update for runtime `1.0.2` was published from commit `2bb0762` as update group `c7a07b26-fc60-4ce1-9f7b-b72b1f0ac9a1`.

### 1.0.3 is a build, not an OTA

`app.json` moved to `1.0.3` on July 24, 2026, which — under the `appVersion`
runtime policy — moves `runtimeVersion` with it. **Nothing in this tree can
reach live 1.0.2 users over the air**, and that is deliberate: two changes here
are native and would break under an OTA that pretended otherwise.

- Lock Screen SOS widget families (`accessoryCircular` / `accessoryRectangular`
  in `targets/SOSWidget/SOSWidget.swift`) — Swift, compiled into the binary.
- Ten Expo SDK 56 native modules realigned to the versions the SDK expects
  (`expo-router`, `expo-updates`, `react-native-screens`, and others). The JS in
  this tree is built against that newer native code.

Because the runtimes no longer match, an accidental `eas update --channel
production` is now a no-op for 1.0.2 users rather than a mismatched bundle.

Ship path for 1.0.3:

```bash
npx eas build -p ios --profile production
npx eas submit -p ios --profile production
```

Once 1.0.3 is live, `eas update --channel production` resumes as the path for
JS/asset/copy-only fixes on top of it.

## Pre-Submission Checklist

### Legal & Compliance
- [x] Privacy Policy — production-grade at `docs/privacy-policy.md`
- [x] Terms of Service — at `docs/terms-of-service.md`
- [x] EULA — at `docs/eula.md`
- [x] Host privacy policy at `https://signal-liart-rho.vercel.app/privacy` (returns unauthenticated 200)
- [x] Host terms of service at `https://signal-liart-rho.vercel.app/terms` (returns unauthenticated 200)
- [x] Host support page at `https://signal-liart-rho.vercel.app/support` (returns unauthenticated 200)
- [x] `ITSAppUsesNonExemptEncryption: false` set in `app.json`
- [x] Face ID usage description set in `app.json`
- [x] Age rating: 18+ (Frequent/Intense for Mature Themes and Sexual Content)

### App Store Connect Setup — complete (app approved and live)
- [x] Create app record in App Store Connect
- [x] Set Primary Category: Health & Fitness (verified on live listing)
- [x] Set Secondary Category: Lifestyle
- [x] Upload promotional text (see `docs/app-store-metadata.md`)
- [x] Upload description (see `docs/app-store-metadata.md`)
- [x] Upload keywords (see `docs/app-store-metadata.md`)
- [x] Upload app icon (1024×1024 — EAS handles this from `assets/icon.png`)
- [x] Upload screenshots for iPhone 6.9" and 6.7"
- [x] Fill out App Privacy section — "Data Not Collected"
- [x] Fill out Content Rights — "Does not contain third-party content"
- [x] Fill out age rating questionnaire (18+ verified on live listing)
- [x] Add App Review notes (see `docs/app-store-metadata.md`)
- [x] Set pricing: Free (verified on live listing)

### App Configuration
- [x] `constants/links.ts` — production URLs and support email
- [x] `app.json` — bundle ID, version, EAS project ID, and remote versioning configured
- [x] EAS project ID configured
- [x] Onboarding flow implemented
- [x] App Lock with Face ID / Touch ID
- [x] Data export and delete functionality
- [x] Settings screen with Privacy Policy, Terms, and Support links
- [x] App version and native build metadata displayed in Settings

### Accessibility
- [x] VoiceOver labels on all interactive elements (Buttons, Chips)
- [x] `accessibilityRole` set on Cards, SectionTitles, Buttons, Chips
- [x] `accessibilityState` on toggleable elements (Chips, Switches)
- [x] State card reads full state description to screen readers
- [x] Minimum 44pt tap targets on all interactive elements

### Testing
- [x] TypeScript: `npm run typecheck` passes with 0 errors
- [x] Logic tests: `npm run test:logic` passes
- [x] Expo doctor: `npm exec -- expo-doctor` passes (21/21)
- [x] Expo dependency validation: `npm exec -- expo install --check` passes

`.github/workflows/ci.yml` runs typecheck, the logic tests, and
`expo install --check` on every push to `main` and every PR. That last check
exits non-zero the moment a dependency drifts from the version SDK 56 expects,
so treat a red CI on an untouched branch as "run `npx expo install --fix`", not
as a flake.
- [x] Bundle sanity: `npm exec -- expo export --platform ios` and `npm exec -- expo export --platform web` pass
- [x] Build: EAS iOS production build `8598e4c0-045d-46a9-9747-c6a03fd8bd6d` succeeded

### On-device regression pass (post-launch, still owed)

The app shipped without this checklist being recorded as done. Run it on a
physical device with the production build and check items off — it doubles as
the regression script for every future release.

- [ ] App Lock: Enable → background → return → biometric prompt appears
- [ ] Onboarding: Clear data → relaunch → onboarding appears
- [ ] SOS Timer: Verify timer resumes accurately after app background / foreground
- [ ] Check-in: Complete full flow → results appear on dashboard and pattern map
- [ ] Slip Review: Complete flow → appears in pattern map
- [ ] Pause: Complete flow → count appears on dashboard and pattern map
- [ ] SOS Widget: Add to Home Screen → tap → opens SOS screen
- [ ] Data Export: Export → verify JSON contains all logged data
- [ ] Data Delete: Delete → confirm all data cleared, onboarding reappears
- [ ] Settings links: Privacy Policy, Terms, Support, and Our story all open correctly

### Post-Launch
- [x] App approved — live on the App Store as of ~July 9, 2026
- [x] v1.0.3 prepared — see "What 1.0.3 contains" above
- [ ] Build and submit v1.0.3 (`eas build` → `eas submit`, both `-p ios --profile production`)
- [ ] Run the on-device regression pass above against the 1.0.3 build before submitting
- [ ] Monitor App Store reviews and support inbox (supportsignalteam@gmail.com) weekly
- [ ] Decide whether to keep the no-crash-SDK privacy posture or add privacy-preserving crash reporting in a later release

### What 1.0.3 contains

All of the following ships in the 1.0.3 binary. The JS-only items below were
drafted as OTA candidates against runtime 1.0.2; the native changes in the same
tree overtook that, so they now go out with the build.

**UI and flow (JS):**

- SF Symbol tab icons (letter-circle fallback kept for Expo Go Android)
- Breathing pulse on running SOS/Pause timers (respects Reduce Motion) and a
  crossfade on dashboard state changes
- Check-in: stale classification clears when inputs change; slider/trigger
  re-seed from the latest snapshot on tab focus
- iOS data export shares a real `.json` file from the cache directory
- Paywall: Terms of use link (Apple requires Terms + Privacy on subscription
  paywalls), Restore disabled mid-purchase, purchase configures the SDK first
- "Our story" reachable from Settings; chip tap targets widened to ~44pt

**Correctness fixes (July 24, 2026 inspection):**

- SOS no longer carries a saved protocol's reflection and intensity readings
  into the next session. The tab never unmounts, so restarting after a save left
  the old answers in the form already valid to submit — a second tap logged that
  session twice in the pattern map.
- Pauses now count toward `progressDays`. A day interrupted only by a pause was
  previously worth zero "days structured" even though pauses count everywhere
  else in the app. A pause still never re-classifies the urge state.
- High-risk reminders are cancelled when the Pro entitlement lapses or local
  data is deleted. Previously the scheduled daily notifications survived both,
  so the OS kept firing them after the app had dropped the setting — which also
  broke the promise that "Delete local data" clears the device.

**Native:**

- Lock Screen SOS widget (`accessoryCircular` / `accessoryRectangular`
  families in `targets/SOSWidget/SOSWidget.swift`) — typechecked against the
  iOS 17 SDK with `swiftc -typecheck -parse-as-library`; compiles for real on
  the next EAS build
- Expo SDK 56 dependency realignment (10 packages) so `expo install --check`
  and `expo-doctor` pass again — this is what CI enforces

**Site (deploys on push via Vercel):** App Store download CTA, favicon,
meta/OG tags.

---

## App Review Tips

1. **Subject matter explanation**: Include a clear note in App Review Notes explaining that this is a recovery/self-improvement tool, not a content app. Apple reviewers may flag the 18+ rating otherwise.

2. **No backend**: Emphasize that the app is entirely local-first with no server calls. This simplifies review significantly.

3. **Face ID**: Apple will verify the `NSFaceIDUsageDescription` string is clear and accurate. Ours is: "Signal uses Face ID to keep your check-ins and history private on this device."

4. **No IAP in v1**: Since v1 is entirely free with no in-app purchases, the billing/subscription review is skipped.

5. **Screenshots**: Take screenshots on a device or simulator with realistic data (not empty states). Show the SOS timer running, a completed check-in, and the pattern map with at least some data.

## Pro Checklist (v1.1 fast-follow)

- Subscription restore + manage actions: DONE (`app/paywall.tsx`).
- Set RevenueCat keys, re-add Pro feature gates, attach the App Store Connect subscription.
- Test purchase, restore, cancel, expired subscription, no-network entitlement, and reinstall on a dev/store build.
