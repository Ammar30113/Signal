import React from "react";
import { TextInput, View } from "react-native";

import { AppText, Button, Card, Chip, Header, Row, Screen, SectionTitle, Wrap } from "@/components/ui";
import { theme } from "@/constants/theme";
import { identityPrompts } from "@/data/signal-data";
import { useSignal } from "@/context/signal-store";
import {
  IDENTITY_MAX_VALUES,
  IDENTITY_TEXT_LIMIT,
  IDENTITY_VALUE_LIMIT,
  type IdentityProfile,
} from "@/types/signal";
import { addIdentityValue, isUntouchedIdentity, removeIdentityValue } from "@/utils/identity";

type TextField = "why" | "becoming" | "protects";

function EditableField({
  field,
  value,
  onChange,
}: {
  field: TextField;
  value: string;
  onChange: (next: string) => void;
}) {
  const prompt = identityPrompts[field];
  const remaining = IDENTITY_TEXT_LIMIT - value.length;

  return (
    <Card>
      <SectionTitle title={prompt.title} detail={prompt.hint} />
      <TextInput
        value={value}
        onChangeText={(next) => onChange(next.slice(0, IDENTITY_TEXT_LIMIT))}
        placeholder="Write it in your own words."
        placeholderTextColor={theme.colors.muted}
        multiline
        textAlignVertical="top"
        accessibilityLabel={prompt.title}
        style={{
          minHeight: 104,
          color: theme.colors.text,
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.md,
          borderCurve: "continuous",
          padding: 14,
          fontSize: 16,
          lineHeight: 24,
        }}
      />
      <AppText style={{ color: remaining <= 20 ? theme.colors.gold : theme.colors.mutedDark, fontSize: 12 }}>
        {remaining} characters left
      </AppText>
    </Card>
  );
}

function ReadableField({ field, value }: { field: TextField; value: string }) {
  const prompt = identityPrompts[field];

  return (
    <Card>
      <SectionTitle title={prompt.title} />
      {value.trim() ? (
        <AppText style={{ color: theme.colors.textSoft, fontSize: 17, lineHeight: 25 }}>{value}</AppText>
      ) : (
        <AppText style={{ color: theme.colors.muted, fontSize: 16, fontStyle: "italic" }}>
          Nothing written yet. Tap Edit and answer it in your own words.
        </AppText>
      )}
    </Card>
  );
}

