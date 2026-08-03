import type {
  EmergencyAction,
  IdentityProfile,
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

// Starting point for the Identity tab. Seeded on first launch so the screen is
// never empty, then edited by the user into their own words.
export const defaultIdentity: IdentityProfile = {
  why: "Protect focus, clarity, and the ability to choose long-term value over short-term impulse.",
  becoming:
    "Someone who notices the signal early, interrupts the pattern, and builds systems instead of relying on willpower.",
  protects: "Energy, time, relationships, self-respect, and the momentum that compounds when you stay consistent.",
  values: ["Focus", "Energy", "Time", "Relationships", "Self-respect"],
};

export const identityPrompts = {
  why: { title: "Why I am doing this", hint: "The reason that still holds at 1am." },
  becoming: { title: "Who I am becoming", hint: "Describe the person, not the streak." },
  protects: { title: "What this protects", hint: "Name what is actually at stake." },
} as const;
