import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import React from "react";
import { AppState, TextInput, View } from "react-native";

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
  const duration = settings.protocolDurationSeconds;
  const [remaining, setRemaining] = React.useState(duration);
  const [running, setRunning] = React.useState(false);
  const [selectedAction, setSelectedAction] = React.useState<EmergencyAction>("Walk outside");
  const [emotion, setEmotion] = React.useState("Restless");
  const [trigger, setTrigger] = React.useState<Trigger>(snapshot.topTrigger);
  const [intensityBefore, setIntensityBefore] = React.useState(snapshot.intensity);
  const [intensityAfter, setIntensityAfter] = React.useState(Math.max(0, snapshot.intensity - 18));
  const [reflection, setReflection] = React.useState("");
  const [reflectionReady, setReflectionReady] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const endAtRef = React.useRef<number | null>(null);
  // True from Start until the session is reset/completed. Lets us tell a paused
  // mid-countdown apart from a genuinely idle timer, so Pause never resets it.
  const sessionActiveRef = React.useRef(false);

  // Keep the countdown aligned with the persisted protocol duration while the
  // timer is idle (covers settings hydration and the 5 / 10-minute chips).
  // Skip while a session is active (running OR paused) so Pause preserves time.
  React.useEffect(() => {
    if (sessionActiveRef.current || running || reflectionReady) return;
    setRemaining(duration);
  }, [duration, running, reflectionReady]);

  // Timestamp-based countdown so the timer stays accurate across backgrounding
  // and screen lock, and self-corrects when the app returns to the foreground.
  React.useEffect(() => {
    if (!running) return undefined;

    if (endAtRef.current == null) {
      endAtRef.current = Date.now() + remaining * 1000;
    }
    void activateKeepAwakeAsync("sos");

    const tick = () => {
      const target = endAtRef.current ?? Date.now();
      const left = Math.max(0, Math.round((target - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        endAtRef.current = null;
        sessionActiveRef.current = false;
        setRunning(false);
        setReflectionReady(true);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
    };

    tick();
    const interval = setInterval(tick, 500);
    const appStateSub = AppState.addEventListener("change", (next) => {
      if (next === "active") tick();
    });

    return () => {
      clearInterval(interval);
      appStateSub.remove();
      void deactivateKeepAwake("sos");
      endAtRef.current = null;
    };
    // `remaining` is intentionally read once when the timer starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const setProtocolDuration = (seconds: number) => {
    sessionActiveRef.current = false;
    setRunning(false);
    setRemaining(seconds);
    setReflectionReady(false);
    setSaved(false);
    endAtRef.current = null;
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
                  endAtRef.current = null;
                  setRemaining(duration);
                  setReflectionReady(false);
                  setSaved(false);
                  sessionActiveRef.current = true;
                  setRunning(true);
                  return;
                }
                // Starting or pausing — the session stays active either way.
                sessionActiveRef.current = true;
                setRunning((current) => !current);
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Reflect now"
              tone="ghost"
              onPress={() => {
                sessionActiveRef.current = false;
                setRunning(false);
                setRemaining(0);
                setReflectionReady(true);
              }}
            />
          </View>
        </Row>
      </Card>

      <Card>
        <SectionTitle title="Name the cue" detail="The useful question is what you were feeling and where it started — not what you almost did." />
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
          placeholderTextColor={theme.colors.muted}
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
          SOS, the timer, check-ins, and slip review are always available, and everything stays on this device.
        </AppText>
      </Card>
    </Screen>
  );
}
