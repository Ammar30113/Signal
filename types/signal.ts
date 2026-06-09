export type UrgeState = "green" | "yellow" | "red";

export type RiskTrend = "falling" | "stable" | "rising";

export type EntitlementPlan = "free" | "pro";

export type Trigger =
  | "Boredom"
  | "Loneliness"
  | "Late-night phone"
  | "Purposeless scrolling"
  | "Suggestive content"
  | "Overwhelmed"
  | "Morning without purpose"
  | "Alone in bed"
  | "Milestone reward logic";

export type RationalizationScript =
  | "One peek will not hurt"
  | "I earned it"
  | "I will restart tomorrow"
  | "Soft content does not count"
  | "Just for today"
  | "I only need a minute"
  | "I need to release the heat";

export type LonelinessSignal = "mostly-lonely" | "mostly-horny" | "mixed" | "unclear";

export type EmergencyAction =
  | "Walk outside"
  | "Cold shower"
  | "Pushups"
  | "Leave the room"
  | "Sleep"
  | "Read"
  | "Journal"
  | "Intentional non-porn release";

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

export interface CheckInAnswer {
  mood: string;
  intensity: number;
  trigger: Trigger;
  lonelinessSignal: LonelinessSignal;
  hasScrolled: boolean;
  suggestiveContent: boolean;
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
    slipReviews: number;
  };
}

export interface UserSettings {
  hasCompletedOnboarding: boolean;
  appLockEnabled: boolean;
  protocolDurationSeconds: number;
}

export interface Entitlement {
  plan: EntitlementPlan;
  source: "local" | "revenuecat";
  lastCheckedAt?: string;
  expiresAt?: string;
}
