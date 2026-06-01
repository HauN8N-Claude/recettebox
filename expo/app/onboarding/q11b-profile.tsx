import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Users } from "lucide-react-native";

import { Colors, Spacing } from "@/constants/theme";
import { OnboardingFooter, OnboardingHeader } from "@/components/onboarding";
import { Confetti } from "@/components/onboarding/Confetti";
import { Reveal } from "@/components/Reveal";
import { progressFor } from "@/constants/onboardingSteps";
import { useOnboardingStore } from "@/stores/onboardingStore";

const SAUGE_DEEP = "#5F6E52";
const SAUGE_SOFT = "#E6ECDF";

// Reformulation au "tu" de chaque friction cochée en q11.
const FRICTION_TEXT: Record<string, string> = {
  eparpillees: "tes recettes sont éparpillées partout",
  inspiration_soir: "tu ne sais jamais quoi cuisiner le soir",
  ingredients: "tu n'as jamais les bons ingrédients",
  etapes: "trop d'étapes te découragent",
  refais_memes: "tu refais toujours les mêmes plats",
  my_mettre: "tu n'arrives juste pas à t'y mettre",
};

export default function Q11bProfileScreen() {
  const router = useRouter();
  const frictions = useOnboardingStore((s) => s.q11_frictions);

  const items = (frictions ?? [])
    .map((v) => FRICTION_TEXT[v])
    .filter((t): t is string => !!t);

  const onContinue = () => {
    router.push("/onboarding/q5b-cooking-time");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={progressFor("q11b-profile")} showBack={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={60}>
          <Text style={styles.intro}>
            On te comprend tellement&nbsp;! En ce moment&nbsp;:
          </Text>
        </Reveal>

        <Reveal delay={180}>
          <View style={styles.list}>
            {items.map((text, i) => (
              <View key={i} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{text}</Text>
              </View>
            ))}
          </View>
        </Reveal>

        <Reveal delay={320}>
          <Text style={styles.closing}>
            Et la bonne nouvelle&nbsp;? Tout ça, on va le{" "}
            <Text style={styles.closingAccent}>transformer ensemble</Text>. 💛
          </Text>
        </Reveal>

        <Reveal delay={460}>
          <View style={styles.belongBanner}>
            <View style={styles.belongIcon}>
              <Users size={22} color={SAUGE_DEEP} strokeWidth={2.2} />
            </View>
            <Text style={styles.belongText}>
              Tu n&apos;es pas seule.{"\n"}
              <Text style={styles.belongBig}>76%</Text> des utilisatrices traversent exactement la même chose.
            </Text>
          </View>
        </Reveal>
      </ScrollView>
      <OnboardingFooter label="On continue" onPress={onContinue} />
      <Confetti count={40} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  content: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 16,
    paddingBottom: 24,
  },
  intro: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 26,
    lineHeight: 34,
    color: Colors.encre,
  },
  list: {
    marginTop: 20,
    gap: 14,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.terracotta,
    marginTop: 9,
  },
  listText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    lineHeight: 24,
    color: Colors.encre,
  },
  closing: {
    marginTop: 24,
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 22,
    lineHeight: 30,
    color: Colors.encre,
  },
  closingAccent: {
    color: Colors.terracotta,
  },
  belongBanner: {
    marginTop: 32,
    backgroundColor: SAUGE_SOFT,
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  belongIcon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  belongText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    lineHeight: 24,
    color: Colors.encre,
  },
  belongBig: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 24,
    color: SAUGE_DEEP,
  },
});
