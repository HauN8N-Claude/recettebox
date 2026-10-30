import React, { useCallback, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { currentUser } from "@/constants/mockData";
import { useRecipes } from "@/lib/api/recipes";
import { useAuthStore } from "@/stores/authStore";
import { Reveal } from "@/components/Reveal";
import { PressableScale } from "@/components/PressableScale";
import { SourceIcon } from "@/components/SourceIcon";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [revealKey, setRevealKey] = useState<number>(0);

  // Recettes du user depuis Supabase. Le cache est partagé avec library.tsx
  // (queryKey ["recipes"]) : pas de double fetch en passant d'un tab à l'autre.
  const recipesQuery = useRecipes();
  const recipesList = recipesQuery.data ?? [];
  // Triées par imported_at desc dans fetchRecipes → la plus récente est en [0],
  // les 4 suivantes alimentent le carrousel "Récemment importées".
  const suggestedRecipe = recipesList[0];
  const recentlyImported = recipesList.slice(1, 5);

  // Nouvel utilisateur sans aucune recette → on affiche l'état vide didactique
  // (le geste de partage) à la place du hero de stats.
  const user = useAuthStore((s) => s.user);
  const firstName =
    (user?.user_metadata?.first_name as string | undefined)?.trim() ||
    currentUser.firstName;
  const isEmpty = !recipesQuery.isLoading && recipesList.length === 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await recipesQuery.refetch();
    } finally {
      setRefreshing(false);
      setRevealKey((k) => k + 1);
    }
  }, [recipesQuery]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.terracotta}
          colors={[Colors.terracotta]}
        />
      }
    >
      {/* HEADER */}
      <Reveal key={`h-${revealKey}`} delay={0}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>
              Bonjour {firstName} <Text>☀️</Text>
            </Text>
          </View>
          <PressableScale
            onPress={() => router.push("/(tabs)/profile")}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {firstName.charAt(0)}
            </Text>
          </PressableScale>
        </View>
      </Reveal>

      {/* ÉTAT VIDE — nouvel utilisateur : on enseigne le geste de partage */}
      {isEmpty && (
        <Reveal key={`e-${revealKey}`} delay={200}>
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>
              Ta première recette t&apos;attend.
            </Text>
            <Text style={styles.emptySub}>
              Importe-la en 3 gestes, directement depuis Insta ou TikTok :
            </Text>
            <View style={styles.emptySteps}>
              <EmptyStep
                n="1"
                text="Ouvre un Reel ou une vidéo TikTok de recette"
              />
              <EmptyStep n="2" text="Appuie sur « Partager »" />
              <EmptyStep
                n="3"
                text="Choisis RecetteBox — on s'occupe du reste"
              />
            </View>
          </View>
        </Reveal>
      )}

      {/* HERO PROGRESS */}
      {!isEmpty && (
      <Reveal key={`p-${revealKey}`} delay={200}>
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={[Colors.creme, "rgba(232,184,106,0.14)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.heroLabel}>TON CARNET</Text>
            <Text style={styles.heroStat}>
              {recipesList.length}{" "}
              {recipesList.length > 1 ? "recettes" : "recette"}
            </Text>
            <Text style={styles.heroSub}>
              Tes recettes préférées, prêtes à cuisiner.
            </Text>
          </LinearGradient>
        </View>
      </Reveal>
      )}

      {/* SUGGESTION (masqué si pas de recettes en BD) */}
      {suggestedRecipe && (
        <Reveal key={`s-${revealKey}`} delay={380}>
          <View style={styles.section}>
            <Text style={[styles.systemLabel, { color: Colors.sauge }]}>
              Suggestion du jour
            </Text>
            <PressableScale
              onPress={() => router.push(`/recipe/${suggestedRecipe.id}`)}
              style={styles.suggestionCard}
            >
              <Image
                source={{ uri: suggestedRecipe.imageUrl }}
                style={styles.suggestionImage}
              />
              <View style={styles.suggestionBody}>
                <Text style={styles.suggestionTitle} numberOfLines={2}>
                  {suggestedRecipe.title}
                </Text>
                <View style={styles.pillRow}>
                  <View style={styles.saugePill}>
                    <Text style={styles.saugePillText}>Anti-gaspi</Text>
                  </View>
                </View>
                <Text style={styles.suggestionMeta}>
                  {suggestedRecipe.prepTimeMinutes +
                    suggestedRecipe.cookTimeMinutes}{" "}
                  min · {suggestedRecipe.servings} personnes
                </Text>
                <View style={styles.ghostCta}>
                  <Text style={styles.ghostCtaText}>Voir la recette</Text>
                  <ArrowRight size={14} color={Colors.terracotta} strokeWidth={2.2} />
                </View>
              </View>
            </PressableScale>
          </View>
        </Reveal>
      )}

      {/* RECENTLY IMPORTED (masqué si pas assez de recettes en BD) */}
      {recentlyImported.length > 0 && (
        <Reveal key={`r-${revealKey}`} delay={740}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.systemLabel, { color: Colors.cacao }]}>
                Récemment importées
              </Text>
              <PressableScale
                onPress={() => router.push("/(tabs)/library")}
                haptic
              >
                <View style={styles.linkRow}>
                  <Text style={styles.linkText}>Voir tout</Text>
                  <ArrowRight size={13} color={Colors.terracotta} strokeWidth={2.2} />
                </View>
              </PressableScale>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={172}
              decelerationRate="fast"
              contentContainerStyle={styles.carousel}
            >
              {recentlyImported.map((r) => (
                <PressableScale
                  key={r.id}
                  onPress={() => router.push(`/recipe/${r.id}`)}
                  style={styles.miniCard}
                >
                  <Image
                    source={{ uri: r.imageUrl }}
                    style={styles.miniImage}
                  />
                  <View style={styles.miniBody}>
                    <Text style={styles.miniTitle} numberOfLines={2}>
                      {r.title}
                    </Text>
                    <View style={styles.miniSourceRow}>
                      <SourceIcon source={r.source} />
                      <Text style={styles.miniSource} numberOfLines={1}>
                        {r.sourceAuthor ?? "Carnet perso"}
                      </Text>
                    </View>
                  </View>
                </PressableScale>
              ))}
            </ScrollView>
          </View>
        </Reveal>
      )}

      {/* FOOTER WHISPER */}
      <Reveal key={`f-${revealKey}`} delay={920}>
        <View style={styles.footer}>
          <View style={styles.footerRule} />
          <Text style={styles.footerText}>
            Remettre de l&apos;ordre dans ton chaos, une recette à la fois.
          </Text>
        </View>
      </Reveal>
    </ScrollView>
  );
}

