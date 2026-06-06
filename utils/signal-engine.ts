import { initialSnapshot } from "@/data/signal-data";
import type {
  CheckInAnswer,
  CheckInEntry,
  CheckInResult,
  EmergencyAction,
  InterventionSession,
  PatternAggregate,
  PatternInsight,
  RationalizationScript,
  SignalSnapshot,
  SlipReview,
  Trigger,
  TriggerProfile,
  UrgeState,
} from "@/types/signal";

export function getStateFromScore(score: number): UrgeState {
  if (score >= 72) return "red";
  if (score >= 36) return "yellow";
  return "green";
}

export function getTrend(previous: number, next: number) {
  if (next >= previous + 8) return "rising";
  if (next <= previous - 8) return "falling";
  return "stable";
}

export function classifyCheckIn(answer: CheckInAnswer): CheckInResult {
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
      nextStep: "Take the 10-minute protocol. Move first, reflect after.",
    };
  }

  return {
    state,
    riskScore,
    summary: "Stable signal. Keep structure visible and avoid idle feeds.",
    nextStep: "Choose the next real-world task before the day gets soft.",
  };
}

function getHourWindow(isoDate: string) {
  const hour = new Date(isoDate).getHours();
  const start = `${hour.toString().padStart(2, "0")}:00`;
  const end = `${((hour + 1) % 24).toString().padStart(2, "0")}:00`;
  return `${start}-${end}`;
}

