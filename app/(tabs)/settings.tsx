import React from "react";
import { Alert, Share, Switch, View } from "react-native";

import { AppText, Button, Card, Chip, Header, Row, Screen, SectionTitle, Wrap } from "@/components/ui";
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
  const {
    settings,
    updateSettings,
    entitlement,
    setLocalEntitlement,
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
      "This clears check-ins, SOS sessions, slip reviews, settings, and local entitlement preview. This does not affect GitHub or any future store purchase.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: clearLocalData },
      ],
    );
  };

  return (
    <Screen>
      <Header
        eyebrow="Privacy"
        title="Private by default."
        detail="Local-first. No account. No screenshots. No accountability partner unless you explicitly choose that later."
      />

      <Card>
        <SectionTitle title="Local-first posture" />
        <SettingRow
          title="Discreet interface"
          detail="Neutral language and no public-facing shame cues."
          value={settings.discreetMode}
          onChange={(discreetMode) => updateSettings({ discreetMode })}
        />
        <SettingRow
          title="Reminder nudges"
          detail="Gentle prompts for structure without surveillance."
          value={settings.remindersEnabled}
          onChange={(remindersEnabled) => updateSettings({ remindersEnabled })}
        />
        <SettingRow
          title="High-risk reminders"
          detail="Reserved for local danger-window reminders after more history."
          value={settings.highRiskReminders}
          onChange={(highRiskReminders) => updateSettings({ highRiskReminders })}
        />
        <SettingRow
          title="App lock"
          detail="Pro-ready privacy control. Face ID/biometric enforcement comes before launch."
          value={settings.appLockEnabled}
          onChange={(appLockEnabled) => updateSettings({ appLockEnabled })}
        />
        <SettingRow
          title="Analytics consent"
          detail="Off by default. Personal behavior data should stay local."
          value={settings.analyticsConsent}
          onChange={(analyticsConsent) => updateSettings({ analyticsConsent })}
        />
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

      <Card accentColor={theme.colors.gold}>
        <SectionTitle title="Free forever" detail="Competitors lose trust when panic tools sit behind a paywall." />
        <Wrap>
          {["SOS timer", "Basic check-ins", "Slip review", "Privacy controls"].map((item) => (
            <Chip key={item} label={item} selected />
          ))}
        </Wrap>
      </Card>

      <Card>
        <SectionTitle title="Signal Pro" detail="$4.99/month · $39.99/year · 7-day trial target." />
        <AppText style={{ color: theme.colors.textSoft }}>
          Pro should unlock advanced local pattern intelligence, custom protocols, weekly review, app lock, export, and future encrypted backup. RevenueCat/StoreKit/Google Play Billing will replace this local preview before launch.
        </AppText>
        <Row>
          <Chip label={`Current: ${entitlement.plan.toUpperCase()}`} selected={entitlement.plan === "pro"} />
          <Chip label={entitlement.source} />
        </Row>
        <Row style={{ alignItems: "stretch" }}>
          <View style={{ flex: 1 }}>
            <Button label="Preview Free" tone="ghost" onPress={() => setLocalEntitlement("free")} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Preview Pro" tone="primary" onPress={() => setLocalEntitlement("pro")} />
          </View>
        </Row>
      </Card>

      <Card>
        <SectionTitle title="Product stance" />
        <AppText style={{ color: theme.colors.textSoft }}>
          Signal does not promise perfect blocking. It increases awareness, adds a 10-minute interruption, and helps users redirect before the loop becomes automatic.
        </AppText>
      </Card>
    </Screen>
  );
}
