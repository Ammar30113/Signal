import React from "react";
import { Alert, FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Button, Card, Chip, Header, Row, SectionTitle, Wrap } from "@/components/ui";
import { stateTheme, theme } from "@/constants/theme";
import { useSignal } from "@/context/signal-store";
import {
  buildHistoryTimeline,
  countByKind,
  formatEntryTimestamp,
  historyFilters,
  type HistoryEntry,
  type HistoryFilter,
} from "@/utils/history";

function Field({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;

  return (
    <View style={{ gap: 3 }}>
      <AppText
        style={{
          color: theme.colors.muted,
          fontSize: 11,
          fontWeight: "800",
          letterSpacing: 1.8,
          textTransform: "uppercase",
        }}
      >
        {label}
      </AppText>
      <AppText style={{ color: theme.colors.textSoft, fontSize: 15, lineHeight: 22 }}>{value.trim()}</AppText>
    </View>
  );
}

function EntryHeader({
  title,
  when,
  accentColor,
  onDelete,
}: {
  title: string;
  when: string;
  accentColor?: string;
  onDelete: () => void;
}) {
  return (
    <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
      <View style={{ flex: 1, gap: 3 }}>
        <AppText style={{ fontSize: 17, fontWeight: "800", color: accentColor ?? theme.colors.text }}>{title}</AppText>
        <AppText style={{ color: theme.colors.muted, fontSize: 12.5 }}>{when}</AppText>
      </View>
      <Button
        label="Delete"
        tone="ghost"
        onPress={onDelete}
        style={{ minHeight: 44, paddingHorizontal: 14 }}
      />
    </Row>
  );
}

function HistoryCard({ entry, onDelete }: { entry: HistoryEntry; onDelete: () => void }) {
  const when = formatEntryTimestamp(entry.createdAt);

  if (entry.kind === "check-in") {
    const { answer, result } = entry.checkIn;
    const state = stateTheme[result.state];
    const cues = [
      answer.hasScrolled ? "Scrolling" : null,
      answer.exposedToContent ? "Exposed to content" : null,
      answer.bargainingThoughts ? "Bargaining" : null,
    ].filter((cue): cue is string => cue !== null);

    return (
      <Card accentColor={state.accent}>
        <EntryHeader title="Check-in" when={when} onDelete={onDelete} />
        <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
          <AppText style={{ color: state.accent, fontSize: 26, fontWeight: "900", lineHeight: 30 }}>
            {state.label}
          </AppText>
          <AppText style={{ color: theme.colors.muted, fontSize: 16, fontWeight: "800" }}>
            {result.riskScore}%
          </AppText>
        </Row>
        <Wrap>
          <Chip label={answer.mood} />
          <Chip label={answer.trigger} selected />
          <Chip label={`Intensity ${answer.intensity}`} />
        </Wrap>
        {cues.length > 0 ? (
          <Wrap>
            {cues.map((cue) => (
              <Chip key={cue} label={cue} />
            ))}
          </Wrap>
        ) : null}
        <AppText style={{ color: theme.colors.textSoft }}>{result.summary}</AppText>
      </Card>
    );
  }

  if (entry.kind === "protocol") {
    const session = entry.protocol;
    const after = session.intensityAfter ?? session.intensityBefore;
    const drop = Math.max(0, session.intensityBefore - after);

    return (
      <Card accentColor={session.completed ? theme.colors.green : theme.colors.border}>
        <EntryHeader title="SOS protocol" when={when} onDelete={onDelete} />
        <Wrap>
          <Chip label={session.selectedAction} selected />
          <Chip label={session.trigger} />
          <Chip label={session.emotion} />
          <Chip label={`${Math.round(session.durationSeconds / 60)} min`} />
        </Wrap>
        <Row style={{ gap: 8 }}>
          <AppText style={{ color: theme.colors.textSoft, fontSize: 15 }}>
            Intensity {session.intensityBefore} → {after}
          </AppText>
          {drop > 0 ? (
            <AppText style={{ color: theme.colors.green, fontWeight: "900", fontSize: 15 }}>-{drop}</AppText>
          ) : null}
        </Row>
        <Field label="Reflection" value={session.reflection ?? ""} />
      </Card>
    );
  }

  if (entry.kind === "pause") {
    const pause = entry.pause;

    return (
      <Card accentColor={theme.colors.gold}>
        <EntryHeader title="Pause" when={when} onDelete={onDelete} />
        <Wrap>
          <Chip label={`${pause.durationSeconds}s`} selected />
          <Chip label={pause.completed ? "Waited it out" : "Cut it short"} />
        </Wrap>
        <AppText style={{ color: theme.colors.textSoft }}>Moved into: {pause.redirectTitle}</AppText>
      </Card>
    );
  }

  const review = entry.slipReview;
  const state = stateTheme[review.state];

  return (
    <Card accentColor={theme.colors.red}>
      <EntryHeader title="Slip review" when={when} onDelete={onDelete} />
      <Wrap>
        <Chip label={state.label} />
        <Chip label={review.trigger} selected />
        <Chip label={review.rationalization} />
      </Wrap>
      <Field label="First wrong turn" value={review.firstWrongTurn} />
      <Field label="Earlier interruption" value={review.earlierInterruption} />
      <Field label="Next 24 hours" value={review.next24Hours} />
    </Card>
  );
}

export default function HistoryScreen() {
  const { checkIns, interventions, pauses, slipReviews, deleteHistoryEntry } = useSignal();
  const [filter, setFilter] = React.useState<HistoryFilter>("all");
  const insets = useSafeAreaInsets();

  const source = React.useMemo(
    () => ({ checkIns, interventions, pauses, slipReviews }),
    [checkIns, interventions, pauses, slipReviews],
  );
  const counts = React.useMemo(() => countByKind(source), [source]);
  const timeline = React.useMemo(() => buildHistoryTimeline(source, filter), [source, filter]);

  const confirmDelete = React.useCallback(
    (entry: HistoryEntry) => {
      const label =
        entry.kind === "check-in"
          ? "this check-in"
          : entry.kind === "protocol"
            ? "this SOS protocol"
            : entry.kind === "pause"
              ? "this pause"
              : "this slip review";

      Alert.alert(
        "Delete entry?",
        `This removes ${label} from this device and from your pattern map. It cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteHistoryEntry(entry.kind, entry.id) },
        ],
      );
    },
    [deleteHistoryEntry],
  );

  const renderItem = React.useCallback(
    ({ item }: { item: HistoryEntry }) => <HistoryCard entry={item} onDelete={() => confirmDelete(item)} />,
    [confirmDelete],
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.screen,
        paddingTop: 12,
        paddingBottom: insets.bottom + 48,
        gap: 14,
      }}
      contentInsetAdjustmentBehavior="automatic"
      data={timeline}
      keyExtractor={(item) => `${item.kind}-${item.id}`}
      renderItem={renderItem}
      // Histories can run to thousands of entries; keep the window small so
      // scrolling stays smooth on older devices. Deliberately not using
      // removeClippedSubviews — it still causes blank rows on iOS, and this
      // list is the one place a user reads their own words back.
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 4 }}>
          <Header
            eyebrow="History"
            title="Everything you logged."
            detail="Read back your own entries, and remove any that do not belong. Deleting one also removes it from the pattern map."
          />
          <Wrap>
            {historyFilters.map((option) => (
              <Chip
                key={option.value}
                label={`${option.label} ${counts[option.value]}`}
                selected={filter === option.value}
                onPress={() => setFilter(option.value)}
                accessibilityLabel={`${option.label}, ${counts[option.value]} entries`}
              />
            ))}
          </Wrap>
        </View>
      }
      ListEmptyComponent={
        <Card>
          <SectionTitle title={counts.all === 0 ? "Nothing logged yet" : "Nothing of this kind yet"} />
          <AppText style={{ color: theme.colors.textSoft }}>
            {counts.all === 0
              ? "Run a check-in, take a pause, or complete an SOS protocol and it will show up here."
              : "Switch the filter above to see the entries you do have."}
          </AppText>
        </Card>
      }
    />
  );
}
