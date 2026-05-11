import React, { useMemo, useState, useCallback } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BookOpen,
  Heart,
  Instagram,
  Link2,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { recipes, type Recipe } from "@/constants/mockData";
import { useRouter } from "expo-router";

import { Reveal } from "@/components/Reveal";
import { PressableScale } from "@/components/PressableScale";
import { SourceIcon } from "@/components/SourceIcon";

type FilterKey = "all" | "antigaspi" | "recent" | "favorites";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "antigaspi", label: "Anti-gaspi" },
  { key: "recent", label: "Récentes" },
  { key: "favorites", label: "Favoris" },
];

type ModeKey = "j1" | "j12";

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mode, setMode] = useState<ModeKey>("j12");
  const [query, setQuery] = useState<string>("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const toggleMode = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    setMode((m) => (m === "j1" ? "j12" : "j1"));
    setQuery("");
    setFilter("all");
  }, []);

  const filtered = useMemo<Recipe[]>(() => {
    let list = recipes;
    if (filter === "antigaspi") {
      list = list.filter((r) => r.tags.includes("anti-gaspi"));
    } else if (filter === "favorites") {
      list = list.filter((r) => r.isFavorite);
    } else if (filter === "recent") {
      list = [...list].sort((a, b) =>
        b.importedAt.localeCompare(a.importedAt),
      );
    }
    const q = query.trim().toLowerCase();
    if (q.length > 0) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          (r.sourceAuthor ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [filter, query]);

  const isEmpty = mode === "j1";

  return (
    <View style={styles.container}>
      <View
        style={[styles.headerWrap, { paddingTop: insets.top + 12 }]}
      >
        <Reveal delay={0}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Ton carnet</Text>
              <Text style={styles.subtitle}>
                {isEmpty
                  ? "Tout commence ici."
                  : `${recipes.length} recettes sauvées`}
              </Text>
            </View>
            <DevToggle mode={mode} onToggle={toggleMode} />
          </View>
        </Reveal>

        {!isEmpty && (
          <Reveal delay={120}>
            <View style={styles.searchWrap}>
              <Search size={16} color={Colors.cacao} strokeWidth={2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Chercher dans ton carnet"
                placeholderTextColor={Colors.cacao + "99"}
                style={styles.searchInput}
                autoCorrect={false}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable
                  onPress={() => setQuery("")}
                  hitSlop={8}
                  style={styles.searchClear}
                >
                  <X size={14} color={Colors.cacao} strokeWidth={2} />
                </Pressable>
              )}
            </View>
          </Reveal>
        )}

        {!isEmpty && (
          <Reveal delay={220}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <PressableScale
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    style={[
                      styles.filterPill,
                      active && styles.filterPillActive,
                    ]}
                    scaleTo={0.95}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </PressableScale>
                );
              })}
            </ScrollView>
          </Reveal>
        )}
      </View>

      {isEmpty ? (
        <EmptyState
          insetsBottom={insets.bottom}
          onImport={() => router.push("/import")}
        />
      ) : (
        <PopulatedGrid
          list={filtered}
          insetsBottom={insets.bottom}
          query={query}
          onOpen={(id) => router.push(`/recipe/${id}`)}
        />
      )}
    </View>
  );
}

function DevToggle({
  mode,
  onToggle,
}: {
  mode: ModeKey;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} hitSlop={6} style={styles.devToggle}>
      <View
        style={[
          styles.devDot,
          { backgroundColor: mode === "j1" ? Colors.encre : Colors.cacao },
        ]}
      />
      <Text style={styles.devText}>
        {mode === "j1" ? "J1" : "J12"}
      </Text>
    </Pressable>
  );
}

function EmptyState({
  insetsBottom,
  onImport,
}: {
  insetsBottom: number;
  onImport: () => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={[
        styles.emptyScroll,
        { paddingBottom: insetsBottom + 120 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Reveal delay={300}>
        <View style={styles.emptyHero}>
          <View style={styles.emptyIconRing}>
            <BookOpen size={28} color={Colors.terracotta} strokeWidth={1.6} />
          </View>
          <Text style={styles.emptyTitle}>
            Ton carnet est encore vierge.
          </Text>
          <Text style={styles.emptyBody}>
            Importe ta première recette — celle que tu sauves toujours sans
            jamais la cuisiner.
          </Text>
        </View>
      </Reveal>

      <Reveal delay={460}>
        <PressableScale style={styles.primaryCta} onPress={onImport}>
          <Plus size={18} color={Colors.creme} strokeWidth={2.2} />
          <Text style={styles.primaryCtaText}>Importer une recette</Text>
        </PressableScale>
      </Reveal>

      <Reveal delay={620}>
        <Text style={[styles.systemLabel, styles.emptyLabel]}>
          Trois façons d&apos;ajouter
        </Text>
      </Reveal>

      <Reveal delay={760}>
        <View style={styles.methodList}>
          <MethodCard
            icon={<Instagram size={18} color={Colors.terracotta} strokeWidth={1.8} />}
            title="Coller un lien"
            body="Instagram, TikTok, Pinterest, blog. On extrait tout."
          />
          <MethodCard
            icon={<Link2 size={18} color={Colors.sauge} strokeWidth={1.8} />}
            title="Partager depuis une app"
            body="Bouton Partager → RecetteBox, où que tu sois."
          />
          <MethodCard
            icon={<Sparkles size={18} color={Colors.miel} strokeWidth={1.8} />}
            title="Écrire à la main"
            body="Pour les recettes de famille, celles qui n&apos;existent qu&apos;ici."
          />
        </View>
      </Reveal>

      <Reveal delay={920}>
        <View style={styles.whisperWrap}>
          <View style={styles.whisperRule} />
          <Text style={styles.whisperText}>
            Remettre de l&apos;ordre dans ton chaos, une recette à la fois.
          </Text>
        </View>
      </Reveal>
    </ScrollView>
  );
}

function MethodCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.methodCard}>
      <View style={styles.methodIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.methodTitle}>{title}</Text>
        <Text style={styles.methodBody}>{body}</Text>
      </View>
    </View>
  );
}

