import React, { useCallback, useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueries } from "@tanstack/react-query";
import { Check, ShoppingBasket, Trash2, Share2, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { Reveal } from "@/components/Reveal";
import { fetchRecipeById } from "@/lib/api/recipes";
import {
  CATEGORY_ORDER,
  categorize,
  scaleQuantity,
  type IngredientCategory,
} from "@/lib/shopping";
import { useShoppingListStore } from "@/stores/shoppingListStore";
import { useServingsStore } from "@/stores/servingsStore";
import { useCheckedIngredientsStore } from "@/stores/checkedIngredientsStore";

type CourseItem = {
  recipeId: string;
  idx: number;
  name: string;
  quantity: string;
};

type CourseGroup = {
  cat: IngredientCategory;
  items: CourseItem[];
};

// --- Ligne d'article (isolée) ---
//
// Même principe que l'écran par recette : chaque ligne s'abonne UNIQUEMENT à
// son propre booléen « pris / acheté ». Cocher ne re-render que sa ligne, donc
// pas de rechargement ni de saut de scroll sur l'onglet Courses.
const CourseRow = React.memo(function CourseRow({
  recipeId,
  idx,
  name,
  quantity,
  onToggle,
}: {
  recipeId: string;
  idx: number;
  name: string;
  quantity: string;
  onToggle: (recipeId: string, idx: number) => void;
}) {
  const bought = useShoppingListStore(
    (s) => !!s.boughtByRecipe[recipeId]?.[idx],
  );
  return (
    <Pressable
      onPress={() => onToggle(recipeId, idx)}
      style={styles.itemRow}
    >
      <View style={[styles.checkbox, bought && styles.checkboxOn]}>
        {bought && <Check size={13} color={Colors.creme} strokeWidth={3} />}
      </View>
      <Text style={[styles.itemName, bought && styles.itemDone]}>{name}</Text>
      <Text style={[styles.itemQty, bought && styles.itemDone]}>{quantity}</Text>
    </Pressable>
  );
});

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const recipeIds = useShoppingListStore((s) => s.recipeIds);
  const removeRecipe = useShoppingListStore((s) => s.removeRecipe);
  const clearList = useShoppingListStore((s) => s.clear);
  const toggleBought = useShoppingListStore((s) => s.toggleBought);

  const servingsByRecipe = useServingsStore((s) => s.servingsByRecipe);
  const checkedByRecipe = useCheckedIngredientsStore((s) => s.checkedByRecipe);

  const handleHaptic = useCallback((style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style).catch(() => {});
    }
  }, []);

  // Récupère toutes les recettes validées en une fois (cache partagé avec les
  // fiches via la queryKey ["recipe", id]).
  const results = useQueries({
    queries: recipeIds.map((id) => ({
      queryKey: ["recipe", id] as const,
      queryFn: () => fetchRecipeById(id),
      staleTime: 60_000,
    })),
  });

  const { groups, recipeCards, totalToBuy } = useMemo(() => {
    const buckets = new Map<IngredientCategory, CourseItem[]>();
    const cards: { id: string; title: string }[] = [];
    let total = 0;

    results.forEach((res, i) => {
      const recipe = res.data;
      const recipeId = recipeIds[i];
      if (!recipe) return;
      cards.push({ id: recipe.id, title: recipe.title });

      const servings = servingsByRecipe[recipeId] ?? recipe.servings ?? 4;
      const ratio = servings / (recipe.servings || 1);
      const ownedMap = checkedByRecipe[recipeId] ?? {};

      recipe.ingredients.forEach((ing, idx) => {
        // « j'ai déjà ça » coché sur la fiche → exclu de la liste de courses.
        if (ownedMap[idx]) return;
        const cat = categorize(ing.name);
        const list = buckets.get(cat) ?? [];
        list.push({
          recipeId,
          idx,
          name: ing.name,
          quantity: scaleQuantity(ing.quantity, ratio),
        });
        buckets.set(cat, list);
        total += 1;
      });
    });

    const grouped: CourseGroup[] = CATEGORY_ORDER.filter((c) =>
      buckets.has(c),
    ).map((c) => ({ cat: c, items: buckets.get(c) ?? [] }));

    return { groups: grouped, recipeCards: cards, totalToBuy: total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, recipeIds, servingsByRecipe, checkedByRecipe]);

  const isLoading =
    recipeIds.length > 0 && results.some((r) => r.isLoading);

  const onRemoveRecipe = useCallback(
    (recipeId: string) => {
      handleHaptic(Haptics.ImpactFeedbackStyle.Light);
      removeRecipe(recipeId);
    },
    [handleHaptic, removeRecipe],
  );

  const onClear = useCallback(() => {
    handleHaptic(Haptics.ImpactFeedbackStyle.Medium);
    clearList();
  }, [handleHaptic, clearList]);

  const onShare = useCallback(async () => {
    if (groups.length === 0) return;
    handleHaptic(Haptics.ImpactFeedbackStyle.Light);
    const sections = groups.map((g) => {
      const items = g.items
        .map((it) => `  • ${it.name}${it.quantity ? `  —  ${it.quantity}` : ""}`)
        .join("\n");
      return `\n${g.cat}\n${items}`;
    });
    const text = `Ma liste de courses — RecetteBox${sections.join("\n")}`;
    try {
      await Share.share({ message: text, title: "Ma liste de courses" });
    } catch {
      // annulé / indisponible
    }
  }, [groups, handleHaptic]);

  // --- État vide ---
  if (recipeIds.length === 0) {
    return (
      <View style={styles.wrap}>
        <View
          style={[
            styles.emptyWrap,
            { paddingTop: insets.top, paddingBottom: insets.bottom + 100 },
          ]}
        >
          <View style={styles.emptyIcon}>
            <ShoppingBasket size={34} color={Colors.sauge} strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyTitle}>Ta liste est vide.</Text>
          <Text style={styles.emptyBody}>
            Ouvre une recette, touche{" "}
            <Text style={styles.emptyBodyStrong}>Préparer mes courses</Text>,
            coche ce que tu as déjà, puis ajoute-la ici. Seules les recettes que
            tu choisis apparaissent.
          </Text>
          <Pressable
            onPress={() => {
              handleHaptic(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/library");
            }}
            style={({ pressed }) => [
              styles.emptyCta,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.emptyCtaText}>Voir mes recettes</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 120,
        }}
      >
        {/* En-tête */}
        <Reveal delay={0}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Mes courses</Text>
              <Pressable
                onPress={onShare}
                hitSlop={8}
                style={styles.headerIconBtn}
                accessibilityRole="button"
                accessibilityLabel="Partager ma liste de courses"
              >
                <Share2 size={18} color={Colors.encre} strokeWidth={2} />
              </Pressable>
            </View>
            <Text style={styles.headerSub}>
              {recipeIds.length} recette{recipeIds.length > 1 ? "s" : ""} ·{" "}
              {totalToBuy} article{totalToBuy > 1 ? "s" : ""} à acheter
            </Text>
          </View>
        </Reveal>

        {/* Recettes validées (avec retrait) */}
        <Reveal delay={120}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Recettes dans ma liste</Text>
            <View style={styles.chipsWrap}>
              {recipeCards.map((r) => (
                <View key={r.id} style={styles.chip}>
                  <Text
                    style={styles.chipText}
                    numberOfLines={1}
                  >
                    {r.title}
                  </Text>
                  <Pressable
                    onPress={() => onRemoveRecipe(r.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Retirer ${r.title} de ma liste`}
                  >
                    <X size={14} color={Colors.cacao} strokeWidth={2.4} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </Reveal>

        {/* Articles agrégés par rayon */}
        {isLoading && groups.length === 0 ? (
          <Text style={styles.loadingText}>Chargement de ta liste…</Text>
        ) : groups.length === 0 ? (
          <Text style={styles.allOwnedText}>
            Tu as déjà tout ce qu&apos;il te faut pour ces recettes. 🎉
          </Text>
        ) : (
          <Reveal delay={220}>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>À acheter</Text>
              <View style={{ gap: 22 }}>
                {groups.map((group) => (
                  <View key={group.cat}>
                    <Text style={styles.groupTitle}>{group.cat}</Text>
                    <View style={styles.groupList}>
                      {group.items.map((it) => (
                        <CourseRow
                          key={`${it.recipeId}:${it.idx}`}
                          recipeId={it.recipeId}
                          idx={it.idx}
                          name={it.name}
                          quantity={it.quantity}
                          onToggle={toggleBought}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Reveal>
        )}

        {/* Vider */}
        <Pressable
          onPress={onClear}
          style={({ pressed }) => [
            styles.clearRow,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Vider ma liste de courses"
        >
          <Trash2 size={16} color={Colors.cacao} strokeWidth={2} />
          <Text style={styles.clearText}>Vider ma liste</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  header: {
    paddingHorizontal: Spacing.screen,
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 30,
    color: Colors.encre,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    marginTop: 6,
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
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  chipText: {
    flexShrink: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.encre,
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
  itemRow: {
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
  itemName: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.encre,
  },
  itemQty: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
  },
  itemDone: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: Spacing.section,
  },
  allOwnedText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: Spacing.section,
    paddingHorizontal: Spacing.screen,
    lineHeight: 20,
  },
  clearRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 36,
    paddingVertical: 12,
  },
  clearText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.cacao,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 999,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 26,
    color: Colors.encre,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: Colors.cacao,
    textAlign: "center",
    maxWidth: 320,
  },
  emptyBodyStrong: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.encre,
  },
  emptyCta: {
    marginTop: 10,
    height: 50,
    paddingHorizontal: 28,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCtaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.creme,
    letterSpacing: 0.2,
  },
});
