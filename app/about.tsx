import { router } from "expo-router";
import React from "react";
import { View } from "react-native";

import { AppText, Button, Card, Chip, Header, Screen, SectionTitle, Wrap } from "@/components/ui";
import { theme } from "@/constants/theme";

export default function AboutScreen() {
  return (
    <Screen>
      <Header
        eyebrow="Our story"
        title="Why Signal exists."
        detail="Built from a real system that actually worked."
      />

      <Card accentColor={theme.colors.gold}>
        <SectionTitle title="The origin" />
        <View style={{ gap: 14 }}>
          <AppText style={{ color: theme.colors.textSoft, fontSize: 16, lineHeight: 26 }}>
            Signal started because I read a book that changed how I think about habits.
          </AppText>
          <AppText style={{ color: theme.colors.textSoft, fontSize: 16, lineHeight: 26 }}>
            The framework that clicked was simple: you don't break a habit by forcing yourself to stop. You break it by building a system.
          </AppText>
          <AppText style={{ color: theme.colors.textSoft, fontSize: 16, lineHeight: 26 }}>
            Identify the cue. Interrupt the routine. Redirect the reward. Make the pattern visible so it loses power over you.
          </AppText>
        </View>
      </Card>

      <Card>
        <SectionTitle title="The system that worked" />
        <View style={{ gap: 14 }}>
          <AppText style={{ color: theme.colors.textSoft, fontSize: 16, lineHeight: 26 }}>
            Like most people, porn had been part of my life at some point. I wasn't addicted — but I wanted to get rid of the pattern entirely. Not because of shame. Because I wanted to choose what gets my time and attention.
          </AppText>
          <AppText style={{ color: theme.colors.textSoft, fontSize: 16, lineHeight: 26 }}>
            After reading the book, I built a simple system for myself:
          </AppText>
        </View>
        <View style={{ gap: 10, paddingLeft: 4 }}>
          {[
            "Every time I felt an urge, I set a 10-minute timer.",
            "During those 10 minutes, I didn't try to fight it. I just didn't act on it.",
            "I started writing down what triggered the urge — time of day, mood, situation.",
            "I built a mind map of my cues and triggers.",
            "Eventually, the urges stopped coming.",
          ].map((step, index) => (
            <View key={step} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: index === 4 ? theme.colors.green : theme.colors.surfaceMuted,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 2,
                }}
              >
                <AppText style={{ fontWeight: "900", fontSize: 12 }}>{index + 1}</AppText>
              </View>
              <AppText style={{ color: theme.colors.textSoft, fontSize: 15, lineHeight: 23, flex: 1 }}>
                {step}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <SectionTitle title="Not just one habit" />
        <View style={{ gap: 14 }}>
          <AppText style={{ color: theme.colors.textSoft, fontSize: 16, lineHeight: 26 }}>
            The system works because it addresses how habits actually function — not with willpower or shame, but with awareness and interruption.
          </AppText>
          <AppText style={{ color: theme.colors.textSoft, fontSize: 16, lineHeight: 26 }}>
            Signal works for any pattern you want to break:
          </AppText>
        </View>
        <Wrap>
          {[
            "Porn",
            "Doom scrolling",
            "Social media",
            "Junk food",
            "Smoking",
            "Gambling",
            "Impulse buying",
            "Any cue-driven habit",
          ].map((item) => (
            <Chip key={item} label={item} />
          ))}
        </Wrap>
      </Card>

      <Card>
        <SectionTitle title="The habit-loop framework" detail="The system behind Signal." />
        <View style={{ gap: 10 }}>
          {[
            { label: "Cue", detail: "The trigger that starts the loop. Signal helps you name it." },
            { label: "Craving", detail: "The urge to act. The 10-minute timer interrupts it." },
            { label: "Response", detail: "The redirect action. Walk, write, move — anything but the old pattern." },
            { label: "Reward", detail: "The pattern map shows you it's working. That becomes the new reward." },
          ].map((step) => (
            <View key={step.label} style={{ gap: 4, paddingVertical: 6 }}>
              <AppText style={{ fontSize: 17, fontWeight: "800", color: theme.colors.gold }}>
                {step.label}
              </AppText>
              <AppText style={{ color: theme.colors.textSoft, fontSize: 15, lineHeight: 22 }}>
                {step.detail}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <Card accentColor={theme.colors.green}>
        <SectionTitle title="The promise" />
        <AppText style={{ color: theme.colors.textSoft, fontSize: 16, lineHeight: 26 }}>
          Signal will never use shame, surveillance, or fake streaks. It gives you a system. The system does the work. And when it works, you stop needing it.
        </AppText>
        <AppText style={{ color: theme.colors.muted, fontSize: 14, lineHeight: 22, fontStyle: "italic" }}>
          That's the goal — an app that makes itself unnecessary.
        </AppText>
      </Card>

      <Button label="Back" tone="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
