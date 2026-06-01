import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Users } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Spacing } from "@/constants/theme";
import { Confetti } from "@/components/onboarding/Confetti";
import { Reveal } from "@/components/Reveal";
import { useOnboardingStore } from "@/stores/onboardingStore";

const SUBTITLES: Record<string, string> = {
  seul: "Tes recettes seront automatiquement ajustées pour 1 personne.",
  duo: "Tes recettes seront automatiquement ajustées pour 2 personnes.",
  famille: "Tes recettes seront automatiquement ajustées pour 3-4 personnes.",
  plus: "Tes recettes seront automatiquement ajustées à ton groupe.",
};

export default function AdjustPortionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const household = useOnboardingStore((s) => s.q9_household);

  const subtitle = useMemo(
    () => (household ? SUBTITLES[household] : SUBTITLES.duo),
    [household]
  );

  useEffect(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    const t = setTimeout(() => {
      router.replace("/onboarding/q8");
    }, 5000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 12 }]}>
      <View style={styles.center}>
        <Reveal delay={80}>
          <View style={styles.iconWrap}>
            <Users size={40} color={Colors.sauge} strokeWidth={2} />
          </View>
        </Reveal>
        <Reveal delay={240}>
          <Text style={styles.title}>C&apos;est noté.</Text>
        </Reveal>
        <Reveal delay={380}>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Reveal>
        <Reveal delay={560}>
          <Text style={styles.caption}>
            Tu pourras modifier ce réglage à tout moment.
          </Text>
        </Reveal>
      </View>
      <Confetti count={40} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.creme,
    paddingHorizontal: Spacing.screen,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 28,
    color: Colors.encre,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: Colors.cacao,
    textAlign: "center",
    maxWidth: 330,
    lineHeight: 26,
  },
  caption: {
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    fontSize: 15,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: 4,
  },
});
