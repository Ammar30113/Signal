import { emergencyActions, rationalizationScripts, triggers } from "@/data/signal-data";
import type {
  CheckInEntry,
  IdentityProfile,
  ImportSummary,
  InterventionSession,
  PauseSession,
  RedirectAction,
  SignalPersistedState,
  SlipReview,
  Trigger,
  UrgeState,
} from "@/types/signal";
import { sanitizeIdentity } from "@/utils/identity";

// Reading an export back in. Signal has no account and no server, so this file
// is the only way a user's history survives a new phone — which also means it is
// the only untrusted input the app ever parses. Everything here is defensive:
// malformed entries are dropped one by one rather than failing the whole import,
// so a partially corrupted file still restores what is intact.

const urgeStates: UrgeState[] = ["green", "yellow", "red"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIntensity(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function parseCheckIn(raw: unknown): CheckInEntry | null {
  if (!isRecord(raw) || !isNonEmptyString(raw.id) || !isIsoDate(raw.createdAt)) return null;
  const { answer, result } = raw;
  if (!isRecord(answer) || !isRecord(result)) return null;
  if (!oneOf(answer.trigger, triggers) || !isIntensity(answer.intensity)) return null;
  if (!oneOf(result.state, urgeStates) || !isIntensity(result.riskScore)) return null;

  return {
    id: raw.id,
    createdAt: raw.createdAt,
    answer: {
      mood: isNonEmptyString(answer.mood) ? answer.mood : "Restless",
      intensity: Math.round(answer.intensity),
      trigger: answer.trigger,
      emotionalDriver: oneOf(answer.emotionalDriver, ["emotional-need", "surface-craving", "mixed", "unclear"] as const)
        ? answer.emotionalDriver
        : "unclear",
      hasScrolled: answer.hasScrolled === true,
      exposedToContent: answer.exposedToContent === true,
      bargainingThoughts: answer.bargainingThoughts === true,
    },
    result: {
      state: result.state,
      riskScore: Math.round(result.riskScore),
      summary: isNonEmptyString(result.summary) ? result.summary : "Imported check-in.",
      nextStep: isNonEmptyString(result.nextStep) ? result.nextStep : "Keep structure visible.",
    },
  };
}

function parseIntervention(raw: unknown): InterventionSession | null {
  if (!isRecord(raw) || !isNonEmptyString(raw.id) || !isIsoDate(raw.createdAt)) return null;
  if (!oneOf(raw.trigger, triggers) || !oneOf(raw.selectedAction, emergencyActions)) return null;
  if (!isIntensity(raw.intensityBefore)) return null;

  return {
    id: raw.id,
    createdAt: raw.createdAt,
    completedAt: isIsoDate(raw.completedAt) ? raw.completedAt : undefined,
    durationSeconds: typeof raw.durationSeconds === "number" && raw.durationSeconds >= 0 ? raw.durationSeconds : 600,
    selectedAction: raw.selectedAction,
    emotion: isNonEmptyString(raw.emotion) ? raw.emotion : "Restless",
    trigger: raw.trigger,
    intensityBefore: Math.round(raw.intensityBefore),
    intensityAfter: isIntensity(raw.intensityAfter) ? Math.round(raw.intensityAfter) : undefined,
    reflection: typeof raw.reflection === "string" ? raw.reflection : undefined,
    completed: raw.completed === true,
  };
}

function parsePause(raw: unknown): PauseSession | null {
  if (!isRecord(raw) || !isNonEmptyString(raw.id) || !isIsoDate(raw.createdAt)) return null;
  if (!isNonEmptyString(raw.redirectTitle)) return null;

  return {
    id: raw.id,
    createdAt: raw.createdAt,
    durationSeconds: typeof raw.durationSeconds === "number" && raw.durationSeconds >= 0 ? raw.durationSeconds : 60,
    redirectId: isNonEmptyString(raw.redirectId) ? raw.redirectId : "imported",
    redirectTitle: raw.redirectTitle,
    completed: raw.completed === true,
  };
}

function parseSlipReview(raw: unknown): SlipReview | null {
  if (!isRecord(raw) || !isNonEmptyString(raw.id) || !isIsoDate(raw.createdAt)) return null;
  if (!oneOf(raw.trigger, triggers) || !oneOf(raw.rationalization, rationalizationScripts)) return null;

  return {
    id: raw.id,
    createdAt: raw.createdAt,
    firstWrongTurn: typeof raw.firstWrongTurn === "string" ? raw.firstWrongTurn : "",
    trigger: raw.trigger,
    rationalization: raw.rationalization,
    state: oneOf(raw.state, urgeStates) ? raw.state : "yellow",
    earlierInterruption: typeof raw.earlierInterruption === "string" ? raw.earlierInterruption : "",
    next24Hours: typeof raw.next24Hours === "string" ? raw.next24Hours : "",
  };
}

function parseRedirect(raw: unknown): RedirectAction | null {
  if (!isRecord(raw) || !isNonEmptyString(raw.id)) return null;
  if (!isNonEmptyString(raw.title) || !isNonEmptyString(raw.detail) || !isNonEmptyString(raw.duration)) return null;

  return {
    id: raw.id,
    title: raw.title.trim().slice(0, 56),
    detail: raw.detail.trim().slice(0, 140),
    duration: raw.duration.trim().slice(0, 20),
  };
}

function parseList<T>(raw: unknown, parse: (entry: unknown) => T | null) {
  if (!Array.isArray(raw)) return { items: [] as T[], skipped: 0 };
  let skipped = 0;
  const items: T[] = [];
  for (const entry of raw) {
    const parsed = parse(entry);
    if (parsed) items.push(parsed);
    else skipped += 1;
  }
  return { items, skipped };
}

export interface ParsedImport {
  checkIns: CheckInEntry[];
  interventions: InterventionSession[];
  pauses: PauseSession[];
  slipReviews: SlipReview[];
  customRedirects: RedirectAction[];
  /**
   * Present only when the file carried one. Identity is user content, so unlike
   * settings and entitlement it does travel with an import — but it is applied
   * only if the file actually had it, so a partial export never wipes what is
   * already written on this device.
   */
  identity?: IdentityProfile;
  skipped: number;
}

/**
 * Parse an exported Signal file. Returns null only when the payload is not
 * recognisable as a Signal export at all; a file that parses but contains no
 * usable entries comes back with empty lists so the caller can say so plainly.
 */
export function parseSignalImport(raw: string): ParsedImport | null {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(payload)) return null;

  // Signal's own exports carry app: "Signal". Anything else has to at least
  // look like one — otherwise we would happily "import" an unrelated JSON file.
  const looksLikeSignal =
    payload.app === "Signal" ||
    ["checkIns", "interventions", "pauses", "slipReviews", "customRedirects"].some((key) => Array.isArray(payload[key]));
  if (!looksLikeSignal) return null;

  const checkIns = parseList(payload.checkIns, parseCheckIn);
  const interventions = parseList(payload.interventions, parseIntervention);
  const pauses = parseList(payload.pauses, parsePause);
  const slipReviews = parseList(payload.slipReviews, parseSlipReview);
  const customRedirects = parseList(payload.customRedirects, parseRedirect);

  return {
    checkIns: checkIns.items,
    interventions: interventions.items,
    pauses: pauses.items,
    slipReviews: slipReviews.items,
    customRedirects: customRedirects.items,
    identity: isRecord(payload.identity) ? sanitizeIdentity(payload.identity) : undefined,
    skipped:
      checkIns.skipped + interventions.skipped + pauses.skipped + slipReviews.skipped + customRedirects.skipped,
  };
}

function newestFirst<T extends { createdAt: string }>(entries: T[]) {
  return [...entries].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

/**
 * Union an import into what is already on the device, keeping the entry already
 * present whenever ids collide. Importing the same file twice is therefore a
 * no-op rather than a way to double your history.
 */
function unionById<T extends { id: string; createdAt: string }>(current: T[], incoming: T[]) {
  const byId = new Map(current.map((entry) => [entry.id, entry]));
  let added = 0;
  for (const entry of incoming) {
    if (byId.has(entry.id)) continue;
    byId.set(entry.id, entry);
    added += 1;
  }
  return { merged: newestFirst([...byId.values()]), added };
}

export function mergeSignalImport(
  current: SignalPersistedState,
  incoming: ParsedImport,
): { state: SignalPersistedState; summary: ImportSummary } {
  const checkIns = unionById(current.checkIns, incoming.checkIns);
  const interventions = unionById(current.interventions, incoming.interventions);
  const pauses = unionById(current.pauses, incoming.pauses);
  const slipReviews = unionById(current.slipReviews, incoming.slipReviews);

  const redirectsById = new Map(current.customRedirects.map((entry) => [entry.id, entry]));
  let addedRedirects = 0;
  for (const redirect of incoming.customRedirects) {
    if (redirectsById.has(redirect.id)) continue;
    redirectsById.set(redirect.id, redirect);
    addedRedirects += 1;
  }

  return {
    state: {
      ...current,
      checkIns: checkIns.merged,
      interventions: interventions.merged,
      pauses: pauses.merged,
      slipReviews: slipReviews.merged,
      customRedirects: [...redirectsById.values()],
      // A merge keeps whatever the user has already written here; taking the
      // file's version would silently overwrite it.
      identity: current.identity,
    },
    summary: {
      checkIns: checkIns.added,
      interventions: interventions.added,
      pauses: pauses.added,
      slipReviews: slipReviews.added,
      customRedirects: addedRedirects,
      skipped: incoming.skipped,
    },
  };
}

/**
 * Replace local history outright. Settings and entitlement stay as they are on
 * this device — a restored backup should not silently flip App Lock off or hand
 * out a Pro plan the store has not confirmed.
 */
export function replaceWithImport(
  current: SignalPersistedState,
  incoming: ParsedImport,
): { state: SignalPersistedState; summary: ImportSummary } {
  return {
    state: {
      ...current,
      checkIns: newestFirst(incoming.checkIns),
      interventions: newestFirst(incoming.interventions),
      pauses: newestFirst(incoming.pauses),
      slipReviews: newestFirst(incoming.slipReviews),
      customRedirects: incoming.customRedirects,
      // Replace is the new-phone path, so the file's identity wins — but only
      // if it carried one. A file without it leaves this device's text alone.
      identity: incoming.identity ?? current.identity,
    },
    summary: {
      checkIns: incoming.checkIns.length,
      interventions: incoming.interventions.length,
      pauses: incoming.pauses.length,
      slipReviews: incoming.slipReviews.length,
      customRedirects: incoming.customRedirects.length,
      skipped: incoming.skipped,
    },
  };
}

export function summaryTotal(summary: ImportSummary) {
  return (
    summary.checkIns + summary.interventions + summary.pauses + summary.slipReviews + summary.customRedirects
  );
}
