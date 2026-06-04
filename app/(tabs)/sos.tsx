import React from "react";
import { View } from "react-native";

import { AppText, Button, Card, Chip, Header, ProgressBar, Row, Screen, SectionTitle, Wrap } from "@/components/ui";
import { theme } from "@/constants/theme";
import { emergencyActions } from "@/data/signal-data";
import type { EmergencyAction } from "@/types/signal";

const steps = ["Pause", "Stand up", "Move away from screen", "Breathe", "Choose next action"];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export default function SosScreen() {
  const [duration, setDuration] = React.useState(300);
  const [remaining, setRemaining] = React.useState(300);
  const [running, setRunning] = React.useState(false);
  const [selectedAction, setSelectedAction] = React.useState<EmergencyAction>("Walk outside");

  React.useEffect(() => {
    if (!running) return undefined;

    const interval = setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  const progress = duration === 0 ? 0 : ((duration - remaining) / duration) * 100;

  return (
    <Screen>
      <Header
        eyebrow="Emergency mode"
        title="Move now."
        detail="This is not a debate screen. Create physical distance and let the spike pass."
      />

      <Card accentColor={theme.colors.red} style={{ backgroundColor: "#161014" }}>
        <SectionTitle title="Intervention timer" detail={`Action selected: ${selectedAction}`} />
        <AppText
          style={{
            color: theme.colors.white,
            fontSize: 72,
            lineHeight: 76,
            fontWeight: "900",
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatTime(remaining)}
        </AppText>
        <ProgressBar value={progress} color={theme.colors.red} />
        <Row>
          <Chip
            label="5 min"
            selected={duration === 300}
            onPress={() => {
              setDuration(300);
              setRemaining(300);
              setRunning(false);
            }}
          />
          <Chip
            label="10 min"
            selected={duration === 600}
            onPress={() => {
              setDuration(600);
              setRemaining(600);
              setRunning(false);
            }}
          />
        </Row>
        <Row style={{ alignItems: "stretch" }}>
          <View style={{ flex: 1 }}>
            <Button
              label={running ? "Pause timer" : remaining === 0 ? "Restart" : "Start"}
              tone="danger"
              onPress={() => {
                if (remaining === 0) {
                  setRemaining(duration);
                  setRunning(true);
                  return;
                }
                setRunning((current) => !current);
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Reset"
              tone="ghost"
              onPress={() => {
                setRunning(false);
                setRemaining(duration);
              }}
            />
          </View>
        </Row>
      </Card>

      <Card>
        <SectionTitle title="Immediate steps" />
        {steps.map((step, index) => (
          <Row key={step}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: index === 0 ? theme.colors.red : theme.colors.surfaceMuted,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText style={{ fontWeight: "900", fontSize: 13 }}>{index + 1}</AppText>
            </View>
            <AppText style={{ color: theme.colors.textSoft, fontSize: 16 }}>{step}</AppText>
          </Row>
        ))}
      </Card>

      <Card>
        <SectionTitle title="Choose one action" detail="Lower friction. No perfect option needed." />
        <Wrap>
          {emergencyActions.map((action) => (
            <Chip
              key={action}
              label={action}
              selected={selectedAction === action}
              onPress={() => setSelectedAction(action)}
              style={selectedAction === action ? { backgroundColor: theme.colors.red, borderColor: theme.colors.red } : undefined}
              textStyle={selectedAction === action ? { color: theme.colors.white } : undefined}
            />
          ))}
        </Wrap>
      </Card>
    </Screen>
  );
}
