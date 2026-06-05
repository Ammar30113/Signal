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
  const { snapshot, redirects, updateIntensity, slipReviews, checkIns, patternAggregate, entitlement } = useSignal();
  const current = stateTheme[snapshot.currentState];

  return (
    <Screen>
      <Header eyebrow={getDateLabel()} title={getGreeting()} detail="Private 10-minute interruption for urges, loops, and drift." />

      <StateCard
        state={snapshot.currentState}
        onEmergency={() => router.push("/sos")}
        onCheckIn={() => router.push("/check-in")}
      />

      <Card>
        <IntensitySlider value={snapshot.intensity} onChange={updateIntensity} />
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Metric label="Risk level" value={`${snapshot.riskScore}%`} detail={snapshot.trend} accentColor={current.accent} />
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
          <Metric label="Plan" value={entitlement.plan.toUpperCase()} detail="panic tools free" />
        </Row>
      </Card>

      <Card>
        <SectionTitle title="Current trigger" detail="The useful question is where the sequence started." />
        <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
          <AppText style={{ fontSize: 22, fontWeight: "800", flex: 1 }}>{snapshot.topTrigger}</AppText>
          <Chip label={current.label} selected />
        </Row>
      </Card>

      <View style={{ gap: 12 }}>
        <SectionTitle title="Redirect actions" detail="Move the body before the mind starts negotiating." />
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
      </View>

      <Card>
        <SectionTitle title="Recovery tools" detail="Use this if the sequence already crossed a line." />
        <Row style={{ alignItems: "stretch" }}>
          <View style={{ flex: 1 }}>
            <Button label="Slip review" tone="ghost" onPress={() => router.push("/slip-review")} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Open SOS" tone="danger" onPress={() => router.push("/sos")} />
          </View>
        </Row>
        <AppText style={{ color: theme.colors.muted }}>
          {slipReviews.length === 0
            ? "No slip reviews saved yet. If one happens, review it without a shame spiral."
            : `${slipReviews.length} slip review${slipReviews.length === 1 ? "" : "s"} saved on this device.`}
        </AppText>
      </Card>

      <Card>
        <SectionTitle title="Trust stance" detail="Competitor gap we are intentionally closing." />
        <AppText style={{ color: theme.colors.textSoft }}>
          No surveillance screenshots. No fake blocker promises. No emergency paywall. Signal monetizes long-term insight, not crisis access.
        </AppText>
      </Card>
    </Screen>
  );
}
