import * as LocalAuthentication from "expo-local-authentication";
import React from "react";
import { AppState, Pressable, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import { useSignal } from "@/context/signal-store";

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const { settings, isHydrated } = useSignal();
  const lockEnabled = settings.appLockEnabled;

  const [unlocked, setUnlocked] = React.useState(false);
  const [authing, setAuthing] = React.useState(false);
  const unlockedRef = React.useRef(false);

  const setUnlockedState = React.useCallback((next: boolean) => {
    unlockedRef.current = next;
    setUnlocked(next);
  }, []);

  const authenticate = React.useCallback(async () => {
    setAuthing(true);
    try {
      const enrolledLevel = await LocalAuthentication.getEnrolledLevelAsync();
      // If the device cannot authenticate with biometrics or passcode, don't
      // trap the user out after enabling App Lock on an unsupported device.
      if (enrolledLevel === LocalAuthentication.SecurityLevel.NONE) {
        setUnlockedState(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Signal",
        cancelLabel: "Cancel",
        fallbackLabel: "Use Passcode",
      });
      if (result.success) setUnlockedState(true);
    } catch {
      // Leave locked; the user can retry from the lock screen.
    } finally {
      setAuthing(false);
    }
  }, [setUnlockedState]);

  // Prompt as soon as persisted settings have hydrated.
  React.useEffect(() => {
    if (!isHydrated) return;
    if (!lockEnabled) {
      setUnlockedState(true);
      return;
    }
    if (!unlockedRef.current) void authenticate();
  }, [authenticate, isHydrated, lockEnabled, setUnlockedState]);

  // Re-lock when backgrounded; re-prompt when returning to the foreground.
  React.useEffect(() => {
    if (!lockEnabled) return;
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "background") {
        setUnlockedState(false);
      } else if (next === "active" && !unlockedRef.current) {
        void authenticate();
      }
    });
    return () => sub.remove();
  }, [authenticate, lockEnabled, setUnlockedState]);

  // Hold a blank screen until hydration so we never flash content before locking.
  if (!isHydrated) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  if (lockEnabled && !unlocked) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          gap: 16,
        }}
      >
        <Text style={{ color: theme.colors.text, fontSize: 26, fontWeight: "800" }}>Signal is locked</Text>
        <Text style={{ color: theme.colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" }}>
          Your check-ins and history stay private on this device.
        </Text>
        <Pressable
          onPress={authenticate}
          disabled={authing}
          accessibilityRole="button"
          accessibilityLabel="Unlock Signal"
          style={{
            marginTop: 12,
            minHeight: 54,
            paddingHorizontal: 28,
            borderRadius: theme.radius.md,
            borderCurve: "continuous",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.gold,
            opacity: authing ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "#171104", fontWeight: "800", fontSize: 16 }}>
            {authing ? "Authenticating…" : "Unlock"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}
