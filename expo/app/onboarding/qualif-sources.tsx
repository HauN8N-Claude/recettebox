import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { BookMarked, Check, Globe, Instagram, Music2, Bookmark } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { OnboardingFooter, OnboardingHeader } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { progressFor } from "@/constants/onboardingSteps";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { navigateNextDemo, type DemoParcours } from "@/components/onboarding/navigateNextDemo";

type CardConfig = {
  value: DemoParcours;
  label: string;
  sublabel: string;
  accent: string;
  comingSoon?: boolean;
  renderTrailing: (color: string) => React.ReactNode;
};

const CARDS: CardConfig[] = [
  {
    value: "social",
    label: "Réseaux sociaux",
    sublabel: "Insta · TikTok · Pinterest",
    accent: Colors.terracotta,
    renderTrailing: (color) => (
      <View style={styles.iconRow}>
        <Instagram size={16} color={color} strokeWidth={1.8} />
        <Music2 size={16} color={color} strokeWidth={1.8} />
        <Bookmark size={16} color={color} strokeWidth={1.8} />
      </View>
    ),
  },
  {
    value: "web",
    label: "Sites web ou blogs",
    sublabel: "Marmiton, blogs, magazines en ligne…",
    accent: Colors.sauge,
    comingSoon: true,
    renderTrailing: (color) => <Globe size={20} color={color} strokeWidth={1.8} />,
  },
  {
    value: "manuscript",
    label: "Recettes manuscrites ou imprimées",
    sublabel: "Carnet de famille, livre de cuisine, photo de magazine…",
    accent: Colors.miel,
    comingSoon: true,
    renderTrailing: (color) => <BookMarked size={20} color={color} strokeWidth={1.8} />,
  },
];

function SourceCard({
  cfg,
  selected,
  onPress,
}: {
  cfg: CardConfig;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const disabled = !!cfg.comingSoon;
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      onPressIn={() => {
        if (disabled) return;
        Animated.spring(scale, {
          toValue: 0.98,
          useNativeDriver: true,
          speed: 40,
          bounciness: 0,
        }).start();
      }}
      onPressOut={() => {
        if (disabled) return;
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 6,
        }).start();
      }}
      onPress={() => {
        if (disabled) return;
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress();
      }}
    >
      <Animated.View
        style={[
          styles.card,
          selected
            ? { backgroundColor: Colors.creme, borderColor: cfg.accent, borderWidth: 2 }
            : { backgroundColor: Colors.cremeDeep, borderColor: Colors.rule, borderWidth: 1 },
          { transform: [{ scale }] },
          disabled && styles.cardDisabled,
        ]}
      >
        <View
          style={[
            styles.checkbox,
            selected
              ? { backgroundColor: cfg.accent, borderColor: cfg.accent }
              : { borderColor: Colors.cacao },
          ]}
        >
          {selected ? <Check size={14} color={Colors.creme} strokeWidth={3} /> : null}
        </View>
        <View style={styles.cardText}>
          <View style={styles.labelRow}>
            <Text style={[styles.cardLabel, selected && styles.cardLabelActive]}>
              {cfg.label}
            </Text>
            {disabled && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Bientôt</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardSublabel}>{cfg.sublabel}</Text>
        </View>
        <View style={styles.trailing}>{cfg.renderTrailing(Colors.cacao)}</View>
      </Animated.View>
    </Pressable>
  );
}

export default function QualifSourcesScreen() {
  const router = useRouter();
  // q14_firstName n'est jamais set pendant l'onboarding initial.
  // Il sera renseigné par l'auth (Apple/Google/Email) déclenchée au paywall
  // final, donc la salutation personnalisée n'est active qu'aux sessions
  // suivantes (utilisateur revenant déjà connecté). Le fallback ci-dessous
  // gère le premier passage.
  const firstName = useOnboardingStore((s) => s.q14_firstName);
  const stored = useOnboardingStore((s) => s.q3_sources_demo);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const [selected, setSelected] = useState<DemoParcours[]>(
    (stored ?? []).filter((s) => s === "social")
  );

  const toggle = (value: DemoParcours) => {
    if (value !== "social") return;
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const onContinue = () => {
    if (selected.length === 0) return;
    setAnswer("q3_sources_demo", selected);
    navigateNextDemo(router, selected);
  };

  const displayName = firstName?.trim();

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={progressFor("qualif-sources")} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={60}>
          <Text style={styles.title}>
            {displayName
              ? `${displayName}, on va te montrer comment ça marche.`
              : "On va te montrer comment ça marche."}
          </Text>
        </Reveal>
        <Reveal delay={180}>
          <Text style={styles.subtitle}>D&apos;où viennent tes recettes ?</Text>
        </Reveal>
        <Reveal delay={240}>
          <Text style={styles.subtitleMuted}>Plusieurs choix possibles.</Text>
        </Reveal>

        <View style={styles.cards}>
          {CARDS.map((cfg, i) => (
            <Reveal key={cfg.value} delay={340 + i * 100}>
              <SourceCard
                cfg={cfg}
                selected={selected.includes(cfg.value)}
                onPress={() => toggle(cfg.value)}
              />
            </Reveal>
          ))}
        </View>
      </ScrollView>
      <OnboardingFooter disabled={selected.length === 0} onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  content: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 6,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 26,
    color: Colors.encre,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    marginTop: 12,
  },
  subtitleMuted: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    opacity: 0.75,
  },
  cards: {
    marginTop: 28,
    gap: 14,
  },
  card: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: Radius.cta,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.encre,
  },
  cardLabelActive: {
    fontFamily: "Inter_600SemiBold",
  },
  cardSublabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
  },
  trailing: {
    marginLeft: 8,
  },
  iconRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  cardDisabled: {
    opacity: 0.55,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  badgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.cacao,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
