import React from "react";
import { View } from "react-native";

import { AppText, Card, Chip, Header, Row, Screen, SectionTitle, Wrap } from "@/components/ui";
import { theme } from "@/constants/theme";
import { identitySections } from "@/data/signal-data";
import { useSignal } from "@/context/signal-store";

export default function IdentityScreen() {
  const { snapshot } = useSignal();

  return (
    <Screen>
      <Header
        eyebrow="Identity"
        title="Remember who you are."
        detail="The product is not avoidance. It is building a system that makes the old pattern unnecessary."
      />

      {identitySections.map((section) => (
        <Card key={section.title}>
          <SectionTitle title={section.title} />
          <AppText style={{ color: theme.colors.textSoft, fontSize: 17, lineHeight: 25 }}>{section.body}</AppText>
        </Card>
      ))}

      <Card>
        <SectionTitle title="What this protects" detail="The compound interest of showing up." />
        <Wrap>
          {["Focus", "Energy", "Time", "Relationships", "Self-respect"].map((item) => (
            <Chip key={item} label={item} selected />
          ))}
        </Wrap>
      </Card>

      <Card>
        <SectionTitle title="Today" />
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, gap: 6 }}>
            <AppText style={{ fontSize: 24, fontWeight: "900" }}>{snapshot.progressDays} days</AppText>
            <AppText style={{ color: theme.colors.textSoft }}>
              Progress is useful data, not permission to test the edge.
            </AppText>
          </View>
          <Chip label="Quiet confidence" selected />
        </Row>
      </Card>

      <Card accentColor={theme.colors.gold}>
        <SectionTitle title="Operating principles" />
        <View style={{ gap: 12 }}>
          {["Systems over willpower", "Interrupt early", "No shame spirals", "Long-term value over short-term relief"].map((item) => (
            <Row key={item}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.colors.gold,
                }}
              />
              <AppText style={{ color: theme.colors.text }}>{item}</AppText>
            </Row>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
