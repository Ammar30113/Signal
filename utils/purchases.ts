import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from "react-native-purchases";

import { PRO_ENTITLEMENT_ID, isProBillingEnabled, revenueCatApiKey } from "@/constants/revenuecat";
import type { EntitlementPlan } from "@/types/signal";

// `import type` above is erased at build time, so the RevenueCat native module
// is ONLY touched through the dynamic import below — and only when an API key is
// configured. With no key, none of this runs and Expo Go is unaffected.

let configured = false;

async function getSdk() {
  const module = await import("react-native-purchases");
  return module.default;
}

export function planFromCustomerInfo(info: CustomerInfo): EntitlementPlan {
  return info.entitlements.active[PRO_ENTITLEMENT_ID] ? "pro" : "free";
}

export async function configurePurchases(): Promise<void> {
  const apiKey = revenueCatApiKey();
  if (!apiKey || configured) return;
  const Purchases = await getSdk();
  Purchases.configure({ apiKey });
  configured = true;
}

export async function getCurrentPlan(): Promise<EntitlementPlan> {
  if (!isProBillingEnabled()) return "free";
  await configurePurchases();
  const Purchases = await getSdk();
  const info = await Purchases.getCustomerInfo();
  return planFromCustomerInfo(info);
}

export async function addPlanListener(cb: (plan: EntitlementPlan) => void): Promise<() => void> {
  if (!isProBillingEnabled()) return () => undefined;
  await configurePurchases();
  const Purchases = await getSdk();
  const listener = (info: CustomerInfo) => cb(planFromCustomerInfo(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    void getSdk().then((p) => p.removeCustomerInfoUpdateListener(listener));
  };
}

export async function getProOffering(): Promise<PurchasesOffering | null> {
  if (!isProBillingEnabled()) return null;
  await configurePurchases();
  const Purchases = await getSdk();
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<EntitlementPlan> {
  await configurePurchases();
  const Purchases = await getSdk();
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return planFromCustomerInfo(customerInfo);
}

export async function restorePurchases(): Promise<EntitlementPlan> {
  if (!isProBillingEnabled()) return "free";
  await configurePurchases();
  const Purchases = await getSdk();
  const info = await Purchases.restorePurchases();
  return planFromCustomerInfo(info);
}
