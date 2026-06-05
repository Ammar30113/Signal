import React from "react";
import { View } from "react-native";

import { AppText, Card, Chip, Header, ProgressBar, Row, Screen, SectionTitle, Wrap } from "@/components/ui";
import { theme } from "@/constants/theme";
import { escalationPath } from "@/data/signal-data";
import { useSignal } from "@/context/signal-store";

function labelForKind(kind: string) {
  return kind.replace("-", " ").toUpperCase();
}

export default function PatternScreen() {
  const { patternAggregate, entitlement } = useSignal();
  const isPro = entitlement.plan === "pro";
  const visibleInsights = isPro ? patternAggregate.insights : patternAggregate.insights.slice(0, 3);

  return (
    <Screen>
      <Header
        eyebrow="Pattern map"
        title="See the sequence."
        detail="Built from check-ins, SOS sessions, and slip reviews saved on this device."
      />

      <Card>
        <SectionTitle title="Local signal count" detail="No account, no surveillance, no screenshots." />
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 28, fontWeight: "900" }}>{patternAggregate.totals.checkIns}</AppText>
            <AppText style={{ color: theme.colors.textSoft }}>check-ins</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 28, fontWeight: "900" }}>{patternAggregate.totals.completedInterventions}</AppText>
            <AppText style={{ color: theme.colors.textSoft }}>protocols</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 28, fontWeight: "900" }}>{patternAggregate.totals.slipReviews}</AppText>
            <AppText style={{ color: theme.colors.textSoft }}>reviews</AppText>
          </View>
        </Row>
      </Card>

      <Card>
        <SectionTitle
          title="Highest-signal insights"
          detail={isPro ? "Advanced local pattern intelligence is unlocked." : "Basic pattern summary is free. Pro expands depth and history."}
        />
        {visibleInsights.map((insight) => (
          <View key={insight.id} style={{ gap: 8 }}>
            <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Chip label={labelForKind(insight.kind)} />
                <AppText style={{ fontSize: 18, fontWeight: "800" }}>{insight.title}</AppText>
                <AppText style={{ color: theme.colors.textSoft }}>{insight.detail}</AppText>
              </View>
              <AppText style={{ color: theme.colors.gold, fontSize: 18, fontWeight: "900" }}>{insight.weight}</AppText>
            </Row>
            <ProgressBar value={insight.weight} color={theme.colors.gold} />
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle title="Top triggers" detail="This is where the habit loop most often starts." />
        {patternAggregate.topTriggers.length === 0 ? (
          <AppText style={{ color: theme.colors.textSoft }}>Log a check-in or SOS session to build your trigger profile.</AppText>
        ) : (
          patternAggregate.topTriggers.map((profile) => (
            <Row key={profile.trigger} style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1, gap: 4 }}>
                <AppText style={{ fontSize: 16, fontWeight: "800" }}>{profile.trigger}</AppText>
                <AppText style={{ color: theme.colors.textSoft, fontSize: 13 }}>Average risk {profile.averageRisk}%</AppText>
              </View>
              <Chip label={`${profile.count}x`} selected />
            </Row>
          ))
        )}
      </Card>

      <Card>
        <SectionTitle title="Emotion + trigger pairs" detail="The practical gap: people need to know what they are feeling, not just what they watched." />
        {patternAggregate.emotionTriggerPairs.length === 0 ? (
          <AppText style={{ color: theme.colors.textSoft }}>No pairs yet. Use SOS to name the cue during an urge.</AppText>
        ) : (
          patternAggregate.emotionTriggerPairs.map((pair) => (
            <Row key={`${pair.emotion}-${pair.trigger}`} style={{ justifyContent: "space-between" }}>
              <AppText style={{ color: theme.colors.textSoft, flex: 1 }}>
                {pair.emotion} {"->"} {pair.trigger}
              </AppText>
              <Chip label={`${pair.count}x`} />
            </Row>
          ))
        )}
      </Card>

      <Card>
        <SectionTitle title="Redirects that worked" detail="Pro should monetize insight, not panic access." />
        {patternAggregate.successfulRedirectActions.length === 0 ? (
          <AppText style={{ color: theme.colors.textSoft }}>Complete a protocol reflection to identify your best redirect actions.</AppText>
        ) : (
          patternAggregate.successfulRedirectActions.map((item) => (
            <View key={item.action} style={{ gap: 8 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <AppText style={{ fontWeight: "800", flex: 1 }}>{item.action}</AppText>
                <AppText style={{ color: theme.colors.green, fontWeight: "900" }}>-{item.averageDrop}</AppText>
              </Row>
              <ProgressBar value={Math.min(100, 50 + item.averageDrop)} color={theme.colors.green} />
            </View>
          ))
        )}
      </Card>

      <Card>
        <SectionTitle title="Escalation path" detail="Interrupt before hovering becomes engagement." />
        {escalationPath.map((step, index) => (
          <Row key={step} style={{ alignItems: "flex-start" }}>
            <View style={{ alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: index < 4 ? theme.colors.gold : theme.colors.red,
                }}
              />
              {index < escalationPath.length - 1 ? (
                <View style={{ width: 1, height: 18, backgroundColor: theme.colors.borderStrong }} />
              ) : null}
            </View>
            <AppText style={{ color: theme.colors.textSoft, flex: 1 }}>{step}</AppText>
          </Row>
        ))}
      </Card>

      <Card>
        <SectionTitle title="Danger windows" detail="Local-only timing patterns from your history." />
        <Wrap>
          {patternAggregate.dangerWindows.map((window) => (
            <Chip key={window.label} label={`${window.label} · ${window.count}`} />
          ))}
        </Wrap>
      </Card>

      {!isPro ? (
        <Card accentColor={theme.colors.gold}>
          <SectionTitle title="Signal Pro" detail="$4.99/month or $39.99/year after a 7-day trial." />
          <AppText style={{ color: theme.colors.textSoft }}>
            Pro should unlock deeper pattern intelligence, custom protocols, reminders, export, and app lock. SOS remains free forever.
          </AppText>
        </Card>
      ) : null}
    </Screen>
  );
}
