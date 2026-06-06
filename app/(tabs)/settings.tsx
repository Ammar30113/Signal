import React from "react";
import { Alert, Linking, Share, Switch, View } from "react-native";

import { AppText, Button, Card, Chip, Header, Row, Screen, SectionTitle, Wrap } from "@/components/ui";
import { theme } from "@/constants/theme";
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from "@/constants/links";
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
  const {
    settings,
    updateSettings,
    exportLocalData,
    clearLocalData,
    checkIns,
    interventions,
    slipReviews,
  } = useSignal();

  const handleExport = async () => {
    await Share.share({
      title: "Signal local export",
      message: exportLocalData(),
    });
  };

  const handleClear = () => {
    Alert.alert(
      "Delete local Signal data?",
      "This clears check-ins, SOS sessions, slip reviews, and settings stored on this device. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: clearLocalData },
      ],
    );
  };

  const handlePrivacyPolicy = () => {
    void Linking.openURL(PRIVACY_POLICY_URL).catch(() => undefined);
  };

  const handleSupport = () => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => undefined);
  };

  return (
    <Screen>
      <Header
        eyebrow="Privacy"
        title="Private by default."
        detail="Local-first. No account. No screenshots. No accountability partner unless you explicitly choose that later."
      />

      <Card>
        <SectionTitle title="Privacy posture" />
        <SettingRow
          title="App lock"
          detail="Require Face ID, Touch ID, or your device passcode to open Signal."
          value={settings.appLockEnabled}
          onChange={(appLockEnabled) => updateSettings({ appLockEnabled })}
        />
        <AppText style={{ color: theme.colors.textSoft, fontSize: 13 }}>
          Signal has no analytics, no trackers, and no accounts. Your data never leaves this device unless you export it yourself.
        </AppText>
      </Card>

      <Card>
        <SectionTitle title="Local data" detail="Export or delete what is stored on this device." />
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 28, fontWeight: "900" }}>{checkIns.length}</AppText>
            <AppText style={{ color: theme.colors.textSoft }}>check-ins</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 28, fontWeight: "900" }}>{interventions.length}</AppText>
            <AppText style={{ color: theme.colors.textSoft }}>protocols</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 28, fontWeight: "900" }}>{slipReviews.length}</AppText>
            <AppText style={{ color: theme.colors.textSoft }}>reviews</AppText>
          </View>
        </Row>
        <Button label="Export local data" tone="secondary" onPress={handleExport} />
        <Button label="Delete local data" tone="ghost" onPress={handleClear} />
      </Card>

      <Card>
        <SectionTitle title="Legal & support" detail="Read how Signal handles data, or get in touch." />
        <Button label="Privacy policy" tone="secondary" onPress={handlePrivacyPolicy} />
        <Button label="Contact support" tone="ghost" onPress={handleSupport} />
      </Card>

      <Card accentColor={theme.colors.gold}>
        <SectionTitle title="What's included" detail="Everything in Signal is free. Panic tools never sit behind a paywall." />
        <Wrap>
          {["SOS timer", "Check-ins", "Slip review", "Pattern map", "App lock", "Privacy controls"].map((item) => (
            <Chip key={item} label={item} selected />
          ))}
        </Wrap>
      </Card>

      <Card>
        <SectionTitle title="Product stance" />
        <AppText style={{ color: theme.colors.textSoft }}>
          Signal does not promise perfect blocking. It increases awareness, adds a 10-minute interruption, and helps you redirect before the loop becomes automatic.
        </AppText>
      </Card>
    </Screen>
  );
}
