import React from "react";
import { Animated, View } from "react-native";

import { stateTheme, theme } from "@/constants/theme";
import { Button, Card, Row, AppText } from "@/components/ui";
import type { UrgeState } from "@/types/signal";

export function StateCard({
  state,
  onEmergency,
  onCheckIn,
}: {
  state: UrgeState;
  onEmergency: () => void;
  onCheckIn: () => void;
}) {
  const stateCopy = stateTheme[state];

  // Crossfade the zone block when the state flips (green/yellow/red) so the
  // change registers without a jarring hard swap. Fades stay acceptable under
  // Reduce Motion, so no gating is needed here.
  const fade = React.useRef(new Animated.Value(1)).current;
  const previousState = React.useRef(state);
  React.useEffect(() => {
    if (previousState.current === state) return;
    previousState.current = state;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [fade, state]);

  return (
    <Card accentColor={stateCopy.accent} style={{ gap: 18 }}>
      <Row>
        <View
          accessible={false}
          style={{
            width: 9,
            height: 9,
            borderRadius: 99,
            backgroundColor: stateCopy.accent,
          }}
        />
        <AppText
          style={{
            color: theme.colors.muted,
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Current state
        </AppText>
      </Row>
      <Animated.View
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`Current state: ${stateCopy.label} zone. ${stateCopy.copy}. ${stateCopy.note}`}
        style={{ opacity: fade }}
      >
        <Row style={{ alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <AppText
            style={{
              color: stateCopy.accent,
              fontSize: 66,
              lineHeight: 70,
              fontWeight: "900",
              letterSpacing: -1,
            }}
          >
            {stateCopy.label}
          </AppText>
          <AppText
            style={{
              color: theme.colors.muted,
              fontSize: 18,
              lineHeight: 32,
              fontWeight: "800",
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            zone
          </AppText>
        </Row>
        <View style={{ gap: 8, marginTop: 8 }}>
          <AppText style={{ color: theme.colors.textSoft, fontSize: 18, lineHeight: 27 }}>
            {stateCopy.copy}
          </AppText>
          <AppText style={{ color: theme.colors.muted, fontSize: 16, lineHeight: 24, fontStyle: "italic" }}>
            {stateCopy.note}
          </AppText>
        </View>
      </Animated.View>
      <View style={{ gap: 10 }}>
        <Button label="Emergency" tone="danger" onPress={onEmergency} />
        <Button label="Check in" tone="ghost" onPress={onCheckIn} />
      </View>
    </Card>
  );
}
