import React from "react";
import { TextInput, View } from "react-native";

import { IntensitySlider } from "@/components/intensity-slider";
import { AppText, Button, Card, Chip, Header, ProgressBar, Row, Screen, SectionTitle, Wrap } from "@/components/ui";
import { theme } from "@/constants/theme";
import { emergencyActions, moods, triggers } from "@/data/signal-data";
import { useSignal } from "@/context/signal-store";
import type { EmergencyAction, Trigger } from "@/types/signal";

const steps = ["Pause", "Stand up", "Move away from screen", "Breathe", "Choose next action"];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export default function SosScreen() {
  const { snapshot, settings, updateSettings, completeIntervention } = useSignal();
  const [duration, setDuration] = React.useState(settings.protocolDurationSeconds);
  const [remaining, setRemaining] = React.useState(settings.protocolDurationSeconds);
  const [running, setRunning] = React.useState(false);
  const [selectedAction, setSelectedAction] = React.useState<EmergencyAction>("Walk outside");
  const [emotion, setEmotion] = React.useState("Restless");
  const [trigger, setTrigger] = React.useState<Trigger>(snapshot.topTrigger);
  const [intensityBefore, setIntensityBefore] = React.useState(snapshot.intensity);
  const [intensityAfter, setIntensityAfter] = React.useState(Math.max(0, snapshot.intensity - 18));
  const [reflection, setReflection] = React.useState("I changed location and let the spike pass.");
  const [reflectionReady, setReflectionReady] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (!running) return undefined;

    const interval = setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          setRunning(false);
          setReflectionReady(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  const setProtocolDuration = (seconds: number) => {
    setDuration(seconds);
    setRemaining(seconds);
    setRunning(false);
    setReflectionReady(false);
    setSaved(false);
    updateSettings({ protocolDurationSeconds: seconds });
  };

  const progress = duration === 0 ? 0 : ((duration - remaining) / duration) * 100;
  const canSave = reflectionReady && reflection.trim().length > 0;

  const handleSave = () => {
    completeIntervention({
      durationSeconds: duration,
      selectedAction,
      emotion,
      trigger,
      intensityBefore,
      intensityAfter,
      reflection,
    });
    setSaved(true);
  };

  return (
    <Screen>
      <Header
        eyebrow="Emergency mode"
        title="Move now."
        detail="Cue detected. Name it, delay 10 minutes, move your body, then reflect."
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
          <Chip label="5 min" selected={duration === 300} onPress={() => setProtocolDuration(300)} />
          <Chip label="10 min" selected={duration === 600} onPress={() => setProtocolDuration(600)} />
        </Row>
        <Row style={{ alignItems: "stretch" }}>
          <View style={{ flex: 1 }}>
            <Button
              label={running ? "Pause timer" : remaining === 0 ? "Restart" : "Start"}
              tone="danger"
              onPress={() => {
                if (remaining === 0) {
                  setRemaining(duration);
                  setReflectionReady(false);
                  setSaved(false);
                  setRunning(true);
                  return;
                }
                setRunning((current) => !current);
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Reflect now"
              tone="ghost"
              onPress={() => {
                setRunning(false);
                setRemaining(0);
                setReflectionReady(true);
              }}
            />
          </View>
        </Row>
      </Card>

      <Card>
        <SectionTitle title="Name the cue" detail="This is the part competitors miss: the urge is usually emotion plus context." />
        <Wrap>
          {moods.map((item) => (
            <Chip key={item} label={item} selected={emotion === item} onPress={() => setEmotion(item)} />
          ))}
        </Wrap>
        <SectionTitle title="Where did it start?" />
        <Wrap>
          {triggers.map((item) => (
            <Chip key={item} label={item} selected={trigger === item} onPress={() => setTrigger(item)} />
          ))}
        </Wrap>
      </Card>

      <Card>
        <SectionTitle title="Choose one action" detail="No perfect option needed. Lower friction and move." />
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

      <Card accentColor={reflectionReady ? theme.colors.green : theme.colors.border}>
        <SectionTitle
          title="Post-timer reflection"
          detail={reflectionReady ? "Log what happened. This updates your pattern map." : "Complete the timer first, or reflect early if you already moved."}
        />
        <IntensitySlider value={intensityBefore} onChange={setIntensityBefore} label="Before" />
        <IntensitySlider value={intensityAfter} onChange={setIntensityAfter} label="After" />
        <TextInput
          value={reflection}
          onChangeText={setReflection}
          placeholder="What helped the urge pass?"
          placeholderTextColor={theme.colors.mutedDark}
          multiline
          textAlignVertical="top"
          style={{
            minHeight: 92,
            color: theme.colors.text,
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: theme.radius.md,
            borderCurve: "continuous",
            padding: 14,
            fontSize: 15,
            lineHeight: 21,
          }}
        />
        <Button
          label={saved ? "Protocol saved" : "Save protocol"}
          tone="primary"
          disabled={!canSave || saved}
          onPress={handleSave}
        />
        <AppText style={{ color: theme.colors.muted }}>
          SOS, the timer, check-ins, and slip review stay free. Signal never monetizes panic.
        </AppText>
      </Card>
    </Screen>
  );
}
