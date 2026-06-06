import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, Linking, View } from "react-native";
import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";

import { AppText, Button, Card, Header, Row, Screen, SectionTitle } from "@/components/ui";
import { PRIVACY_POLICY_URL } from "@/constants/links";
import { MANAGE_SUBSCRIPTION_URL, isProBillingEnabled } from "@/constants/revenuecat";
import { theme } from "@/constants/theme";
import { useSignal } from "@/context/signal-store";
import { getProOffering, purchasePackage, restorePurchases } from "@/utils/purchases";

const PRO_FEATURES = [
  "Full pattern intelligence — complete history and deeper correlations",
  "Custom redirect protocols and timer durations",
  "Weekly review and long-term trends",
  "High-risk reminders for your danger windows",
  "Encrypted backup and multi-device sync (coming soon)",
];

export default function PaywallScreen() {
  const { entitlement, refreshEntitlement } = useSignal();
  const billingEnabled = isProBillingEnabled();
  const isPro = entitlement.plan === "pro";

  const [offering, setOffering] = React.useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = React.useState(billingEnabled);
  const [busyPackage, setBusyPackage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!billingEnabled) return;
    let active = true;
    void (async () => {
      try {
        const current = await getProOffering();
        if (active) setOffering(current);
      } catch {
        if (active) setOffering(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [billingEnabled]);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setBusyPackage(pkg.identifier);
    try {
      const plan = await purchasePackage(pkg);
      await refreshEntitlement();
      if (plan === "pro") router.back();
    } catch (error) {
      const cancelled = !!(error as { userCancelled?: boolean })?.userCancelled;
      if (!cancelled) Alert.alert("Purchase failed", "Something went wrong. Please try again.");
    } finally {
      setBusyPackage(null);
    }
  };

  const handleRestore = async () => {
    try {
      const plan = await restorePurchases();
      await refreshEntitlement();
      Alert.alert(
        plan === "pro" ? "Restored" : "Nothing to restore",
        plan === "pro" ? "Your Signal Pro subscription is active." : "No active purchases were found for this account.",
      );
    } catch {
      Alert.alert("Restore failed", "Could not restore purchases. Please try again.");
    }
  };

  return (
    <Screen>
      <Header
        eyebrow="Signal Pro"
        title="Go deeper."
        detail="Panic tools stay free forever. Pro adds long-term insight, personalization, and structure."
      />

      <Card accentColor={theme.colors.gold}>
        <SectionTitle title="What Pro unlocks" />
        {PRO_FEATURES.map((feature) => (
          <Row key={feature} style={{ alignItems: "flex-start" }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 7, backgroundColor: theme.colors.gold }} />
            <AppText style={{ color: theme.colors.textSoft, flex: 1 }}>{feature}</AppText>
          </Row>
        ))}
      </Card>

      {!billingEnabled ? (
        <Card>
          <SectionTitle title="Not available yet" detail="Signal Pro is coming in a future update." />
        </Card>
      ) : isPro ? (
        <Card accentColor={theme.colors.green}>
          <SectionTitle title="Pro is active" detail="Thank you for supporting Signal." />
          <Button label="Manage subscription" tone="secondary" onPress={() => void Linking.openURL(MANAGE_SUBSCRIPTION_URL).catch(() => undefined)} />
        </Card>
      ) : loading ? (
        <Card>
          <ActivityIndicator color={theme.colors.gold} />
        </Card>
      ) : offering && offering.availablePackages.length > 0 ? (
        <Card>
          <SectionTitle title="Choose a plan" detail="Cancel anytime in your store account." />
          {offering.availablePackages.map((pkg) => (
            <Button
              key={pkg.identifier}
              label={
                busyPackage === pkg.identifier
                  ? "Processing…"
                  : `${pkg.product.title} — ${pkg.product.priceString}`
              }
              tone="primary"
              disabled={busyPackage !== null}
              onPress={() => void handlePurchase(pkg)}
            />
          ))}
          <Button label="Restore purchases" tone="ghost" onPress={() => void handleRestore()} />
        </Card>
      ) : (
        <Card>
          <SectionTitle title="Plans unavailable" detail="Could not load plans right now. Please try again later." />
          <Button label="Restore purchases" tone="ghost" onPress={() => void handleRestore()} />
        </Card>
      )}

      <Card>
        <AppText style={{ color: theme.colors.muted, fontSize: 13 }}>
          Subscriptions renew automatically until cancelled. Manage or cancel anytime in your App Store or Google Play account.
        </AppText>
        <Button label="Privacy policy" tone="ghost" onPress={() => void Linking.openURL(PRIVACY_POLICY_URL).catch(() => undefined)} />
      </Card>
    </Screen>
  );
}
