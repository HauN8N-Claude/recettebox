import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Check,
  ChefHat,
  Clock,
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  Users,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { useRecipe } from "@/lib/api/recipes";
import { Reveal } from "@/components/Reveal";
import { PressableScale } from "@/components/PressableScale";
import { SourceIcon } from "@/components/SourceIcon";
import { useSeenRecipesStore } from "@/stores/seenRecipesStore";
import { useServingsStore } from "@/stores/servingsStore";

const HERO_HEIGHT = 360;

type IngredientCategory =
  | "Légumes & frais"
  | "Protéines"
  | "Crémerie & œufs"
  | "Épicerie";

const CATEGORY_ORDER: IngredientCategory[] = [
  "Légumes & frais",
  "Protéines",
  "Crémerie & œufs",
  "Épicerie",
];

function categorize(name: string): IngredientCategory {
  const n = name.toLowerCase();
  if (
    /(courgette|tomate|oignon|ail|échalote|carotte|romaine|basilic|citron|pomme|champignon|thym|coriandre|persil|poireau|salade|cannelle|wakame|alg)/.test(
      n,
    )
  )
    return "Légumes & frais";
  if (
    /(b(œ|oe)uf|lardon|poulet|crevette|saumon|porc|veau|jambon|poisson|tofu)/.test(
      n,
    )
  )
    return "Protéines";
  if (/(beurre|parmesan|cr(è|e)me|lait|(œ|oe)uf|fromage|yaourt)/.test(n))
    return "Crémerie & œufs";
  return "Épicerie";
}

/**
 * Multiplies the leading numeric portion of an ingredient quantity
 * by a ratio while preserving the trailing unit/text.
 * Falls back to the original string when no number is found.
 */
