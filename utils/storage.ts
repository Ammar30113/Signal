import "expo-sqlite/localStorage/install";

import { initialSnapshot } from "@/data/signal-data";
import type { Entitlement, SignalPersistedState, UserSettings } from "@/types/signal";

const STORAGE_KEY = "signal.local-first.v1";

export type { SignalPersistedState };

export const defaultSettings: UserSettings = {
  hasCompletedOnboarding: false,
  appLockEnabled: false,
  protocolDurationSeconds: 600,
  pauseDurationSeconds: 60,
  highRiskRemindersEnabled: false,
  weeklyDigestEnabled: false,
  reviewPromptAttempts: 0,
};

export const defaultEntitlement: Entitlement = {
  plan: "free",
  source: "local",
};

export const defaultPersistedState: SignalPersistedState = {
  snapshot: initialSnapshot,
  checkIns: [],
  interventions: [],
  pauses: [],
  slipReviews: [],
  customRedirects: [],
  settings: defaultSettings,
  entitlement: defaultEntitlement,
};

export function loadSignalState(): SignalPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPersistedState;

    const parsed = JSON.parse(raw) as Partial<SignalPersistedState>;
    const settings = { ...defaultSettings, ...parsed.settings };

    // Installs before the milestone-based review prompt stored only a single
    // timestamp and never asked again. Treat that as one attempt spent so those
    // users rejoin the ladder at the next milestone instead of being asked
    // immediately or never again.
    if (parsed.settings?.lastReviewPromptedAt && parsed.settings.reviewPromptAttempts === undefined) {
      settings.reviewPromptAttempts = 1;
    }

    return {
      snapshot: parsed.snapshot ?? defaultPersistedState.snapshot,
      checkIns: parsed.checkIns ?? [],
      interventions: parsed.interventions ?? [],
      pauses: parsed.pauses ?? [],
      slipReviews: parsed.slipReviews ?? [],
      customRedirects: parsed.customRedirects ?? [],
      settings,
      entitlement: { ...defaultEntitlement, ...parsed.entitlement },
    };
  } catch {
    return defaultPersistedState;
  }
}

/**
 * Returns false when the write failed. Signal keeps everything on the device and
 * nowhere else, so a silent failure here means the user loses history without
 * ever being told — the caller surfaces this rather than swallowing it.
 */
export function saveSignalState(state: SignalPersistedState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    // Keep the in-memory state so the session continues rather than crashing
    // out of a render effect; the caller warns the user instead.
    return false;
  }
}

export function clearSignalState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do; the next save will overwrite.
  }
}

export function createSignalExport(state: SignalPersistedState) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: "Signal",
      privacy: "Local-first export. No backend account is required for this data.",
      ...state,
    },
    null,
    2,
  );
}
