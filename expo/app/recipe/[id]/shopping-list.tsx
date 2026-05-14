import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
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
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  Share2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { Reveal } from "@/components/Reveal";
import { PressableScale } from "@/components/PressableScale";
import { SourceIcon } from "@/components/SourceIcon";
import { useRecipe } from "@/lib/api/recipes";
import { useServingsStore } from "@/stores/servingsStore";
import { useCheckedIngredientsStore } from "@/stores/checkedIngredientsStore";

// --- Utility functions (copied from app/recipe/[id].tsx — Option A) ---

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

// --- Main component ---

export default function ShoppingListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Recette complète (ingredients + steps) chargée depuis Supabase.
  // Partage le cache React Query ["recipe", id] avec la fiche recette
  // → si l'user vient de la fiche, le data est déjà chaud.
  const recipeQuery = useRecipe(id);
  const recipe = recipeQuery.data ?? undefined;
  const isLoading = recipeQuery.isLoading;
  const isError = recipeQuery.isError;

  const recipeId = recipe?.id ?? "";
  const defaultServings = recipe?.servings ?? 4;
  const servings = useServingsStore(
    (s) => s.servingsByRecipe[recipeId] ?? defaultServings,
  );
  const setServingsInStore = useServingsStore((s) => s.setServings);

  const checked = useCheckedIngredientsStore(
    (s) => s.checkedByRecipe[recipeId] ?? {},
  );
  const toggleCheckInStore = useCheckedIngredientsStore((s) => s.toggleCheck);
  const setManyChecked = useCheckedIngredientsStore((s) => s.setManyChecked);

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
      toggleCheckInStore(recipeId, idx);
    },
    [handleHaptic, recipeId, toggleCheckInStore],
  );

  const allIndices = useMemo(
    () => (recipe ? recipe.ingredients.map((_, i) => i) : []),
    [recipe],
  );
  const allChecked =
    allIndices.length > 0 && allIndices.every((i) => checked[i]);

  const toggleAll = useCallback(() => {
    handleHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setManyChecked(recipeId, allIndices, !allChecked);
  }, [allChecked, allIndices, handleHaptic, recipeId, setManyChecked]);

  const buildShoppingListText = useCallback((): string => {
    if (!recipe) return "";
    const header = `Liste de courses — ${recipe.title} (${servings} ${
      servings > 1 ? "personnes" : "personne"
    })`;
    const sections = grouped.map((g) => {
      const items = g.items
        .map((i) => `  • ${i.name}${i.quantity ? `  —  ${i.quantity}` : ""}`)
        .join("\n");
      return `\n${g.cat}\n${items}`;
    });
    return header + sections.join("\n");
  }, [recipe, servings, grouped]);

  const onShare = useCallback(async () => {
    if (!recipe) return;
    handleHaptic(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: buildShoppingListText(),
        title: `Liste de courses — ${recipe.title}`,
      });
    } catch {
      // share annulé ou indisponible, on ignore silencieusement
    }
  }, [recipe, handleHaptic, buildShoppingListText]);

  const grouped = useMemo(() => {
    if (!recipe)
      return [] as {
        cat: IngredientCategory;
        items: { idx: number; name: string; quantity: string }[];
      }[];
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
          On n&apos;a pas pu charger cette liste.
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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <PressableScale
          onPress={() => router.back()}
          style={styles.iconButton}
          scaleTo={0.92}
        >
          <ArrowLeft size={20} color={Colors.encre} strokeWidth={2} />
        </PressableScale>
        <Text style={styles.topTitle}>Liste de courses</Text>
        <PressableScale
          onPress={onShare}
          style={styles.iconButton}
          scaleTo={0.92}
          accessibilityLabel="Partager la liste de courses"
        >
          <Share2 size={18} color={Colors.encre} strokeWidth={2} />
        </PressableScale>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Recipe summary card */}
        <Reveal delay={80}>
          <View style={styles.summaryCard}>
            <Image
              source={{ uri: recipe.imageUrl }}
              style={styles.summaryImage}
            />
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle} numberOfLines={2}>
                {recipe.title}
              </Text>
              <View style={styles.summaryMetaRow}>
                <SourceIcon source={recipe.source} size={11} />
                <Text style={styles.summaryMeta} numberOfLines={1}>
                  {recipe.sourceAuthor ?? "Carnet perso"}
                </Text>
              </View>
            </View>
          </View>
        </Reveal>

        {/* Servings selector */}
        <Reveal delay={180}>
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

        {/* Ingredients to buy */}
        <Reveal delay={300}>
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>À acheter</Text>
              <Pressable
                onPress={toggleAll}
                hitSlop={8}
                style={styles.toggleAllLink}
                accessibilityRole="button"
                accessibilityLabel={
                  allChecked ? "Tout décocher" : "Tout cocher"
                }
              >
                <Text style={styles.toggleAllText}>
                  {allChecked ? "Tout décocher" : "Tout cocher"}
                </Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 18,
    color: Colors.encre,
  },
  summaryCard: {
    flexDirection: "row",
    gap: 14,
    marginHorizontal: Spacing.screen,
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.cremeDeep,
    borderRadius: Radius.cta,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  summaryImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: Colors.rule,
  },
  summaryText: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  summaryTitle: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 16,
    color: Colors.encre,
    lineHeight: 20,
  },
  summaryMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.cacao,
    flex: 1,
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
  toggleAllLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  toggleAllText: {
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
  },
  servingsValue: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 24,
    color: Colors.encre,
  },
  servingsUnit: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.cacao,
  },
  servingsHint: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    fontSize: 12,
    color: Colors.cacao,
  },
  groupTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 14,
    color: Colors.encre,
    marginBottom: 10,
  },
  groupList: {
    gap: 12,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.cacao,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxOn: {
    backgroundColor: Colors.terracotta,
    borderColor: Colors.terracotta,
  },
  ingredientName: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.encre,
  },
  ingredientNameDone: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  ingredientQty: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
  },
  ingredientQtyDone: {
    opacity: 0.5,
  },
  notFoundWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.creme,
    padding: 24,
  },
  notFoundTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 22,
    color: Colors.encre,
    marginBottom: 18,
  },
  backCta: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  backCtaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.creme,
  },
});
