import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { router } from "expo-router";
import React from "react";
import { AppState, Pressable, View } from "react-native";

import { AppText, Button, Card, Chip, Header, ProgressBar, Row, Screen, SectionTitle } from "@/components/ui";
import { theme } from "@/constants/theme";
import { useSignal } from "@/context/signal-store";
import type { RedirectAction } from "@/types/signal";

const durationOptions = [30, 60, 90];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function RedirectOption({
  action,
  selected,
  onPress,
}: {
  action: RedirectAction;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Redirect: ${action.title}`}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        backgroundColor: selected ? "rgba(245, 194, 75, 0.10)" : theme.colors.backgroundSoft,
        borderColor: selected ? theme.colors.gold : theme.colors.border,
        borderWidth: 1,
        borderRadius: theme.radius.lg,
        borderCurve: "continuous",
        padding: theme.spacing.card,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, gap: 6 }}>
          <AppText style={{ fontSize: 18, fontWeight: "800" }}>{action.title}</AppText>
          <AppText style={{ color: theme.colors.textSoft }}>{action.detail}</AppText>
        </View>
        <Chip label={action.duration} selected={selected} />
      </Row>
    </Pressable>
  );
}

export default function PauseScreen() {
  const { settings, updateSettings, completePause, pauses, redirects } = useSignal();
  const duration = settings.pauseDurationSeconds;
  const [remaining, setRemaining] = React.useState(duration);
  const [running, setRunning] = React.useState(false);
  // `arrived` flips when the wait ends — by completion or by skipping — and moves
  // the screen to the redirect-commit step. `waitedFully` is only true when the
  // timer ran all the way down, which is what we persist as `completed`.
  const [arrived, setArrived] = React.useState(false);
  const [waitedFully, setWaitedFully] = React.useState(false);
  const [redirectId, setRedirectId] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const endAtRef = React.useRef<number | null>(null);
  // True from Start until the pause is reset/committed. Lets us tell a paused
  // mid-countdown apart from a genuinely idle timer, so Pause never resets it.
  const sessionActiveRef = React.useRef(false);

  const selectedRedirect =
    redirects.find((item) => item.id === redirectId) ??
    redirects[0] ?? {
      id: "fallback",
      title: "Walk without phone",
      detail: "Change state before thinking through it.",
      duration: "12 min",
    };

  React.useEffect(() => {
    if (redirectId && redirects.some((item) => item.id === redirectId)) return;
    setRedirectId(redirects[0]?.id ?? null);
  }, [redirectId, redirects]);

  // Keep the countdown aligned with the persisted pause duration while the timer
  // is idle (covers settings hydration and the 30 / 60 / 90-second chips). Skip
  // while a session is active (running OR paused) or arrived, so time is preserved.
  React.useEffect(() => {
    if (sessionActiveRef.current || running || arrived) return;
    setRemaining(duration);
  }, [duration, running, arrived]);

  // Timestamp-based countdown so the timer stays accurate across backgrounding
  // and screen lock, and self-corrects when the app returns to the foreground.
  React.useEffect(() => {
    if (!running) return undefined;

    if (endAtRef.current == null) {
      endAtRef.current = Date.now() + remaining * 1000;
    }
    void activateKeepAwakeAsync("pause");

    const tick = () => {
      const target = endAtRef.current ?? Date.now();
      const left = Math.max(0, Math.round((target - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        endAtRef.current = null;
        sessionActiveRef.current = false;
        setRunning(false);
        setWaitedFully(true);
        setArrived(true);
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
      void deactivateKeepAwake("pause");
      endAtRef.current = null;
    };
    // `remaining` is intentionally read once when the timer starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const setPauseDuration = (seconds: number) => {
    sessionActiveRef.current = false;
    setRunning(false);
    setRemaining(seconds);
    setArrived(false);
    setWaitedFully(false);
    setSaved(false);
    endAtRef.current = null;
    updateSettings({ pauseDurationSeconds: seconds });
  };

  const progress = duration === 0 ? 0 : ((duration - remaining) / duration) * 100;

  const handleCommit = () => {
    completePause({
      durationSeconds: duration,
      redirectId: selectedRedirect.id,
      redirectTitle: selectedRedirect.title,
      completed: waitedFully,
    });
    setSaved(true);
  };

  return (
    <Screen>
      <Header
        eyebrow="Pause"
        title="Let it pass."
        detail="You don't have to act on this. Wait it out, then move straight into one action — the move is what breaks the loop, not the waiting."
      />

      <Card accentColor={theme.colors.gold} style={{ backgroundColor: "#15130C" }}>
        <SectionTitle
          title="Pause timer"
          detail={arrived ? "The wait is done. Move into your action." : "Stay with it. The urge spikes, then fades on its own."}
        />
        <AppText
          style={{
            color: theme.colors.white,
            fontSize: 64,
            lineHeight: 68,
            fontWeight: "900",
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatTime(remaining)}
        </AppText>
        <ProgressBar value={progress} color={theme.colors.gold} />
        <Row>
          {durationOptions.map((seconds) => (
            <Chip
              key={seconds}
              label={`${seconds}s`}
              selected={duration === seconds}
              onPress={() => setPauseDuration(seconds)}
            />
          ))}
        </Row>
        <Row style={{ alignItems: "stretch" }}>
          <View style={{ flex: 1 }}>
            <Button
              label={running ? "Pause" : remaining === 0 ? "Restart" : "Start pause"}
              tone="primary"
              onPress={() => {
                if (remaining === 0) {
                  endAtRef.current = null;
                  setRemaining(duration);
                  setArrived(false);
                  setWaitedFully(false);
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
              label="Skip the wait"
              tone="ghost"
              onPress={() => {
                sessionActiveRef.current = false;
                setRunning(false);
                setRemaining(0);
                setWaitedFully(false);
                setArrived(true);
              }}
            />
          </View>
        </Row>
      </Card>

      {!running && !arrived && pauses.length > 0 ? (
        <AppText style={{ color: theme.colors.muted }}>
          {pauses.length} pause{pauses.length === 1 ? "" : "s"} logged on this device.
        </AppText>
      ) : null}

      {running ? (
        <Card>
          <SectionTitle title="While you wait" />
          <AppText style={{ color: theme.colors.textSoft, fontSize: 17, lineHeight: 25 }}>
            Slow the breath. Unclench the jaw. You are not deciding anything right now — just letting the spike come down.
          </AppText>
        </Card>
      ) : null}

      <Card accentColor={arrived ? theme.colors.gold : theme.colors.border}>
        <SectionTitle
          title="Where you'll go next"
          detail="Pick the move now, so the pause lands on a real action instead of looping back to the feed."
        />
        <View style={{ gap: 12 }}>
          {redirects.map((action) => (
            <RedirectOption
              key={action.id}
              action={action}
              selected={action.id === redirectId}
              onPress={() => setRedirectId(action.id)}
            />
          ))}
        </View>
      </Card>

      {arrived && !saved ? (
        <Card accentColor={theme.colors.gold} style={{ backgroundColor: "#15130C" }}>
          <SectionTitle title="Now do this" detail="The urge had to wait. It doesn't get to choose what's next — you do." />
          <AppText style={{ fontSize: 24, lineHeight: 30, fontWeight: "900" }}>{selectedRedirect.title}</AppText>
          <AppText style={{ color: theme.colors.textSoft, fontSize: 16 }}>{selectedRedirect.detail}</AppText>
          <Button label="I'll do this now" tone="primary" onPress={handleCommit} />
        </Card>
      ) : null}

      {saved ? (
        <Card accentColor={theme.colors.green}>
          <SectionTitle title="Logged" detail="That's a rep. The pattern weakens a little every time you interrupt it." />
          <AppText style={{ color: theme.colors.textSoft, fontSize: 16 }}>
            {waitedFully ? "You waited it out and moved." : "You cut it short and moved."} Next: {selectedRedirect.title}.
          </AppText>
          <Button label="Back to dashboard" tone="secondary" onPress={() => router.back()} />
        </Card>
      ) : null}

      <AppText style={{ color: theme.colors.muted }}>
        Pauses, SOS, check-ins, and slip review are always free, and everything stays on this device.
      </AppText>
    </Screen>
  );
}
