import * as Haptics from "expo-haptics";
import React from "react";

import { initialSnapshot, redirectActions } from "@/data/signal-data";
import type {
  CheckInAnswer,
  CheckInResult,
  RedirectAction,
  SignalSnapshot,
  SlipReview,
  UrgeState,
} from "@/types/signal";

interface SignalContextValue {
  snapshot: SignalSnapshot;
  redirects: RedirectAction[];
  slipReviews: SlipReview[];
  updateIntensity: (intensity: number) => void;
  submitCheckIn: (answer: CheckInAnswer) => CheckInResult;
  saveSlipReview: (review: Omit<SlipReview, "id" | "createdAt">) => SlipReview;
  resetMockSession: () => void;
}

const SignalContext = React.createContext<SignalContextValue | null>(null);

function getStateFromScore(score: number): UrgeState {
  if (score >= 72) return "red";
  if (score >= 36) return "yellow";
  return "green";
}

function getTrend(previous: number, next: number) {
  if (next >= previous + 8) return "rising";
  if (next <= previous - 8) return "falling";
  return "stable";
}

function classifyCheckIn(answer: CheckInAnswer): CheckInResult {
  let score = answer.intensity;

  if (answer.hasScrolled) score += 12;
  if (answer.suggestiveContent) score += 18;
  if (answer.bargainingThoughts) score += 22;
  if (answer.lonelinessSignal === "mostly-lonely") score += 8;
  if (answer.lonelinessSignal === "mixed") score += 6;
  if (answer.trigger === "Alone in bed") score += 12;
  if (answer.trigger === "Late-night phone") score += 10;
  if (answer.trigger === "Milestone reward logic") score += 10;

  const riskScore = Math.min(100, Math.round(score));
  const state = getStateFromScore(riskScore);

  if (state === "red") {
    return {
      state,
      riskScore,
      summary: "You are past debate. Create distance from the screen now.",
      nextStep: "Open SOS, stand up, and choose a physical reset.",
    };
  }

  if (state === "yellow") {
    return {
      state,
      riskScore,
      summary: "Drift detected. The useful move is interruption, not analysis.",
      nextStep: "Take a 6 minute body reset or leave the room without your phone.",
    };
  }

  return {
    state,
    riskScore,
    summary: "Stable signal. Keep structure visible and avoid idle feeds.",
    nextStep: "Choose the next real-world task before the day gets soft.",
  };
}

function notifySelection() {
  if (process.env.EXPO_OS !== "ios") return;
  void Haptics.selectionAsync().catch(() => undefined);
}

export function SignalProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = React.useState<SignalSnapshot>(initialSnapshot);
  const [slipReviews, setSlipReviews] = React.useState<SlipReview[]>([]);

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
    notifySelection();

    setSnapshot((current) => ({
      ...current,
      currentState: result.state,
      intensity: answer.intensity,
      riskScore: result.riskScore,
      trend: getTrend(current.riskScore, result.riskScore),
      topTrigger: answer.trigger,
      lastCheckInSummary: result.summary,
    }));

    return result;
  }, []);

  const saveSlipReview = React.useCallback((review: Omit<SlipReview, "id" | "createdAt">) => {
    const saved: SlipReview = {
      ...review,
      id: `review-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setSlipReviews((current) => [saved, ...current]);
    setSnapshot((current) => ({
      ...current,
      currentState: "yellow",
      intensity: 28,
      riskScore: 34,
      trend: "falling",
      topTrigger: review.trigger,
      lastCheckInSummary: "Slip reviewed. No binge logic. Protect the next 24 hours.",
    }));
    notifySelection();

    return saved;
  }, []);

  const resetMockSession = React.useCallback(() => {
    setSnapshot(initialSnapshot);
    setSlipReviews([]);
    notifySelection();
  }, []);

  const value = React.useMemo(
    () => ({
      snapshot,
      redirects: redirectActions,
      slipReviews,
      updateIntensity,
      submitCheckIn,
      saveSlipReview,
      resetMockSession,
    }),
    [resetMockSession, saveSlipReview, slipReviews, snapshot, submitCheckIn, updateIntensity],
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
