import type { CheckInEntry, InterventionSession, PauseSession, SlipReview } from "@/types/signal";

// Merging the four logs into one timeline. Kept pure and free of native imports
// so it can be tested in Node — the screen only renders what this returns.

export type HistoryKind = "check-in" | "protocol" | "pause" | "slip-review";

export type HistoryEntry =
  | { kind: "check-in"; id: string; createdAt: string; checkIn: CheckInEntry }
  | { kind: "protocol"; id: string; createdAt: string; protocol: InterventionSession }
  | { kind: "pause"; id: string; createdAt: string; pause: PauseSession }
  | { kind: "slip-review"; id: string; createdAt: string; slipReview: SlipReview };

export type HistoryFilter = HistoryKind | "all";

export const historyFilters: { label: string; value: HistoryFilter }[] = [
  { label: "All", value: "all" },
  { label: "Check-ins", value: "check-in" },
  { label: "Protocols", value: "protocol" },
  { label: "Pauses", value: "pause" },
  { label: "Reviews", value: "slip-review" },
];

export interface HistorySource {
  checkIns: CheckInEntry[];
  interventions: InterventionSession[];
  pauses?: PauseSession[];
  slipReviews: SlipReview[];
}

/**
 * Newest first. Ties break on id so the order is stable across renders — two
 * entries can share a timestamp when they are logged in the same second, and an
 * unstable sort would let them swap places under the user mid-scroll.
 */
function newestFirst(a: HistoryEntry, b: HistoryEntry) {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

export function buildHistoryTimeline(
  { checkIns, interventions, pauses = [], slipReviews }: HistorySource,
  filter: HistoryFilter = "all",
): HistoryEntry[] {
  const entries: HistoryEntry[] = [];

  if (filter === "all" || filter === "check-in") {
    for (const checkIn of checkIns) {
      entries.push({ kind: "check-in", id: checkIn.id, createdAt: checkIn.createdAt, checkIn });
    }
  }
  if (filter === "all" || filter === "protocol") {
    for (const protocol of interventions) {
      entries.push({ kind: "protocol", id: protocol.id, createdAt: protocol.createdAt, protocol });
    }
  }
  if (filter === "all" || filter === "pause") {
    for (const pause of pauses) {
      entries.push({ kind: "pause", id: pause.id, createdAt: pause.createdAt, pause });
    }
  }
  if (filter === "all" || filter === "slip-review") {
    for (const slipReview of slipReviews) {
      entries.push({ kind: "slip-review", id: slipReview.id, createdAt: slipReview.createdAt, slipReview });
    }
  }

  return entries.sort(newestFirst);
}

export function countByKind({ checkIns, interventions, pauses = [], slipReviews }: HistorySource) {
  return {
    all: checkIns.length + interventions.length + pauses.length + slipReviews.length,
    "check-in": checkIns.length,
    protocol: interventions.length,
    pause: pauses.length,
    "slip-review": slipReviews.length,
  } satisfies Record<HistoryFilter, number>;
}

/** "Sat, Aug 2 · 11:42 PM" — local time, since the pattern map reasons in local hours too. */
export function formatEntryTimestamp(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "Unknown date";

  const day = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}
