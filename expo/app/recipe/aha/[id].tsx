/**
 * Écran "aha" post-import — liste de courses prête à partager.
 *
 * Affiché juste après l'écran "Recette extraite" (révélation). Concrétise la
 * promesse de l'app : transformer un reel en quelque chose d'actionnable tout
 * de suite, AVANT même d'aller cuisiner. C'est ici qu'on permet :
 *   - d'ajuster le nombre de portions (recalcul live des quantités),
 *   - de lire les ingrédients groupés par rayon,
 *   - de partager la liste via la feuille iOS native (iMessage, WhatsApp…).
 *
 * Navigation :
 *   - Arrivée depuis /recipe/reveal/<id> (CTA "Découvrir la recette").
 *   - Sortie vers /recipe/<id> via tap sur le hint "Voir la recette complète".
 */
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronUp,
  Clock,
  Minus,
  Plus,
  Share2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { useRecipe } from "@/lib/api/recipes";
import { PREVIEW_RECIPE } from "@/lib/devPreviewRecipe";
import { groupIngredients, type IngredientGroup } from "@/lib/recipeFormat";
import { PressableScale } from "@/components/PressableScale";
import { Reveal } from "@/components/Reveal";
import { SourceIcon } from "@/components/SourceIcon";
import { useServingsStore } from "@/stores/servingsStore";
import type { Recipe } from "@/constants/mockData";

const HERO_HEIGHT = 220;

function buildShareText(recipe: Recipe, servings: number, groups: IngredientGroup[]): string {
  const lines: string[] = [];
  lines.push(`Liste de courses — ${recipe.title}`);
  lines.push(`Pour ${servings} ${servings > 1 ? "personnes" : "personne"}`);
  lines.push("");
  groups.forEach((group, gi) => {
    lines.push(group.cat);
    group.items.forEach((it) => {
      const qty = it.quantity ? ` — ${it.quantity}` : "";
      lines.push(`• ${it.name}${qty}`);
    });
    if (gi < groups.length - 1) lines.push("");
  });
  lines.push("");
  lines.push("—");
  lines.push("Liste générée par RecetteBox");
  return lines.join("\n");
}

