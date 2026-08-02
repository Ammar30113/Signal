import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { AppState } from "react-native";

import { redirectActions } from "@/data/signal-data";
import type {
  CheckInAnswer,
  CheckInEntry,
  CheckInResult,
  Entitlement,
  ImportSummary,
  InterventionSession,
  PauseSession,
  PatternAggregate,
  RedirectAction,
  RedirectActionInput,
  SignalPersistedState,
  SignalSnapshot,
  SlipReview,
  UserSettings,
} from "@/types/signal";
import {
  buildPatternAggregate,
  classifyCheckIn,
  countStructuredDays,
  deriveSnapshot,
  getStateFromScore,
  getTrend,
} from "@/utils/signal-engine";
import { isProBillingEnabled } from "@/constants/revenuecat";
import { addPlanListener, getCurrentPlan } from "@/utils/purchases";
import {
  DIGEST_ROUTE,
  addNotificationRouteListener,
  cancelHighRiskReminders,
  cancelWeeklyDigest,
  scheduleHighRiskReminders,
  scheduleWeeklyDigest,
} from "@/utils/notifications";
import { maybeRequestStoreReview } from "@/utils/review-prompt";
import {
  mergeSignalImport,
  replaceWithImport,
  type ParsedImport,
} from "@/utils/signal-import";
import {
  clearSignalState,
  createSignalExport,
  defaultEntitlement,
  defaultPersistedState,
  defaultSettings,
  loadSignalState,
  saveSignalState,
} from "@/utils/storage";

/**
 * Ask for an App Store review at widening milestones of completed interruptions
 * rather than once per install. iOS silently caps the sheet at three times a
 * year and never tells us whether it actually appeared, so a single lifetime
 * attempt quietly throws the rating away when the system swallows it.
 */
const REVIEW_PROMPT_MILESTONES = [5, 20, 50];
const REVIEW_PROMPT_MIN_GAP_MS = 14 * 24 * 60 * 60 * 1000;

// The dashboard slider writes a new snapshot on every release. Coalesce that
// churn instead of re-serializing the whole history each time; anything that
// touches real history still writes immediately (see the save effect).
const SNAPSHOT_SAVE_DEBOUNCE_MS = 400;

interface SignalContextValue {
  snapshot: SignalSnapshot;
  redirects: RedirectAction[];
  customRedirects: RedirectAction[];
  checkIns: CheckInEntry[];
  interventions: InterventionSession[];
  pauses: PauseSession[];
  slipReviews: SlipReview[];
  settings: UserSettings;
  entitlement: Entitlement;
  patternAggregate: PatternAggregate;
  isHydrated: boolean;
  /** True when the last write to device storage failed. Surfaced in Settings. */
  persistenceFailed: boolean;
  updateIntensity: (intensity: number) => void;
  submitCheckIn: (answer: CheckInAnswer) => CheckInResult;
  completeIntervention: (session: Omit<InterventionSession, "id" | "createdAt" | "completedAt" | "completed">) => InterventionSession;
  completePause: (session: Omit<PauseSession, "id" | "createdAt">) => PauseSession;
  saveSlipReview: (review: Omit<SlipReview, "id" | "createdAt">) => SlipReview;
  addCustomRedirect: (input: RedirectActionInput) => RedirectAction | null;
  deleteCustomRedirect: (id: string) => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
  setLocalEntitlement: (plan: Entitlement["plan"]) => void;
  refreshEntitlement: () => Promise<void>;
  exportLocalData: () => string;
  importLocalData: (parsed: ParsedImport, mode: "merge" | "replace") => ImportSummary;
  clearLocalData: () => void;
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
  const [customRedirects, setCustomRedirects] = React.useState<RedirectAction[]>([]);
  const [settings, setSettings] = React.useState<UserSettings>(defaultSettings);
  const [entitlement, setEntitlement] = React.useState<Entitlement>(defaultEntitlement);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [persistenceFailed, setPersistenceFailed] = React.useState(false);
  const reviewPromptPendingRef = React.useRef(false);

