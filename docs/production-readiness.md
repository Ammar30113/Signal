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

The app now has a local `Entitlement` model and Pro preview UI. Real purchases still require:

- RevenueCat project
- App Store Connect subscription products
- Google Play Billing subscription products
- RevenueCat public SDK keys
- TestFlight/internal testing build for real purchase QA

Expo Go can preview UI, but real in-app purchases require a development or store build.

## Launch Checklist

- Add privacy policy URL.
- Complete Apple App Privacy details.
- Complete Google Play Data Safety.
- Add support email.
- Add subscription restore and manage-subscription actions.
- Test purchase, restore, cancel, expired subscription, no-network entitlement, and reinstall.
- Test local export/delete and confirm no sensitive data leaves the device by default.