export default function AhaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isPreview = id === "preview";
  const recipeQuery = useRecipe(isPreview ? undefined : id);
  const recipe = isPreview ? PREVIEW_RECIPE : recipeQuery.data;

  const recipeId = recipe?.id ?? "";
  const defaultServings = recipe?.servings ?? 4;
  const servings = useServingsStore(
    (s) => s.servingsByRecipe[recipeId] ?? defaultServings,
  );
  const setServingsInStore = useServingsStore((s) => s.setServings);

  const haptic = useCallback((style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style).catch(() => {});
    }
  }, []);

  const adjustServings = useCallback(
    (delta: number) => {
      const next = Math.min(12, Math.max(1, servings + delta));
      if (next !== servings) {
        haptic(Haptics.ImpactFeedbackStyle.Light);
        setServingsInStore(recipeId, next);
      }
    },
    [servings, recipeId, setServingsInStore, haptic],
  );

  const grouped = useMemo(
    () => (recipe ? groupIngredients(recipe, servings) : []),
    [recipe, servings],
  );

  const onShare = useCallback(async () => {
    if (!recipe) return;
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: buildShareText(recipe, servings, grouped),
        title: `Liste de courses · ${recipe.title}`,
      });
    } catch {
      // Annulation utilisateur ou erreur silencieuse — on n'affiche rien.
    }
  }, [recipe, servings, grouped, haptic]);

  const goToFiche = useCallback(() => {
    if (!recipe) return;
    haptic(Haptics.ImpactFeedbackStyle.Light);
    if (isPreview) {
      // En preview, retour à la révélation pour faciliter les tests visuels.
      router.replace("/recipe/reveal/preview");
      return;
    }
    router.push(`/recipe/${recipe.id}`);
  }, [recipe, isPreview, router, haptic]);

  // Pulse subtil du chevron en bas (boucle ~1.6s).
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: -5,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  if ((!isPreview && recipeQuery.isLoading) || !recipe) {
    return (
      <View style={styles.loading}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.terracotta} />
      </View>
    );
  }

  const totalMinutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const authorHandle = recipe.sourceAuthor ? `@${recipe.sourceAuthor}` : null;
  const bottomSafe = insets.bottom > 0 ? insets.bottom : 18;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 220 + bottomSafe,
        }}
      >
        {/* Header — photo + titre + meta */}
        <Reveal delay={120}>
          <View style={styles.heroWrap}>
            <Image source={{ uri: recipe.imageUrl }} style={styles.hero} />
            <LinearGradient
              colors={["rgba(250,246,240,0)", Colors.creme]}
              style={styles.heroFade}
            />
          </View>
        </Reveal>

        <View style={styles.headerBlock}>
          <Reveal delay={260}>
            <View style={styles.sourceLine}>
              <SourceIcon source={recipe.source} size={12} color={Colors.cacao} />
              <Text style={styles.sourceText}>
                {authorHandle ? `depuis ${authorHandle}` : "depuis votre carnet"}
              </Text>
            </View>
          </Reveal>
          <Reveal delay={340}>
            <Text style={styles.title} numberOfLines={3}>
              {recipe.title}
            </Text>
          </Reveal>
          <Reveal delay={420}>
            <View style={styles.metaRow}>
              <Clock size={13} color={Colors.cacao} strokeWidth={1.8} />
              <Text style={styles.metaText}>{totalMinutes} min</Text>
              <View style={styles.metaDot} />
              <Text style={styles.metaText}>{recipe.difficulty}</Text>
            </View>
          </Reveal>
        </View>

        {/* Servings selector */}
        <Reveal delay={540}>
          <View style={styles.servingsBlock}>
            <Text style={styles.sectionEyebrow}>Pour combien de personnes</Text>
            <View style={styles.servingsRow}>
              <PressableScale
                onPress={() => adjustServings(-1)}
                style={[
                  styles.servingsBtn,
                  servings <= 1 && styles.servingsBtnDisabled,
                ]}
                scaleTo={0.9}
                haptic={false}
                disabled={servings <= 1}
              >
                <Minus size={18} color={Colors.encre} strokeWidth={2.2} />
              </PressableScale>
              <View style={styles.servingsValueWrap}>
                <Text style={styles.servingsValue}>{servings}</Text>
                <Text style={styles.servingsUnit}>
                  {servings > 1 ? "personnes" : "personne"}
                </Text>
              </View>
              <PressableScale
                onPress={() => adjustServings(1)}
                style={[
                  styles.servingsBtn,
                  servings >= 12 && styles.servingsBtnDisabled,
                ]}
                scaleTo={0.9}
                haptic={false}
                disabled={servings >= 12}
              >
                <Plus size={18} color={Colors.encre} strokeWidth={2.2} />
              </PressableScale>
            </View>
            {servings !== recipe.servings && (
              <Text style={styles.servingsHint}>
                Les quantités s&apos;ajustent en direct
              </Text>
            )}
          </View>
        </Reveal>

        {/* Ingredients list */}
        <Reveal delay={680}>
          <View style={styles.ingredientsBlock}>
            <Text style={styles.sectionEyebrow}>Ingrédients</Text>
            <View style={{ gap: 22 }}>
              {grouped.map((group) => (
                <View key={group.cat}>
                  <Text style={styles.groupTitle}>{group.cat}</Text>
                  <View style={styles.groupList}>
                    {group.items.map((it) => (
                      <View key={it.idx} style={styles.ingredientRow}>
                        <Text style={styles.ingredientName} numberOfLines={1}>
                          {it.name}
                        </Text>
                        <Text style={styles.ingredientQty}>{it.quantity}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Reveal>
      </ScrollView>

      {/* Sticky bottom : CTA partage + hint vers la fiche */}
      <View
        style={[
          styles.bottomWrap,
          { paddingBottom: bottomSafe },
        ]}
        pointerEvents="box-none"
      >
        <LinearGradient
          colors={["rgba(250,246,240,0)", Colors.creme]}
          style={styles.bottomFade}
          pointerEvents="none"
        />

        <Reveal delay={820}>
          <PressableScale
            onPress={onShare}
            style={styles.shareCta}
            scaleTo={0.97}
            haptic={false}
          >
            <Share2 size={18} color={Colors.creme} strokeWidth={2.2} />
            <Text style={styles.shareCtaText}>Partager la liste de courses</Text>
          </PressableScale>
        </Reveal>

        <Reveal delay={1000}>
          <Pressable
            onPress={goToFiche}
            hitSlop={8}
            style={styles.ficheHint}
            accessibilityRole="button"
            accessibilityLabel="Voir la recette complète"
          >
            <Animated.View style={{ transform: [{ translateY: pulse }] }}>
              <ChevronUp size={16} color={Colors.cacao} strokeWidth={2} />
            </Animated.View>
            <Text style={styles.ficheHintText}>Voir la recette complète</Text>
          </Pressable>
        </Reveal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.creme,
  },

  heroWrap: {
    width: "100%",
    height: HERO_HEIGHT,
    backgroundColor: Colors.cremeDeep,
    position: "relative",
  },
  hero: {
    width: "100%",
    height: HERO_HEIGHT,
  },
  heroFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },

  headerBlock: {
    paddingHorizontal: Spacing.screen,
    marginTop: 4,
    alignItems: "center",
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
    paddingHorizontal: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  metaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.cacao,
    letterSpacing: 0.2,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.cacao,
    opacity: 0.5,
  },

  sectionEyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    color: Colors.sauge,
    marginBottom: 16,
  },

  servingsBlock: {
    marginTop: 36,
    paddingHorizontal: Spacing.screen,
    alignItems: "center",
  },
  servingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  servingsBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  servingsBtnDisabled: {
    opacity: 0.4,
  },
  servingsValueWrap: {
    alignItems: "center",
    minWidth: 120,
  },
  servingsValue: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 44,
    color: Colors.encre,
    lineHeight: 48,
  },
  servingsUnit: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.cacao,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  servingsHint: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 13,
    color: Colors.miel,
    textAlign: "center",
    marginTop: 12,
  },

  ingredientsBlock: {
    marginTop: 40,
    paddingHorizontal: Spacing.screen,
  },
  groupTitle: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 15,
    color: Colors.cacao,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  groupList: {
    gap: 2,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
  },
  ingredientName: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.encre,
  },
  ingredientQty: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.cacao,
  },

  bottomWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.screen,
    paddingTop: 8,
    alignItems: "center",
    gap: 14,
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -40,
    height: 60,
  },
  shareCta: {
    height: 56,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 28,
    alignSelf: "stretch",
    shadowColor: Colors.encre,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  shareCtaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
    letterSpacing: 0.2,
  },

  ficheHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  ficheHintText: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 13,
    color: Colors.cacao,
  },
});
