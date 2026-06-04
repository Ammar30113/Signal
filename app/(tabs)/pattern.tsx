import React from "react";
import { View } from "react-native";

import { AppText, Card, Chip, Header, ProgressBar, Row, Screen, SectionTitle, Wrap } from "@/components/ui";
import { theme } from "@/constants/theme";
import { escalationPath, patternInsights, rationalizationScripts } from "@/data/signal-data";

function labelForKind(kind: string) {
  return kind.replace("-", " ").toUpperCase();
}

export default function PatternScreen() {
  return (
    <Screen>
      <Header
        eyebrow="Pattern map"
        title="See the sequence."
        detail="Your risk is easier to interrupt when it becomes visible."
      />

      <Card>
        <SectionTitle title="Highest-signal insights" detail="Mocked intelligence based on the seeded session." />
        {patternInsights.map((insight) => (
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
        <SectionTitle title="Escalation path" detail="The goal is to interrupt before hovering becomes engagement." />
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
        <SectionTitle title="Rationalization scripts" detail="Scripts lose power when they are named cleanly." />
        <Wrap>
          {rationalizationScripts.map((script) => (
            <Chip key={script} label={script} />
          ))}
        </Wrap>
      </Card>
    </Screen>
  );
}
