import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, Spacing } from "@/constants/theme";
import {
  MultiOptionCard,
  OnboardingFooter,
  OnboardingHeader,
} from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { useOnboardingStore } from "@/stores/onboardingStore";

const OPTIONS: { value: string; label: string }[] = [
  { value: "eparpillees", label: "Mes recettes sont éparpillées partout" },
  { value: "inspiration_soir", label: "Je sais jamais quoi cuisiner le soir" },
  { value: "ingredients", label: "J'ai jamais les bons ingrédients" },
  { value: "etapes", label: "Trop d'étapes, ça me décourage" },
  { value: "refais_memes", label: "Je refais toujours les mêmes plats" },
  { value: "my_mettre", label: "J'arrive juste pas à m'y mettre" },
];

const BLOCKER_NORMALIZED: Record<string, string> = {
  eparpillees: "eparpillees",
  inspiration_soir: "sais-pas-quoi",
  ingredients: "mauvais-ingredients",
  etapes: "trop-etapes",
  refais_memes: "memes-plats",
  my_mettre: "pas-y-mettre",
};

export default function Q11Screen() {
  const router = useRouter();
  const stored = useOnboardingStore((s) => s.q11_frictions);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const [selected, setSelected] = useState<string[]>(stored ?? []);

  const toggle = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const onContinue = () => {
    if (selected.length === 0) return;
    setAnswer("q11_frictions", selected);
    setAnswer("blockers", selected.map((v) => BLOCKER_NORMALIZED[v] ?? v));
    router.push("/onboarding/q11b-profile");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={10 / 12} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={60}>
          <Text style={styles.title}>
            Qu&apos;est-ce qui te freine, vraiment&nbsp;?
          </Text>
        </Reveal>
        <Reveal delay={160}>
          <Text style={styles.subtitle}>
            Coche tout ce qui te parle. On juge pas.
          </Text>
        </Reveal>

        <View style={styles.options}>
          {OPTIONS.map((opt, i) => (
            <Reveal key={opt.value} delay={260 + i * 90}>
              <MultiOptionCard
                label={opt.label}
                selected={selected.includes(opt.value)}
                onPress={() => toggle(opt.value)}
              />
            </Reveal>
          ))}
        </View>
      </ScrollView>
      <OnboardingFooter
        disabled={selected.length === 0}
        onPress={onContinue}
      />
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
    marginTop: 24,
    gap: 12,
  },
});
