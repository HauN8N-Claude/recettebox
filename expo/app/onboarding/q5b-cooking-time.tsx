import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ChefHat, Clock, Clock3, Zap } from "lucide-react-native";

import { Colors, Spacing } from "@/constants/theme";
import { OnboardingFooter, OnboardingHeader, OptionCard } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { progressFor } from "@/constants/onboardingSteps";
import { useOnboardingStore, type OnboardingAnswers } from "@/stores/onboardingStore";

type CookingTime = NonNullable<OnboardingAnswers["cookingTime"]>;

const OPTIONS: { value: CookingTime; label: string; Icon: typeof Zap }[] = [
  { value: "express", label: "Express, moins de 15 min", Icon: Zap },
  { value: "semaine", label: "Semaine type, 15 à 30 min", Icon: Clock },
  { value: "confort", label: "Confort, 30 min à 1h", Icon: Clock3 },
  { value: "afond", label: "À fond, plus d'1h", Icon: ChefHat },
];

export default function CookingTimeScreen() {
  const router = useRouter();
  const stored = useOnboardingStore((s) => s.cookingTime);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);

  const [selected, setSelected] = useState<CookingTime | null>(stored);

  const onContinue = () => {
    if (!selected) return;
    setAnswer("cookingTime", selected);
    router.push("/onboarding/q6");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={progressFor("q5b-cooking-time")} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={60}>
          <Text style={styles.title}>
            Combien de temps{"\n"}pour cuisiner ?
          </Text>
        </Reveal>
        <Reveal delay={140}>
          <Text style={styles.subtitle}>
            Par jour, en semaine. Le weekend on lâche les chiffres.
          </Text>
        </Reveal>

        <View style={styles.options}>
          {OPTIONS.map((opt, i) => {
            const Icon = opt.Icon;
            const isSelected = selected === opt.value;
            return (
              <Reveal key={opt.value} delay={260 + i * 80}>
                <OptionCard
                  label={opt.label}
                  selected={isSelected}
                  onPress={() => setSelected(opt.value)}
                  leading={
                    <Icon
                      size={22}
                      color={isSelected ? Colors.terracotta : Colors.cacao}
                      strokeWidth={1.6}
                    />
                  }
                />
              </Reveal>
            );
          })}
        </View>
      </ScrollView>
      <OnboardingFooter disabled={selected === null} onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  content: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 30,
    color: Colors.encre,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    marginTop: 10,
    lineHeight: 20,
  },
  options: {
    marginTop: 28,
    gap: 14,
  },
});
