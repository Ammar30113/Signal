export type UrgeState = "green" | "yellow" | "red";

export type RiskTrend = "falling" | "stable" | "rising";

export type EntitlementPlan = "free" | "pro";

export type Trigger =
  | "Boredom"
  | "Loneliness"
  | "Late-night phone"
  | "Purposeless scrolling"
  | "Stress or overwhelm"
  | "After a win or milestone"
  | "Morning without structure"
  | "Alone and unstructured"
  | "Social media"
  | "Emotional numbness";

export type RationalizationScript =
  | "Just this once"
  | "I earned it"
  | "I will start fresh tomorrow"
  | "It is not that serious"
  | "Just for today"
  | "I only need a minute"
  | "I deserve a break";

export type EmotionalDriver = "emotional-need" | "surface-craving" | "mixed" | "unclear";

export type EmergencyAction =
  | "Walk outside"
  | "Cold water on face"
  | "Pushups"
  | "Leave the room"
  | "Call or text someone"
  | "Read something"
  | "Write it down"
  | "Sleep";

export type PatternInsightKind =
  | "trigger"
  | "state"
  | "cue"
  | "vulnerability"
  | "script"
  | "time"
  | "milestone"
  | "action";

export interface PatternInsight {
  id: string;
  kind: PatternInsightKind;
  title: string;
  detail: string;
  weight: number;
}

export interface RedirectAction {
  id: string;
  title: string;
  detail: string;
  duration: string;
}

export type RedirectActionInput = Omit<RedirectAction, "id">;

export interface CheckInAnswer {
  mood: string;
  intensity: number; // 0-100
  trigger: Trigger;
  emotionalDriver: EmotionalDriver;
  hasScrolled: boolean;
  exposedToContent: boolean;
  bargainingThoughts: boolean;
}

export interface CheckInResult {
  state: UrgeState;
  riskScore: number;
  summary: string;
  nextStep: string;
}

export interface CheckInEntry {
  id: string;
  createdAt: string;
  answer: CheckInAnswer;
  result: CheckInResult;
}

export interface TriggerProfile {
  trigger: Trigger;
  count: number;
  averageRisk: number;
  lastSeenAt?: string;
}

export interface InterventionSession {
  id: string;
  createdAt: string;
  completedAt?: string;
  durationSeconds: number;
  selectedAction: EmergencyAction;
  emotion: string;
  trigger: Trigger;
  intensityBefore: number;
  intensityAfter?: number;
  reflection?: string;
  completed: boolean;
}

/**
 * A lightweight, fast urge interruption — the tier below the full SOS protocol.
 * Deliberately minimal: it records the wait length and the single redirect the
 * user committed to, not mood/trigger/intensity. The payoff is the redirect, not
 * analysis, so a pause stays a few taps rather than a whole reflection.
 */
export interface PauseSession {
  id: string;
  createdAt: string;
  durationSeconds: number;
  redirectId: string;
  redirectTitle: string;
  completed: boolean;
}

export interface SlipReview {
  id: string;
  createdAt: string;
  firstWrongTurn: string;
  trigger: Trigger;
  rationalization: RationalizationScript;
  state: UrgeState;
  earlierInterruption: string;
  next24Hours: string;
}

export interface SignalSnapshot {
  currentState: UrgeState;
  intensity: number;
  riskScore: number;
  trend: RiskTrend;
  topTrigger: Trigger;
  progressDays: number;
  lastCheckInSummary: string;
}

export interface PatternAggregate {
  insights: PatternInsight[];
  topTriggers: TriggerProfile[];
  emotionTriggerPairs: Array<{
    emotion: string;
    trigger: Trigger;
    count: number;
  }>;
  topRationalizations: Array<{
    script: RationalizationScript;
    count: number;
  }>;
  successfulRedirectActions: Array<{
    action: EmergencyAction;
    count: number;
    averageDrop: number;
  }>;
  dangerWindows: Array<{
    label: string;
    count: number;
  }>;
  milestoneDangerDays: number[];
  totals: {
    checkIns: number;
    interventions: number;
    completedInterventions: number;
    pauses: number;
    slipReviews: number;
  };
}

export interface WeeklyReview {
  startedAt: string;
  endedAt: string;
  headline: string;
  focus: string;
  totalSignals: number;
  totals: PatternAggregate["totals"];
  topTrigger?: TriggerProfile;
  topDangerWindow?: {
    label: string;
    count: number;
  };
  bestRedirect?: {
    action: EmergencyAction;
    count: number;
    averageDrop: number;
  };
}

export interface UserSettings {
  hasCompletedOnboarding: boolean;
  appLockEnabled: boolean;
  protocolDurationSeconds: number;
  pauseDurationSeconds: number;
  highRiskRemindersEnabled: boolean;
  weeklyDigestEnabled: boolean;
  /**
   * How many times the App Store review sheet has been requested. iOS silently
   * caps prompts at 3 per year, so we ask at widening milestones rather than
   * once per install — see REVIEW_PROMPT_MILESTONES.
   */
  reviewPromptAttempts: number;
  lastReviewPromptedAt?: string;
}

export interface Entitlement {
  plan: EntitlementPlan;
  source: "local" | "revenuecat";
  lastCheckedAt?: string;
  expiresAt?: string;
}

/**
 * What the user is doing this for, in their own words. Seeded with Signal's
 * default copy so the screen is never blank, then edited into something
 * personal — the point of the Identity tab is that it is theirs, not ours.
 *
 * This is user content, not device configuration, so unlike `settings` it IS
 * restored by an import.
 */
export interface IdentityProfile {
  why: string;
  becoming: string;
  protects: string;
  /** Short labels for what this is protecting — rendered as chips. */
  values: string[];
}

export const IDENTITY_TEXT_LIMIT = 280;
export const IDENTITY_VALUE_LIMIT = 24;
export const IDENTITY_MAX_VALUES = 12;

/**
 * Everything Signal keeps on the device. Lives here rather than in utils/storage
 * so the pure import/merge logic can be tested without pulling in the SQLite
 * localStorage shim, which cannot load outside the app runtime.
 */
export interface SignalPersistedState {
  snapshot: SignalSnapshot;
  checkIns: CheckInEntry[];
  interventions: InterventionSession[];
  pauses: PauseSession[];
  slipReviews: SlipReview[];
  customRedirects: RedirectAction[];
  identity: IdentityProfile;
  settings: UserSettings;
  entitlement: Entitlement;
}

export interface ImportSummary {
  checkIns: number;
  interventions: number;
  pauses: number;
  slipReviews: number;
  customRedirects: number;
  /** Entries dropped because they did not survive validation. */
  skipped: number;
}
