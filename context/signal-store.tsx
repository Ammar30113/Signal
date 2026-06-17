import * as Haptics from "expo-haptics";
import React from "react";

import { redirectActions } from "@/data/signal-data";
import type {
  CheckInAnswer,
  CheckInEntry,
  CheckInResult,
  Entitlement,
  InterventionSession,
  PauseSession,
  PatternAggregate,
  RedirectAction,
  SignalSnapshot,
  SlipReview,
  UserSettings,
} from "@/types/signal";
import { buildPatternAggregate, classifyCheckIn, deriveSnapshot, getStateFromScore, getTrend } from "@/utils/signal-engine";
import { isProBillingEnabled } from "@/constants/revenuecat";
import { addPlanListener, getCurrentPlan } from "@/utils/purchases";
import { scheduleHighRiskReminders } from "@/utils/notifications";
import {
  clearSignalState,
  createSignalExport,
  defaultEntitlement,
  defaultPersistedState,
  defaultSettings,
  loadSignalState,
  saveSignalState,
  type SignalPersistedState,
} from "@/utils/storage";

interface SignalContextValue {
  snapshot: SignalSnapshot;
  redirects: RedirectAction[];
  checkIns: CheckInEntry[];
  interventions: InterventionSession[];
  pauses: PauseSession[];
  slipReviews: SlipReview[];
  settings: UserSettings;
  entitlement: Entitlement;
  patternAggregate: PatternAggregate;
  isHydrated: boolean;
  updateIntensity: (intensity: number) => void;
  submitCheckIn: (answer: CheckInAnswer) => CheckInResult;
  completeIntervention: (session: Omit<InterventionSession, "id" | "createdAt" | "completedAt" | "completed">) => InterventionSession;
  completePause: (session: Omit<PauseSession, "id" | "createdAt">) => PauseSession;
  saveSlipReview: (review: Omit<SlipReview, "id" | "createdAt">) => SlipReview;
  updateSettings: (patch: Partial<UserSettings>) => void;
  setLocalEntitlement: (plan: Entitlement["plan"]) => void;
  refreshEntitlement: () => Promise<void>;
  exportLocalData: () => string;
  clearLocalData: () => void;
  resetMockSession: () => void;
}

const SignalContext = React.createContext<SignalContextValue | null>(null);

