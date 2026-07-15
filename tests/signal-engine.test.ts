import { initialSnapshot } from "@/data/signal-data";
import type { CheckInAnswer, CheckInEntry, InterventionSession, PauseSession, SlipReview } from "@/types/signal";
import {
  buildPatternAggregate,
  buildWeeklyReview,
  classifyCheckIn,
  deriveSnapshot,
  getStateFromScore,
  getTrend,
} from "@/utils/signal-engine";

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message ?? `Expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assertOk<T>(value: T, message?: string): asserts value is NonNullable<T> {
  if (value === undefined || value === null || value === false) {
    throw new Error(message ?? "Expected value to be present");
  }
}

// State thresholds: green < 36 <= yellow < 72 <= red.
assertEqual(getStateFromScore(0), "green");
assertEqual(getStateFromScore(35), "green");
assertEqual(getStateFromScore(36), "yellow");
assertEqual(getStateFromScore(71), "yellow");
assertEqual(getStateFromScore(72), "red");
assertEqual(getStateFromScore(100), "red");

// Trend flips only on a move of 8+ points in either direction.
assertEqual(getTrend(50, 57), "stable");
assertEqual(getTrend(50, 58), "rising");
assertEqual(getTrend(50, 43), "stable");
assertEqual(getTrend(50, 42), "falling");

const baseAnswer: CheckInAnswer = {
  mood: "Clear",
  intensity: 12,
  trigger: "Boredom",
  emotionalDriver: "unclear",
  hasScrolled: false,
  exposedToContent: false,
  bargainingThoughts: false,
};

const greenResult = classifyCheckIn(baseAnswer);

assertEqual(greenResult.state, "green");
assertEqual(greenResult.riskScore, 12);

const redResult = classifyCheckIn({
  ...baseAnswer,
  mood: "Restless",
  intensity: 74,
  trigger: "Late-night phone",
  emotionalDriver: "mixed",
  hasScrolled: true,
  exposedToContent: true,
  bargainingThoughts: true,
});

assertEqual(redResult.state, "red");
assertEqual(redResult.riskScore, 100);

const checkIn: CheckInEntry = {
  id: "check-in-test",
  createdAt: "2026-06-04T23:12:00.000Z",
  answer: {
    ...baseAnswer,
    mood: "Restless",
    intensity: 54,
    trigger: "Late-night phone",
    hasScrolled: true,
  },
  result: classifyCheckIn({
    ...baseAnswer,
    mood: "Restless",
    intensity: 54,
    trigger: "Late-night phone",
    hasScrolled: true,
  }),
};

const intervention: InterventionSession = {
  id: "intervention-test",
  createdAt: "2026-06-04T23:20:00.000Z",
  completedAt: "2026-06-04T23:30:00.000Z",
  durationSeconds: 600,
  selectedAction: "Walk outside",
  emotion: "Restless",
  trigger: "Late-night phone",
  intensityBefore: 82,
  intensityAfter: 38,
  reflection: "Moved outside and the spike dropped.",
  completed: true,
};

const slipReview: SlipReview = {
  id: "slip-review-test",
  createdAt: "2026-06-05T00:05:00.000Z",
  firstWrongTurn: "Stayed in bed with the phone.",
  trigger: "Alone and unstructured",
  rationalization: "I earned it",
  state: "red",
  earlierInterruption: "Stand up before scrolling.",
  next24Hours: "Sleep, train, and keep the phone out of bed.",
};

const pause: PauseSession = {
  id: "pause-test",
  createdAt: "2026-06-05T01:00:00.000Z",
  durationSeconds: 60,
  redirectId: "walk",
  redirectTitle: "Walk without phone",
  completed: true,
};

const aggregate = buildPatternAggregate({
  checkIns: [checkIn],
  interventions: [intervention],
  pauses: [pause],
  slipReviews: [slipReview],
});

assertEqual(aggregate.totals.checkIns, 1);
assertEqual(aggregate.totals.interventions, 1);
assertEqual(aggregate.totals.completedInterventions, 1);
assertEqual(aggregate.totals.pauses, 1);
assertEqual(aggregate.totals.slipReviews, 1);

const lateNight = aggregate.topTriggers.find((profile) => profile.trigger === "Late-night phone");
assertOk(lateNight);
assertEqual(lateNight.count, 2);
assertEqual(lateNight.averageRisk, checkIn.result.riskScore);

const redirect = aggregate.successfulRedirectActions.find((item) => item.action === "Walk outside");
assertOk(redirect);
assertEqual(redirect.count, 1);
assertEqual(redirect.averageDrop, 44);

assertEqual(aggregate.topRationalizations[0]?.script, "I earned it");

const emptyAggregate = buildPatternAggregate({
  checkIns: [],
  interventions: [],
  slipReviews: [],
});

assertEqual(emptyAggregate.totals.checkIns, 0);
// With no data, insights must be empty rather than fabricated seed data.
assertEqual(emptyAggregate.insights.length, 0);

const weeklyReview = buildWeeklyReview({
  checkIns: [checkIn],
  interventions: [intervention],
  pauses: [pause],
  slipReviews: [slipReview],
  now: new Date("2026-06-06T00:00:00.000Z"),
});

assertEqual(weeklyReview.totalSignals, 4);
assertEqual(weeklyReview.totals.pauses, 1);
assertEqual(weeklyReview.topTrigger?.trigger, "Late-night phone");
assertEqual(weeklyReview.bestRedirect?.action, "Walk outside");

const emptyWeeklyReview = buildWeeklyReview({
  checkIns: [checkIn],
  interventions: [intervention],
  pauses: [pause],
  slipReviews: [slipReview],
  now: new Date("2026-07-01T00:00:00.000Z"),
});

assertEqual(emptyWeeklyReview.totalSignals, 0);
assertEqual(emptyWeeklyReview.headline, "No weekly pattern yet.");

// A slip review must drive the snapshot when it is the most recent event,
// even if a check-in and an intervention already exist.
const slipDriven = deriveSnapshot({
  current: initialSnapshot,
  checkIns: [checkIn],
  interventions: [intervention],
  slipReviews: [{ ...slipReview, createdAt: "2026-06-05T02:00:00.000Z" }],
});

assertEqual(slipDriven.currentState, "yellow");
assertEqual(slipDriven.topTrigger, "Alone and unstructured");
assertEqual(slipDriven.trend, "falling");

// An intervention that is the most recent event reports a real (non-hardcoded) trend.
const interventionDriven = deriveSnapshot({
  current: initialSnapshot,
  checkIns: [],
  interventions: [intervention],
  slipReviews: [],
});

assertEqual(interventionDriven.trend, "falling");

console.log("signal-engine tests passed");
