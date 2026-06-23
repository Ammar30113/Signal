import * as StoreReview from "expo-store-review";

export async function maybeRequestStoreReview(): Promise<boolean> {
  if (process.env.EXPO_OS === "web") return false;

  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return false;

    await StoreReview.requestReview();
    return true;
  } catch {
    return false;
  }
}
