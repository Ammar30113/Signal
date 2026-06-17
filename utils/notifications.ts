import { Platform } from "react-native";

import type * as NotificationsModule from "expo-notifications";

// High-risk reminders are LOCAL notifications only — no push token, no server,
// nothing leaves the device. The native module is loaded lazily (like the
// RevenueCat SDK in utils/purchases.ts), so a free user who never enables
// reminders never touches expo-notifications at all.

const REMINDER_ID_PREFIX = "signal-high-risk-";
const REMINDER_CHANNEL_ID = "high-risk-reminders";
const MAX_REMINDERS = 3;

let handlerSet = false;

async function getModule() {
  return import("expo-notifications");
}

// Show the reminder while the app is foregrounded too. Set once, lazily.
function ensureHandler(Notifications: typeof NotificationsModule) {
  if (handlerSet) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  handlerSet = true;
}

// Pull the unique start hours out of danger-window labels like "23:00-00:00".
// Skips placeholders ("No window yet") and caps how many reminders we set.
function parseWindowsToHours(windows: string[]): number[] {
  const hours: number[] = [];
  for (const window of windows) {
    const match = /^(\d{1,2}):/.exec(window);
    if (!match) continue;
    const hour = Number(match[1]);
    if (Number.isInteger(hour) && hour >= 0 && hour <= 23 && !hours.includes(hour)) {
      hours.push(hour);
    }
    if (hours.length >= MAX_REMINDERS) break;
  }
  return hours;
}

// iOS treats `granted` directly; provisional authorization also lets us post
// quiet notifications, which is good enough for a gentle nudge.
export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = await getModule();

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: "High-risk reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

// Cancel only the reminders we own (matched by id prefix), so we never touch
// notifications scheduled by anything else.
export async function cancelHighRiskReminders(): Promise<void> {
  const Notifications = await getModule();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.identifier.startsWith(REMINDER_ID_PREFIX))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

// Replace the current reminder set with one daily notification per danger window.
// Safe to call repeatedly: it cancels ours first, then reschedules from scratch.
export async function scheduleHighRiskReminders(windows: string[]): Promise<void> {
  const Notifications = await getModule();
  ensureHandler(Notifications);
  await cancelHighRiskReminders();

  const hours = parseWindowsToHours(windows);
  for (const hour of hours) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${REMINDER_ID_PREFIX}${hour}`,
      content: {
        title: "Heads-up from Signal",
        body: "One of your high-risk windows is here. A quick check-in or a short pause now beats deciding mid-urge.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  }
}
