import "react-native-gesture-handler";

import { Stack } from "expo-router";
import type { ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppLockGate } from "@/components/app-lock-gate";
import { theme } from "@/constants/theme";
import { SignalProvider } from "@/context/signal-store";

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
        <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: "800" }}>Something went wrong</Text>
        <Text style={{ color: theme.colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" }}>
          {error.message}
        </Text>
        <Pressable
          onPress={retry}
          accessibilityRole="button"
          accessibilityLabel="Restart"
          style={{
            marginTop: 16,
            minHeight: 50,
            paddingHorizontal: 28,
            borderRadius: theme.radius.md,
            borderCurve: "continuous",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.gold,
          }}
        >
          <Text style={{ color: "#171104", fontWeight: "800", fontSize: 16 }}>Restart</Text>
        </Pressable>
      </View>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaProvider>
        <SignalProvider>
          <AppLockGate>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: theme.colors.background },
                headerStyle: { backgroundColor: theme.colors.background },
                headerTintColor: theme.colors.text,
                headerShadowVisible: false,
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="about" options={{ title: "Our Story", headerBackTitle: "Back" }} />
              <Stack.Screen
                name="slip-review"
                options={{
                  title: "Slip Review",
                  presentation: "card",
                }}
              />
            </Stack>
          </AppLockGate>
        </SignalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