export default function IdentityScreen() {
  const { snapshot, identity, updateIdentity } = useSignal();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<IdentityProfile>(identity);
  const [pendingValue, setPendingValue] = React.useState("");

  // Keep the draft aligned with the store while not editing — an import or a
  // data wipe can replace identity underneath this screen.
  React.useEffect(() => {
    if (!editing) setDraft(identity);
  }, [editing, identity]);

  const startEditing = () => {
    setDraft(identity);
    setPendingValue("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(identity);
    setPendingValue("");
    setEditing(false);
  };

  const saveEditing = () => {
    // Fold in whatever is sitting unsubmitted in the add-value box, so a typed
    // value is not silently dropped by tapping Save instead of Add.
    updateIdentity({ ...draft, values: addIdentityValue(draft.values, pendingValue) });
    setPendingValue("");
    setEditing(false);
  };

  const setField = (field: TextField) => (next: string) => setDraft((current) => ({ ...current, [field]: next }));

  const valuesAtCap = draft.values.length >= IDENTITY_MAX_VALUES;

  if (editing) {
    return (
      <Screen>
        <Header
          eyebrow="Editing identity"
          title="Say it your way."
          detail="This is the screen you will read at your worst moment. Generic words will not hold then — yours might."
        />

        <EditableField field="why" value={draft.why} onChange={setField("why")} />
        <EditableField field="becoming" value={draft.becoming} onChange={setField("becoming")} />
        <EditableField field="protects" value={draft.protects} onChange={setField("protects")} />

        <Card>
          <SectionTitle title="…and in single words" detail="Short labels shown under the answer above. Tap one to remove it." />
          {draft.values.length === 0 ? (
            <AppText style={{ color: theme.colors.muted, fontSize: 14 }}>
              No values yet. Add what is actually at stake.
            </AppText>
          ) : (
            <Wrap>
              {draft.values.map((value) => (
                <Chip
                  key={value}
                  label={`${value}  ✕`}
                  selected
                  onPress={() => setDraft((current) => ({ ...current, values: removeIdentityValue(current.values, value) }))}
                  accessibilityLabel={`Remove ${value}`}
                />
              ))}
            </Wrap>
          )}
          <Row style={{ alignItems: "center" }}>
            <TextInput
              value={pendingValue}
              onChangeText={(next) => setPendingValue(next.slice(0, IDENTITY_VALUE_LIMIT))}
              placeholder={valuesAtCap ? "Maximum reached" : "Add one, e.g. Sleep"}
              placeholderTextColor={theme.colors.muted}
              editable={!valuesAtCap}
              returnKeyType="done"
              onSubmitEditing={() => {
                setDraft((current) => ({ ...current, values: addIdentityValue(current.values, pendingValue) }));
                setPendingValue("");
              }}
              accessibilityLabel="Add a value"
              style={{
                flex: 1,
                minHeight: 48,
                color: theme.colors.text,
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.radius.md,
                borderCurve: "continuous",
                paddingHorizontal: 14,
                fontSize: 15,
                opacity: valuesAtCap ? 0.5 : 1,
              }}
            />
            <Button
              label="Add"
              tone="secondary"
              disabled={valuesAtCap || pendingValue.trim().length === 0}
              style={{ minHeight: 48, paddingHorizontal: 18 }}
              onPress={() => {
                setDraft((current) => ({ ...current, values: addIdentityValue(current.values, pendingValue) }));
                setPendingValue("");
              }}
            />
          </Row>
        </Card>

        <Row style={{ alignItems: "stretch" }}>
          <View style={{ flex: 1 }}>
            <Button label="Cancel" tone="ghost" onPress={cancelEditing} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Save" tone="primary" onPress={saveEditing} />
          </View>
        </Row>

        <AppText style={{ color: theme.colors.muted, fontSize: 13 }}>
          Stored on this device only, and included when you export your data.
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        eyebrow="Identity"
        title="Remember who you are."
        detail="The product is not avoidance. It is building a system that makes the old pattern unnecessary."
      />

      {isUntouchedIdentity(identity) ? (
        <Card accentColor={theme.colors.gold}>
          <SectionTitle title="These are Signal's words" detail="Not yours — yet." />
          <AppText style={{ color: theme.colors.textSoft, fontSize: 16, lineHeight: 24 }}>
            This screen only works if it sounds like you. Replace the text below with your own reason, and it will be
            here waiting the next time the urge shows up.
          </AppText>
          <Button label="Make it mine" tone="primary" onPress={startEditing} />
        </Card>
      ) : null}

      <ReadableField field="why" value={identity.why} />
      <ReadableField field="becoming" value={identity.becoming} />

      {/* Prose and chips share one card — two cards both titled "What this
          protects" read as a duplication bug. */}
      <Card>
        <SectionTitle title={identityPrompts.protects.title} />
        {identity.protects.trim() ? (
          <AppText style={{ color: theme.colors.textSoft, fontSize: 17, lineHeight: 25 }}>{identity.protects}</AppText>
        ) : (
          <AppText style={{ color: theme.colors.muted, fontSize: 16, fontStyle: "italic" }}>
            Nothing written yet. Tap Edit and answer it in your own words.
          </AppText>
        )}
        {identity.values.length > 0 ? (
          <Wrap>
            {identity.values.map((value) => (
              <Chip key={value} label={value} selected />
            ))}
          </Wrap>
        ) : null}
      </Card>

      <Button label="Edit my identity" tone="secondary" onPress={startEditing} />

      <Card>
        <SectionTitle title="Today" />
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, gap: 6 }}>
            <AppText style={{ fontSize: 24, fontWeight: "900", lineHeight: 30 }}>{snapshot.progressDays} days</AppText>
            <AppText style={{ color: theme.colors.textSoft }}>
              Progress is useful data, not permission to test the edge.
            </AppText>
          </View>
          <Chip label="Quiet confidence" selected />
        </Row>
      </Card>

      <Card accentColor={theme.colors.gold}>
        <SectionTitle title="Operating principles" detail="Signal's stance, not a to-do list." />
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
