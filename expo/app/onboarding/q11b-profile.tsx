import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AlertCircle, Bookmark, Flame, Users, Zap } from "lucide-react-native";

import { Colors, Spacing } from "@/constants/theme";
import { OnboardingFooter, OnboardingHeader } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { useOnboardingStore } from "@/stores/onboardingStore";
import {
  cookedLabel,
  pickProfile,
  savesLabel,
} from "@/constants/onboardingProfile";

const SAUGE_DEEP = "#5F6E52";
const SAUGE_SOFT = "#E6ECDF";
const MIEL_DEEP = "#B8842F";

export default function Q11bProfileScreen() {
  const router = useRouter();
  const savesPerWeek = useOnboardingStore((s) => s.savesPerWeek);
  const cookedRatio = useOnboardingStore((s) => s.cookedRatio);
  const blockers = useOnboardingStore((s) => s.blockers);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);

  const profile = useMemo(
    () => pickProfile(savesPerWeek, cookedRatio, blockers),
    [savesPerWeek, cookedRatio, blockers]
  );

  useEffect(() => {
    setAnswer("userProfile", profile.name.replace(/\.$/, ""));
  }, [profile.name, setAnswer]);

  const savedValue = savesLabel(savesPerWeek);
  const cookedValue = cookedLabel(savesPerWeek, cookedRatio);
  const blockersCount = blockers.length;

  const onContinue = () => {
    router.push("/onboarding/q5b-cooking-time");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={11 / 12} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={40}>
          <View style={styles.eyebrow}>
            <Zap size={14} color={Colors.miel} strokeWidth={2.4} fill={Colors.miel} />
            <Text style={styles.eyebrowText}>TON PROFIL CULINAIRE</Text>
          </View>
        </Reveal>

        <Reveal delay={140}>
          <Text style={styles.title}>{profile.name}</Text>
        </Reveal>

        <Reveal delay={240}>
          <Text style={styles.tagline}>
            {profile.subtitle.segments.map((seg, i) =>
              seg.accent ? (
                <Text key={i} style={styles.taglineAccent}>
                  {seg.text}
                </Text>
              ) : (
                <Text key={i}>{seg.text}</Text>
              )
            )}
          </Text>
        </Reveal>

        <Reveal delay={340}>
          <View style={styles.belongBanner}>
            <View style={styles.belongIcon}>
              <Users size={18} color={SAUGE_DEEP} strokeWidth={2.2} />
            </View>
            <View style={styles.belongTextCol}>
              <Text style={styles.belongLine1}>
                Tu n&apos;es pas seule : c&apos;est le profil{" "}
                <Text style={styles.belongBold}>
                  n°{profile.number} sur RecetteBox.
                </Text>
              </Text>
              <Text style={styles.belongLine2}>
                {profile.percentage}% des utilisatrices se reconnaissent ici.
              </Text>
            </View>
          </View>
        </Reveal>

        <Reveal delay={440}>
          <View style={styles.statsBlock}>
            <Text style={styles.statsLabel}>TES CHIFFRES AUJOURD&apos;HUI</Text>

            <View style={styles.statRow}>
              <View style={styles.statLeft}>
                <Bookmark size={18} color={Colors.terracotta} strokeWidth={2.2} />
                <Text style={styles.statText}>Recettes sauvées / sem</Text>
              </View>
              <Text style={styles.statValue}>{savedValue}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statRow}>
              <View style={styles.statLeft}>
                <Flame size={18} color={Colors.terracotta} strokeWidth={2.2} />
                <Text style={styles.statText}>Vraiment cuisinées</Text>
              </View>
              <Text style={[styles.statValue, styles.statValueAccent]}>
                {cookedValue}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statRow}>
              <View style={styles.statLeft}>
                <AlertCircle size={18} color={Colors.terracotta} strokeWidth={2.2} />
                <Text style={styles.statText}>Freins identifiés</Text>
              </View>
              <Text style={styles.statValue}>{blockersCount}</Text>
            </View>
          </View>
        </Reveal>
      </ScrollView>
      <OnboardingFooter label="C'est exactement ça" onPress={onContinue} />
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  eyebrowText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.6,
    color: MIEL_DEEP,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 38,
    lineHeight: 44,
    color: Colors.encre,
  },
  tagline: {
    marginTop: 14,
    fontFamily: "Inter_500Medium",
    fontSize: 19,
    lineHeight: 27,
    color: Colors.encre,
  },
  taglineAccent: {
    color: Colors.terracotta,
    fontFamily: "Inter_600SemiBold",
  },
  belongBanner: {
    marginTop: 22,
    backgroundColor: SAUGE_SOFT,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  belongIcon: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  belongTextCol: {
    flex: 1,
    gap: 2,
  },
  belongLine1: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.encre,
    lineHeight: 20,
  },
  belongBold: {
    fontFamily: "Inter_700Bold",
    color: Colors.encre,
  },
  belongLine2: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: SAUGE_DEEP,
  },
  statsBlock: {
    marginTop: 26,
  },
  statsLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.4,
    color: SAUGE_DEEP,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  statLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.encre,
  },
  statValue: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 22,
    color: Colors.encre,
  },
  statValueAccent: {
    color: Colors.terracotta,
  },
  statDivider: {
    height: 1,
    backgroundColor: Colors.rule,
  },
});
