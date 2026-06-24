import { router } from "expo-router";
import React from "react";
import { View } from "react-native";

import { AppText, Button, Card, Chip, Header, Row, Screen, SectionTitle, Wrap } from "@/components/ui";
import { theme } from "@/constants/theme";
import { useSignal } from "@/context/signal-store";
import { emergencyActions, triggers } from "@/data/signal-data";
import type { EmergencyAction, Trigger } from "@/types/signal";

function InsightPiece({ label, body }: { label: string; body: string }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 142,
        gap: 8,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: theme.radius.md,
        borderCurve: "continuous",
        backgroundColor: theme.colors.surfaceMuted,
        padding: 14,
      }}
    >
      <Chip label={label} selected />
      <AppText style={{ color: theme.colors.textSoft, fontSize: 15, lineHeight: 22 }}>{body}</AppText>
    </View>
  );
}

export default function OnboardingScreen() {
  const { updateSettings } = useSignal();
  const [selectedTrigger, setSelectedTrigger] = React.useState<Trigger>("Purposeless scrolling");
  const [selectedAction, setSelectedAction] = React.useState<EmergencyAction>("Walk outside");

  const completeOnboarding = () => {
    updateSettings({ hasCompletedOnboarding: true });
  };

  const handleOpenProtocol = () => {
    completeOnboarding();
    router.replace({
      pathname: "/sos",
      params: {
        trigger: selectedTrigger,
        action: selectedAction,
      },
    });
  };

  const handleOpenDashboard = () => {
    completeOnboarding();
    router.replace("/");
  };

  return (
    <Screen>
      <Header
        eyebrow="Welcome"
        title="Connect the gap."
        detail="Signal helps you catch the moment before an urge turns automatic, then gives you one physical move to run for 10 minutes."
      />

      <Card>
        <SectionTitle
          title="Two pieces"
          detail="Signal does not try to shame you into a decision. It puts the useful facts next to each other."
        />
        <Row style={{ alignItems: "stretch", flexWrap: "wrap" }}>
          <InsightPiece label="Piece one" body="The sequence usually starts before the action: a mood, a cue, a scroll, then bargaining." />
          <InsightPiece label="Piece two" body="A 10-minute physical interruption changes the state before the loop feels inevitable." />
        </Row>
        <View
          style={{
            gap: 10,
            borderColor: theme.colors.gold,
            borderWidth: 1,
            borderRadius: theme.radius.md,
            borderCurve: "continuous",
            backgroundColor: "#15130C",
            padding: 14,
          }}
        >
          <SectionTitle title="The conclusion" />
          <AppText style={{ color: theme.colors.textSoft, fontSize: 17, lineHeight: 25 }}>
            Catch the first cue, delay the loop, and move before the mind starts negotiating.
          </AppText>
        </View>
      </Card>

      <Card>
        <SectionTitle title="Build your first protocol" detail="Pick the honest cue and one action you can do without negotiating." />
        <SectionTitle title="When does the sequence usually start?" />
        <Wrap>
          {triggers.map((trigger) => (
            <Chip
              key={trigger}
              label={trigger}
              selected={selectedTrigger === trigger}
              onPress={() => setSelectedTrigger(trigger)}
            />
          ))}
        </Wrap>
        <SectionTitle title="What move changes your state fastest?" />
        <Wrap>
          {emergencyActions.map((action) => (
            <Chip
              key={action}
              label={action}
              selected={selectedAction === action}
              onPress={() => setSelectedAction(action)}
            />
          ))}
        </Wrap>
      </Card>

      <Card accentColor={theme.colors.gold}>
        <SectionTitle title="Your protocol" detail="This is the product loop in one sentence." />
        <AppText style={{ color: theme.colors.text, fontSize: 22, fontWeight: "900", lineHeight: 30 }}>
          When {selectedTrigger.toLowerCase()} shows up, run {selectedAction.toLowerCase()} for 10 minutes before deciding anything.
        </AppText>
      </Card>

      <Card>
        <SectionTitle title="Privacy first" />
        <View style={{ gap: 12 }}>
          <AppText style={{ color: theme.colors.textSoft, fontSize: 16, lineHeight: 24 }}>
            No accounts. No trackers. No surveillance screenshots. All your check-ins and history stay exactly where they belong: on this device.
          </AppText>
        </View>
      </Card>

      <Card accentColor={theme.colors.gold}>
        <SectionTitle title="Ready?" detail="Start with the protocol, or go to the dashboard and use it when the signal appears." />
        <Button label="Open my protocol" tone="primary" onPress={handleOpenProtocol} />
        <Button label="Go to dashboard" tone="ghost" onPress={handleOpenDashboard} />
      </Card>
    </Screen>
  );
}