function increment<K extends string>(map: Map<K, number>, key: K, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function topEntries<K extends string>(map: Map<K, number>, limit: number) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export function buildPatternAggregate({
  checkIns,
  interventions,
  slipReviews,
}: {
  checkIns: CheckInEntry[];
  interventions: InterventionSession[];
  slipReviews: SlipReview[];
}): PatternAggregate {
  const triggerCounts = new Map<Trigger, number>();
  const triggerRiskTotals = new Map<Trigger, number>();
  const triggerRiskSamples = new Map<Trigger, number>();
  const triggerLastSeen = new Map<Trigger, string>();
  const emotionTriggerCounts = new Map<string, number>();
  const rationalizationCounts = new Map<RationalizationScript, number>();
  const actionCounts = new Map<EmergencyAction, number>();
  const actionDropTotals = new Map<EmergencyAction, number>();
  const hourCounts = new Map<string, number>();

  checkIns.forEach((entry) => {
    const trigger = entry.answer.trigger;
    increment(triggerCounts, trigger);
    triggerRiskTotals.set(trigger, (triggerRiskTotals.get(trigger) ?? 0) + entry.result.riskScore);
    increment(triggerRiskSamples, trigger);
    triggerLastSeen.set(trigger, entry.createdAt);
    increment(emotionTriggerCounts, `${entry.answer.mood}|${trigger}`);
    increment(hourCounts, getHourWindow(entry.createdAt));
  });

  interventions.forEach((session) => {
    increment(triggerCounts, session.trigger);
    triggerLastSeen.set(session.trigger, session.createdAt);
    increment(emotionTriggerCounts, `${session.emotion}|${session.trigger}`);
    increment(hourCounts, getHourWindow(session.createdAt));

    if (session.completed) {
      increment(actionCounts, session.selectedAction);
      const drop = Math.max(0, session.intensityBefore - (session.intensityAfter ?? session.intensityBefore));
      actionDropTotals.set(session.selectedAction, (actionDropTotals.get(session.selectedAction) ?? 0) + drop);
    }
  });

  slipReviews.forEach((review) => {
    increment(triggerCounts, review.trigger);
    triggerLastSeen.set(review.trigger, review.createdAt);
    increment(rationalizationCounts, review.rationalization);
    increment(hourCounts, getHourWindow(review.createdAt));
  });

  const topTriggers: TriggerProfile[] = topEntries(triggerCounts, 5).map(([trigger, count]) => ({
    trigger,
    count,
    averageRisk:
      triggerRiskSamples.has(trigger)
        ? Math.round((triggerRiskTotals.get(trigger) ?? 0) / Math.max(1, triggerRiskSamples.get(trigger) ?? 1))
        : 48,
    lastSeenAt: triggerLastSeen.get(trigger),
  }));

  const topRationalizations = topEntries(rationalizationCounts, 5).map(([script, count]) => ({
    script,
    count,
  }));

  const successfulRedirectActions = topEntries(actionCounts, 5).map(([action, count]) => ({
    action,
    count,
    averageDrop: Math.round((actionDropTotals.get(action) ?? 0) / Math.max(1, count)),
  }));

  const emotionTriggerPairs = topEntries(emotionTriggerCounts, 5).map(([key, count]) => {
    const [emotion, trigger] = key.split("|") as [string, Trigger];
    return { emotion, trigger, count };
  });

  const dangerWindows = topEntries(hourCounts, 4).map(([label, count]) => ({ label, count }));

  const insights: PatternInsight[] = [
    ...topTriggers.slice(0, 2).map((profile) => ({
      id: `trigger-${profile.trigger}`,
      kind: "trigger" as const,
      title: profile.trigger,
      detail: `${profile.count} signal${profile.count === 1 ? "" : "s"} logged. Average risk ${profile.averageRisk}%.`,
      weight: Math.min(95, Math.max(45, profile.averageRisk)),
    })),
    ...successfulRedirectActions.slice(0, 1).map((action) => ({
      id: `action-${action.action}`,
      kind: "action" as const,
      title: action.action,
      detail: `Most reliable redirect so far. Average intensity drop: ${action.averageDrop} points.`,
      weight: Math.min(95, 55 + action.averageDrop),
    })),
    ...topRationalizations.slice(0, 1).map((item) => ({
      id: `script-${item.script}`,
      kind: "script" as const,
      title: item.script,
      detail: "Name this script early. It loses force when it is no longer vague.",
      weight: Math.min(90, 55 + item.count * 10),
    })),
  ];

  return {
    insights,
    topTriggers,
    emotionTriggerPairs,
    topRationalizations,
    successfulRedirectActions,
    dangerWindows: dangerWindows.length > 0 ? dangerWindows : [{ label: "No window yet", count: 0 }],
    milestoneDangerDays: [7, 14, 21],
    totals: {
      checkIns: checkIns.length,
      interventions: interventions.length,
      completedInterventions: interventions.filter((session) => session.completed).length,
      slipReviews: slipReviews.length,
    },
  };
}

export function deriveSnapshot({
  current,
  checkIns,
  interventions,
  slipReviews,
}: {
  current: SignalSnapshot;
  checkIns: CheckInEntry[];
  interventions: InterventionSession[];
  slipReviews: SlipReview[];
}): SignalSnapshot {
  const lastCheckIn = checkIns[0];
  const lastIntervention = interventions[0];
  const lastSlip = slipReviews[0];
  const aggregate = buildPatternAggregate({ checkIns, interventions, slipReviews });
  const structuredDays = new Set(
    [...checkIns, ...interventions, ...slipReviews].map((entry) => entry.createdAt.slice(0, 10)),
  ).size;

  // Drive the live snapshot from whichever event happened most recently.
  const events = [
    lastIntervention?.completed ? { kind: "intervention" as const, at: lastIntervention.createdAt } : null,
    lastCheckIn ? { kind: "checkin" as const, at: lastCheckIn.createdAt } : null,
    lastSlip ? { kind: "slip" as const, at: lastSlip.createdAt } : null,
  ].filter((event): event is NonNullable<typeof event> => event !== null);
  const latest = events.sort((a, b) => (a.at < b.at ? 1 : -1))[0];

  if (latest?.kind === "intervention" && lastIntervention) {
    const after = lastIntervention.intensityAfter ?? Math.max(0, lastIntervention.intensityBefore - 12);
    const riskScore = Math.min(100, Math.round(after * 1.12));

    return {
      ...current,
      currentState: getStateFromScore(riskScore),
      intensity: after,
      riskScore,
      trend: getTrend(lastIntervention.intensityBefore, after),
      topTrigger: lastIntervention.trigger,
      progressDays: structuredDays,
      lastCheckInSummary: "10-minute protocol completed. The signal was interrupted before it became automatic.",
    };
  }

  if (latest?.kind === "slip" && lastSlip) {
    return {
      ...current,
      currentState: "yellow",
      intensity: 28,
      riskScore: 34,
      trend: "falling",
      topTrigger: lastSlip.trigger,
      progressDays: structuredDays,
      lastCheckInSummary: "Slip reviewed. No binge logic. Protect the next 24 hours.",
    };
  }

  if (latest?.kind === "checkin" && lastCheckIn) {
    return {
      ...current,
      currentState: lastCheckIn.result.state,
      intensity: lastCheckIn.answer.intensity,
      riskScore: lastCheckIn.result.riskScore,
      trend: getTrend(current.riskScore, lastCheckIn.result.riskScore),
      topTrigger: lastCheckIn.answer.trigger,
      progressDays: structuredDays,
      lastCheckInSummary: lastCheckIn.result.summary,
    };
  }

  return {
    ...initialSnapshot,
    progressDays: structuredDays || initialSnapshot.progressDays,
    topTrigger: aggregate.topTriggers[0]?.trigger ?? initialSnapshot.topTrigger,
  };
}
