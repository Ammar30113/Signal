import * as ScreenCapture from "expo-screen-capture";
import React from "react";
import { AppState, Text, View } from "react-native";

import { theme } from "@/constants/theme";

// Privacy cover for the OS app-switcher snapshot.
//
// iOS/Android take a screenshot of the live screen when the app is backgrounded
// to render the multitasking preview — which could expose a reflection or slip
// note. We render an opaque branded cover whenever the app is not `active`, and
// best-effort block screenshots / the Android recents snapshot via
// expo-screen-capture. Always on, regardless of App Lock, given how sensitive
// the logged data is.
export function PrivacyScreen() {
  const [obscured, setObscured] = React.useState(false);

  React.useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      setObscured(next !== "active");
    });
    return () => sub.remove();
  }, []);

  React.useEffect(() => {
    void ScreenCapture.preventScreenCaptureAsync("signal-privacy").catch(() => undefined);
    return () => {
      void ScreenCapture.allowScreenCaptureAsync("signal-privacy").catch(() => undefined);
    };
  }, []);

  if (!obscured) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colors.background,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={{ color: theme.colors.muted, fontSize: 20, fontWeight: "900", letterSpacing: 6 }}>SIGNAL</Text>
    </View>
  );
}
