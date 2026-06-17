import { router } from "expo-router";
import React from "react";
import { View } from "react-native";

import { IntensitySlider } from "@/components/intensity-slider";
import { StateCard } from "@/components/state-card";
import { AppText, Button, Card, Chip, Header, Metric, ProgressBar, Row, Screen, SectionTitle } from "@/components/ui";
import { stateTheme, theme } from "@/constants/theme";
import { useSignal } from "@/context/signal-store";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

function getDateLabel() {
  return new Date()
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
    .toUpperCase();
}

export default function DashboardScreen() {
  const { snapshot, redirects, updateIntensity, slipReviews, checkIns, interventions, patternAggregate } = useSignal();
  const current = stateTheme[snapshot.currentState];
  const hasHistory = checkIns.length + interventions.length + slipReviews.length > 0;

  return (
    <Screen>
      <Header eyebrow={getDateLabel()} title="Signal" detail="Private 10-minute interruption system for urges, cravings, and unwanted habits." />

      <StateCard
        state={snapshot.currentState}
        onEmergency={() => router.navigate("/sos")}
        onCheckIn={() => router.navigate("/check-in")}
      />

      <Card>
        <IntensitySlider value={snapshot.intensity} onChange={updateIntensity} />
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Metric label="Urge level" value={`${snapshot.riskScore}%`} detail={snapshot.trend} accentColor={current.accent} />
          <Metric label="Progress" value={`${snapshot.progressDays}`} detail="days structured" />
        </Row>
        <ProgressBar value={snapshot.riskScore} color={current.accent} />
        <AppText style={{ color: theme.colors.muted }}>{snapshot.lastCheckInSummary}</AppText>
      </Card>

      <Card accentColor={theme.colors.gold}>
        <SectionTitle title="10-minute protocol" detail="Your method, built into the product loop." />
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Metric label="Check-ins" value={`${checkIns.length}`} detail="saved locally" />
          <Metric label="SOS done" value={`${patternAggregate.totals.completedInterventions}`} detail="completed" accentColor={theme.colors.green} />
          <Metric label="Reviews" value={`${slipReviews.length}`} detail="saved locally" />
        </Row>
      </Card>

      <Card>
        <SectionTitle title="Current trigger" detail="The useful question is where the sequence started." />
        {hasHistory ? (
          <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
            <AppText style={{ fontSize: 22, fontWeight: "800", lineHeight: 28, flex: 1 }}>{snapshot.topTrigger}</AppText>
            <Chip label={current.label} selected />
          </Row>
        ) : (
          <AppText style={{ color: theme.colors.textSoft }}>
            No signals logged yet. Run your first check-in to surface your top trigger.
          </AppText>
        )}
      </Card>

      <View style={{ gap: 12 }}>
        <SectionTitle title="Redirect actions" detail="Pause the urge, then move the body before the mind starts negotiating." />
        {redirects.map((action) => (
          <Card key={action.id} style={{ backgroundColor: theme.colors.backgroundSoft }}>
            <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, gap: 6 }}>
                <AppText style={{ fontSize: 18, fontWeight: "800" }}>{action.title}</AppText>
                <AppText style={{ color: theme.colors.textSoft }}>{action.detail}</AppText>
              </View>
              <Chip label={action.duration} />
            </Row>
          </Card>
        ))}
        <Button label="Start a pause" tone="primary" onPress={() => router.push("/pause")} />
        {patternAggregate.totals.pauses > 0 ? (
          <AppText style={{ color: theme.colors.muted }}>
            {patternAggregate.totals.pauses} pause{patternAggregate.totals.pauses === 1 ? "" : "s"} taken on this device.
          </AppText>
        ) : null}
      </View>

      <Card>
        <SectionTitle title="Recovery tools" detail="Use this if the sequence already crossed a line." />
        <Row style={{ alignItems: "stretch" }}>
          <View style={{ flex: 1 }}>
            <Button label="Slip review" tone="ghost" onPress={() => router.push("/slip-review")} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Open SOS" tone="danger" onPress={() => router.navigate("/sos")} />
          </View>
        </Row>
        <AppText style={{ color: theme.colors.muted }}>
          {slipReviews.length === 0
            ? "No slip reviews saved yet. If one happens, review it without a shame spiral."
            : `${slipReviews.length} slip review${slipReviews.length === 1 ? "" : "s"} saved on this device.`}
        </AppText>
      </Card>

      <Card>
        <SectionTitle title="Trust stance" />
        <AppText style={{ color: theme.colors.textSoft, lineHeight: 22 }}>
          No surveillance. No fake promises. No accounts. Everything you log stays on this device. Built from a habit-loop system: identify the cue, interrupt the routine, redirect the reward.
        </AppText>
      </Card>
    </Screen>
  );
}
