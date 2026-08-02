import Constants from "expo-constants";
import { File, Paths } from "expo-file-system";
import { router } from "expo-router";
import React from "react";
import { Alert, Linking, Platform, Share, Switch, TextInput, View, type TextInputProps } from "react-native";

import { AppText, Button, Card, Chip, Header, Row, Screen, SectionTitle, Wrap } from "@/components/ui";
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL, SUPPORT_URL, TERMS_OF_SERVICE_URL } from "@/constants/links";
import { isProBillingEnabled } from "@/constants/revenuecat";
import { theme } from "@/constants/theme";
import { useSignal } from "@/context/signal-store";
import { cancelHighRiskReminders, cancelWeeklyDigest, ensureNotificationPermission } from "@/utils/notifications";
import { parseSignalImport, summaryTotal } from "@/utils/signal-import";

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
    importLocalData,
    clearLocalData,
    persistenceFailed,
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

  const handleToggleDigest = async (next: boolean) => {
    if (next) {
      const allowed = await ensureNotificationPermission();
      if (!allowed) {
        Alert.alert(
          "Notifications are off",
          "Turn on notifications for Signal in your device settings to receive the weekly digest.",
        );
        return;
      }
      updateSettings({ weeklyDigestEnabled: true });
    } else {
      updateSettings({ weeklyDigestEnabled: false });
      void cancelWeeklyDigest().catch(() => undefined);
    }
  };

  const handleExport = async () => {
    if (checkIns.length + interventions.length + pauses.length + slipReviews.length + customRedirects.length === 0) {
      Alert.alert("Nothing to export yet", "Log a check-in, pause, SOS session, slip review, or custom redirect first.");
      return;
    }

    const json = exportLocalData();

    // On iOS, share a real .json file (long histories truncate as inline text
    // in some share targets). The file lives in the cache directory, which the
    // OS purges — nothing lingers beyond the share.
    if (Platform.OS === "ios") {
      try {
        const file = new File(Paths.cache, `signal-export-${new Date().toISOString().slice(0, 10)}.json`);
        if (file.exists) file.delete();
        file.create();
        file.write(json);
        await Share.share({ url: file.uri, title: "Signal local export" });
        return;
      } catch {
        // Fall through to the inline-text share below.
      }
    }

    try {
      await Share.share({
        title: "Signal local export",
        message: json,
      });
    } catch {
      Alert.alert("Export failed", "Could not open the share sheet. Please try again.");
    }
  };

  const hasLocalHistory =
    checkIns.length + interventions.length + pauses.length + slipReviews.length + customRedirects.length > 0;

  const runImport = (parsed: ReturnType<typeof parseSignalImport>, mode: "merge" | "replace") => {
    if (!parsed) return;
    const summary = importLocalData(parsed, mode);
    const added = summaryTotal(summary);
    const skippedNote = summary.skipped > 0 ? `\n\n${summary.skipped} entr${summary.skipped === 1 ? "y was" : "ies were"} skipped because they could not be read.` : "";

    Alert.alert(
      mode === "merge" ? "Import complete" : "Data replaced",
      `${added} entr${added === 1 ? "y" : "ies"} restored: ${summary.checkIns} check-ins, ` +
        `${summary.interventions} protocols, ${summary.pauses} pauses, ${summary.slipReviews} reviews, ` +
        `${summary.customRedirects} custom redirects.${skippedNote}`,
    );
  };

  const handleImport = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not available here", "Importing a Signal export is only supported in the mobile app.");
      return;
    }

    let raw: string;
    try {
      const picked = await File.pickFileAsync({ mimeTypes: ["application/json", "text/plain", "*/*"] });
      if (picked.canceled) return;
      raw = await picked.result.text();
    } catch {
      Alert.alert("Could not open that file", "Pick the .json file Signal created when you exported your data.");
      return;
    }

    const parsed = parseSignalImport(raw);
    if (!parsed) {
      Alert.alert("That isn't a Signal export", "Choose the .json file Signal created from Export local data.");
      return;
    }

    const found =
      parsed.checkIns.length + parsed.interventions.length + parsed.pauses.length + parsed.slipReviews.length + parsed.customRedirects.length;

    if (found === 0) {
      Alert.alert(
        "Nothing to import",
        parsed.skipped > 0
          ? "Every entry in that file was unreadable, so there is nothing to restore."
          : "That export does not contain any check-ins, pauses, protocols, or reviews.",
      );
      return;
    }

    // With nothing on this device there is no decision to make — restoring onto
    // a fresh install is the whole point, so skip straight to it.
    if (!hasLocalHistory) {
      runImport(parsed, "replace");
      return;
    }

    Alert.alert(
      "Import Signal data",
      `Found ${found} entr${found === 1 ? "y" : "ies"}. Merge keeps what is already on this device and adds anything new. Replace discards your current history first.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Merge", onPress: () => runImport(parsed, "merge") },
        { text: "Replace", style: "destructive", onPress: () => runImport(parsed, "replace") },
      ],
    );
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

      {persistenceFailed ? (
        <Card accentColor={theme.colors.red}>
          <SectionTitle title="Signal could not save to this device" />
          <AppText style={{ color: theme.colors.textSoft }}>
            Your most recent entries are still on screen but were not written to storage, so they will be lost if you
            close Signal. This usually means the device is out of space. Free some space, then export your data to be
            safe.
          </AppText>
          <Button label="Export local data" tone="primary" onPress={handleExport} />
        </Card>
      ) : null}

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
        <Button label="Import from a Signal export" tone="secondary" onPress={() => void handleImport()} />
        <AppText style={{ color: theme.colors.textSoft, fontSize: 13 }}>
          Signal has no account, so an export is the only way your history moves to a new phone. Keep the file somewhere
          you trust — it contains everything you have logged.
        </AppText>
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
        <Button label="Our story" tone="ghost" onPress={() => router.push("/about")} />
      </Card>

      <Card accentColor={theme.colors.gold}>
        <SectionTitle
          title="When Signal reaches out"
          detail="Local notifications only — scheduled on this device, from your own history. Nothing is sent anywhere."
        />
        {entitlement.plan === "pro" ? (
          <>
            <SettingRow
              title="High-risk reminders"
              detail="Notifies you around your top danger windows so you can check in or pause early."
              value={settings.highRiskRemindersEnabled}
              onChange={handleToggleReminders}
            />
            {settings.highRiskRemindersEnabled && !hasDangerWindows ? (
              <AppText style={{ color: theme.colors.muted, fontSize: 13 }}>
                Reminders start once your pattern map has enough check-ins to find your high-risk windows.
              </AppText>
            ) : null}
            <SettingRow
              title="Weekly digest"
              detail="One quiet nudge on Sunday evening to review the week's pattern before the next one starts."
              value={settings.weeklyDigestEnabled}
              onChange={handleToggleDigest}
            />
          </>
        ) : (
          <Row style={{ justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <AppText style={{ flex: 1, color: theme.colors.textSoft, fontSize: 13 }}>
              High-risk reminders and the weekly digest arrive with Signal Pro. Panic tools stay free forever — these are
              optional extras, never a paywalled crisis tool.
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
