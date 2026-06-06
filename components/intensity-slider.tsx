import Slider from "@react-native-community/slider";
import React from "react";
import { View } from "react-native";

import { stateTheme, theme } from "@/constants/theme";
import { AppText, Row } from "@/components/ui";
import { getStateFromScore } from "@/utils/signal-engine";

export function IntensitySlider({
  value,
  onChange,
  label = "Urge intensity",
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  // Track the drag locally so the UI stays smooth; only commit to the
  // store (and persistence) once, on release, to avoid a write-storm.
  const [live, setLive] = React.useState(value);

  React.useEffect(() => {
    setLive(value);
  }, [value]);

  const state = getStateFromScore(live);
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
          {Math.round(live)}
          <AppText style={{ color: theme.colors.muted, fontSize: 16 }}>/100</AppText>
        </AppText>
      </Row>
      <Slider
        value={live}
        minimumValue={0}
        maximumValue={100}
        step={1}
        minimumTrackTintColor={accent}
        maximumTrackTintColor={theme.colors.surfaceMuted}
        thumbTintColor={theme.colors.white}
        onValueChange={setLive}
        onSlidingComplete={(next) => onChange(Math.round(next))}
        accessibilityLabel={`${label}: ${Math.round(live)} out of 100`}
      />
      <Row style={{ justifyContent: "space-between" }}>
        <AppText style={{ color: theme.colors.muted, fontSize: 12, fontWeight: "700" }}>CALM</AppText>
        <AppText style={{ color: theme.colors.muted, fontSize: 12, fontWeight: "700" }}>DRIFT</AppText>
        <AppText style={{ color: theme.colors.muted, fontSize: 12, fontWeight: "700" }}>EDGE</AppText>
      </Row>
    </View>
  );
}
