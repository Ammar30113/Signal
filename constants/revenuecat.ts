import { Platform } from "react-native";

// RevenueCat configuration.
//
// Leave BOTH keys empty to keep Signal fully free: billing stays completely
// dormant, the RevenueCat native SDK is never loaded, and the app runs in
// Expo Go exactly as it does today.
//
// To turn Pro on (v1.1), paste your RevenueCat PUBLIC SDK keys below, build a
// dev/EAS build (RevenueCat cannot run in Expo Go), and QA
// purchase / restore / cancel / expiry / no-network / reinstall before shipping.

export const REVENUECAT_IOS_API_KEY = ""; // e.g. "appl_xxxxxxxxxxxx"
export const REVENUECAT_ANDROID_API_KEY = ""; // e.g. "goog_xxxxxxxxxxxx"

// Entitlement identifier configured in the RevenueCat dashboard.
export const PRO_ENTITLEMENT_ID = "pro";

// Platform deep links for managing/cancelling an active subscription.
export const MANAGE_SUBSCRIPTION_URL =
  Platform.OS === "android"
    ? "https://play.google.com/store/account/subscriptions"
    : "https://apps.apple.com/account/subscriptions";

export function revenueCatApiKey(): string | null {
  const key = Platform.OS === "android" ? REVENUECAT_ANDROID_API_KEY : REVENUECAT_IOS_API_KEY;
  return key.length > 0 ? key : null;
}

// Master switch. When false, no billing code path ever runs.
export function isProBillingEnabled(): boolean {
  return revenueCatApiKey() !== null;
}
