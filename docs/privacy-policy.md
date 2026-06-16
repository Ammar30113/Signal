# Signal Privacy Policy

_Effective date: June 9, 2026_
_Last updated: June 9, 2026_

Signal is a private, local-first habit-interruption app developed and published by ab3011s-organization. This policy explains, in plain language, what data Signal handles and how.

---

## The Short Version

- Signal stores your data **only on your device.**
- Signal has **no account, no login, and no server.** Nothing you log is uploaded to us.
- Signal contains **no analytics, no advertising, and no third-party trackers.**
- Signal does **not track you** across apps or websites. We do not participate in any ad tracking.
- You can **export or permanently delete** your data at any time from the Privacy screen.

---

## What Data Signal Stores

Signal lets you log information to help you notice and interrupt urges, including:

- **Check-ins** — mood, urge intensity, triggers, loneliness signal, escalation cues, and classification results
- **SOS / intervention sessions** — timer use, chosen redirect action, emotion, trigger, before/after intensity, and your written reflection
- **Slip reviews** — your notes about what happened, the trigger, the rationalization script, and what would help next time
- **Pattern data** — aggregated locally from check-ins, interventions, and reviews (top triggers, danger windows, redirect effectiveness)
- **App settings** — protocol duration preference, whether App Lock is enabled, and onboarding completion status

All of this is stored locally on your device using on-device storage (expo-sqlite/localStorage). It is **never** transmitted to Signal, ab3011s-organization, or any third party.

---

## How Your Data Is Used

Your data is used **solely on your device** to:

- Show your current state, risk level, and trends on the dashboard
- Build your local pattern map (top triggers, danger windows, emotion-trigger pairs, redirects that worked)
- Derive insights about your behavioral patterns over time

There is no remote processing. We never see your entries. We cannot access your data even if we wanted to.

---

## Data We Do NOT Collect

For complete transparency, here is what Signal does **not** collect:

| Data Type | Collected? |
|-----------|-----------|
| Name, email, or contact info | ❌ No |
| Device identifiers | ❌ No |
| Location data | ❌ No |
| Browsing or search history | ❌ No |
| Usage analytics | ❌ No |
| Crash reports (by us) | ❌ No |
| Advertising data | ❌ No |
| Health or fitness data (to our servers) | ❌ No |
| Financial or payment information | ❌ No |

---

## App Tracking Transparency

Signal does **not** track you. We do not use Apple's advertising identifier (IDFA), and we do not engage in any form of cross-app or cross-site tracking. Signal will never request the App Tracking Transparency (ATT) permission because there is nothing to track.

---

## Third-Party SDKs and Frameworks

Signal uses the following open-source frameworks, **none of which collect user data**:

| Framework | Purpose | Data Collected |
|-----------|---------|---------------|
| Expo / React Native | App runtime and navigation | None |
| expo-sqlite | On-device local storage | None — data stays on device |
| expo-local-authentication | Face ID / Touch ID for App Lock | None — biometric auth is handled by iOS |
| expo-haptics | Haptic feedback on interactions | None |
| expo-keep-awake | Keep screen on during SOS timer | None |

No analytics SDKs (such as Firebase Analytics, Mixpanel, or Amplitude) are included. No advertising SDKs are included. No crash reporting SDKs are included.

---

## Apple App Store

When you download Signal from the Apple App Store, **Apple** may collect certain information in accordance with Apple's own privacy policy, including:

- Crash logs and diagnostics (if you have opted in to share analytics with app developers in your iOS Settings)
- Basic download and usage metrics visible to us in App Store Connect (aggregate, non-identifying)

This data is collected and controlled by Apple, not by Signal. We do not have access to any personally identifiable information through App Store Connect analytics.

---

## App Lock and Biometric Authentication

You can enable App Lock to require Face ID, Touch ID, or your device passcode before opening Signal. Authentication is performed entirely by your device's operating system through the iOS LocalAuthentication framework. Signal **never** receives, accesses, stores, or transmits your biometric data.

---

## Sharing and Disclosure

We do not sell, rent, share, or disclose your personal data because we never receive it.

The only time data leaves your device is when **you** choose to use the **Export** feature, which produces a JSON file you control and can share wherever you decide. Anything you export and share is your responsibility.

---

## Future Subscription Services (Signal Pro)

When Signal Pro is introduced, subscription billing will be handled entirely by **Apple** through the App Store (StoreKit). Signal will not collect, process, or store any payment or billing information. Apple's privacy practices for in-app purchases are governed by [Apple's Privacy Policy](https://www.apple.com/privacy/).

A local entitlement status (free or pro) is stored on your device to determine which features to enable. No subscription data is transmitted to our servers.

---

## Data Retention and Deletion

Your data remains on your device until you delete it. You have two options:

1. **Delete local data** — Use the "Delete local data" button on the Privacy screen. This immediately and permanently removes all check-ins, SOS sessions, slip reviews, settings, and pattern data.
2. **Delete the app** — Uninstalling Signal from your device also removes all locally stored data.

Because we never receive your data, there is nothing for us to delete on our end. There is no account to close.

---

## Data Security

Your data is protected by the security features of your device, including:

- Device encryption (enabled by default on all modern iOS devices)
- Optional App Lock using Face ID, Touch ID, or device passcode
- No network transmission — your data cannot be intercepted in transit because it is never transmitted

We recommend keeping your device's operating system up to date and using a strong device passcode.

---

## California Residents (CCPA)

Under the California Consumer Privacy Act (CCPA), California residents have the right to know what personal information is collected, request deletion of personal information, and opt out of the sale of personal information.

Because Signal does not collect, store, or sell any personal information, these rights are satisfied by design:

- **Right to Know**: We collect no personal information.
- **Right to Delete**: Use the "Delete local data" button in the app, or delete the app.
- **Right to Opt Out of Sale**: We do not sell personal information. There is nothing to opt out of.
- **Non-Discrimination**: We do not discriminate against users who exercise their privacy rights.

---

## European Residents (GDPR)

Under the General Data Protection Regulation (GDPR), individuals in the European Economic Area have rights regarding their personal data.

Because Signal processes all data locally on your device and never transmits it to external servers:

- **Data Controller**: You are effectively the controller of your own data. We do not process your personal data.
- **Legal Basis**: No legal basis for processing is required because we do not process your data.
- **Data Subject Rights**: You can access, export, and delete your data at any time using the built-in Privacy screen controls.
- **Data Transfer**: No data is transferred outside your device.
- **Data Protection Officer**: Not applicable, as we do not process personal data.

---

## Children

Signal is intended for adults and is rated **17+** on the App Store. The App deals with themes that are not appropriate for children. We do not knowingly collect information from anyone under the age of 17. If you are under 17, do not use this App.

---

## Changes to This Policy

If this policy changes, the updated version will be posted at [https://signal-liart-rho.vercel.app/privacy](https://signal-liart-rho.vercel.app/privacy) with a new "Last updated" date. If we make material changes, we will also update the privacy information within the App.

---

## Contact

Questions or concerns about privacy? Contact us at:

📧 **Email:** [supportsignalteam@gmail.com](mailto:supportsignalteam@gmail.com)
