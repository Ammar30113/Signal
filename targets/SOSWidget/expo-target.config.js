/** @type {import('@bacons/apple-targets/app.plugin').Config} */
// iOS widget target for Signal. Generated into the Xcode project by
// @bacons/apple-targets during `expo prebuild` — the gitignored ios/ folder is
// rebuilt from this on every prebuild, so always edit here, never in ios/.
//
// This is a STATIC widget: it carries no user data and needs no App Group. It
// just deep-links into the SOS screen via the app's "signal" URL scheme, so
// there are no extra entitlements and minimal signing impact.
module.exports = {
  type: "widget",
  name: "SOSWidget",
  displayName: "Signal SOS",
  icon: "../../assets/icon.png",
  // Home Screen widget uses iOS 14+, but containerBackground (used below) needs
  // iOS 17. The app itself stays on its own (lower) deployment target.
  deploymentTarget: "17.0",
  frameworks: ["SwiftUI", "WidgetKit"],
};
