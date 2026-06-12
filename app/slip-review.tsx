import { router } from "expo-router";
import React from "react";
import { TextInput, View } from "react-native";

import { AppText, Button, Card, Chip, Row, Screen, SectionTitle, Wrap } from "@/components/ui";
import { stateTheme, theme } from "@/constants/theme";
import { rationalizationScripts, triggers } from "@/data/signal-data";
import { useSignal } from "@/context/signal-store";
import type { RationalizationScript, Trigger, UrgeState } from "@/types/signal";

const stateOptions: UrgeState[] = ["green", "yellow", "red"];

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <AppText
        style={{
          color: theme.colors.muted,
          fontSize: 12,
          fontWeight: "800",
          letterSpacing: 2.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        multiline
        textAlignVertical="top"
        style={{
          minHeight: 92,
          color: theme.colors.text,
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.md,
          borderCurve: "continuous",
          padding: 14,
          fontSize: 15,
          lineHeight: 21,
        }}
      />
    </View>
  );
}

export default function SlipReviewScreen() {
  const { saveSlipReview } = useSignal();
  const [firstWrongTurn, setFirstWrongTurn] = React.useState("");
  const [trigger, setTrigger] = React.useState<Trigger>("Alone and unstructured");
  const [rationalization, setRationalization] = React.useState<RationalizationScript>("Just this once");
  const [state, setState] = React.useState<UrgeState>("yellow");
  const [earlierInterruption, setEarlierInterruption] = React.useState("");
  const [next24Hours, setNext24Hours] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  const canSave = firstWrongTurn.trim().length > 0 && earlierInterruption.trim().length > 0 && next24Hours.trim().length > 0;

  const handleSave = () => {
    saveSlipReview({
      firstWrongTurn,
      trigger,
      rationalization,
      state,
      earlierInterruption,
      next24Hours,
    });
    setSaved(true);
  };

  return (
    <Screen>
      <Card accentColor={theme.colors.gold}>
        <SectionTitle title="Recovery stance" />
        <AppText style={{ color: theme.colors.textSoft, fontSize: 17, lineHeight: 25 }}>
          Stop immediately. No binge logic. Restart today. Protect the next 24 hours. Return to structure fast.
        </AppText>
      </Card>

      <Card>
        <Field
          label="First wrong turn"
          value={firstWrongTurn}
          onChangeText={setFirstWrongTurn}
          placeholder="Where did the sequence actually start?"
        />
        <SectionTitle title="Trigger" />
        <Wrap>
          {triggers.map((item) => (
            <Chip key={item} label={item} selected={trigger === item} onPress={() => setTrigger(item)} />
          ))}
        </Wrap>
        <SectionTitle title="State at the time" />
        <Row>
          {stateOptions.map((item) => (
            <Chip
              key={item}
              label={stateTheme[item].label}
              selected={state === item}
              onPress={() => setState(item)}
              style={state === item ? { backgroundColor: stateTheme[item].accent, borderColor: stateTheme[item].accent } : undefined}
            />
          ))}
        </Row>
      </Card>

      <Card>
        <SectionTitle title="Rationalization" />
        <Wrap>
          {rationalizationScripts.map((script) => (
            <Chip
              key={script}
              label={script}
              selected={rationalization === script}
              onPress={() => setRationalization(script)}
            />
          ))}
        </Wrap>
        <Field
          label="Earlier interruption"
          value={earlierInterruption}
          onChangeText={setEarlierInterruption}
          placeholder="What would have interrupted this earlier?"
        />
        <Field
          label="Next 24 hours"
          value={next24Hours}
          onChangeText={setNext24Hours}
          placeholder="What structure protects the next day?"
        />
      </Card>

      <Button label={saved ? "Review saved" : "Save review"} tone="primary" disabled={!canSave || saved} onPress={handleSave} />

      {saved ? (
        <Card accentColor={theme.colors.green}>
          <SectionTitle title="Recovery summary" />
          {["Stop now", "No binge logic", "Restart today", "Protect next 24 hours", "Return to structure"].map((item) => (
            <Row key={item}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.colors.green,
                }}
              />
              <AppText style={{ color: theme.colors.textSoft }}>{item}</AppText>
            </Row>
          ))}
          <Button label="Back to dashboard" tone="secondary" onPress={() => router.back()} />
        </Card>
      ) : null}
    </Screen>
  );
}
