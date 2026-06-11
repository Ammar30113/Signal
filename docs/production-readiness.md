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
- Basic check-ins
- Slip review
- Basic pattern summary
- Export/delete privacy controls

Signal Pro:

- Advanced local pattern intelligence
- Custom redirect protocols
- Weekly review
- High-risk reminders
- App lock
- Future encrypted backup

Target pricing:

- Monthly: `$4.99`
- Annual: `$39.99`
- Trial: 7 days

## Billing Notes

v1 ships fully free. The RevenueCat integration is **built but dormant** — it stays completely inert (and Expo Go keeps working) until a RevenueCat public SDK key is set.

Already wired:

- `react-native-purchases@10.2.2` (autolinks on prebuild; no config plugin needed)
- `utils/purchases.ts` — wrapper with a lazy dynamic import; the native SDK is only loaded when a key is configured
- `constants/revenuecat.ts` — `REVENUECAT_IOS_API_KEY` / `REVENUECAT_ANDROID_API_KEY` (empty = off), `PRO_ENTITLEMENT_ID = "pro"`, manage-subscription deep link
- `app/paywall.tsx` — offerings list, purchase, restore, manage-subscription, privacy link
- Store: `entitlement` is synced from RevenueCat (with a customer-info listener) only when billing is enabled; `refreshEntitlement()` exposed
- Settings: a Pro entry that appears only when `isProBillingEnabled()` is true

To enable Pro (v1.1):

1. Create the RevenueCat project; add the iOS + Android apps; set the `pro` entitlement and an offering with monthly + annual packages.
2. Create the App Store Connect + Google Play subscription products and attach them in RevenueCat. (Keep the App Store Connect subscription already created — do not delete it; attach it to the v1.1 submission.)
3. Paste the public SDK keys into `constants/revenuecat.ts`.
4. Re-add feature gates on Pro-only screens (the gating on advanced Pattern insights was removed for the free launch).
5. Build a dev/EAS build (RevenueCat cannot run in Expo Go) and QA purchase, restore, cancel, expired subscription, no-network entitlement, and reinstall.

---

## Pre-Submission Checklist

### Legal & Compliance
- [x] Privacy Policy — production-grade at `docs/privacy-policy.md`
- [x] Terms of Service — at `docs/terms-of-service.md`
- [x] EULA — at `docs/eula.md`
- [ ] Host privacy policy at `https://ammar30113.github.io/Signal/privacy` (must be a live URL)
- [ ] Host terms of service at `https://ammar30113.github.io/Signal/terms`
- [x] `ITSAppUsesNonExemptEncryption: false` set in `app.json`
- [x] Face ID usage description set in `app.json`
- [x] Age rating: 17+ (Frequent/Intense for Mature Themes and Sexual Content)

### App Store Connect Setup
- [ ] Create app record in App Store Connect
- [ ] Set Primary Category: Health & Fitness
- [ ] Set Secondary Category: Lifestyle
- [ ] Upload promotional text (see `docs/app-store-metadata.md`)
- [ ] Upload description (see `docs/app-store-metadata.md`)
- [ ] Upload keywords (see `docs/app-store-metadata.md`)
- [ ] Upload app icon (1024×1024 — EAS handles this from `assets/icon.png`)
- [ ] Upload screenshots for iPhone 6.9" and 6.7"
- [ ] Fill out App Privacy section — select "Data Not Collected"
- [ ] Fill out Content Rights — "Does not contain third-party content"
- [ ] Fill out age rating questionnaire
- [ ] Add App Review notes (see `docs/app-store-metadata.md`)
- [ ] Set pricing: Free

### App Configuration
- [x] `constants/links.ts` — production URLs and support email
- [x] `app.json` — bundle ID, version, build number set
- [x] EAS project ID configured
- [x] Onboarding flow implemented
- [x] App Lock with Face ID / Touch ID
- [x] Data export and delete functionality
- [x] Settings screen with Privacy Policy, Terms, and Support links
- [x] App version displayed in Settings

### Accessibility
- [x] VoiceOver labels on all interactive elements (Buttons, Chips)
- [x] `accessibilityRole` set on Cards, SectionTitles, Buttons, Chips
- [x] `accessibilityState` on toggleable elements (Chips, Switches)
- [x] State card reads full state description to screen readers
- [x] Minimum 44pt tap targets on all interactive elements

### Testing
- [x] TypeScript: `npm run typecheck` passes with 0 errors
- [x] Logic tests: `npm run test:logic` passes
- [ ] Build: `npx eas build --platform ios --profile preview` succeeds
- [ ] TestFlight: Install and test on physical device
- [ ] App Lock: Enable → background → return → biometric prompt appears
- [ ] Onboarding: Clear data → relaunch → onboarding appears
- [ ] SOS Timer: Verify timer continues when screen is locked
- [ ] Check-in: Complete full flow → results appear on dashboard and pattern map
- [ ] Slip Review: Complete flow → appears in pattern map
- [ ] Data Export: Export → verify JSON contains all logged data
- [ ] Data Delete: Delete → confirm all data cleared, onboarding reappears
- [ ] Settings links: Privacy Policy, Terms, and Support all open correctly

### Post-Submission
- [ ] Monitor App Review status
- [ ] Respond to any App Review rejection feedback within 24 hours
- [ ] Prepare v1.0.1 patch release for any post-launch issues
- [ ] Set up Crashlytics or equivalent crash reporting for production monitoring

---

## App Review Tips

1. **Subject matter explanation**: Include a clear note in App Review Notes explaining that this is a recovery/self-improvement tool, not a content app. Apple reviewers may flag the 17+ rating otherwise.

2. **No backend**: Emphasize that the app is entirely local-first with no server calls. This simplifies review significantly.

3. **Face ID**: Apple will verify the `NSFaceIDUsageDescription` string is clear and accurate. Ours is: "Signal uses Face ID to keep your check-ins and history private on this device."

4. **No IAP in v1**: Since v1 is entirely free with no in-app purchases, the billing/subscription review is skipped.

5. **Screenshots**: Take screenshots on a device or simulator with realistic data (not empty states). Show the SOS timer running, a completed check-in, and the pattern map with at least some data.

## Pro Checklist (v1.1 fast-follow)

- Subscription restore + manage actions: DONE (`app/paywall.tsx`).
- Set RevenueCat keys, re-add Pro feature gates, attach the App Store Connect subscription.
- Test purchase, restore, cancel, expired subscription, no-network entitlement, and reinstall on a dev/store build.
