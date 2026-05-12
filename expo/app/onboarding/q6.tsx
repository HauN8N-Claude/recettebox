import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, Spacing } from "@/constants/theme";
import { OnboardingFooter, OnboardingHeader, OptionCard } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { progressFor } from "@/constants/onboardingSteps";
import { useOnboardingStore, type OnboardingAnswers } from "@/stores/onboardingStore";

type Value = NonNullable<OnboardingAnswers["q6_frequency"]>;

const OPTIONS: { value: Value; label: string }[] = [
  { value: "jamais", label: "Quasiment jamais" },
  { value: "1-2", label: "1 à 2 fois" },
  { value: "3-5", label: "3 à 5 fois" },
  { value: "tousJours", label: "Presque tous les jours" },
];

export default function Q6Screen() {
  const router = useRouter();
  const stored = useOnboardingStore((s) => s.q6_frequency);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const [selected, setSelected] = useState<Value | null>(stored);

  const onContinue = () => {
    if (!selected) return;
    setAnswer("q6_frequency", selected);
    router.push("/onboarding/q7");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={progressFor("q6")} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={60}>
          <Text style={styles.title}>
            Tu cuisines vraiment combien de fois par semaine ?
          </Text>
        </Reveal>
        <Reveal delay={160}>
          <Text style={styles.subtitle}>
            Réchauffer un plat tout fait, ça compte pas.
          </Text>
        </Reveal>

        <View style={styles.options}>
          {OPTIONS.map((opt, i) => (
            <Reveal key={opt.value} delay={260 + i * 100}>
              <OptionCard
                label={opt.label}
                selected={selected === opt.value}
                onPress={() => setSelected(opt.value)}
              />
            </Reveal>
          ))}
        </View>
      </ScrollView>
      <OnboardingFooter disabled={!selected} onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  content: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 8,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 26,
    color: Colors.encre,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    marginTop: 6,
  },
  options: {
    marginTop: 28,
    gap: 12,
  },
});
