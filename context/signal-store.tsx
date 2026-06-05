import * as Haptics from "expo-haptics";
import React from "react";

import { redirectActions } from "@/data/signal-data";
import type {
  CheckInAnswer,
  CheckInEntry,
  CheckInResult,
  Entitlement,
  InterventionSession,
  PatternAggregate,
  RedirectAction,
  SignalSnapshot,
  SlipReview,
  UserSettings,
} from "@/types/signal";
import { buildPatternAggregate, classifyCheckIn, deriveSnapshot, getStateFromScore, getTrend } from "@/utils/signal-engine";
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
  slipReviews: SlipReview[];
  settings: UserSettings;
  entitlement: Entitlement;
  patternAggregate: PatternAggregate;
  isHydrated: boolean;
  updateIntensity: (intensity: number) => void;
  submitCheckIn: (answer: CheckInAnswer) => CheckInResult;
  completeIntervention: (session: Omit<InterventionSession, "id" | "createdAt" | "completedAt" | "completed">) => InterventionSession;
  saveSlipReview: (review: Omit<SlipReview, "id" | "createdAt">) => SlipReview;
  updateSettings: (patch: Partial<UserSettings>) => void;
  setLocalEntitlement: (plan: Entitlement["plan"]) => void;
  exportLocalData: () => string;
  clearLocalData: () => void;
  resetMockSession: () => void;
}

const SignalContext = React.createContext<SignalContextValue | null>(null);

function notifySelection() {
  if (process.env.EXPO_OS !== "ios") return;
  void Haptics.selectionAsync().catch(() => undefined);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function SignalProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = React.useState<SignalSnapshot>(defaultPersistedState.snapshot);
  const [checkIns, setCheckIns] = React.useState<CheckInEntry[]>([]);
  const [interventions, setInterventions] = React.useState<InterventionSession[]>([]);
  const [slipReviews, setSlipReviews] = React.useState<SlipReview[]>([]);
  const [settings, setSettings] = React.useState<UserSettings>(defaultSettings);
  const [entitlement, setEntitlement] = React.useState<Entitlement>(defaultEntitlement);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    const persisted = loadSignalState();
    setSnapshot(persisted.snapshot);
    setCheckIns(persisted.checkIns);
    setInterventions(persisted.interventions);
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
      slipReviews,
      settings,
      entitlement,
    });
  }, [checkIns, entitlement, interventions, isHydrated, settings, slipReviews, snapshot]);

  const patternAggregate = React.useMemo(
    () => buildPatternAggregate({ checkIns, interventions, slipReviews }),
    [checkIns, interventions, slipReviews],
  );

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

  const saveSlipReview = React.useCallback((review: Omit<SlipReview, "id" | "createdAt">) => {
    const saved: SlipReview = {
      ...review,
      id: createId("review"),
      createdAt: new Date().toISOString(),
    };

    setSlipReviews((current) => [saved, ...current]);
    setSnapshot((current) =>
      deriveSnapshot({
        current: {
          ...current,
          currentState: "yellow",
          intensity: 28,
          riskScore: 34,
          trend: "falling",
          topTrigger: review.trigger,
          lastCheckInSummary: "Slip reviewed. No binge logic. Protect the next 24 hours.",
        },
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
      slipReviews,
      settings,
      entitlement,
    };

    return createSignalExport(state);
  }, [checkIns, entitlement, interventions, settings, slipReviews, snapshot]);

  const clearLocalData = React.useCallback(() => {
    clearSignalState();
    setSnapshot(defaultPersistedState.snapshot);
    setCheckIns([]);
    setInterventions([]);
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
      slipReviews,
      settings,
      entitlement,
      patternAggregate,
      isHydrated,
      updateIntensity,
      submitCheckIn,
      completeIntervention,
      saveSlipReview,
      updateSettings,
      setLocalEntitlement,
      exportLocalData,
      clearLocalData,
      resetMockSession: clearLocalData,
    }),
    [
      checkIns,
      clearLocalData,
      completeIntervention,
      entitlement,
      exportLocalData,
      interventions,
      isHydrated,
      patternAggregate,
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
