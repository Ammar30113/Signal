import type {
  EmergencyAction,
  PatternInsight,
  RationalizationScript,
  RedirectAction,
  SignalSnapshot,
  Trigger,
} from "@/types/signal";

export const triggers: Trigger[] = [
  "Boredom",
  "Loneliness",
  "Late-night phone",
  "Purposeless scrolling",
  "Suggestive content",
  "Overwhelmed",
  "Morning without purpose",
  "Alone in bed",
  "Milestone reward logic",
];

export const moods = ["Clear", "Restless", "Flat", "Lonely", "Overloaded", "Charged"];

export const rationalizationScripts: RationalizationScript[] = [
  "One peek will not hurt",
  "I earned it",
  "I will restart tomorrow",
  "Soft content does not count",
  "Just for today",
  "I only need a minute",
  "I need to release the heat",
];

export const emergencyActions: EmergencyAction[] = [
  "Walk outside",
  "Cold shower",
  "Pushups",
  "Leave the room",
  "Sleep",
  "Read",
  "Journal",
  "Intentional non-porn release",
];

export const redirectActions: RedirectAction[] = [
  {
    id: "walk",
    title: "Walk without phone",
    detail: "Change state before thinking through it.",
    duration: "12 min",
  },
  {
    id: "body",
    title: "Body reset",
    detail: "Pushups, cold water, clean shirt, light on.",
    duration: "6 min",
  },
  {
    id: "structure",
    title: "Return to structure",
    detail: "Pick the next visible task. Make it small.",
    duration: "3 min",
  },
];

export const initialSnapshot: SignalSnapshot = {
  currentState: "yellow",
  intensity: 34,
  riskScore: 42,
  trend: "rising",
  topTrigger: "Purposeless scrolling",
  progressDays: 8,
  lastCheckInSummary: "Drift detected. Interrupt early. Do not negotiate.",
};

export const patternInsights: PatternInsight[] = [
  {
    id: "trigger-scroll",
    kind: "trigger",
    title: "Purposeless scrolling",
    detail: "Usually starts as harmless browsing, then turns visual.",
    weight: 82,
  },
  {
    id: "state-lonely",
    kind: "state",
    title: "Lonely but calling it horny",
    detail: "The body asks for novelty when the real signal is isolation.",
    weight: 76,
  },
  {
    id: "cue-bed",
    kind: "cue",
    title: "Phone in bed",
    detail: "The highest-risk context is alone, horizontal, and unstructured.",
    weight: 89,
  },
  {
    id: "script-earned",
    kind: "script",
    title: "I earned it",
    detail: "Reward logic appears after stress or milestone days.",
    weight: 71,
  },
  {
    id: "time-window",
    kind: "time",
    title: "10:40 PM - 12:15 AM",
    detail: "Energy drops, privacy rises, friction disappears.",
    weight: 84,
  },
  {
    id: "milestone",
    kind: "milestone",
    title: "Day 7 / 14 / 21",
    detail: "Progress can create permission-seeking. Watch reward bargaining.",
    weight: 68,
  },
];

export const escalationPath = [
  "Initial stimulation",
  "Visual curiosity",
  "Scrolling",
  "Fantasy increase",
  "Bargaining",
  "Hovering",
  "Total engagement",
  "Short relief",
  "Fog and depletion",
];

export const identitySections = [
  {
    title: "Why I am doing this",
    body: "Protect focus, self-respect, and the ability to choose real life when novelty is available.",
  },
  {
    title: "Who I am becoming",
    body: "A man who notices the signal early, moves cleanly, and does not outsource discipline to mood.",
  },
  {
    title: "What this protects",
    body: "Body, work, intimacy, confidence, charisma, and momentum that compounds quietly.",
  },
];
