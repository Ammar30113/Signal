# Signal — App Store Connect Metadata

Use this document when filling out App Store Connect for iOS submission.

---

## App Information

| Field | Value |
|-------|-------|
| **App Name** | Signal: Urge Reset |
| **Subtitle** | Private 10-Minute Urge Reset |
| **Bundle ID** | `com.signal.reset` |
| **SKU** | `signal-reset-v1` |
| **Primary Language** | English (U.S.) |

## Categorization

| Field | Value |
|-------|-------|
| **Primary Category** | Health & Fitness |
| **Secondary Category** | Lifestyle |

## Age Rating Questionnaire

| Question | Answer |
|----------|--------|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic or Sadistic Violence | None |
| Profanity or Crude Humor | None |
| Mature/Suggestive Themes | Frequent/Intense |
| Horror/Fear Themes | None |
| Medical/Treatment Information | None |
| Alcohol, Tobacco, or Drug Use | None |
| Simulated Gambling | None |
| Sexual Content and Nudity | Frequent/Intense |
| Contests | None |
| Unrestricted Web Access | None |

**Expected Rating**: 18+

> [!IMPORTANT]
> The "Frequent/Intense" selections for Mature Themes and Sexual Content are required because Signal's core purpose involves pornography recovery. Apple requires honest disclosure even though the app contains no explicit content itself.

---

## App Store Description

### Promotional Text (170 characters)
```
A private 10-minute urge interruption system. No surveillance. No blockers. No accounts. Everything stays on your device.
```

### Description (4000 characters max)
```
Signal is a private behavioral control system for urge awareness, interruption, and redirection. It is not a porn blocker, not a surveillance tool, and not a shame-based streak app.

THE 10-MINUTE PROTOCOL
When an urge hits, Signal gives you a timed intervention: name the cue, choose an action, move your body, then reflect. Complete the protocol, log what helped, and build your personal pattern map over time.

HOW IT WORKS
• SOS Timer — 5 or 10-minute intervention with haptic feedback
• Pause Timer — 30, 60, or 90-second urge delay before a concrete redirect
• Check-Ins — Classify your current state by naming your mood, trigger, and escalation cues
• Slip Review — If the sequence crossed a line, review it without a shame spiral. No binge logic.
• Pattern Map — See your top triggers, danger windows, weekly review, emotion-trigger pairs, and which redirect actions actually lower your intensity
• Custom Redirects — Save personal redirect actions that appear in the dashboard and pause flow
• Identity Anchoring — Remember who you are becoming and what this protects

PRIVACY FIRST
Signal has no accounts, no analytics, no trackers, and no screenshots. Your check-ins, pauses, SOS sessions, custom redirects, and slip reviews are stored only on your device. You can export or permanently delete your data at any time from the Privacy screen.

App Lock keeps Signal private with Face ID, Touch ID, or your device passcode.

WHAT MAKES SIGNAL DIFFERENT
Most competitors rely on imperfect content blockers, surveillance screenshots, or shame-driven streaks. Signal addresses the gap they miss: the 10-minute window between urge and action where a simple interruption is the most effective intervention.

• No fake blocker promises
• No default accountability partners
• No surveillance screenshots
• No aggressive paywalls on panic tools
• SOS and all core tools are free, permanently

BUILT FOR ADULTS
Signal is rated 18+ and designed for adults who want to change a behavioral pattern with dignity, structure, and privacy.

WHAT'S INCLUDED (FREE)
• SOS 5/10-minute timer
• Pause timer
• Check-ins with mood, trigger, and cue classification
• Slip review with recovery stance
• Pattern map with trigger profiles, danger windows, and weekly review
• Custom redirect protocols
• Identity anchoring
• App Lock (Face ID / Touch ID)
• Full data export and delete

Signal does not promise perfect blocking. It increases awareness, adds a 10-minute interruption, and helps you redirect before the loop becomes automatic.
```

### Keywords (100 characters max)
```
urge,interrupt,habit,recovery,self-control,mindfulness,timer,private,no-tracker,behavior,reset
```

---

## App Review Notes

```
Signal is a private, local-first behavioral interruption tool. It helps adults manage unwanted urges through a structured 10-minute protocol.

All data is stored on-device only. There is no backend server, no user accounts, and no data collection. The app does not contain any explicit or sexual content — it is a recovery and self-improvement tool rated 18+ due to its subject matter.

Key features to test:
1. Dashboard — shows current state, risk level, and redirect actions
2. Check-In — multi-step urge classification
3. SOS — timed intervention protocol with reflection
4. Pause — short timer that logs a selected redirect action
5. Pattern Map — aggregated insights and weekly review from local data
6. Settings — custom redirects, data export, data deletion, App Lock toggle, privacy policy, terms of service

App Lock (Face ID) can be enabled in Settings > Privacy Posture. To test: enable App Lock, background the app, then return to it.

The "Delete local data" button in Settings clears all stored data, which also resets the onboarding flow.
```

---

## App Privacy (App Store Connect)

### Data Not Collected
Signal does not collect any data. Select **"Data Not Collected"** in App Store Connect.

| Data Type | Collected? | Linked to Identity? | Used for Tracking? |
|-----------|-----------|---------------------|-------------------|
| Contact Info | No | — | — |
| Health & Fitness | No | — | — |
| Financial Info | No | — | — |
| Location | No | — | — |
| Sensitive Info | No | — | — |
| Contacts | No | — | — |
| User Content | No | — | — |
| Browsing History | No | — | — |
| Search History | No | — | — |
| Identifiers | No | — | — |
| Usage Data | No | — | — |
| Diagnostics | No | — | — |

> [!NOTE]
> Apple itself may collect crash logs and basic diagnostics if the user has opted in to sharing analytics with developers. This is handled by Apple, not by Signal, and does not need to be declared in our privacy section.

---

## Content Rights

Select: **"This app does not contain, show, or access third-party content."**

---

## Screenshots Required

| Device | Required Sizes |
|--------|---------------|
| iPhone 6.9" (16 Pro Max) | 1320 × 2868 or 2868 × 1320 |
| iPhone 6.7" (15 Plus/Pro Max) | 1290 × 2796 or 2796 × 1290 |
| iPad Pro 13" (if supportsTablet were true) | Not required — `supportsTablet: false` |

Suggested screenshots (in order):
1. Dashboard with Green state
2. SOS timer running
3. Check-in classification result
4. Pattern map with insights
5. Settings / Privacy screen

---

## URLs

| Field | URL |
|-------|-----|
| Privacy Policy URL | `https://signal-liart-rho.vercel.app/privacy` |
| Terms of Service URL | `https://signal-liart-rho.vercel.app/terms` |
| Support URL | `https://signal-liart-rho.vercel.app/support` |
| Marketing URL | `https://signal-liart-rho.vercel.app` (optional) |
