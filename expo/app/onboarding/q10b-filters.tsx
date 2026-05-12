import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  CalendarDays,
  Clock,
  Leaf,
  Pencil,
  ShieldCheck,
  ShieldHalf,
  Users,
} from "lucide-react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { OnboardingFooter, OnboardingHeader } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { progressFor } from "@/constants/onboardingSteps";
import { useOnboardingStore } from "@/stores/onboardingStore";

const SAUGE_DEEP = "#5F6E52";
const SAUGE_SOFT = "#E6ECDF";
const PINK_SOFT = "#F5E3DC";
const MIEL_SOFT = "#F4E6C8";

type DietaryValue = string;
type AllergyValue =
  | "aucune"
  | "fruits-a-coque"
  | "arachides"
  | "lactose"
  | "oeufs"
  | "poisson-crustaces"
  | "soja";

/** Returns label used inside subtitle "Pas de X" — lowercase, gender-neutral. */
const dietaryToSubtitleWord = (v: DietaryValue): string | null => {
  switch (v) {
    case "vegetarien":
      return "viande";
    case "vegan":
      return "produits animaux";
    case "sans_gluten":
    case "sans-gluten":
      return "gluten";
    case "sans_lactose":
    case "sans-lactose":
      return "produits laitiers";
    default:
      return null;
  }
};

const allergyToSubtitleWord = (v: AllergyValue): string | null => {
  switch (v) {
    case "fruits-a-coque":
      return "fruits à coque";
    case "arachides":
      return "arachides";
    case "lactose":
      return "produits laitiers";
    case "oeufs":
      return "œufs";
    case "poisson-crustaces":
      return "poisson ni crustacés";
    case "soja":
      return "soja";
    default:
      return null;
  }
};

const dietaryToCardLabel = (v: DietaryValue): string | null => {
  switch (v) {
    case "vegetarien":
      return "Végétarienne";
    case "vegan":
      return "Vegan";
    case "sans_gluten":
    case "sans-gluten":
      return "Sans gluten";
    case "sans_lactose":
    case "sans-lactose":
      return "Sans lactose";
    default:
      return null;
  }
};

const allergyToCardLabel = (v: AllergyValue): string | null => {
  switch (v) {
    case "fruits-a-coque":
      return "Fruits à coque";
    case "arachides":
      return "Arachides";
    case "lactose":
      return "Lactose";
    case "oeufs":
      return "Œufs";
    case "poisson-crustaces":
      return "Poisson, crustacés";
    case "soja":
      return "Soja";
    default:
      return null;
  }
};

const cookingTimeLabel: Record<string, string> = {
  express: "Moins de 15 min par jour",
  semaine: "15 à 30 min par jour",
  "semaine-type": "15 à 30 min par jour",
  confort: "30 min à 1h par jour",
  afond: "Plus d'1h par jour",
  "a-fond": "Plus d'1h par jour",
};

const cookingFreqLabel: Record<string, string> = {
  jamais: "Quasiment jamais",
  "1-2": "1 à 2 fois par semaine",
  "3-5": "3 à 5 fois par semaine",
  tousJours: "Presque tous les jours",
  "tous-les-jours": "Presque tous les jours",
};

const householdLabel: Record<string, string> = {
  seul: "1 personne",
  moi: "1 personne",
  duo: "2 personnes",
  deux: "2 personnes",
  famille: "3 à 4 personnes",
  "famille-3-4": "3 à 4 personnes",
  plus: "Plus de 4 personnes",
};

