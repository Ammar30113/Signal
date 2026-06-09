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
