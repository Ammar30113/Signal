# Signal SOS widget

A one-tap iOS Home Screen widget that opens Signal straight to the **SOS** screen.

## How it works

- The widget is a static [WidgetKit](https://developer.apple.com/documentation/widgetkit) extension (SwiftUI), added to the Xcode project by the [`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets) config plugin during `expo prebuild`.
- Tapping it opens `signal:///sos`. The app already declares `"scheme": "signal"` in `app.json`, and Expo Router already routes `/sos` to `app/(tabs)/sos.tsx` — so **no app-side code was needed**; the deep link works today.
- It carries no data, so it needs **no App Group and no extra entitlements** — minimal signing impact.

## Files

- `expo-target.config.js` — declares the widget target (name, icon, iOS 17 deployment target, frameworks). Edit target config here, never in `ios/` (that folder is git-ignored and regenerated on every prebuild).
- `SOSWidget.swift` — the widget UI + timeline. Static, single-entry, never auto-reloads.

## Build & test (requires a dev build — widgets do NOT run in Expo Go)

1. **Keep the Apple Team ID** in `app.json` (prebuild warns without it; the extension can't be signed without it):
   ```json
   { "expo": { "ios": { "appleTeamId": "WYNT52D6DX" } } }
   ```
   This is the team currently used by the EAS distribution certificate and provisioning profiles.
2. Generate native code and run:
   ```bash
   npx expo run:ios        # regenerates ios/, installs pods, builds, launches
   ```
   > Heads-up: an `expo prebuild -p ios --clean` was run to validate the plugin, so the local `ios/` was regenerated **without** pods. `expo run:ios` restores a buildable state automatically.
3. On the device/simulator: long-press the Home Screen → **+** → search **Signal SOS** → add the small widget.
4. Tap it → the app opens directly on the SOS screen.

EAS users: `eas build --profile development -p ios` works too; EAS manages the extra extension's credentials.

## Optional drop-ins (left out of the default to keep the core widget compile-safe)

### Lock Screen families (iOS 16+)
In `SOSWidget.swift`, widen the families and branch the view on `@Environment(\.widgetFamily)`:
```swift
.supportedFamilies([.systemSmall, .accessoryCircular, .accessoryRectangular])
```
```swift
@Environment(\.widgetFamily) private var family
// in body: switch family { case .accessoryCircular: ...; case .accessoryRectangular: ...; default: ... }
// Use AccessoryWidgetBackground() for accessory backgrounds; the system tints them.
```

### Control Center control (iOS 18+)
Add a second member to the `WidgetBundle` (gate it so older iOS still builds):
```swift
import AppIntents

@available(iOS 18.0, *)
struct OpenSOSIntent: AppIntent {
  static var title: LocalizedStringResource = "Open Signal SOS"
  static var openAppWhenRun = true
  @MainActor func perform() async throws -> some IntentResult & OpensIntent {
    .result(opensIntent: OpenURLIntent(URL(string: "signal:///sos")!))
  }
}

@available(iOS 18.0, *)
struct SOSControl: ControlWidget {
  var body: some ControlWidgetConfiguration {
    StaticControlConfiguration(kind: "com.signal.reset.SOSControl") {
      ControlWidgetButton(action: OpenSOSIntent()) {
        Label("SOS", systemImage: "exclamationmark.triangle.fill")
      }
    }
    .displayName("Signal SOS")
  }
}
```
```swift
@main
struct SignalWidgets: WidgetBundle {
  var body: some Widget {
    SOSWidget()
    if #available(iOS 18.0, *) { SOSControl() }
  }
}
```
These use newer APIs I couldn't compile here, so verify them in your Xcode build before shipping.
