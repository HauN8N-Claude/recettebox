import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Spacing } from "@/constants/theme";
import { OnboardingFooter } from "@/components/onboarding";
import { Confetti } from "@/components/onboarding/Confetti";
import { RecipeCardWow } from "@/components/demo";
import { Reveal } from "@/components/Reveal";
import { demoRecipes } from "@/constants/mockData";
import { useOnboardingStore } from "@/stores/onboardingStore";
import {
  navigateNextDemo,
  type DemoTrack,
} from "@/components/onboarding/navigateNextDemo";

function Spark({
  glyph,
  style,
  delay,
}: {
  glyph: string;
  style: { top?: number; bottom?: number; left?: number; right?: number };
  delay: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, scale, opacity]);

  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        styles.spark,
        style,
        { transform: [{ scale }], opacity },
      ]}
    >
      {glyph}
    </Animated.Text>
  );
}

export default function DemoB6Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selected = useOnboardingStore((s) => s.selectedSources);

  const onContinue = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    navigateNextDemo(router, selected as DemoTrack[], "B");
  };

  return (
    <View style={styles.wrap}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={[Colors.creme, Colors.cremeDeep]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.confettiClip} pointerEvents="none">
        <Confetti count={28} />
      </View>

      <Spark glyph="✦" style={{ top: 120, left: 28 }} delay={0} />
      <Spark glyph="✧" style={{ top: 180, right: 36 }} delay={500} />
      <Spark glyph="✦" style={{ top: 90, right: 80 }} delay={1000} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={120}>
          <Text style={styles.eyebrow}>✨ Tout est nettoyé</Text>
        </Reveal>
        <Reveal delay={240}>
          <Text style={styles.title}>
            Recette{"\n"}
            <Text style={styles.titleAccent}>importée.</Text>
          </Text>
        </Reveal>
        <Reveal delay={360}>
          <Text style={styles.sub}>marmiton.org · 4 secondes</Text>
        </Reveal>

        <Reveal delay={520} style={styles.cardWrap}>
          <RecipeCardWow recipe={demoRecipes.tarteFigues} />
        </Reveal>
      </ScrollView>

      <OnboardingFooter label="Suivant →" onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme, overflow: "hidden" },
  confettiClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  scroll: {
    paddingHorizontal: Spacing.screen,
    alignItems: "center",
  },
  eyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 0.6,
    color: Colors.terracotta,
    textAlign: "center",
  },
  title: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 28,
    color: Colors.encre,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 32,
  },
  titleAccent: {
    fontFamily: "Fraunces_400Regular_Italic",
    color: Colors.terracotta,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 8,
  },
  cardWrap: {
    width: "100%",
    marginTop: 28,
  },
  spark: {
    position: "absolute",
    fontSize: 22,
    color: Colors.miel,
    fontFamily: "Fraunces_400Regular",
    zIndex: 5,
  },
});
