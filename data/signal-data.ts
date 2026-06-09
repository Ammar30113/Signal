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
  "Stress or overwhelm",
  "After a win or milestone",
  "Morning without structure",
  "Alone and unstructured",
  "Social media",
  "Emotional numbness",
];

export const moods = ["Clear", "Restless", "Flat", "Lonely", "Overloaded", "Charged"];

export const rationalizationScripts: RationalizationScript[] = [
  "Just this once",
  "I earned it",
  "I will start fresh tomorrow",
  "It is not that serious",
  "Just for today",
  "I only need a minute",
  "I deserve a break",
];

export const emergencyActions: EmergencyAction[] = [
  "Walk outside",
  "Cold water on face",
  "Pushups",
  "Leave the room",
  "Call or text someone",
  "Read something",
  "Write it down",
  "Sleep",
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
  currentState: "green",
  intensity: 0,
  riskScore: 0,
  trend: "stable",
  topTrigger: "Purposeless scrolling",
  progressDays: 0,
  lastCheckInSummary: "Run your first check-in to calibrate your signal.",
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
  "Initial trigger",
  "Curiosity or pull",
  "Browsing or hovering",
  "Rationalization begins",
  "Bargaining with yourself",
  "Giving in feels inevitable",
  "The act",
  "Brief relief",
  "Fog, regret, or depletion",
];

export const identitySections = [
  {
    title: "Why I am doing this",
    body: "Protect focus, clarity, and the ability to choose long-term value over short-term impulse.",
  },
  {
    title: "Who I am becoming",
    body: "Someone who notices the signal early, interrupts the pattern, and builds systems instead of relying on willpower.",
  },
  {
    title: "What this protects",
    body: "Energy, time, relationships, self-respect, and the momentum that compounds when you stay consistent.",
  },
];