function EmptyStep({ n, text }: { n: string; text: string }) {
  return (
    <View style={styles.emptyStepRow}>
      <View style={styles.emptyStepNum}>
        <Text style={styles.emptyStepNumText}>{n}</Text>
      </View>
      <Text style={styles.emptyStepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  emptyWrap: {
    marginHorizontal: Spacing.screen,
    backgroundColor: Colors.cremeDeep,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.rule,
    padding: 22,
  },
  emptyTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 22,
    color: Colors.encre,
    lineHeight: 28,
  },
  emptySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    marginTop: 8,
    lineHeight: 20,
  },
  emptySteps: {
    marginTop: 18,
    gap: 14,
  },
  emptyStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  emptyStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStepNumText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.creme,
  },
  emptyStepText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.encre,
    lineHeight: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.screen,
    paddingTop: 4,
    paddingBottom: 24,
  },
  hello: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 28,
    color: Colors.encre,
    lineHeight: 34,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 16,
    color: Colors.creme,
  },

  heroWrap: {
    paddingHorizontal: Spacing.screen,
  },
  hero: {
    borderRadius: Radius.card,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  heroLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    color: Colors.sauge,
    marginBottom: 14,
  },
  heroStat: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 22,
    color: Colors.encre,
    lineHeight: 28,
  },
  heroSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    marginTop: 6,
  },
  curveWrap: {
    marginTop: 12,
    marginBottom: 8,
  },
  heroEncourage: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 14,
    color: Colors.sauge,
    marginTop: 4,
  },

  section: {
    paddingHorizontal: Spacing.screen,
    marginTop: Spacing.section,
  },
  systemLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.terracotta,
    letterSpacing: 0.3,
  },

  suggestionCard: {
    backgroundColor: Colors.cremeDeep,
    borderRadius: Radius.card,
    padding: 14,
    flexDirection: "row",
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  suggestionImage: {
    width: 100,
    height: 100,
    borderRadius: Radius.cta,
    backgroundColor: Colors.rule,
  },
  suggestionBody: {
    flex: 1,
    justifyContent: "space-between",
  },
  suggestionTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 20,
    color: Colors.encre,
    lineHeight: 24,
  },
  pillRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  saugePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: "rgba(138,154,123,0.18)",
  },
  saugePillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.sauge,
    letterSpacing: 0.3,
  },
  suggestionMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
    marginTop: 4,
  },
  ghostCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  ghostCtaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.terracotta,
  },

  carousel: {
    gap: 12,
    paddingRight: Spacing.screen,
  },
  miniCard: {
    width: 160,
    backgroundColor: Colors.cremeDeep,
    borderRadius: Radius.cta,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  miniImage: {
    width: 160,
    height: 120,
    backgroundColor: Colors.rule,
  },
  miniBody: {
    padding: 12,
    gap: 8,
  },
  miniTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 16,
    color: Colors.encre,
    lineHeight: 20,
    minHeight: 40,
  },
  miniSourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniSource: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.cacao,
    flex: 1,
  },

  footer: {
    paddingHorizontal: Spacing.screen,
    marginTop: Spacing.section + 8,
    alignItems: "center",
  },
  footerRule: {
    width: 28,
    height: 1,
    backgroundColor: Colors.rule,
    marginBottom: 16,
  },
  footerText: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 13,
    color: Colors.cacao,
    textAlign: "center",
  },
});
