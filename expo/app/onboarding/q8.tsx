import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, Spacing } from "@/constants/theme";
import { MultiOptionCard, OnboardingFooter, OnboardingHeader } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { progressFor } from "@/constants/onboardingSteps";
import { useOnboardingStore } from "@/stores/onboardingStore";

const NONE = "rien" as const;

const OPTIONS: { value: string; label: string }[] = [
  { value: NONE, label: "Rien de particulier" },
  { value: "vegetarien", label: "Végétarien·ne" },
  { value: "vegan", label: "Vegan" },
  { value: "sans_gluten", label: "Sans gluten" },
  { value: "sans_lactose", label: "Sans lactose" },
  { value: "autre", label: "Autre régime" },
];

export default function Q8Screen() {
  const router = useRouter();
  const stored = useOnboardingStore((s) => s.q8_restrictions);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const [selected, setSelected] = useState<string[]>(stored ?? []);

  const toggle = (value: string) => {
    setSelected((prev) => {
      if (value === NONE) {
        return prev.includes(NONE) ? [] : [NONE];
      }
      const without = prev.filter((v) => v !== NONE);
      return without.includes(value)
        ? without.filter((v) => v !== value)
        : [...without, value];
    });
  };

  const onContinue = () => {
    setAnswer("q8_restrictions", selected);
    router.push("/onboarding/q9-exclusions");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={progressFor("q8")} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={60}>
          <Text style={styles.title}>
            Des trucs qu&apos;on doit savoir côté assiette ?
          </Text>
        </Reveal>
        <Reveal delay={160}>
          <Text style={styles.subtitle}>
            Allergies, régimes, ce que tu ne manges pas. C&apos;est pour adapter ce qu&apos;on te montre.
          </Text>
        </Reveal>

        <View style={styles.options}>
          {OPTIONS.map((opt, i) => (
            <Reveal key={opt.value} delay={260 + i * 80}>
              <MultiOptionCard
                label={opt.label}
                selected={selected.includes(opt.value)}
                onPress={() => toggle(opt.value)}
              />
            </Reveal>
          ))}
        </View>
      </ScrollView>
      <OnboardingFooter disabled={selected.length === 0} onPress={onContinue} />
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
    lineHeight: 22,
  },
  options: {
    marginTop: 24,
    gap: 10,
  },
});
