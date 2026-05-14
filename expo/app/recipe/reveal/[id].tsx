/**
 * Écran "révélation" post-import (aha moment).
 *
 * Affiché juste après qu'une recette ait été générée par le worker. Joue une
 * courte animation (~3s) où le post Instagram/TikTok d'origine se transforme
 * en la fiche recette structurée, puis propose un CTA "Découvrir la recette"
 * qui route (replace) vers /recipe/[id].
 *
 * Étape 1 (visuel seul) : accessible manuellement via /recipe/reveal/<id> pour
 * juger le rendu. Pas encore branché au flow d'import — viendra en étape 2.
 */
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { useRecipe } from "@/lib/api/recipes";
import { PREVIEW_RECIPE } from "@/lib/devPreviewRecipe";
import { PressableScale } from "@/components/PressableScale";
import { Reveal } from "@/components/Reveal";
import { SourceIcon } from "@/components/SourceIcon";
import type { RecipeSource } from "@/constants/mockData";

const CARD_SIZE = 208;

function getPostGradient(source: RecipeSource): [string, string, ...string[]] {
  switch (source) {
    case "instagram":
      return ["#F58529", "#DD2A7B", "#8134AF"];
    case "tiktok":
      return ["#25F4EE", "#1A1A1A", "#FE2C55"];
    case "pinterest":
      return ["#E60023", "#BD081C"];
    case "web":
      return [Colors.cacao, Colors.encre];
    case "manual":
    default:
      return [Colors.cacao, Colors.encre];
  }
}

function getSourceLabel(source: RecipeSource): string {
  switch (source) {
    case "instagram":
      return "Reel Instagram";
    case "tiktok":
      return "TikTok";
    case "pinterest":
      return "Pinterest";
    case "web":
      return "Article web";
    case "manual":
    default:
      return "Carnet";
  }
}

export default function ImportRevealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isPreview = id === "preview";
  const recipeQuery = useRecipe(isPreview ? undefined : id);
  const recipe = isPreview ? PREVIEW_RECIPE : recipeQuery.data;

  // Crossfade vignette du post (visible au départ) → photo de la recette.
  const vignetteOpacity = useRef(new Animated.Value(0)).current;
  const vignetteScale = useRef(new Animated.Value(0.92)).current;
  const photoOpacity = useRef(new Animated.Value(0)).current;
  const photoScale = useRef(new Animated.Value(1.06)).current;

  useEffect(() => {
    // Apparition de la vignette du post (0 → ~500ms).
    Animated.parallel([
      Animated.timing(vignetteOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(vignetteScale, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Transformation vers la photo de la recette à t = 950ms.
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(vignetteOpacity, {
          toValue: 0,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(vignetteScale, {
          toValue: 0.88,
          duration: 600,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(photoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(photoScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 950);

    return () => clearTimeout(t);
  }, [vignetteOpacity, vignetteScale, photoOpacity, photoScale]);

  const goToRecipe = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    if (recipe) {
      // Ouvre l'écran "aha" (liste de courses prête à partager) avant la fiche.
      router.replace(`/recipe/aha/${recipe.id}`);
    }
  };

  if ((!isPreview && recipeQuery.isLoading) || !recipe) {
    return (
      <View style={styles.loading}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.terracotta} />
      </View>
    );
  }

  const totalMinutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const authorHandle = recipe.sourceAuthor
    ? `@${recipe.sourceAuthor}`
    : getSourceLabel(recipe.source);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 28,
        },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topGroup}>
        <Reveal delay={120}>
          <Text style={styles.eyebrow}>Recette extraite</Text>
        </Reveal>

        <View style={styles.cardWrap}>
          {/* Vignette du post source (Insta / TikTok / …) */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: vignetteOpacity,
                transform: [{ scale: vignetteScale }],
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={getPostGradient(recipe.source)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardInner}
            >
              <View style={styles.postIconRing}>
                <SourceIcon source={recipe.source} size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.postAuthor} numberOfLines={1}>
                {authorHandle}
              </Text>
              <Text style={styles.postLabel}>{getSourceLabel(recipe.source)}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Photo de la recette extraite */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: photoOpacity,
                transform: [{ scale: photoScale }],
              },
            ]}
            pointerEvents="none"
          >
            <Image
              source={{ uri: recipe.imageUrl }}
              style={styles.cardImage}
            />
            <LinearGradient
              colors={["rgba(42,37,32,0)", "rgba(42,37,32,0.35)"]}
              style={styles.cardImageFade}
            />
          </Animated.View>
        </View>

        <View style={styles.statsWrap}>
          <Reveal delay={1450}>
            <StatRow
              label={`${recipe.ingredients.length} ingrédients identifiés`}
            />
          </Reveal>
          <Reveal delay={1650}>
            <StatRow label={`${recipe.steps.length} étapes détaillées`} />
          </Reveal>
          <Reveal delay={1850}>
            <StatRow label={`Prêt en ${totalMinutes} min`} />
          </Reveal>
        </View>

        <View style={styles.titleWrap}>
          <Reveal delay={2300}>
            <View style={styles.sourceLine}>
              <SourceIcon source={recipe.source} size={12} color={Colors.cacao} />
              <Text style={styles.sourceText}>depuis {authorHandle}</Text>
            </View>
          </Reveal>
          <Reveal delay={2450}>
            <Text style={styles.title} numberOfLines={3}>
              {recipe.title}
            </Text>
          </Reveal>
        </View>
      </View>

      <Reveal delay={2850} style={styles.ctaWrap}>
        <PressableScale
          onPress={goToRecipe}
          style={styles.cta}
          scaleTo={0.97}
          haptic={false}
        >
          <Text style={styles.ctaText}>Découvrir la recette</Text>
          <ArrowRight size={18} color={Colors.creme} strokeWidth={2.2} />
        </PressableScale>
      </Reveal>
    </View>
  );
}

function StatRow({ label }: { label: string }) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statCheck}>
        <Check size={12} color={Colors.creme} strokeWidth={3} />
      </View>
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creme,
    paddingHorizontal: Spacing.screen,
    alignItems: "stretch",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.creme,
  },

  topGroup: {
    flex: 1,
    alignItems: "center",
  },

  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.sauge,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    marginBottom: 28,
  },

  cardWrap: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    position: "relative",
  },
  card: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: Radius.card,
    overflow: "hidden",
    shadowColor: Colors.encre,
    shadowOpacity: 0.18,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  cardInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.cremeDeep,
  },
  cardImageFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
  },

  postIconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.65)",
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  postAuthor: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
    marginBottom: 4,
    maxWidth: CARD_SIZE - 36,
  },
  postLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10.5,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },

  statsWrap: {
    marginTop: 32,
    gap: 12,
    alignSelf: "stretch",
    paddingHorizontal: 8,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.sauge,
    alignItems: "center",
    justifyContent: "center",
  },
  statText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.encre,
  },

  titleWrap: {
    marginTop: 28,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  sourceLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  sourceText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.cacao,
    letterSpacing: 0.2,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 26,
    color: Colors.encre,
    textAlign: "center",
    lineHeight: 32,
  },

  ctaWrap: {
    alignSelf: "stretch",
  },
  cta: {
    height: 56,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.encre,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
    letterSpacing: 0.2,
  },
});