  React.useEffect(() => {
    const persisted = loadSignalState();
    setSnapshot(persisted.snapshot);
    setCheckIns(persisted.checkIns);
    setInterventions(persisted.interventions);
    setPauses(persisted.pauses);
    setSlipReviews(persisted.slipReviews);
    setCustomRedirects(persisted.customRedirects);
    setSettings(persisted.settings);
    setEntitlement(persisted.entitlement);
    setIsHydrated(true);
  }, []);

  // Persistence. `pendingRef` always holds the newest state; `dirtyRef` says
  // whether it still needs writing. Both a debounced timer and the AppState
  // flush below go through `flushSave`, so a write is never lost or doubled.
  const pendingRef = React.useRef<SignalPersistedState | null>(null);
  const dirtyRef = React.useRef(false);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSliceRef = React.useRef<unknown[] | null>(null);

  const flushSave = React.useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!dirtyRef.current || !pendingRef.current) return;
    dirtyRef.current = false;
    setPersistenceFailed(!saveSignalState(pendingRef.current));
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return undefined;

    pendingRef.current = {
      snapshot,
      checkIns,
      interventions,
      pauses,
      slipReviews,
      customRedirects,
      settings,
      entitlement,
    };

    // Everything except `snapshot` — history, settings, entitlement. These
    // change rarely and matter, so they are written straight away. A snapshot-
    // only change is the slider moving, which can wait.
    const slice = [checkIns, interventions, pauses, slipReviews, customRedirects, settings, entitlement];
    const previous = lastSavedSliceRef.current;
    lastSavedSliceRef.current = slice;

    // First pass after hydration: nothing has changed since load, so writing it
    // straight back would just be a wasted serialize on every launch.
    if (previous === null) return undefined;

    dirtyRef.current = true;
    if (slice.some((value, index) => value !== previous[index])) {
      flushSave();
      return undefined;
    }

    saveTimerRef.current = setTimeout(flushSave, SNAPSHOT_SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    };
  }, [checkIns, customRedirects, entitlement, flushSave, interventions, isHydrated, pauses, settings, slipReviews, snapshot]);

  // A debounced write must not die with the app. Flush the moment we stop being
  // foregrounded, and on teardown.
  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active") flushSave();
    });
    return () => {
      subscription.remove();
      flushSave();
    };
  }, [flushSave]);

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
  const redirects = React.useMemo(() => [...redirectActions, ...customRedirects], [customRedirects]);

  const maybePromptForReview = React.useCallback(
    ({
      interventions: nextInterventions,
      pauses: nextPauses,
      slipReviews: nextSlipReviews,
    }: {
      interventions: InterventionSession[];
      pauses: PauseSession[];
      slipReviews: SlipReview[];
    }) => {
      if (!isHydrated || reviewPromptPendingRef.current) return;

      const attempts = settings.reviewPromptAttempts;
      if (attempts >= REVIEW_PROMPT_MILESTONES.length) return;

      const meaningfulActions =
        nextInterventions.filter((session) => session.completed).length + nextPauses.length + nextSlipReviews.length;
      if (meaningfulActions < REVIEW_PROMPT_MILESTONES[attempts]) return;

      // Space the attempts out even for a heavy user who clears a milestone the
      // same week — iOS would drop the extra sheet anyway, wasting an attempt.
      if (settings.lastReviewPromptedAt) {
        const elapsed = Date.now() - Date.parse(settings.lastReviewPromptedAt);
        if (Number.isFinite(elapsed) && elapsed < REVIEW_PROMPT_MIN_GAP_MS) return;
      }

      reviewPromptPendingRef.current = true;
      void maybeRequestStoreReview()
        .then((requested) => {
          if (!requested) return;
          setSettings((current) => ({
            ...current,
            reviewPromptAttempts: current.reviewPromptAttempts + 1,
            lastReviewPromptedAt: new Date().toISOString(),
          }));
        })
        .finally(() => {
          reviewPromptPendingRef.current = false;
        });
    },
    [isHydrated, settings.lastReviewPromptedAt, settings.reviewPromptAttempts],
  );

  // Keep high-risk reminders aligned with the latest danger windows. Pro + opt-in
  // only; utils/notifications dynamically imports expo-notifications, so a free
  // user who never enables this never loads the native module.
  const remindersScheduledRef = React.useRef(false);
  const dangerWindowKey = patternAggregate.dangerWindows.map((window) => window.label).join("|");
  React.useEffect(() => {
    if (!isHydrated) return;

    // Withdrawing the entitlement or clearing local data has to take the already
    // scheduled notifications with it — the OS keeps firing them otherwise, long
    // after the app has forgotten why. Gated on the ref so a user who never
    // scheduled anything still never loads the native module.
    if (entitlement.plan !== "pro" || !settings.highRiskRemindersEnabled) {
      if (!remindersScheduledRef.current) return;
      remindersScheduledRef.current = false;
      void cancelHighRiskReminders().catch(() => undefined);
      return;
    }

    remindersScheduledRef.current = true;
    const windows = patternAggregate.dangerWindows.map((window) => window.label);
    void scheduleHighRiskReminders(windows).catch(() => undefined);
    // patternAggregate is read via dangerWindowKey so we only reschedule when the
    // windows themselves change, not on every unrelated aggregate recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, entitlement.plan, settings.highRiskRemindersEnabled, dangerWindowKey]);

  // Weekly digest, same lifecycle as the reminders above: Pro + opt-in, and
  // cancelled on the way down so a lapsed plan stops the notification too.
  const digestScheduledRef = React.useRef(false);
  React.useEffect(() => {
    if (!isHydrated) return;

    if (entitlement.plan !== "pro" || !settings.weeklyDigestEnabled) {
      if (!digestScheduledRef.current) return;
      digestScheduledRef.current = false;
      void cancelWeeklyDigest().catch(() => undefined);
      return;
    }

    digestScheduledRef.current = true;
    void scheduleWeeklyDigest().catch(() => undefined);
  }, [isHydrated, entitlement.plan, settings.weeklyDigestEnabled]);

  // Route taps on our own notifications. Only attached while notifications are
  // actually in use, so a free user still never loads expo-notifications.
  const notificationsInUse =
    entitlement.plan === "pro" && (settings.highRiskRemindersEnabled || settings.weeklyDigestEnabled);
  React.useEffect(() => {
    if (!isHydrated || !notificationsInUse) return undefined;

    let active = true;
    let dispose: (() => void) | undefined;

    void addNotificationRouteListener((url) => {
      // Mapped rather than passed through so the router keeps its literal
      // route types and a malformed payload cannot navigate anywhere odd.
      if (url === DIGEST_ROUTE) router.navigate("/pattern");
      else router.navigate("/check-in");
    })
      .then((off) => {
        if (active) dispose = off;
        else off();
      })
      .catch(() => undefined);

    return () => {
      active = false;
      dispose?.();
    };
  }, [isHydrated, notificationsInUse]);

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
        pauses,
        slipReviews,
      }),
    );

    return result;
  }, [checkIns, interventions, pauses, slipReviews]);

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
      const nextInterventions = [saved, ...interventions];
      setInterventions((current) => [saved, ...current]);
      setSnapshot((current) =>
        deriveSnapshot({
          current,
          checkIns,
          interventions: nextInterventions,
          pauses,
          slipReviews,
        }),
      );
      maybePromptForReview({ interventions: nextInterventions, pauses, slipReviews });

      return saved;
    },
    [checkIns, interventions, maybePromptForReview, pauses, slipReviews],
  );

  // A pause is deliberately self-contained: it logs the interruption but does not
  // recompute the global snapshot. A micro-pause is a nudge, not a re-classification
  // of the urge state, so it never overrides the most recent check-in / SOS / slip.
  const completePause = React.useCallback(
    (session: Omit<PauseSession, "id" | "createdAt">) => {
      const saved: PauseSession = {
        ...session,
        id: createId("pause"),
        createdAt: new Date().toISOString(),
      };

      notifySelection();
      const nextPauses = [saved, ...pauses];
      setPauses((current) => [saved, ...current]);
      // The one snapshot field a pause does move: showing up on a day counts,
      // whichever tool you reached for. Everything else stays as the last
      // check-in / SOS / slip left it.
      setSnapshot((current) => ({
        ...current,
        progressDays: countStructuredDays({ checkIns, interventions, pauses: nextPauses, slipReviews }),
      }));
      maybePromptForReview({ interventions, pauses: nextPauses, slipReviews });

      return saved;
    },
    [checkIns, interventions, maybePromptForReview, pauses, slipReviews],
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
        current,
        checkIns,
        interventions,
        pauses,
        slipReviews: [saved, ...slipReviews],
      }),
    );
    notifySelection();

    return saved;
  }, [checkIns, interventions, pauses, slipReviews]);

  const addCustomRedirect = React.useCallback((input: RedirectActionInput) => {
    const title = input.title.trim().slice(0, 56);
    const detail = input.detail.trim().slice(0, 140);
    const duration = input.duration.trim().slice(0, 20);

    if (!title || !detail || !duration) return null;

    const saved: RedirectAction = {
      id: createId("redirect"),
      title,
      detail,
      duration,
    };

    setCustomRedirects((current) => [saved, ...current]);
    notifySelection();
    return saved;
  }, []);

  const deleteCustomRedirect = React.useCallback((id: string) => {
    setCustomRedirects((current) => current.filter((redirect) => redirect.id !== id));
    notifySelection();
  }, []);

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
      customRedirects,
      settings,
      entitlement,
    };

    return createSignalExport(state);
  }, [checkIns, customRedirects, entitlement, interventions, pauses, settings, slipReviews, snapshot]);

  const importLocalData = React.useCallback(
    (parsed: ParsedImport, mode: "merge" | "replace") => {
      const current: SignalPersistedState = {
        snapshot,
        checkIns,
        interventions,
        pauses,
        slipReviews,
        customRedirects,
        settings,
        entitlement,
      };

      const { state, summary } = mode === "merge" ? mergeSignalImport(current, parsed) : replaceWithImport(current, parsed);

      setCheckIns(state.checkIns);
      setInterventions(state.interventions);
      setPauses(state.pauses);
      setSlipReviews(state.slipReviews);
      setCustomRedirects(state.customRedirects);
      // Recompute rather than trusting the file's snapshot: it describes the
      // device it was exported from, and after a merge it may not even be the
      // most recent event any more.
      setSnapshot(
        deriveSnapshot({
          current: state.snapshot,
          checkIns: state.checkIns,
          interventions: state.interventions,
          pauses: state.pauses,
          slipReviews: state.slipReviews,
        }),
      );
      notifySelection();

      return summary;
    },
    [checkIns, customRedirects, entitlement, interventions, pauses, settings, slipReviews, snapshot],
  );

  const clearLocalData = React.useCallback(() => {
    clearSignalState();
    setSnapshot(defaultPersistedState.snapshot);
    setCheckIns([]);
    setInterventions([]);
    setPauses([]);
    setSlipReviews([]);
    setCustomRedirects([]);
    setSettings(defaultSettings);
    setEntitlement(defaultEntitlement);
    notifySelection();
  }, []);

  const value = React.useMemo(
    () => ({
      snapshot,
      redirects,
      customRedirects,
      checkIns,
      interventions,
      pauses,
      slipReviews,
      settings,
      entitlement,
      patternAggregate,
      isHydrated,
      persistenceFailed,
      updateIntensity,
      submitCheckIn,
      completeIntervention,
      completePause,
      saveSlipReview,
      addCustomRedirect,
      deleteCustomRedirect,
      updateSettings,
      setLocalEntitlement,
      refreshEntitlement,
      exportLocalData,
      importLocalData,
      clearLocalData,
    }),
    [
      checkIns,
      customRedirects,
      addCustomRedirect,
      clearLocalData,
      completeIntervention,
      completePause,
      deleteCustomRedirect,
      entitlement,
      exportLocalData,
      importLocalData,
      interventions,
      isHydrated,
      patternAggregate,
      pauses,
      persistenceFailed,
      refreshEntitlement,
      redirects,
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
