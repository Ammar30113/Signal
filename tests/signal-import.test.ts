import { initialSnapshot } from "@/data/signal-data";
import type { CheckInEntry, PauseSession, SignalPersistedState, SlipReview } from "@/types/signal";
import { mergeSignalImport, parseSignalImport, replaceWithImport, summaryTotal } from "@/utils/signal-import";
import { classifyCheckIn } from "@/utils/signal-engine";

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

const answer = {
  mood: "Restless",
  intensity: 54,
  trigger: "Late-night phone" as const,
  emotionalDriver: "mixed" as const,
  hasScrolled: true,
  exposedToContent: false,
  bargainingThoughts: true,
};

const checkIn: CheckInEntry = {
  id: "check-in-1",
  createdAt: "2026-06-04T23:12:00.000Z",
  answer,
  result: classifyCheckIn(answer),
};

const pause: PauseSession = {
  id: "pause-1",
  createdAt: "2026-06-05T01:00:00.000Z",
  durationSeconds: 60,
  redirectId: "walk",
  redirectTitle: "Walk without phone",
  completed: true,
};

const slipReview: SlipReview = {
  id: "slip-1",
  createdAt: "2026-06-05T00:05:00.000Z",
  firstWrongTurn: "Stayed in bed with the phone.",
  trigger: "Alone and unstructured",
  rationalization: "I earned it",
  state: "red",
  earlierInterruption: "Stand up before scrolling.",
  next24Hours: "Sleep, train, phone out of the bedroom.",
};

const emptyState: SignalPersistedState = {
  snapshot: initialSnapshot,
  checkIns: [],
  interventions: [],
  pauses: [],
  slipReviews: [],
  customRedirects: [],
  settings: {
    hasCompletedOnboarding: true,
    appLockEnabled: true,
    protocolDurationSeconds: 600,
    pauseDurationSeconds: 60,
    highRiskRemindersEnabled: false,
    weeklyDigestEnabled: false,
    reviewPromptAttempts: 0,
  },
  entitlement: { plan: "free", source: "local" },
};

const exported = JSON.stringify({
  exportedAt: "2026-08-02T10:00:00.000Z",
  app: "Signal",
  ...emptyState,
  checkIns: [checkIn],
  pauses: [pause],
  slipReviews: [slipReview],
});

// --- rejection of things that are not Signal exports -------------------------

assertEqual(parseSignalImport("not json at all"), null);
assertEqual(parseSignalImport("[1,2,3]"), null, "a bare array is not an export");
assertEqual(parseSignalImport('{"hello":"world"}'), null, "unrelated JSON must be rejected");
// A file that merely looks like one is accepted structurally, then validated.
assertOk(parseSignalImport('{"checkIns":[]}'));

// --- a real export round-trips ----------------------------------------------

const parsed = parseSignalImport(exported);
assertOk(parsed);
assertEqual(parsed.checkIns.length, 1);
assertEqual(parsed.pauses.length, 1);
assertEqual(parsed.slipReviews.length, 1);
assertEqual(parsed.skipped, 0);
assertEqual(parsed.checkIns[0].answer.trigger, "Late-night phone");
assertEqual(parsed.checkIns[0].result.riskScore, checkIn.result.riskScore);

// --- malformed entries are dropped individually, not fatally -----------------

const partiallyCorrupt = JSON.stringify({
  app: "Signal",
  checkIns: [
    checkIn,
    { id: "no-date", answer, result: checkIn.result },
    { id: "bad-trigger", createdAt: checkIn.createdAt, answer: { ...answer, trigger: "Nonsense" }, result: checkIn.result },
    { id: "bad-intensity", createdAt: checkIn.createdAt, answer: { ...answer, intensity: 9000 }, result: checkIn.result },
    null,
    "a string",
  ],
  pauses: [pause, { id: "no-title", createdAt: pause.createdAt }],
});

const corrupt = parseSignalImport(partiallyCorrupt);
assertOk(corrupt);
assertEqual(corrupt.checkIns.length, 1, "only the valid check-in survives");
assertEqual(corrupt.pauses.length, 1);
assertEqual(corrupt.skipped, 6, "five bad check-ins and one bad pause are counted");

// --- merge ------------------------------------------------------------------

const firstMerge = mergeSignalImport(emptyState, parsed);
assertEqual(summaryTotal(firstMerge.summary), 3);
assertEqual(firstMerge.state.checkIns.length, 1);
assertEqual(firstMerge.state.pauses.length, 1);
assertEqual(firstMerge.state.slipReviews.length, 1);

// Importing the same file twice must not duplicate history.
const secondMerge = mergeSignalImport(firstMerge.state, parsed);
assertEqual(summaryTotal(secondMerge.summary), 0, "re-importing adds nothing");
assertEqual(secondMerge.state.checkIns.length, 1);
assertEqual(secondMerge.state.pauses.length, 1);

// A genuinely new entry does get added, and history stays newest-first.
const laterCheckIn = { ...checkIn, id: "check-in-2", createdAt: "2026-07-01T09:00:00.000Z" };
const thirdMerge = mergeSignalImport(
  firstMerge.state,
  parseSignalImport(JSON.stringify({ app: "Signal", checkIns: [laterCheckIn] }))!,
);
assertEqual(thirdMerge.summary.checkIns, 1);
assertEqual(thirdMerge.state.checkIns.length, 2);
assertEqual(thirdMerge.state.checkIns[0].id, "check-in-2", "newest entry sorts first");

// --- replace ----------------------------------------------------------------

const populated = mergeSignalImport(emptyState, parseSignalImport(JSON.stringify({
  app: "Signal",
  checkIns: [{ ...checkIn, id: "pre-existing" }],
}))!).state;
assertEqual(populated.checkIns.length, 1);

const replaced = replaceWithImport(populated, parsed);
assertEqual(replaced.state.checkIns.length, 1);
assertEqual(replaced.state.checkIns[0].id, "check-in-1", "replace discards what was there");

// --- settings and entitlement are never taken from the file ------------------

const hostile = parseSignalImport(JSON.stringify({
  app: "Signal",
  checkIns: [checkIn],
  settings: { appLockEnabled: false, hasCompletedOnboarding: false },
  entitlement: { plan: "pro", source: "revenuecat" },
}));
assertOk(hostile);

for (const [label, outcome] of [
  ["merge", mergeSignalImport(emptyState, hostile)],
  ["replace", replaceWithImport(emptyState, hostile)],
] as const) {
  assertEqual(outcome.state.entitlement.plan, "free", `${label} must not grant Pro from a file`);
  assertEqual(outcome.state.settings.appLockEnabled, true, `${label} must not disable App Lock from a file`);
  assertEqual(outcome.state.settings.hasCompletedOnboarding, true, `${label} keeps local onboarding state`);
}

console.log("signal-import tests passed");
