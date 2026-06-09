import { router } from "expo-router";
import React from "react";
import { View } from "react-native";

import { AppText, Button, Card, Header, Screen, SectionTitle } from "@/components/ui";
import { theme } from "@/constants/theme";
import { useSignal } from "@/context/signal-store";

export default function OnboardingScreen() {
  const { updateSettings } = useSignal();

  const handleComplete = () => {
    updateSettings({ hasCompletedOnboarding: true });
    router.replace("/");
  };

  return (
    <Screen>
      <Header
        eyebrow="Welcome"
        title="Signal, not a blocker."
        detail="This is a private 10-minute urge interruption system, not a surveillance tool."
      />

      <Card>
        <SectionTitle title="The Philosophy" />
        <View style={{ gap: 12 }}>
          <AppText style={{ color: theme.colors.textSoft, fontSize: 16, lineHeight: 24 }}>
            Blockers are friction, not recovery. Signal doesn't promise perfect blocking or rely on shame-based streaks.
          </AppText>
          <AppText style={{ color: theme.colors.textSoft, fontSize: 16, lineHeight: 24 }}>
            Instead, we use a 10-minute intervention loop. Move your body before the mind starts negotiating.
          </AppText>
        </View>
      </Card>

      <Card>
        <SectionTitle title="Privacy First" />
        <View style={{ gap: 12 }}>
          <AppText style={{ color: theme.colors.textSoft, fontSize: 16, lineHeight: 24 }}>
            No accounts. No trackers. No surveillance screenshots. All your check-ins and history stay exactly where they belong: on this device.
          </AppText>
        </View>
      </Card>

      <Card accentColor={theme.colors.gold}>
        <SectionTitle title="Ready?" detail="Let's build toward something." />
        <Button label="I understand" tone="primary" onPress={handleComplete} />
      </Card>
    </Screen>
  );
}
