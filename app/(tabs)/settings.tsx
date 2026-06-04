import React from "react";
import { Switch, View } from "react-native";

import { AppText, Button, Card, Header, Row, Screen, SectionTitle } from "@/components/ui";
import { theme } from "@/constants/theme";
import { useSignal } from "@/context/signal-store";

function SettingRow({
  title,
  detail,
  value,
  onChange,
}: {
  title: string;
  detail: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Row style={{ justifyContent: "space-between", alignItems: "center", gap: 16 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <AppText style={{ fontSize: 16, fontWeight: "800" }}>{title}</AppText>
        <AppText style={{ color: theme.colors.textSoft, fontSize: 13 }}>{detail}</AppText>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: theme.colors.surfaceMuted, true: theme.colors.gold }} />
    </Row>
  );
}

export default function SettingsScreen() {
  const { resetMockSession, slipReviews } = useSignal();
  const [reminders, setReminders] = React.useState(true);
  const [discreet, setDiscreet] = React.useState(true);
  const [lock, setLock] = React.useState(false);
  const [exportReady, setExportReady] = React.useState(false);

  return (
    <Screen>
      <Header
        eyebrow="Privacy"
        title="Private by default."
        detail="This mock keeps data in the current session. No account, backend, sync, or analytics."
      />

      <Card>
        <SectionTitle title="Local-first posture" />
        <SettingRow
          title="Discreet interface"
          detail="Neutral app language and no public-facing shame cues."
          value={discreet}
          onChange={setDiscreet}
        />
        <SettingRow
          title="Reminder nudges"
          detail="Mock morning and late-night structure prompts."
          value={reminders}
          onChange={setReminders}
        />
        <SettingRow
          title="App lock placeholder"
          detail="Reserved for Face ID once the app moves past mock state."
          value={lock}
          onChange={setLock}
        />
      </Card>

      <Card>
        <SectionTitle title="Session data" detail={`${slipReviews.length} slip review saved in this mock session.`} />
        <Button label={exportReady ? "Export prepared" : "Mock export logs"} tone="secondary" onPress={() => setExportReady(true)} />
        <Button label="Reset mock session" tone="ghost" onPress={resetMockSession} />
      </Card>

      <Card>
        <SectionTitle title="Product stance" />
        <AppText style={{ color: theme.colors.textSoft }}>
          Signal treats urges as data. It is designed for awareness, interruption, and redirection, not shame or streak theater.
        </AppText>
      </Card>
    </Screen>
  );
}
