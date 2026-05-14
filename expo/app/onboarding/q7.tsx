import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Home, User, Users, UsersRound } from "lucide-react-native";

import { Colors, Spacing } from "@/constants/theme";
import { OnboardingFooter, OnboardingHeader, OptionCard } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { progressFor } from "@/constants/onboardingSteps";
import { useOnboardingStore, type OnboardingAnswers } from "@/stores/onboardingStore";

type Household = NonNullable<OnboardingAnswers["q9_household"]>;

const HOUSEHOLD: { value: Household; label: string; Icon: typeof User }[] = [
  { value: "seul", label: "Juste moi", Icon: User },
  { value: "duo", label: "Deux", Icon: UsersRound },
  { value: "famille", label: "Une petite famille (3-4)", Icon: Home },
  { value: "plus", label: "Plus que ça", Icon: Users },
];

export default function Q7Screen() {
  const router = useRouter();
  const stored = useOnboardingStore((s) => s.q9_household);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);

  const [household, setHousehold] = useState<Household | null>(stored);

  const onContinue = () => {
    if (!household) return;
    setAnswer("q9_household", household);
    router.push("/onboarding/adjust-portions");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={progressFor("q7")} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={60}>
          <Text style={styles.title}>
            Pour <Text style={styles.titleEm}>combien de personnes</Text> ?
          </Text>
        </Reveal>
        <Reveal delay={140}>
          <Text style={styles.subtitle}>On adaptera les quantités automatiquement.</Text>
        </Reveal>

        <View style={styles.options}>
          {HOUSEHOLD.map((opt, i) => {
            const Icon = opt.Icon;
            const selected = household === opt.value;
            return (
              <Reveal key={opt.value} delay={260 + i * 80}>
                <OptionCard
                  label={opt.label}
                  selected={selected}
                  onPress={() => setHousehold(opt.value)}
                  leading={
                    <Icon
                      size={22}
                      color={selected ? Colors.terracotta : Colors.cacao}
                      strokeWidth={1.6}
                    />
                  }
                />
              </Reveal>
            );
          })}
        </View>
      </ScrollView>
      <OnboardingFooter disabled={household === null} onPress={onContinue} />
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
    fontSize: 26,
    color: Colors.encre,
    lineHeight: 34,
  },
  titleEm: {
    fontFamily: "Fraunces_400Regular_Italic",
    color: Colors.terracotta,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    marginTop: 8,
    lineHeight: 20,
  },
  options: {
    marginTop: 28,
    gap: 14,
  },
});
