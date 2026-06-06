# Signal
Private Expo iOS MVP for Signal, a dark-mode behavioral control system for urge awareness, interruption, and redirection.

Signal is positioned as a private 10-minute urge interruption system, not a porn blocker, surveillance tool, or shame-based streak app.

## Run on Android with Expo Go

Install dependencies once:

```bash
npm install
```

Start on the same Wi-Fi network:

```bash
npm run start:android
```

If the phone cannot connect to the LAN QR code, use a tunnel:

```bash
npm run start:tunnel
```

Then open Expo Go on Android and scan the QR code. Keep the terminal running while testing.

## Production Direction

- v1 launch: fully free. SOS timer, check-ins, slip review, pattern map, App Lock, and privacy controls — no paywall.
- Monetization (post-launch fast-follow): a Pro tier is planned but is **not** in v1. It requires real StoreKit / Google Play Billing (via RevenueCat) and store-side subscription products before any price is shown in-app. Do not re-enable pricing UI until that integration ships and is QA'd on a dev/store build.
- Trust rule: never monetize panic. Panic tools stay free permanently. Monetize insight, personalization, and long-term structure only.
- Privacy rule: personal behavior data stays local by default. No screenshots, no surveillance, no default accountability partner.

## Building for the stores

Expo Go is for development only and cannot run real store builds, App Lock biometrics, or IAP. To ship:

```bash
npx eas init        # creates the EAS project id (writes extra.eas.projectId)
npx eas build -p ios
npx eas build -p android
```

Before submitting: set `PRIVACY_POLICY_URL` and `SUPPORT_EMAIL` in `constants/links.ts`, host `docs/privacy-policy.md`, and set the App Store/Play age rating to 17+.

See [docs/production-readiness.md](docs/production-readiness.md) for launch and competitor-gap notes.