function scaleQuantity(qty: string, ratio: number): string {
  const m = qty.match(/^(\d+(?:[.,]\d+)?)(.*)$/);
  if (!m) return qty;
  const num = parseFloat(m[1].replace(",", "."));
  const rest = m[2];
  const scaled = num * ratio;
  const rounded = Math.round(scaled * 10) / 10;
  const display = Number.isInteger(rounded)
    ? `${rounded}`
    : `${rounded}`.replace(".", ",");
  return `${display}${rest}`;
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Fetch de la recette complète (avec ingredients + steps triés) depuis Supabase.
  // Cache React Query : queryKey ["recipe", id]. Indépendant du cache liste
  // ["recipes"] : ouvrir la fiche déclenche un fetch dédié (acceptable car
  // l'écran a besoin des ingredients/steps qui ne sont pas dans la liste).
  const recipeQuery = useRecipe(id);
  const recipe = recipeQuery.data ?? undefined;
  const isLoading = recipeQuery.isLoading;
  const isError = recipeQuery.isError;

  const markAsSeen = useSeenRecipesStore((s) => s.markAsSeen);
  useEffect(() => {
    if (id) markAsSeen(id);
  }, [id, markAsSeen]);

  const recipeId = recipe?.id ?? "";
  const defaultServings = recipe?.servings ?? 4;
  const servings = useServingsStore(
    (s) => s.servingsByRecipe[recipeId] ?? defaultServings,
  );
  const setServingsInStore = useServingsStore((s) => s.setServings);
  const [favorite, setFavorite] = useState<boolean>(
    recipe?.isFavorite ?? false,
  );
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const scrollY = useRef(new Animated.Value(0)).current;

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY],
  );

  const heroTranslate = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0, HERO_HEIGHT],
    outputRange: [HERO_HEIGHT / 2, 0, -HERO_HEIGHT / 3],
    extrapolateRight: "clamp",
  });
  const heroScale = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolateRight: "clamp",
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 120, HERO_HEIGHT - 40],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const handleHaptic = useCallback((style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style).catch(() => {});
    }
  }, []);

  const adjustServings = useCallback(
    (delta: number) => {
      const next = Math.min(12, Math.max(1, servings + delta));
      if (next !== servings) {
        handleHaptic(Haptics.ImpactFeedbackStyle.Light);
        setServingsInStore(recipeId, next);
      }
    },
    [handleHaptic, servings, recipeId, setServingsInStore],
  );

  const toggleCheck = useCallback(
    (idx: number) => {
      handleHaptic(Haptics.ImpactFeedbackStyle.Light);
      setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
    },
    [handleHaptic],
  );

  const toggleFavorite = useCallback(() => {
    handleHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setFavorite((f) => !f);
  }, [handleHaptic]);

  const grouped = useMemo(() => {
    if (!recipe) return [] as { cat: IngredientCategory; items: { idx: number; name: string; quantity: string }[] }[];
    const ratio = servings / recipe.servings;
    const buckets = new Map<
      IngredientCategory,
      { idx: number; name: string; quantity: string }[]
    >();
    recipe.ingredients.forEach((ing, idx) => {
      const cat = categorize(ing.name);
      const list = buckets.get(cat) ?? [];
      list.push({
        idx,
        name: ing.name,
        quantity: scaleQuantity(ing.quantity, ratio),
      });
      buckets.set(cat, list);
    });
    return CATEGORY_ORDER.filter((c) => buckets.has(c)).map((c) => ({
      cat: c,
      items: buckets.get(c) ?? [],
    }));
  }, [recipe, servings]);

  if (isLoading) {
    return (
      <View style={styles.notFoundWrap}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.terracotta} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.notFoundWrap}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.notFoundTitle}>
          On n&apos;a pas pu charger cette recette.
        </Text>
        <PressableScale
          onPress={() => recipeQuery.refetch()}
          style={styles.backCta}
        >
          <Text style={styles.backCtaText}>Réessayer</Text>
        </PressableScale>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.notFoundWrap}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.notFoundTitle}>Recette introuvable.</Text>
        <PressableScale onPress={() => router.back()} style={styles.backCta}>
          <Text style={styles.backCtaText}>Retour</Text>
        </PressableScale>
      </View>
    );
  }

  const totalMinutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Parallax hero */}
      <Animated.View
        style={[
          styles.heroAbsolute,
          {
            transform: [
              { translateY: heroTranslate },
              { scale: heroScale },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} />
        <LinearGradient
          colors={["rgba(42,37,32,0.35)", "rgba(42,37,32,0)"]}
          style={styles.heroFadeTop}
        />
        <LinearGradient
          colors={["rgba(250,246,240,0)", Colors.creme]}
          style={styles.heroFadeBottom}
        />
      </Animated.View>

      {/* Floating controls */}
      <View
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <PressableScale
          onPress={() => router.back()}
          style={styles.iconButton}
          scaleTo={0.92}
        >
          <ArrowLeft size={20} color={Colors.encre} strokeWidth={2} />
        </PressableScale>
        <Animated.View
          style={[styles.collapsedTitleWrap, { opacity: titleOpacity }]}
          pointerEvents="none"
        >
          <Text style={styles.collapsedTitle} numberOfLines={1}>
            {recipe.title}
          </Text>
        </Animated.View>
        <PressableScale
          onPress={toggleFavorite}
          style={styles.iconButton}
          scaleTo={0.92}
          haptic={false}
        >
          <Heart
            size={20}
            color={Colors.terracotta}
            fill={favorite ? Colors.terracotta : "transparent"}
            strokeWidth={2}
          />
        </PressableScale>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
      >
        <View style={{ height: HERO_HEIGHT - 60 }} />

        {/* Title block */}
        <Reveal delay={120}>
          <View style={styles.titleBlock}>
            <View style={styles.sourceRow}>
              <SourceIcon source={recipe.source} size={13} />
              <Text style={styles.sourceText}>
                {recipe.sourceAuthor ?? "Carnet perso"}
              </Text>
              <View style={styles.sourceDot} />
              <Text style={styles.sourceText}>{recipe.difficulty}</Text>
            </View>
            <Text style={styles.title}>{recipe.title}</Text>
            <View style={styles.tagRow}>
              {recipe.tags.slice(0, 3).map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        </Reveal>

        {/* Meta strip */}
        <Reveal delay={240}>
          <View style={styles.metaStrip}>
            <MetaItem
              icon={<Clock size={16} color={Colors.cacao} strokeWidth={1.8} />}
              label="Total"
              value={`${totalMinutes} min`}
            />
            <View style={styles.metaDivider} />
            <MetaItem
              icon={
                <ChefHat size={16} color={Colors.cacao} strokeWidth={1.8} />
              }
              label="Préparation"
              value={`${recipe.prepTimeMinutes} min`}
            />
            <View style={styles.metaDivider} />
            <MetaItem
              icon={<Users size={16} color={Colors.cacao} strokeWidth={1.8} />}
              label="Pour"
              value={`${servings} pers.`}
            />
          </View>
        </Reveal>

        {/* Servings selector */}
        <Reveal delay={340}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pour combien de personnes</Text>
            <View style={styles.servingsRow}>
              <PressableScale
                onPress={() => adjustServings(-1)}
                style={[
                  styles.servingsButton,
                  servings <= 1 && styles.servingsButtonDisabled,
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
                  styles.servingsButton,
                  servings >= 12 && styles.servingsButtonDisabled,
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
                Quantités ajustées depuis {recipe.servings} pers.
              </Text>
            )}
          </View>
        </Reveal>

        {/* Ingredients */}
        <Reveal delay={460}>
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Ingrédients</Text>
              <Pressable
                onPress={() => {
                  handleHaptic(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/recipe/${recipe.id}/shopping-list`);
                }}
                hitSlop={8}
                style={styles.shoppingListLink}
                accessibilityRole="link"
                accessibilityLabel="Voir la liste de courses"
              >
                <ShoppingCart size={14} color={Colors.terracotta} strokeWidth={2} />
                <Text style={styles.shoppingListLinkText}>Liste de courses</Text>
              </Pressable>
            </View>
            <View style={{ gap: 22 }}>
              {grouped.map((group) => (
                <View key={group.cat}>
                  <Text style={styles.groupTitle}>{group.cat}</Text>
                  <View style={styles.groupList}>
                    {group.items.map((ing) => {
                      const isChecked = !!checked[ing.idx];
                      return (
                        <Pressable
                          key={ing.idx}
                          onPress={() => toggleCheck(ing.idx)}
                          style={styles.ingredientRow}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              isChecked && styles.checkboxOn,
                            ]}
                          >
                            {isChecked && (
                              <Check
                                size={13}
                                color={Colors.creme}
                                strokeWidth={3}
                              />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.ingredientName,
                              isChecked && styles.ingredientNameDone,
                            ]}
                          >
                            {ing.name}
                          </Text>
                          <Text
                            style={[
                              styles.ingredientQty,
                              isChecked && styles.ingredientQtyDone,
                            ]}
                          >
                            {ing.quantity}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Reveal>

        {/* Steps */}
        <Reveal delay={600}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Étapes</Text>
            <View style={{ gap: 22 }}>
              {recipe.steps.map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <Text style={styles.stepNumber}>
                    {String(idx + 1).padStart(2, "0")}
                  </Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        </Reveal>

        <Reveal delay={760}>
          <View style={styles.whisperWrap}>
            <View style={styles.whisperRule} />
            <Text style={styles.whisperText}>
              Cuisiner vraiment ce que tu sauves.
            </Text>
          </View>
        </Reveal>
      </Animated.ScrollView>

      {/* Sticky CTA */}
      <View
        style={[
          styles.ctaWrap,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 18 },
        ]}
        pointerEvents="box-none"
      >
        <LinearGradient
          colors={["rgba(250,246,240,0)", Colors.creme]}
          style={styles.ctaFade}
          pointerEvents="none"
        />
        <PressableScale
          onPress={() => {
            handleHaptic(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/cooking/${recipe.id}`);
          }}
          style={styles.ctaPrimary}
          scaleTo={0.97}
          haptic={false}
        >
          <ChefHat size={18} color={Colors.creme} strokeWidth={2} />
          <Text style={styles.ctaPrimaryText}>Cuisiner cette recette</Text>
        </PressableScale>
      </View>
    </View>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaItem}>
      <View style={styles.metaIconRow}>
        {icon}
        <Text style={styles.metaLabel}>{label}</Text>
      </View>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  heroAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: "100%",
    height: HERO_HEIGHT,
    backgroundColor: Colors.cremeDeep,
  },
  heroFadeTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 120,
  },
  heroFadeBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.screen,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.creme,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  collapsedTitleWrap: {
    flex: 1,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  collapsedTitle: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 16,
    color: Colors.encre,
  },

  titleBlock: {
    paddingHorizontal: Spacing.screen,
    marginTop: 8,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sourceText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.cacao,
    letterSpacing: 0.2,
  },
  sourceDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.cacao,
    opacity: 0.6,
    marginHorizontal: 2,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 32,
    color: Colors.encre,
    lineHeight: 38,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: "rgba(138,154,123,0.18)",
  },
  tagText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.sauge,
    letterSpacing: 0.3,
  },

  metaStrip: {
    marginTop: 26,
    marginHorizontal: Spacing.screen,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: Colors.cremeDeep,
    borderRadius: Radius.card,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  metaItem: {
    flex: 1,
    alignItems: "flex-start",
    gap: 6,
  },
  metaIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.cacao,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metaValue: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 17,
    color: Colors.encre,
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.rule,
    marginHorizontal: 8,
  },

  section: {
    paddingHorizontal: Spacing.screen,
    marginTop: Spacing.section,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    color: Colors.sauge,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shoppingListLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  shoppingListLinkText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.terracotta,
  },

  servingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  servingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  servingsButtonDisabled: {
    opacity: 0.4,
  },
  servingsValueWrap: {
    alignItems: "center",
    minWidth: 120,
  },
  servingsValue: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 40,
    color: Colors.encre,
    lineHeight: 44,
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
    marginTop: 14,
  },

  groupTitle: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 14,
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
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.cacao,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.creme,
  },
  checkboxOn: {
    backgroundColor: Colors.terracotta,
    borderColor: Colors.terracotta,
  },
  ingredientName: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.encre,
  },
  ingredientNameDone: {
    color: Colors.cacao,
    textDecorationLine: "line-through",
  },
  ingredientQty: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.cacao,
  },
  ingredientQtyDone: {
    color: Colors.cacao,
    opacity: 0.5,
  },

  stepRow: {
    flexDirection: "row",
    gap: 18,
    alignItems: "flex-start",
  },
  stepNumber: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 28,
    color: Colors.terracotta,
    lineHeight: 32,
    width: 44,
  },
  stepText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.encre,
    lineHeight: 24,
    paddingTop: 4,
  },

  whisperWrap: {
    marginTop: 48,
    alignItems: "center",
    paddingHorizontal: Spacing.screen,
  },
  whisperRule: {
    width: 28,
    height: 1,
    backgroundColor: Colors.rule,
    marginBottom: 14,
  },
  whisperText: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 13,
    color: Colors.cacao,
    textAlign: "center",
  },

  ctaWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.screen,
    paddingTop: 14,
  },
  ctaFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -40,
    height: 60,
  },
  ctaPrimary: {
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
  ctaPrimaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
    letterSpacing: 0.2,
  },

  notFoundWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.creme,
    padding: Spacing.screen,
    gap: 18,
  },
  notFoundTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 22,
    color: Colors.encre,
  },
  backCta: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
  },
  backCtaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.creme,
  },
});
