import { router } from "expo-router";
import React from "react";
import { View } from "react-native";

import { IntensitySlider } from "@/components/intensity-slider";
import { AppText, Button, Card, Chip, Header, Row, Screen, SectionTitle, Wrap } from "@/components/ui";
import { stateTheme, theme } from "@/constants/theme";
import { moods, triggers } from "@/data/signal-data";
import { useSignal } from "@/context/signal-store";
import type { CheckInResult, EmotionalDriver, Trigger } from "@/types/signal";

const emotionalDriverOptions: { label: string; value: EmotionalDriver }[] = [
  { label: "Emotional need", value: "emotional-need" },
  { label: "Surface craving", value: "surface-craving" },
  { label: "Mixed", value: "mixed" },
  { label: "Unclear", value: "unclear" },
];

function BinaryRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Row style={{ justifyContent: "space-between", gap: 14 }}>
      <AppText style={{ flex: 1, color: theme.colors.textSoft }}>{label}</AppText>
      <Row>
        <Chip label="No" selected={!value} onPress={() => onChange(false)} accessibilityLabel={`No — ${label}`} />
        <Chip label="Yes" selected={value} onPress={() => onChange(true)} accessibilityLabel={`Yes — ${label}`} />
      </Row>
    </Row>
  );
}

export default function CheckInScreen() {
  const { snapshot, submitCheckIn } = useSignal();
  const [mood, setMood] = React.useState("Restless");
  const [intensity, setIntensity] = React.useState(snapshot.intensity);
  const [trigger, setTrigger] = React.useState<Trigger>(snapshot.topTrigger);
  const [emotionalDriver, setEmotionalDriver] = React.useState<EmotionalDriver>("mixed");
  const [hasScrolled, setHasScrolled] = React.useState(false);
  const [exposedToContent, setExposedToContent] = React.useState(false);
  const [bargainingThoughts, setBargainingThoughts] = React.useState(false);
  const [result, setResult] = React.useState<CheckInResult | null>(null);

  const handleSubmit = () => {
    const next = submitCheckIn({
      mood,
      intensity,
      trigger,
      emotionalDriver,
      hasScrolled,
      exposedToContent,
      bargainingThoughts,
    });
    setResult(next);
  };

  return (
    <Screen>
      <Header
        eyebrow="Check-in"
        title="Name the signal."
        detail="Relapse is usually a sequence. This catches the sequence early."
      />

      <Card>
        <SectionTitle title="Current mood" />
        <Wrap>
          {moods.map((item) => (
            <Chip key={item} label={item} selected={mood === item} onPress={() => setMood(item)} />
          ))}
        </Wrap>
      </Card>

      <Card>
        <IntensitySlider value={intensity} onChange={setIntensity} />
      </Card>

      <Card>
        <SectionTitle title="Top trigger" detail="Pick the first honest one, not the cleanest-sounding one." />
        <Wrap>
          {triggers.map((item) => (
            <Chip key={item} label={item} selected={trigger === item} onPress={() => setTrigger(item)} />
          ))}
        </Wrap>
      </Card>

      <Card>
        <SectionTitle title="What's driving this?" detail="The real need underneath is often different from the surface craving." />
        <Wrap>
          {emotionalDriverOptions.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              selected={emotionalDriver === item.value}
              onPress={() => setEmotionalDriver(item.value)}
            />
          ))}
        </Wrap>
      </Card>

      <Card>
        <SectionTitle title="Escalation cues" />
        <BinaryRow label="Have you been scrolling without a clear purpose?" value={hasScrolled} onChange={setHasScrolled} />
        <BinaryRow label="Have you been exposed to triggering content?" value={exposedToContent} onChange={setExposedToContent} />
        <BinaryRow label="Are bargaining thoughts present?" value={bargainingThoughts} onChange={setBargainingThoughts} />
      </Card>

      <Button label="Classify state" tone="primary" onPress={handleSubmit} />

      {result ? (
        <Card accentColor={stateTheme[result.state].accent}>
          <SectionTitle title="Classification" />
          <Row style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
            <AppText style={{ color: stateTheme[result.state].accent, fontSize: 46, lineHeight: 50, fontWeight: "900" }}>
              {stateTheme[result.state].label}
            </AppText>
            <AppText style={{ color: theme.colors.muted, fontSize: 18, fontWeight: "800" }}>{result.riskScore}%</AppText>
          </Row>
          <View style={{ gap: 8 }}>
            <AppText style={{ color: theme.colors.textSoft, fontSize: 17 }}>{result.summary}</AppText>
            <AppText style={{ color: theme.colors.muted }}>{result.nextStep}</AppText>
          </View>
          <Button
            label={result.state === "red" ? "Open SOS" : "Return to dashboard"}
            tone={result.state === "red" ? "danger" : "secondary"}
            onPress={() => router.navigate(result.state === "red" ? "/sos" : "/")}
          />
        </Card>
      ) : null}
    </Screen>
  );
}
