import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Share2 } from "lucide-react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";
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

const DEMO_RECIPE = demoRecipes.risotto;

// `DemoRecipe.ingredients` est un format custom { color, text } — on utilise
// `text` directement (déjà formaté avec quantité, ex: "320g de riz arborio").
function buildShoppingListText(): string {
  const cleanTitle = DEMO_RECIPE.name.replace(/\n/g, " ");
  const lines = DEMO_RECIPE.ingredients.map((i) => `• ${i.text}`);
  return [
    `🛒 Liste de courses — ${cleanTitle} (${DEMO_RECIPE.portions} pers.)`,
    "",
    ...lines,
    "",
    "Générée par RecetteBox 🍳",
  ].join("\n");
}

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

export default function DemoA5Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selected = useOnboardingStore((s) => s.selectedSources);

  const onContinue = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    navigateNextDemo(router, selected as DemoTrack[], "A");
  };

  const onShare = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    try {
      await Share.share({
        message: buildShoppingListText(),
        title: `Liste de courses — ${DEMO_RECIPE.name.replace(/\n/g, " ")}`,
      });
    } catch {
      // Share annulé ou non supporté sur cette plateforme — silencieux.
    }
  };

  const previewIngredients = DEMO_RECIPE.ingredients.slice(0, 3);
  const remainingCount = Math.max(
    0,
    DEMO_RECIPE.ingredients.length - previewIngredients.length,
  );

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
          <Text style={styles.eyebrow}>✨ Comme par magie</Text>
        </Reveal>
        <Reveal delay={240}>
          <Text style={styles.title}>
            Recette{"\n"}
            <Text style={styles.titleAccent}>importée.</Text>
          </Text>
        </Reveal>
        <Reveal delay={360}>
          <Text style={styles.sub}>@marlene.cooks · 8 secondes</Text>
        </Reveal>

        <Reveal delay={520} style={styles.cardWrap}>
          <RecipeCardWow recipe={DEMO_RECIPE} />
        </Reveal>

        <Reveal delay={680} style={styles.shoppingWrap}>
          <View style={styles.shoppingCard}>
            <Text style={styles.shoppingLabel}>🛒 TA LISTE DE COURSES</Text>
            <View style={styles.shoppingItems}>
              {previewIngredients.map((ing, i) => (
                <Text key={i} style={styles.shoppingItem}>
                  • {ing.text}
                </Text>
              ))}
              {remainingCount > 0 ? (
                <Text style={styles.shoppingMore}>
                  + {remainingCount} autre{remainingCount > 1 ? "s" : ""} ingrédient{remainingCount > 1 ? "s" : ""}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onShare} style={({ pressed }) => [
              styles.shareBtn,
              { opacity: pressed ? 0.88 : 1 },
            ]}>
              <Share2 size={16} color={Colors.terracotta} strokeWidth={2.2} />
              <Text style={styles.shareBtnText}>Partager ma liste de courses</Text>
            </Pressable>
          </View>
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
  shoppingWrap: {
    width: "100%",
    marginTop: 22,
  },
  shoppingCard: {
    width: "100%",
    backgroundColor: Colors.creme,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.rule,
    padding: 18,
    gap: 14,
  },
  shoppingLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.4,
    color: Colors.cacao,
  },
  shoppingItems: {
    gap: 6,
  },
  shoppingItem: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.encre,
    lineHeight: 20,
  },
  shoppingMore: {
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    fontSize: 13,
    color: Colors.cacao,
    marginTop: 2,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.cta,
    backgroundColor: Colors.creme,
    borderWidth: 1.5,
    borderColor: Colors.terracotta,
    marginTop: 2,
  },
  shareBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.terracotta,
    letterSpacing: 0.2,
  },
  spark: {
    position: "absolute",
    fontSize: 22,
    color: Colors.miel,
    fontFamily: "Fraunces_400Regular",
    zIndex: 5,
  },
});
