import { Redirect, Tabs } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { Text, View, type ColorValue } from "react-native";

import { theme } from "@/constants/theme";
import { useSignal } from "@/context/signal-store";

// Letter fallback for platforms where the symbol can't render (e.g. Expo Go on
// Android). iOS — the shipped platform — gets real SF Symbols below.
function TabMark({
  label,
  focused,
  danger,
}: {
  label: string;
  focused: boolean;
  danger?: boolean;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? (danger ? theme.colors.red : theme.colors.gold) : "transparent",
        borderWidth: 1,
        borderColor: focused ? (danger ? theme.colors.red : theme.colors.gold) : theme.colors.borderStrong,
      }}
    >
      <Text
        style={{
          color: focused ? theme.colors.background : theme.colors.muted,
          fontSize: 12,
          fontWeight: "900",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function TabIcon({
  symbol,
  focusedSymbol,
  fallbackLabel,
  focused,
  color,
  danger,
}: {
  symbol: SFSymbol;
  focusedSymbol?: SFSymbol;
  fallbackLabel: string;
  focused: boolean;
  color: ColorValue;
  danger?: boolean;
}) {
  return (
    <SymbolView
      name={focused ? (focusedSymbol ?? symbol) : symbol}
      size={25}
      tintColor={color}
      weight={focused ? "semibold" : "regular"}
      fallback={<TabMark label={fallbackLabel} focused={focused} danger={danger} />}
    />
  );
}

export default function TabLayout() {
  const { settings } = useSignal();

  if (!settings.hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.gold,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.backgroundSoft,
          borderTopColor: theme.colors.border,
          minHeight: 72,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon symbol="waveform.path.ecg" fallbackLabel="D" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: "Check-In",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon symbol="checklist" fallbackLabel="C" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pattern"
        options={{
          title: "Pattern",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon symbol="chart.xyaxis.line" fallbackLabel="P" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="identity"
        options={{
          title: "Identity",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              symbol="person.crop.circle"
              focusedSymbol="person.crop.circle.fill"
              fallbackLabel="I"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: "SOS",
          tabBarActiveTintColor: theme.colors.red,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              symbol="exclamationmark.triangle"
              focusedSymbol="exclamationmark.triangle.fill"
              fallbackLabel="!"
              focused={focused}
              color={color}
              danger
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Privacy",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              symbol="lock.shield"
              focusedSymbol="lock.shield.fill"
              fallbackLabel="S"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
