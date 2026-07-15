# Signal

Private, local-first iOS app for urge awareness, interruption, and redirection — **live on the App Store**: [Signal: Urge Reset](https://apps.apple.com/us/app/signal-urge-reset/id6776899029) (v1.0.2, free, 18+).

Signal is positioned as a private 10-minute urge interruption system, not a porn blocker, surveillance tool, or shame-based streak app. Marketing/legal pages are hosted at https://signal-liart-rho.vercel.app (deployed from `site/` via Vercel).

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

## Shipping updates

Expo Go is for development only and cannot run real store builds, App Lock biometrics, the SOS widget, or IAP.

- **JS / asset / copy changes** (same native runtime): `eas update --channel production --message "…"`
- **Native, config, widget, or SDK changes**: bump `version` in `app.json`, then
  ```bash
  npx eas build -p ios --profile production
  npx eas submit -p ios --profile production
  ```

Run `npm run typecheck` and `npm run test:logic` before either path.

See [docs/production-readiness.md](docs/production-readiness.md) for release status, the on-device regression checklist, and the v1.1 Pro playbook.
