import { NativeTabs } from "expo-router/unstable-native-tabs";

import { theme } from "@/constants/theme";

export default function TabLayout() {
  return (
    <NativeTabs tintColor={theme.colors.gold} backgroundColor={theme.colors.backgroundSoft}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: "gauge.open.with.lines.needle.33percent", selected: "gauge.open.with.lines.needle.33percent" }} md="dashboard" />
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="check-in">
        <NativeTabs.Trigger.Icon sf={{ default: "waveform.path.ecg", selected: "waveform.path.ecg" }} md="ecg_heart" />
        <NativeTabs.Trigger.Label>Check-In</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pattern">
        <NativeTabs.Trigger.Icon sf={{ default: "map", selected: "map.fill" }} md="map" />
        <NativeTabs.Trigger.Label>Pattern</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="identity">
        <NativeTabs.Trigger.Icon sf={{ default: "safari", selected: "safari.fill" }} md="explore" />
        <NativeTabs.Trigger.Label>Identity</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sos">
        <NativeTabs.Trigger.Icon sf={{ default: "exclamationmark.octagon", selected: "exclamationmark.octagon.fill" }} md="emergency_home" />
        <NativeTabs.Trigger.Label>SOS</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} md="settings" />
        <NativeTabs.Trigger.Label>Privacy</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
