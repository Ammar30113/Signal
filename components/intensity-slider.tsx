import Slider from "@react-native-community/slider";
import React from "react";
import { View } from "react-native";

import { stateTheme, theme } from "@/constants/theme";
import { AppText, Row } from "@/components/ui";
import type { UrgeState } from "@/types/signal";

function getState(value: number): UrgeState {
  if (value >= 70) return "red";
  if (value >= 35) return "yellow";
  return "green";
}

export function IntensitySlider({
  value,
  onChange,
  label = "Urge intensity",
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  const state = getState(value);
  const accent = stateTheme[state].accent;

  return (
    <View style={{ gap: 12 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <AppText
          style={{
            color: theme.colors.muted,
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 2.5,
            textTransform: "uppercase",
          }}
        >
          {label}
        </AppText>
        <AppText
          style={{
            color: theme.colors.text,
            fontSize: 26,
            lineHeight: 30,
            fontWeight: "800",
            fontVariant: ["tabular-nums"],
          }}
        >
          {Math.round(value)}
          <AppText style={{ color: theme.colors.muted, fontSize: 16 }}>/100</AppText>
        </AppText>
      </Row>
      <Slider
        value={value}
        minimumValue={0}
        maximumValue={100}
        step={1}
        minimumTrackTintColor={accent}
        maximumTrackTintColor={theme.colors.surfaceMuted}
        thumbTintColor={theme.colors.white}
        onValueChange={onChange}
      />
      <Row style={{ justifyContent: "space-between" }}>
        <AppText style={{ color: theme.colors.muted, fontSize: 12, fontWeight: "700" }}>CALM</AppText>
        <AppText style={{ color: theme.colors.muted, fontSize: 12, fontWeight: "700" }}>DRIFT</AppText>
        <AppText style={{ color: theme.colors.muted, fontSize: 12, fontWeight: "700" }}>EDGE</AppText>
      </Row>
    </View>
  );
}
