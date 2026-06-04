export type UrgeState = "green" | "yellow" | "red";

export type RiskTrend = "falling" | "stable" | "rising";

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
  | "milestone";

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
