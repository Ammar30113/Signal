import type { UrgeState } from "@/types/signal";

export const theme = {
  colors: {
    background: "#08090D",
    backgroundSoft: "#0D0F15",
    surface: "#111219",
    surfaceRaised: "#171922",
    surfaceMuted: "#1E212B",
    border: "#2B2E38",
    borderStrong: "#454957",
    text: "#F5F4F0",
    textSoft: "#C7C4BD",
    muted: "#8A8D99",
    mutedDark: "#5D606A",
    gold: "#F5C24B",
    green: "#73D48A",
    red: "#F43F4B",
    orange: "#FF8A4C",
    blue: "#78A6FF",
    white: "#FFFFFF",
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    pill: 999,
  },
  spacing: {
    screen: 20,
    card: 18,
  },
};

export const stateTheme: Record<
  UrgeState,
  {
    label: string;
    accent: string;
    background: string;
    copy: string;
    note: string;
  }
> = {
  green: {
    label: "Green",
    accent: theme.colors.green,
    background: "rgba(115, 212, 138, 0.12)",
    copy: "Clear. Stable. Focused.",
    note: "You are not seeking stimulation. Keep structure visible.",
  },
  yellow: {
    label: "Yellow",
    accent: theme.colors.gold,
    background: "rgba(245, 194, 75, 0.13)",
    copy: "Restless. Lingering. Quiet bargaining beginning.",
    note: "Interrupt early. Do not argue with the signal.",
  },
  red: {
    label: "Red",
    accent: theme.colors.red,
    background: "rgba(244, 63, 75, 0.14)",
    copy: "Searching. Revisiting. Isolation with device.",
    note: "Move first. Think second. Distance beats willpower here.",
  },
};