export default function Q10bFiltersScreen() {
  const router = useRouter();
  const dietary = useOnboardingStore((s) => s.q8_restrictions);
  const allergies = useOnboardingStore((s) => s.allergies);
  const customExclusions = useOnboardingStore((s) => s.customExclusions);
  const cookingTime = useOnboardingStore((s) => s.cookingTime);
  const cookingFrequency = useOnboardingStore((s) => s.q6_frequency);
  const householdSize = useOnboardingStore((s) => s.q9_household);

  const composed = useMemo(() => {
    // Dietary list filtered to "real" diet restrictions (exclude rien / allergies / autre)
    const dietWords: string[] = [];
    const dietLabels: string[] = [];
    (dietary ?? []).forEach((d) => {
      const w = dietaryToSubtitleWord(d);
      if (w) dietWords.push(w);
      const l = dietaryToCardLabel(d);
      if (l) dietLabels.push(l);
    });

    // Allergies words / labels
    const allergyWords: string[] = [];
    const allergyLabels: string[] = [];
    (allergies ?? []).forEach((a) => {
      const w = allergyToSubtitleWord(a as AllergyValue);
      if (w) allergyWords.push(w);
      const l = allergyToCardLabel(a as AllergyValue);
      if (l) allergyLabels.push(l);
    });

    // Custom exclusions — lower case for subtitle, original casing for cards
    const customs = (customExclusions ?? []).map((c) => c.trim()).filter((c) => c.length > 0);
    const customWords = customs.map((c) => c.toLowerCase());

    // Deduplicate subtitle words preserving order
    const seen = new Set<string>();
    const subtitleWords = [...dietWords, ...allergyWords, ...customWords].filter((w) => {
      if (seen.has(w)) return false;
      seen.add(w);
      return true;
    });

    // Hide cards if no real diet AND (no allergies or only "aucune") AND no custom
    const hasRealDiet = dietLabels.length > 0;
    const hasAllergies =
      (allergies ?? []).some((a) => a !== "aucune") || customs.length > 0;
    const fallback = !hasRealDiet && !hasAllergies;

    // Card values
    const regimeValue = dietLabels.length > 0 ? dietLabels.join(", ") : "Aucun régime spécifique";

    const allergyAndCustomLabels: string[] = [
      ...allergyLabels,
      ...customs.map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
    ];
    let allergyCardValue: string;
    if (
      allergyAndCustomLabels.length === 0 ||
      ((allergies ?? []).includes("aucune") && allergyAndCustomLabels.length === 0)
    ) {
      allergyCardValue = "Aucune";
    } else if (allergyAndCustomLabels.length <= 2) {
      allergyCardValue = allergyAndCustomLabels.join(", ");
    } else {
      const remaining = allergyAndCustomLabels.length - 2;
      allergyCardValue = `${allergyAndCustomLabels[0]}, ${allergyAndCustomLabels[1]} + ${remaining} autre${remaining > 1 ? "s" : ""}`;
    }

    return {
      subtitleWords,
      fallback,
      regimeValue,
      allergyCardValue,
    };
  }, [dietary, allergies, customExclusions]);

  const renderSubtitle = () => {
    if (composed.fallback) {
      return <Text style={styles.subtitle}>Tes préférences sont notées.</Text>;
    }
    const words = composed.subtitleWords;
    let accentText: string;
    if (words.length <= 3) {
      accentText = words.map((w) => `pas de ${w}`).join(", ");
      accentText = accentText.charAt(0).toUpperCase() + accentText.slice(1) + ".";
    } else {
      const first = words.slice(0, 3).map((w) => `pas de ${w}`).join(", ");
      const remaining = words.length - 3;
      accentText = `${first.charAt(0).toUpperCase() + first.slice(1)} + ${remaining} autre${remaining > 1 ? "s" : ""}.`;
    }
    return (
      <Text style={styles.subtitle}>
        <Text style={styles.subtitleAccent}>{accentText}</Text>
        <Text> Bannis de tes propositions, pour de vrai.</Text>
      </Text>
    );
  };

  const title = composed.fallback
    ? "On adapte tout à ta vie."
    : "Plus jamais une recette qui te bloque.";

  const onContinue = () => {
    router.push("/onboarding/qualif-sources");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={progressFor("q10b-filters")} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={40}>
          <View style={styles.eyebrow}>
            <ShieldCheck size={14} color={SAUGE_DEEP} strokeWidth={2.4} />
            <Text style={styles.eyebrowText}>FILTRES ACTIVÉS</Text>
          </View>
        </Reveal>

        <Reveal delay={140}>
          <Text style={styles.title}>{title}</Text>
        </Reveal>

        <Reveal delay={240}>{renderSubtitle()}</Reveal>

        {!composed.fallback && (
          <>
            <Reveal delay={340}>
              <View style={[styles.card, styles.cardPriority]}>
                <View style={[styles.cardIcon, { backgroundColor: SAUGE_SOFT }]}>
                  <Leaf size={18} color={SAUGE_DEEP} strokeWidth={2.2} />
                </View>
                <View style={styles.cardTextCol}>
                  <Text style={styles.cardLabel}>RÉGIME</Text>
                  <Text style={styles.cardValue}>{composed.regimeValue}</Text>
                </View>
                <View style={styles.lockBadge}>
                  <Text style={styles.lockBadgeText}>VERROUILLÉ</Text>
                </View>
              </View>
            </Reveal>

            <Reveal delay={420}>
              <View style={[styles.card, styles.cardPriority, { marginTop: 12 }]}>
                <View style={[styles.cardIcon, { backgroundColor: PINK_SOFT }]}>
                  <ShieldHalf size={18} color={Colors.terracotta} strokeWidth={2.2} />
                </View>
                <View style={styles.cardTextCol}>
                  <Text style={styles.cardLabel}>ALLERGIES</Text>
                  <Text style={styles.cardValue}>{composed.allergyCardValue}</Text>
                </View>
                <View style={styles.lockBadge}>
                  <Text style={styles.lockBadgeText}>VERROUILLÉ</Text>
                </View>
              </View>
            </Reveal>

            <Reveal delay={500}>
              <Text style={styles.divider}>ET AUSSI</Text>
            </Reveal>
          </>
        )}

        <Reveal delay={composed.fallback ? 340 : 560}>
          <View style={[styles.card, { marginTop: composed.fallback ? 24 : 0 }]}>
            <View style={[styles.cardIcon, { backgroundColor: PINK_SOFT }]}>
              <Clock size={18} color={Colors.terracotta} strokeWidth={2.2} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardLabel}>TEMPS DISPO</Text>
              <Text style={styles.cardValue}>
                {cookingTime ? cookingTimeLabel[cookingTime] ?? "—" : "—"}
              </Text>
            </View>
          </View>
        </Reveal>

        <Reveal delay={composed.fallback ? 420 : 640}>
          <View style={[styles.card, { marginTop: 12 }]}>
            <View style={[styles.cardIcon, { backgroundColor: SAUGE_SOFT }]}>
              <CalendarDays size={18} color={SAUGE_DEEP} strokeWidth={2.2} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardLabel}>FRÉQUENCE</Text>
              <Text style={styles.cardValue}>
                {cookingFrequency ? cookingFreqLabel[cookingFrequency] ?? "—" : "—"}
              </Text>
            </View>
          </View>
        </Reveal>

        <Reveal delay={composed.fallback ? 500 : 720}>
          <View style={[styles.card, { marginTop: 12 }]}>
            <View style={[styles.cardIcon, { backgroundColor: MIEL_SOFT }]}>
              <Users size={18} color={Colors.miel} strokeWidth={2.2} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardLabel}>FOYER</Text>
              <Text style={styles.cardValue}>
                {householdSize ? householdLabel[householdSize] ?? "—" : "—"}
              </Text>
            </View>
          </View>
        </Reveal>

        <Reveal delay={composed.fallback ? 580 : 800}>
          <View style={styles.reassure}>
            <Pencil size={13} color={SAUGE_DEEP} strokeWidth={2.2} />
            <Text style={styles.reassureText}>
              Modifiable à tout moment dans tes paramètres.
            </Text>
          </View>
        </Reveal>
      </ScrollView>
      <OnboardingFooter onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  content: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 8,
    paddingBottom: 24,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  eyebrowText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.6,
    color: SAUGE_DEEP,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 32,
    lineHeight: 38,
    color: Colors.encre,
  },
  subtitle: {
    marginTop: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    lineHeight: 23,
    color: Colors.encre,
  },
  subtitleAccent: {
    color: Colors.terracotta,
    fontFamily: "Inter_600SemiBold",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.creme,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radius.card,
    padding: 14,
    marginTop: 22,
  },
  cardPriority: {
    borderWidth: 1.5,
    borderColor: SAUGE_DEEP,
    marginTop: 22,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTextCol: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.4,
    color: SAUGE_DEEP,
  },
  cardValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.encre,
    lineHeight: 20,
  },
  lockBadge: {
    backgroundColor: SAUGE_DEEP,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  lockBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 1.1,
    color: "#FFFFFF",
  },
  divider: {
    marginTop: 22,
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.4,
    color: SAUGE_DEEP,
  },
  reassure: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  reassureText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: SAUGE_DEEP,
  },
});
