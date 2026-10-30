import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Instagram, Music2 } from "lucide-react-native";

import { Colors, Spacing } from "@/constants/theme";
import { OnboardingFooter, OnboardingHeader } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";

// 3ᵉ piste MVP (29/10/2026) : remplace la démo simulée (demo-a*/b*/c*, conservées
// sur le disque mais hors routing). Un seul écran qui enseigne le vrai geste, puis
// le paywall. Le 1er import réel se fait ensuite depuis l'écran d'accueil (état vide).
const STEPS = [
  {
    n: "1",
    title: "Ouvre un Reel ou une vidéo TikTok",
    body: "Une recette qui te fait envie, sur Instagram ou TikTok.",
  },
  {
    n: "2",
    title: "Appuie sur « Partager »",
    body: "Le bouton de partage, comme pour l'envoyer à un ami.",
  },
  {
    n: "3",
    title: "Choisis RecetteBox",
    body: "On extrait les ingrédients et les étapes. Tu n'as rien à recopier.",
  },
] as const;

export default function PromiseScreen() {
  const router = useRouter();

  const onContinue = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    router.push("/onboarding/paywall-compare");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={1} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={60}>
          <Text style={styles.eyebrow}>COMMENT ÇA MARCHE</Text>
        </Reveal>
        <Reveal delay={140}>
          <Text style={styles.title}>
            Ta première recette,{"\n"}
            <Text style={styles.titleAccent}>en 3 gestes.</Text>
          </Text>
        </Reveal>

        <Reveal delay={240}>
          <View style={styles.logos}>
            <View style={styles.logoChip}>
              <Instagram size={18} color={Colors.terracotta} strokeWidth={1.9} />
            </View>
            <View style={styles.logoChip}>
              <Music2 size={18} color={Colors.encre} strokeWidth={1.9} />
            </View>
            <Text style={styles.logosText}>Instagram &amp; TikTok</Text>
          </View>
        </Reveal>

        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={360 + i * 120}>
              <View style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{s.n}</Text>
                </View>
                <View style={styles.stepText}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepBody}>{s.body}</Text>
                </View>
              </View>
            </Reveal>
          ))}
        </View>

        <Reveal delay={760}>
          <Text style={styles.note}>
            Pas de copier-coller, pas de saisie. Juste partager.
          </Text>
        </Reveal>
      </ScrollView>
      <OnboardingFooter label="C'est parti →" onPress={onContinue} />
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
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.54,
    color: Colors.terracotta,
    marginBottom: 12,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 28,
    lineHeight: 34,
    color: Colors.encre,
  },
  titleAccent: {
    fontFamily: "Fraunces_400Regular_Italic",
    color: Colors.terracotta,
  },
  logos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
  },
  logoChip: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
  },
  logosText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.cacao,
    marginLeft: 4,
  },
  steps: {
    marginTop: 30,
    gap: 20,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNumText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.creme,
  },
  stepText: {
    flex: 1,
    gap: 3,
  },
  stepTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.encre,
  },
  stepBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    lineHeight: 20,
  },
  note: {
    marginTop: 30,
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 14,
    color: Colors.cacao,
    textAlign: "center",
  },
});
