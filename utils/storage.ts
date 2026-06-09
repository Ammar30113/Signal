import "expo-sqlite/localStorage/install";

import { initialSnapshot } from "@/data/signal-data";
import type {
  CheckInEntry,
  Entitlement,
  InterventionSession,
  SignalSnapshot,
  SlipReview,
  UserSettings,
} from "@/types/signal";

const STORAGE_KEY = "signal.local-first.v1";

export interface SignalPersistedState {
  snapshot: SignalSnapshot;
  checkIns: CheckInEntry[];
  interventions: InterventionSession[];
  slipReviews: SlipReview[];
  settings: UserSettings;
  entitlement: Entitlement;
}

export const defaultSettings: UserSettings = {
  hasCompletedOnboarding: false,
  appLockEnabled: false,
  protocolDurationSeconds: 600,
};

export const defaultEntitlement: Entitlement = {
  plan: "free",
  source: "local",
};

export const defaultPersistedState: SignalPersistedState = {
  snapshot: initialSnapshot,
  checkIns: [],
  interventions: [],
  slipReviews: [],
  settings: defaultSettings,
  entitlement: defaultEntitlement,
};

export function loadSignalState(): SignalPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPersistedState;

    const parsed = JSON.parse(raw) as Partial<SignalPersistedState>;

    return {
      snapshot: parsed.snapshot ?? defaultPersistedState.snapshot,
      checkIns: parsed.checkIns ?? [],
      interventions: parsed.interventions ?? [],
      slipReviews: parsed.slipReviews ?? [],
      settings: { ...defaultSettings, ...parsed.settings },
      entitlement: { ...defaultEntitlement, ...parsed.entitlement },
    };
  } catch {
    return defaultPersistedState;
  }
}

export function saveSignalState(state: SignalPersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence failed (quota, serialization). Keep the in-memory state so
    // the session continues rather than crashing out of a render effect.
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
