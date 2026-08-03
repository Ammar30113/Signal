import type { CheckInEntry, InterventionSession, PauseSession, SlipReview } from "@/types/signal";
import { buildHistoryTimeline, countByKind, formatEntryTimestamp } from "@/utils/history";
import { classifyCheckIn } from "@/utils/signal-engine";

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message ?? `Expected ${String(expected)}, received ${String(actual)}`);
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
  id: "c1",
  createdAt: "2026-06-04T23:12:00.000Z",
  answer,
  result: classifyCheckIn(answer),
};

const protocol: InterventionSession = {
  id: "i1",
  createdAt: "2026-06-05T09:00:00.000Z",
  completedAt: "2026-06-05T09:10:00.000Z",
  durationSeconds: 600,
  selectedAction: "Walk outside",
  emotion: "Restless",
  trigger: "Late-night phone",
  intensityBefore: 82,
  intensityAfter: 38,
  reflection: "Moved outside and the spike dropped.",
  completed: true,
};

const pause: PauseSession = {
  id: "p1",
  createdAt: "2026-06-06T14:00:00.000Z",
  durationSeconds: 60,
  redirectId: "walk",
  redirectTitle: "Walk without phone",
  completed: true,
};

const slipReview: SlipReview = {
  id: "s1",
  createdAt: "2026-06-07T02:00:00.000Z",
  firstWrongTurn: "Phone in bed.",
  trigger: "Alone and unstructured",
  rationalization: "I earned it",
  state: "red",
  earlierInterruption: "Stand up before scrolling.",
  next24Hours: "Sleep, train, phone out of the bedroom.",
};

const source = { checkIns: [checkIn], interventions: [protocol], pauses: [pause], slipReviews: [slipReview] };

// --- merge + ordering --------------------------------------------------------

const all = buildHistoryTimeline(source);
assertEqual(all.length, 4);
assertEqual(all[0].kind, "slip-review", "newest entry first");
assertEqual(all[1].kind, "pause");
assertEqual(all[2].kind, "protocol");
assertEqual(all[3].kind, "check-in", "oldest entry last");

// The discriminated union must carry the right payload on each branch.
const first = all[0];
assertEqual(first.kind === "slip-review" ? first.slipReview.rationalization : "", "I earned it");
const last = all[3];
assertEqual(last.kind === "check-in" ? last.checkIn.answer.trigger : "", "Late-night phone");

// --- stable ordering on identical timestamps ---------------------------------

const sameInstant = buildHistoryTimeline({
  checkIns: [
    { ...checkIn, id: "aaa", createdAt: "2026-06-10T00:00:00.000Z" },
    { ...checkIn, id: "bbb", createdAt: "2026-06-10T00:00:00.000Z" },
    { ...checkIn, id: "ccc", createdAt: "2026-06-10T00:00:00.000Z" },
  ],
  interventions: [],
  slipReviews: [],
});
assertEqual(sameInstant.map((e) => e.id).join(","), "ccc,bbb,aaa", "ties break on id, deterministically");
// Building it again must give the identical order — an unstable sort would let
// rows swap under the user mid-scroll.
assertEqual(
  buildHistoryTimeline({
    checkIns: [
      { ...checkIn, id: "aaa", createdAt: "2026-06-10T00:00:00.000Z" },
      { ...checkIn, id: "bbb", createdAt: "2026-06-10T00:00:00.000Z" },
      { ...checkIn, id: "ccc", createdAt: "2026-06-10T00:00:00.000Z" },
    ],
    interventions: [],
    slipReviews: [],
  })
    .map((e) => e.id)
    .join(","),
  "ccc,bbb,aaa",
);

// --- filtering ---------------------------------------------------------------

assertEqual(buildHistoryTimeline(source, "check-in").length, 1);
assertEqual(buildHistoryTimeline(source, "protocol").length, 1);
assertEqual(buildHistoryTimeline(source, "pause").length, 1);
assertEqual(buildHistoryTimeline(source, "slip-review").length, 1);
assertEqual(buildHistoryTimeline(source, "all").length, 4);
assertEqual(buildHistoryTimeline(source, "pause")[0].kind, "pause", "filter returns only that kind");

// --- counts ------------------------------------------------------------------

const counts = countByKind(source);
assertEqual(counts.all, 4);
assertEqual(counts["check-in"], 1);
assertEqual(counts.protocol, 1);
assertEqual(counts.pause, 1);
assertEqual(counts["slip-review"], 1);

// --- empty + omitted pauses --------------------------------------------------

assertEqual(buildHistoryTimeline({ checkIns: [], interventions: [], slipReviews: [] }).length, 0);
assertEqual(countByKind({ checkIns: [], interventions: [], slipReviews: [] }).all, 0);
// `pauses` is optional; omitting it must not throw or produce undefined entries.
assertEqual(buildHistoryTimeline({ checkIns: [checkIn], interventions: [], slipReviews: [] }).length, 1);

// --- timestamp formatting ----------------------------------------------------

// A corrupt date must not crash the row that renders it.
assertEqual(formatEntryTimestamp("not-a-date"), "Unknown date");
if (!formatEntryTimestamp(checkIn.createdAt).includes("·")) {
  throw new Error("Expected formatted timestamp to join day and time with a separator");
}

console.log("history tests passed");
