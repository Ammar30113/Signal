import React from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/constants/theme";

export function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}

// Slow breathing-pace pulse (~4.4s cycle) for running timers. Sits at rest
// when inactive or when the user has Reduce Motion enabled.
export function Breathe({ active, children }: { active: boolean; children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const phase = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!active || reducedMotion) {
      phase.stopAnimation();
      Animated.timing(phase, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(phase, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(phase, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, phase, reducedMotion]);

  return (
    <Animated.View
      style={{
        opacity: phase.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] }),
        transform: [{ scale: phase.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function AppText({ style, ...props }: TextProps) {
  return (
    <Text
      selectable
      {...props}
      style={[{ color: theme.colors.text, fontSize: 15, lineHeight: 21 }, style]}
    />
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.screen,
          paddingTop: insets.top + 18,
          paddingBottom: 118,
          gap: 18,
        }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Header({
  eyebrow,
  title,
  detail,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      {eyebrow ? (
        <AppText
          style={{
            color: theme.colors.muted,
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </AppText>
      ) : null}
      <AppText style={{ fontSize: 38, lineHeight: 42, fontWeight: "800", letterSpacing: 0 }}>
        {title}
      </AppText>
      {detail ? <AppText style={{ color: theme.colors.textSoft, fontSize: 16 }}>{detail}</AppText> : null}
    </View>
  );
}

export function Card({
  children,
  style,
  accentColor,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
}) {
  return (
    <View
      accessible={false}
      accessibilityRole="none"
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: accentColor ?? theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.lg,
          borderCurve: "continuous",
          padding: theme.spacing.card,
          gap: 14,
          boxShadow: "0 18px 45px rgba(0, 0, 0, 0.24)",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <View accessible accessibilityRole="header" style={{ gap: 4 }}>
      <AppText
        style={{
          color: theme.colors.muted,
          fontSize: 12,
          fontWeight: "800",
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        {title}
      </AppText>
      {detail ? <AppText style={{ color: theme.colors.textSoft }}>{detail}</AppText> : null}
    </View>
  );
}

export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  tone = "secondary",
  disabled,
  style,
}: {
  label: string;
  onPress?: PressableProps["onPress"];
  tone?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    primary: {
      backgroundColor: theme.colors.gold,
      borderColor: theme.colors.gold,
      color: "#171104",
    },
    secondary: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.borderStrong,
      color: theme.colors.text,
    },
    danger: {
      backgroundColor: theme.colors.red,
      borderColor: theme.colors.red,
      color: theme.colors.white,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: theme.colors.border,
      color: theme.colors.text,
    },
  }[tone];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        {
          minHeight: 54,
          borderRadius: theme.radius.md,
          borderCurve: "continuous",
          borderWidth: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 18,
          opacity: disabled ? 0.44 : pressed ? 0.78 : 1,
          ...palette,
        },
        style,
      ]}
    >
      <AppText selectable={false} style={{ color: palette.color, fontWeight: "800", fontSize: 16 }}>{label}</AppText>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  onPress?: PressableProps["onPress"];
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}) {
  const content = (
    <AppText
      selectable={false}
      style={[
        {
          color: selected ? "#151008" : theme.colors.textSoft,
          fontSize: 13,
          fontWeight: "700",
        },
        textStyle,
      ]}
    >
      {label}
    </AppText>
  );

  if (!onPress) {
    return (
      <View
        style={[
          {
            alignSelf: "flex-start",
            borderRadius: theme.radius.pill,
            borderWidth: 1,
            borderColor: selected ? theme.colors.gold : theme.colors.border,
            backgroundColor: selected ? theme.colors.gold : theme.colors.surfaceMuted,
            paddingHorizontal: 12,
            paddingVertical: 8,
          },
          style,
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      // Chips render ~33pt tall; expand the touch area to ~44pt without
      // changing the visual size. Wrap/Row gaps are 10, so ±5 never overlaps
      // a neighboring chip's slop.
      hitSlop={{ top: 5, bottom: 5, left: 4, right: 4 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        {
          alignSelf: "flex-start",
          borderRadius: theme.radius.pill,
          borderWidth: 1,
          borderColor: selected ? theme.colors.gold : theme.colors.border,
          backgroundColor: selected ? theme.colors.gold : theme.colors.surfaceMuted,
          paddingHorizontal: 12,
          paddingVertical: 8,
          opacity: pressed ? 0.78 : 1,
        },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

export function Wrap({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>{children}</View>;
}

export function Metric({
  label,
  value,
  detail,
  accentColor,
}: {
  label: string;
  value: string;
  detail?: string;
  accentColor?: string;
}) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <AppText
        style={{
          color: theme.colors.muted,
          fontSize: 11,
          fontWeight: "800",
          letterSpacing: 2.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </AppText>
      <AppText
        style={{
          color: accentColor ?? theme.colors.text,
          fontSize: 28,
          lineHeight: 32,
          fontWeight: "800",
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </AppText>
      {detail ? <AppText style={{ color: theme.colors.textSoft, fontSize: 13 }}>{detail}</AppText> : null}
    </View>
  );
}

export function ProgressBar({
  value,
  color = theme.colors.gold,
}: {
  value: number;
  color?: string;
}) {
  return (
    <View
      style={{
        height: 8,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.surfaceMuted,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(100, value))}%`,
          borderRadius: theme.radius.pill,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