function notifySelection() {
  if (process.env.EXPO_OS === "web") return;
  void Haptics.selectionAsync().catch(() => undefined);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function SignalProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = React.useState<SignalSnapshot>(defaultPersistedState.snapshot);
  const [checkIns, setCheckIns] = React.useState<CheckInEntry[]>([]);
  const [interventions, setInterventions] = React.useState<InterventionSession[]>([]);
  const [pauses, setPauses] = React.useState<PauseSession[]>([]);
  const [slipReviews, setSlipReviews] = React.useState<SlipReview[]>([]);
  const [settings, setSettings] = React.useState<UserSettings>(defaultSettings);
  const [entitlement, setEntitlement] = React.useState<Entitlement>(defaultEntitlement);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    const persisted = loadSignalState();
    setSnapshot(persisted.snapshot);
    setCheckIns(persisted.checkIns);
    setInterventions(persisted.interventions);
    setPauses(persisted.pauses);
    setSlipReviews(persisted.slipReviews);
    setSettings(persisted.settings);
    setEntitlement(persisted.entitlement);
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;

    saveSignalState({
      snapshot,
      checkIns,
      interventions,
      pauses,
      slipReviews,
      settings,
      entitlement,
    });
  }, [checkIns, entitlement, interventions, isHydrated, pauses, settings, slipReviews, snapshot]);

  // Sync entitlement from RevenueCat — only when billing is configured.
  // With no API key this never runs, so the free build stays purely local.
  React.useEffect(() => {
    if (!isHydrated || !isProBillingEnabled()) return;

    let active = true;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const plan = await getCurrentPlan();
        if (!active) return;
        setEntitlement({ plan, source: "revenuecat", lastCheckedAt: new Date().toISOString() });
        unsubscribe = await addPlanListener((nextPlan) => {
          setEntitlement({ plan: nextPlan, source: "revenuecat", lastCheckedAt: new Date().toISOString() });
        });
      } catch {
        // Leave the last known (persisted) entitlement in place on failure.
      }
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [isHydrated]);

  const refreshEntitlement = React.useCallback(async () => {
    if (!isProBillingEnabled()) return;
    try {
      const plan = await getCurrentPlan();
      setEntitlement({ plan, source: "revenuecat", lastCheckedAt: new Date().toISOString() });
    } catch {
      // Ignore; the customer-info listener will reconcile when possible.
    }
  }, []);

  const patternAggregate = React.useMemo(
    () => buildPatternAggregate({ checkIns, interventions, pauses, slipReviews }),
    [checkIns, interventions, pauses, slipReviews],
  );

  // Keep high-risk reminders aligned with the latest danger windows. Pro + opt-in
  // only; utils/notifications dynamically imports expo-notifications, so a free
  // user who never enables this never loads the native module.
  const dangerWindowKey = patternAggregate.dangerWindows.map((window) => window.label).join("|");
  React.useEffect(() => {
    if (!isHydrated || entitlement.plan !== "pro" || !settings.highRiskRemindersEnabled) return;
    const windows = patternAggregate.dangerWindows.map((window) => window.label);
    void scheduleHighRiskReminders(windows).catch(() => undefined);
    // patternAggregate is read via dangerWindowKey so we only reschedule when the
    // windows themselves change, not on every unrelated aggregate recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, entitlement.plan, settings.highRiskRemindersEnabled, dangerWindowKey]);

  const updateIntensity = React.useCallback((intensity: number) => {
    setSnapshot((current) => {
      const rounded = Math.round(intensity);
      const derivedScore = Math.min(100, Math.round(rounded * 1.18));

      return {
        ...current,
        intensity: rounded,
        riskScore: derivedScore,
        currentState: getStateFromScore(derivedScore),
        trend: getTrend(current.riskScore, derivedScore),
      };
    });
  }, []);

  const submitCheckIn = React.useCallback((answer: CheckInAnswer) => {
    const result = classifyCheckIn(answer);
    const entry: CheckInEntry = {
      id: createId("check-in"),
      createdAt: new Date().toISOString(),
      answer,
      result,
    };

    notifySelection();
    setCheckIns((current) => [entry, ...current]);
    setSnapshot((current) =>
      deriveSnapshot({
        current: {
          ...current,
          currentState: result.state,
          intensity: answer.intensity,
          riskScore: result.riskScore,
          trend: getTrend(current.riskScore, result.riskScore),
          topTrigger: answer.trigger,
          lastCheckInSummary: result.summary,
        },
        checkIns: [entry, ...checkIns],
        interventions,
        slipReviews,
      }),
    );

    return result;
  }, [checkIns, interventions, slipReviews]);

  const completeIntervention = React.useCallback(
    (session: Omit<InterventionSession, "id" | "createdAt" | "completedAt" | "completed">) => {
      const saved: InterventionSession = {
        ...session,
        id: createId("intervention"),
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        completed: true,
      };

      notifySelection();
      setInterventions((current) => [saved, ...current]);
      setSnapshot((current) =>
        deriveSnapshot({
          current,
          checkIns,
          interventions: [saved, ...interventions],
          slipReviews,
        }),
      );

      return saved;
    },
    [checkIns, interventions, slipReviews],
  );

  // A pause is deliberately self-contained: it logs the interruption but does not
  // recompute the global snapshot. A micro-pause is a nudge, not a re-classification
  // of the urge state, so it never overrides the most recent check-in / SOS / slip.
  const completePause = React.useCallback((session: Omit<PauseSession, "id" | "createdAt">) => {
    const saved: PauseSession = {
      ...session,
      id: createId("pause"),
      createdAt: new Date().toISOString(),
    };

    notifySelection();
    setPauses((current) => [saved, ...current]);

    return saved;
  }, []);

  const saveSlipReview = React.useCallback((review: Omit<SlipReview, "id" | "createdAt">) => {
    const saved: SlipReview = {
      ...review,
      id: createId("review"),
      createdAt: new Date().toISOString(),
    };

    setSlipReviews((current) => [saved, ...current]);
    setSnapshot((current) =>
      deriveSnapshot({
        current,
        checkIns,
        interventions,
        slipReviews: [saved, ...slipReviews],
      }),
    );
    notifySelection();

    return saved;
  }, [checkIns, interventions, slipReviews]);

  const updateSettings = React.useCallback((patch: Partial<UserSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
    notifySelection();
  }, []);

  const setLocalEntitlement = React.useCallback((plan: Entitlement["plan"]) => {
    setEntitlement({
      plan,
      source: "local",
      lastCheckedAt: new Date().toISOString(),
    });
    notifySelection();
  }, []);

  const exportLocalData = React.useCallback(() => {
    const state: SignalPersistedState = {
      snapshot,
      checkIns,
      interventions,
      pauses,
      slipReviews,
      settings,
      entitlement,
    };

    return createSignalExport(state);
  }, [checkIns, entitlement, interventions, pauses, settings, slipReviews, snapshot]);

  const clearLocalData = React.useCallback(() => {
    clearSignalState();
    setSnapshot(defaultPersistedState.snapshot);
    setCheckIns([]);
    setInterventions([]);
    setPauses([]);
    setSlipReviews([]);
    setSettings(defaultSettings);
    setEntitlement(defaultEntitlement);
    notifySelection();
  }, []);

  const value = React.useMemo(
    () => ({
      snapshot,
      redirects: redirectActions,
      checkIns,
      interventions,
      pauses,
      slipReviews,
      settings,
      entitlement,
      patternAggregate,
      isHydrated,
      updateIntensity,
      submitCheckIn,
      completeIntervention,
      completePause,
      saveSlipReview,
      updateSettings,
      setLocalEntitlement,
      refreshEntitlement,
      exportLocalData,
      clearLocalData,
      resetMockSession: clearLocalData,
    }),
    [
      checkIns,
      clearLocalData,
      completeIntervention,
      completePause,
      entitlement,
      exportLocalData,
      interventions,
      isHydrated,
      patternAggregate,
      pauses,
      refreshEntitlement,
      saveSlipReview,
      settings,
      setLocalEntitlement,
      slipReviews,
      snapshot,
      submitCheckIn,
      updateIntensity,
      updateSettings,
    ],
  );

  return <SignalContext.Provider value={value}>{children}</SignalContext.Provider>;
}

export function useSignal() {
  const value = React.use(SignalContext);

  if (!value) {
    throw new Error("useSignal must be used inside SignalProvider");
  }

  return value;
}