function PopulatedGrid({
  list,
  insetsBottom,
  query,
  onOpen,
}: {
  list: Recipe[];
  insetsBottom: number;
  query: string;
  onOpen: (id: string) => void;
}) {
  if (list.length === 0) {
    return (
      <View style={styles.noMatch}>
        <Reveal delay={120}>
          <Text style={styles.noMatchTitle}>Rien ne correspond.</Text>
          <Text style={styles.noMatchBody}>
            Essaie un autre mot que « {query} ».
          </Text>
        </Reveal>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.gridScroll,
        { paddingBottom: insetsBottom + 120 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.grid}>
        {list.map((r, i) => (
          <Reveal
            key={r.id}
            delay={300 + Math.min(i, 8) * 60}
            style={styles.gridItem}
          >
            <RecipeGridCard recipe={r} onPress={() => onOpen(r.id)} />
          </Reveal>
        ))}
      </View>
    </ScrollView>
  );
}

function RecipeGridCard({
  recipe,
  onPress,
}: {
  recipe: Recipe;
  onPress: () => void;
}) {
  return (
    <PressableScale style={styles.card} scaleTo={0.97} onPress={onPress}>
      <View style={styles.cardImageWrap}>
        <Image source={{ uri: recipe.imageUrl }} style={styles.cardImage} />
        {recipe.isFavorite && (
          <View style={styles.favBadge}>
            <Heart
              size={12}
              color={Colors.terracotta}
              fill={Colors.terracotta}
              strokeWidth={0}
            />
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.cardSourceRow}>
          <SourceIcon source={recipe.source} size={11} />
          <Text style={styles.cardSource} numberOfLines={1}>
            {recipe.sourceAuthor ?? "Carnet perso"}
          </Text>
        </View>
        <Text style={styles.cardMeta}>
          {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min ·{" "}
          {recipe.servings} pers.
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  headerWrap: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 28,
    color: Colors.encre,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
    marginTop: 4,
  },
  devToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.encre,
  },
  devDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.miel,
  },
  devText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.creme,
    letterSpacing: 0.6,
  },

  searchWrap: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    backgroundColor: Colors.cremeDeep,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.encre,
    padding: 0,
  },
  searchClear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.rule,
  },

  filterRow: {
    gap: 8,
    paddingTop: 16,
    paddingRight: Spacing.screen,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.rule,
    backgroundColor: Colors.creme,
  },
  filterPillActive: {
    backgroundColor: Colors.terracotta,
    borderColor: Colors.terracotta,
  },
  filterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.cacao,
  },
  filterTextActive: {
    color: Colors.creme,
    fontFamily: "Inter_600SemiBold",
  },

  gridScroll: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
  gridItem: {
    width: "48%",
  },
  card: {
    backgroundColor: Colors.cremeDeep,
    borderRadius: Radius.cta,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  cardImageWrap: {
    position: "relative",
  },
  cardImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: Colors.rule,
  },
  favBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.creme,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: 12,
    gap: 6,
  },
  cardTitle: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 16,
    color: Colors.encre,
    lineHeight: 20,
    minHeight: 40,
  },
  cardSourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardSource: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.cacao,
    flex: 1,
  },
  cardMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.cacao,
    letterSpacing: 0.2,
  },

  noMatch: {
    flex: 1,
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: Spacing.screen,
  },
  noMatchTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 22,
    color: Colors.encre,
    textAlign: "center",
  },
  noMatchBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    marginTop: 8,
    textAlign: "center",
  },

  emptyScroll: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 40,
    alignItems: "stretch",
  },
  emptyHero: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  emptyTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 26,
    color: Colors.encre,
    textAlign: "center",
    lineHeight: 32,
  },
  emptyBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
    maxWidth: 320,
  },
  primaryCta: {
    marginTop: 32,
    height: 54,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryCtaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
  },
  systemLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    color: Colors.sauge,
  },
  emptyLabel: {
    marginTop: 40,
    marginBottom: 14,
    textAlign: "center",
  },
  methodList: {
    gap: 10,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    backgroundColor: Colors.cremeDeep,
    borderRadius: Radius.cta,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  methodIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.creme,
    alignItems: "center",
    justifyContent: "center",
  },
  methodTitle: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 16,
    color: Colors.encre,
  },
  methodBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
    marginTop: 2,
    lineHeight: 18,
  },
  whisperWrap: {
    marginTop: 40,
    alignItems: "center",
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
});
