import { Redirect, Tabs } from "expo-router";
import { Text, View } from "react-native";

import { theme } from "@/constants/theme";
import { useSignal } from "@/context/signal-store";

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
          tabBarIcon: ({ focused }) => <TabMark label="D" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: "Check-In",
          tabBarIcon: ({ focused }) => <TabMark label="C" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pattern"
        options={{
          title: "Pattern",
          tabBarIcon: ({ focused }) => <TabMark label="P" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="identity"
        options={{
          title: "Identity",
          tabBarIcon: ({ focused }) => <TabMark label="I" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: "SOS",
          tabBarActiveTintColor: theme.colors.red,
          tabBarIcon: ({ focused }) => <TabMark label="!" focused={focused} danger />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Privacy",
          tabBarIcon: ({ focused }) => <TabMark label="S" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
