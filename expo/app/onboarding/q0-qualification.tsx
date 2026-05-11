import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
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
import { useOnboardingStore } from "@/stores/onboardingStore";
import { navigateNextDemo, type DemoTrack } from "@/components/onboarding/navigateNextDemo";

type CardConfig = {
  value: DemoTrack;
  icon: string;
  label: string;
  sub: string;
};

const CARDS: CardConfig[] = [
  {
    value: "A",
    icon: "📱",
    label: "Réseaux sociaux",
    sub: "Insta, TikTok, Pinterest, YouTube…",
  },
  {
    value: "B",
    icon: "🌐",
    label: "Sites web de recettes",
    sub: "Marmiton, NYT Cooking, Google…",
  },
  {
    value: "C",
    icon: "📖",
    label: "Manuscrites ou imprimées",
    sub: "Carnet de famille, livres, photos…",
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
  const checkScale = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const borderAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(checkScale, {
        toValue: selected ? 1 : 0,
        useNativeDriver: true,
        speed: 18,
        bounciness: 10,
      }),
      Animated.timing(borderAnim, {
        toValue: selected ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [selected, checkScale, borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.rule, Colors.terracotta],
  });
  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FFFFFF", "rgba(200,101,74,0.06)"],
  });

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPressIn={() => {
        Animated.spring(scale, {
          toValue: 0.985,
          useNativeDriver: true,
          speed: 40,
          bounciness: 0,
        }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 6,
        }).start();
      }}
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress();
      }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale }],
            borderColor,
            backgroundColor: bgColor,
          },
        ]}
      >
        <View style={styles.iconBox}>
          <Text style={styles.iconEmoji}>{cfg.icon}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardLabel}>{cfg.label}</Text>
          <Text style={styles.cardSub}>{cfg.sub}</Text>
        </View>
        <View
          style={[
            styles.checkOuter,
            selected ? styles.checkOuterActive : styles.checkOuterIdle,
          ]}
        >
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <Check size={14} color={Colors.creme} strokeWidth={3.2} />
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function Q0QualificationScreen() {
  const router = useRouter();
  const stored = useOnboardingStore((s) => s.selectedSources);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const [selected, setSelected] = useState<DemoTrack[]>(
    (stored ?? []).filter((s): s is DemoTrack => s === "A" || s === "B" || s === "C")
  );

  const toggle = (value: DemoTrack) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const onContinue = () => {
    if (selected.length === 0) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setAnswer("selectedSources", selected);
    // Sync legacy parcours array for downstream demo screens that read q3_sources_demo
    const TRACK_TO_PARCOURS: Record<DemoTrack, "social" | "web" | "manuscript"> = {
      A: "social",
      B: "web",
      C: "manuscript",
    };
    setAnswer(
      "q3_sources_demo",
      selected.map((t) => TRACK_TO_PARCOURS[t])
    );
    navigateNextDemo(router, selected);
  };

  const onSkip = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    router.push("/onboarding/paywall-compare");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={0.5} onBack={() => router.back()} />
      <View style={styles.skipRow}>
        <Pressable hitSlop={12} onPress={onSkip}>
          <Text style={styles.skipLabel}>Passer</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={40}>
          <Text style={styles.eyebrow}>Étape clé</Text>
        </Reveal>
        <Reveal delay={140}>
          <Text style={styles.title}>
            D&apos;où viennent <Text style={styles.titleAccent}>tes recettes</Text> ?
          </Text>
        </Reveal>
        <Reveal delay={240}>
          <Text style={styles.subtitle}>
            Sélectionne tout ce qui s&apos;applique. On personnalise la suite selon toi.
          </Text>
        </Reveal>

        <View style={styles.cards}>
          {CARDS.map((cfg, i) => (
            <Reveal key={cfg.value} delay={340 + i * 90}>
              <SourceCard
                cfg={cfg}
                selected={selected.includes(cfg.value)}
                onPress={() => toggle(cfg.value)}
              />
            </Reveal>
          ))}
        </View>
      </ScrollView>

      <OnboardingFooter
        label="Continuer"
        disabled={selected.length === 0}
        onPress={onContinue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  skipRow: {
    position: "absolute",
    top: 0,
    right: Spacing.screen,
    paddingTop: 56,
    zIndex: 10,
  },
  skipLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.cacao,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 24,
  },
  eyebrow: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 14,
    color: Colors.terracotta,
  },
  title: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 32,
    color: Colors.encre,
    lineHeight: 35,
    marginTop: 8,
  },
  titleAccent: {
    fontFamily: "Fraunces_400Regular_Italic",
    color: Colors.terracotta,
    fontWeight: "600" as const,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    lineHeight: 22.5,
    marginTop: 12,
  },
  cards: {
    marginTop: 28,
    gap: 12,
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 16,
    color: Colors.encre,
  },
  cardSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.cacao,
    opacity: 0.8,
  },
  checkOuter: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  checkOuterIdle: {
    borderColor: Colors.rule,
    backgroundColor: "transparent",
  },
  checkOuterActive: {
    borderColor: Colors.terracotta,
    backgroundColor: Colors.terracotta,
  },
});

// Default-exported screen above
export const __screen = "Q0_Qualification";
