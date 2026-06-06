import React from "react";
import { View } from "react-native";

import { AppText, Card, Chip, Header, Row, Screen, SectionTitle, Wrap } from "@/components/ui";
import { theme } from "@/constants/theme";
import { identitySections } from "@/data/signal-data";
import { useSignal } from "@/context/signal-store";

const protectedAreas = ["Body", "Work", "Lifestyle", "Relationships"];

export default function IdentityScreen() {
  const { snapshot } = useSignal();

  return (
    <Screen>
      <Header
        eyebrow="Identity"
        title="Build toward something."
        detail="The product is not avoidance. It is direction under pressure."
      />

      {identitySections.map((section) => (
        <Card key={section.title}>
          <SectionTitle title={section.title} />
          <AppText style={{ color: theme.colors.textSoft, fontSize: 17, lineHeight: 25 }}>{section.body}</AppText>
        </Card>
      ))}

      <Card>
        <SectionTitle title="What this protects" detail="What stays intact when the sequence is interrupted." />
        <Wrap>
          {protectedAreas.map((area) => (
            <Chip key={area} label={area} />
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

      <Card>
        <SectionTitle title="Operating principles" />
        <Wrap>
          {["Signals, not commands", "Interrupt early", "No binge logic", "Real intimacy over novelty"].map((item) => (
            <Chip key={item} label={item} />
          ))}
        </Wrap>
      </Card>
    </Screen>
  );
}
