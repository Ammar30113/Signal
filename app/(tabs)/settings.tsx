import Constants from "expo-constants";
import { router } from "expo-router";
import React from "react";
import { Alert, Linking, Share, Switch, TextInput, View, type TextInputProps } from "react-native";

import { AppText, Button, Card, Chip, Header, Row, Screen, SectionTitle, Wrap } from "@/components/ui";
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL, SUPPORT_URL, TERMS_OF_SERVICE_URL } from "@/constants/links";
import { isProBillingEnabled } from "@/constants/revenuecat";
import { theme } from "@/constants/theme";
import { useSignal } from "@/context/signal-store";
import { cancelHighRiskReminders, ensureNotificationPermission } from "@/utils/notifications";

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
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={title}
        accessibilityHint={detail}
        trackColor={{ false: theme.colors.surfaceMuted, true: theme.colors.gold }}
      />
    </Row>
  );
}

function SettingsTextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
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
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          minHeight: multiline ? 92 : 52,
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

export default function SettingsScreen() {
  const {
    settings,
    updateSettings,
    entitlement,
    setLocalEntitlement,
    patternAggregate,
    exportLocalData,
    clearLocalData,
    checkIns,
    interventions,
    pauses,
    slipReviews,
    customRedirects,
    addCustomRedirect,
    deleteCustomRedirect,
  } = useSignal();

  const [customRedirectTitle, setCustomRedirectTitle] = React.useState("");
  const [customRedirectDetail, setCustomRedirectDetail] = React.useState("");
  const [customRedirectMinutes, setCustomRedirectMinutes] = React.useState("5");

  const hasDangerWindows = patternAggregate.dangerWindows.some((window) => window.count > 0);
  const parsedCustomRedirectMinutes = Number.parseInt(customRedirectMinutes, 10);
  const canAddCustomRedirect =
    customRedirectTitle.trim().length > 0 &&
    customRedirectDetail.trim().length > 0 &&
    Number.isInteger(parsedCustomRedirectMinutes) &&
    parsedCustomRedirectMinutes >= 1;

  const handleAddCustomRedirect = () => {
    if (!canAddCustomRedirect) {
      Alert.alert("Add a complete redirect", "Enter a title, action detail, and a duration of at least 1 minute.");
      return;
    }

    const minutes = Math.min(120, parsedCustomRedirectMinutes);
    const saved = addCustomRedirect({
      title: customRedirectTitle,
      detail: customRedirectDetail,
      duration: `${minutes} min`,
    });

    if (!saved) {
      Alert.alert("Could not save redirect", "Check the title, detail, and duration, then try again.");
      return;
    }

    setCustomRedirectTitle("");
    setCustomRedirectDetail("");
    setCustomRedirectMinutes("5");
  };

  const handleDeleteCustomRedirect = (id: string, title: string) => {
    Alert.alert("Delete custom redirect?", title, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteCustomRedirect(id) },
    ]);
  };

  const handleToggleReminders = async (next: boolean) => {
    if (next) {
      const allowed = await ensureNotificationPermission();
      if (!allowed) {
        Alert.alert(
          "Notifications are off",
          "Turn on notifications for Signal in your device settings to use high-risk reminders.",
        );
        return;
      }
      updateSettings({ highRiskRemindersEnabled: true });
    } else {
      updateSettings({ highRiskRemindersEnabled: false });
      void cancelHighRiskReminders().catch(() => undefined);
    }
  };

  const handleExport = async () => {
    if (checkIns.length + interventions.length + pauses.length + slipReviews.length + customRedirects.length === 0) {
      Alert.alert("Nothing to export yet", "Log a check-in, pause, SOS session, slip review, or custom redirect first.");
      return;
    }
    try {
      await Share.share({
        title: "Signal local export",
        message: exportLocalData(),
      });
    } catch {
      Alert.alert("Export failed", "Could not open the share sheet. Please try again.");
    }
  };

  const handleClear = () => {
    Alert.alert(
      "Delete local Signal data?",
      "This clears check-ins, pauses, SOS sessions, slip reviews, custom redirects, and settings stored on this device. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: clearLocalData },
      ],
    );
  };

  const handlePrivacyPolicy = () => {
    void Linking.openURL(PRIVACY_POLICY_URL).catch(() => undefined);
  };

  const handleTermsOfService = () => {
    void Linking.openURL(TERMS_OF_SERVICE_URL).catch(() => undefined);
  };

  const handleSupport = () => {
    void Linking.openURL(SUPPORT_URL).catch(() => {
      void Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => undefined);
    });
  };

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const nativeBuildNumber =
    Constants.platform?.ios?.buildNumber ??
    (Constants.platform?.android?.versionCode != null ? String(Constants.platform.android.versionCode) : null);

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
            <AppText style={{ fontSize: 28, fontWeight: "900", lineHeight: 34 }}>{checkIns.length}</AppText>
            <AppText style={{ color: theme.colors.textSoft }}>check-ins</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 28, fontWeight: "900", lineHeight: 34 }}>{interventions.length}</AppText>
            <AppText style={{ color: theme.colors.textSoft }}>protocols</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 28, fontWeight: "900", lineHeight: 34 }}>{pauses.length}</AppText>
            <AppText style={{ color: theme.colors.textSoft }}>pauses</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 28, fontWeight: "900", lineHeight: 34 }}>{slipReviews.length}</AppText>
            <AppText style={{ color: theme.colors.textSoft }}>reviews</AppText>
          </View>
        </Row>
        <Button label="Export local data" tone="secondary" onPress={handleExport} />
        <Button label="Delete local data" tone="ghost" onPress={handleClear} />
      </Card>

      <Card accentColor={theme.colors.gold}>
        <SectionTitle
          title="Custom redirects"
          detail="Add personal actions to the dashboard and pause flow. Stored only on this device."
        />
        <SettingsTextField
          label="Title"
          value={customRedirectTitle}
          onChangeText={setCustomRedirectTitle}
          placeholder="Walk to the lobby"
        />
        <SettingsTextField
          label="Action detail"
          value={customRedirectDetail}
          onChangeText={setCustomRedirectDetail}
          placeholder="Shoes on, no phone, one loop outside."
          multiline
        />
        <SettingsTextField
          label="Duration minutes"
          value={customRedirectMinutes}
          onChangeText={(text) => setCustomRedirectMinutes(text.replace(/[^0-9]/g, "").slice(0, 3))}
          placeholder="5"
          keyboardType="number-pad"
        />
        <Button label="Add redirect" tone="primary" disabled={!canAddCustomRedirect} onPress={handleAddCustomRedirect} />
        {customRedirects.length === 0 ? (
          <AppText style={{ color: theme.colors.textSoft, fontSize: 13 }}>
            No custom redirects yet. The default redirects stay available.
          </AppText>
        ) : (
          customRedirects.map((redirect) => (
            <Row key={redirect.id} style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, gap: 4 }}>
                <AppText style={{ fontSize: 16, fontWeight: "800" }}>{redirect.title}</AppText>
                <AppText style={{ color: theme.colors.textSoft, fontSize: 13 }}>{redirect.detail}</AppText>
                <Chip label={redirect.duration} />
              </View>
              <Button
                label="Delete"
                tone="ghost"
                onPress={() => handleDeleteCustomRedirect(redirect.id, redirect.title)}
                style={{ minHeight: 44, paddingHorizontal: 12 }}
              />
            </Row>
          ))
        )}
      </Card>

      <Card>
        <SectionTitle title="Legal & support" detail="Read how Signal handles data, or get in touch." />
        <Button label="Privacy policy" tone="secondary" onPress={handlePrivacyPolicy} />
        <Button label="Terms of service" tone="secondary" onPress={handleTermsOfService} />
        <Button label="Contact support" tone="ghost" onPress={handleSupport} />
      </Card>

      <Card accentColor={theme.colors.gold}>
        <SectionTitle
          title="High-risk reminders"
          detail="A gentle, local nudge during the windows you tend to be most vulnerable — learned only from your own history on this device."
        />
        {entitlement.plan === "pro" ? (
          <>
            <SettingRow
              title="Daily reminders"
              detail="Notifies you around your top danger windows so you can check in or pause early."
              value={settings.highRiskRemindersEnabled}
              onChange={handleToggleReminders}
            />
            {settings.highRiskRemindersEnabled && !hasDangerWindows ? (
              <AppText style={{ color: theme.colors.muted, fontSize: 13 }}>
                Reminders start once your pattern map has enough check-ins to find your high-risk windows.
              </AppText>
            ) : null}
          </>
        ) : (
          <Row style={{ justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <AppText style={{ flex: 1, color: theme.colors.textSoft, fontSize: 13 }}>
              Arrives with Signal Pro. Panic tools stay free forever — this is an optional extra, never a paywalled crisis tool.
            </AppText>
            <Chip label="Pro" selected />
          </Row>
        )}
      </Card>

      {isProBillingEnabled() ? (
        <Card accentColor={theme.colors.gold}>
          <SectionTitle
            title="Signal Pro"
            detail={entitlement.plan === "pro" ? "Pro is active. Thank you for supporting Signal." : "Deeper insight, custom protocols, and reminders."}
          />
          <Button
            label={entitlement.plan === "pro" ? "Manage Signal Pro" : "View Signal Pro"}
            tone="primary"
            onPress={() => router.navigate("/paywall")}
          />
        </Card>
      ) : null}

      <Card accentColor={theme.colors.gold}>
        <SectionTitle title="What's included" detail="Everything in Signal is free. Panic tools never sit behind a paywall." />
        <Wrap>
          {["SOS timer", "Pause timer", "Check-ins", "Slip review", "Pattern map", "Weekly review", "Custom redirects", "App lock", "Privacy controls"].map((item) => (
            <Chip key={item} label={item} selected />
          ))}
        </Wrap>
      </Card>

      <Card>
        <SectionTitle title="Product stance" />
        <AppText style={{ color: theme.colors.textSoft }}>
          Signal does not promise perfect blocking. It increases awareness, adds a 10-minute interruption, and helps you redirect before the loop becomes automatic.
        </AppText>
        <AppText style={{ color: theme.colors.muted, fontSize: 13 }}>
          Signal is a self-help tool, not a substitute for professional medical or mental health care. If you are in crisis, contact a licensed professional or local emergency services.
        </AppText>
      </Card>

      {__DEV__ ? (
        <Card accentColor={theme.colors.blue}>
          <SectionTitle title="Developer" detail="Debug builds only — never shipped to users." />
          <SettingRow
            title="Simulate Signal Pro"
            detail="Unlock Pro-gated features locally to test them, like high-risk reminders."
            value={entitlement.plan === "pro"}
            onChange={(on) => setLocalEntitlement(on ? "pro" : "free")}
          />
        </Card>
      ) : null}

      <Card>
        <View style={{ alignItems: "center", gap: 4 }}>
          <AppText style={{ color: theme.colors.muted, fontSize: 13 }}>
            Signal v{appVersion}{nativeBuildNumber ? ` (${nativeBuildNumber})` : ""}
          </AppText>
          <AppText style={{ color: theme.colors.mutedDark, fontSize: 12 }}>
            Local-first. No account. No trackers.
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}
