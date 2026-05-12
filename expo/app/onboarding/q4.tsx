import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";

import { Colors, Spacing } from "@/constants/theme";
import { OnboardingFooter, OnboardingHeader } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { progressFor } from "@/constants/onboardingSteps";
import { useOnboardingStore, type OnboardingAnswers } from "@/stores/onboardingStore";

type Source = OnboardingAnswers["q4_sources"][number];

const OPTIONS: { value: Source; label: string; icon: string }[] = [
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "instagram", label: "Instagram", icon: "📷" },
  { value: "pinterest", label: "Pinterest", icon: "📌" },
];

export default function Q4Screen() {
  const router = useRouter();
  const stored = useOnboardingStore((s) => s.q4_sources);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const [selected, setSelected] = useState<Source[]>(
    (stored ?? []).filter(
      (s): s is Source => s === "tiktok" || s === "instagram" || s === "pinterest"
    )
  );

  const toggle = (value: Source) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const onContinue = () => {
    if (selected.length === 0) return;
    setAnswer("q4_sources", selected);
    const PLATFORM_LABEL: Record<Source, string> = {
      tiktok: "TikTok",
      instagram: "Instagram",
      pinterest: "Pinterest",
    };
    setAnswer("platforms", selected.map((s) => PLATFORM_LABEL[s]));
    router.push("/onboarding/q4b");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={progressFor("q4")} onBack={() => router.back()} />
      <View style={styles.content}>
        <Reveal delay={60}>
          <Text style={styles.title}>Où tu trouves le plus de recettes ?</Text>
        </Reveal>
        <Reveal delay={160}>
          <Text style={styles.subtitle}>Plusieurs choix possibles.</Text>
        </Reveal>

        <View style={styles.options}>
          {OPTIONS.map((opt, i) => (
            <Reveal key={opt.value} delay={240 + i * 70}>
              <SourceCard
                label={opt.label}
                icon={opt.icon}
                selected={selected.includes(opt.value)}
                onPress={() => toggle(opt.value)}
              />
            </Reveal>
          ))}
        </View>
      </View>
      <OnboardingFooter disabled={selected.length === 0} onPress={onContinue} />
    </View>
  );
}

function SourceCard({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  const checkScale = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const borderAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(checkScale, {
        toValue: selected ? 1 : 0,
        duration: 200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(borderAnim, {
        toValue: selected ? 1 : 0,
        duration: 200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
    ]).start();
  }, [selected, checkScale, borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.rule, Colors.terracotta],
  });
  const borderWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 2],
  });

  return (
    <Pressable onPress={onPress} testID={`source-${label}`}>
      <Animated.View
        style={[
          styles.card,
          {
            borderColor,
            borderWidth,
          },
        ]}
      >
        <View style={styles.radioWrap}>
          <Animated.View
            style={[
              styles.radioOuter,
              {
                borderColor,
                backgroundColor: selected ? Colors.terracotta : "transparent",
              },
            ]}
          >
            <Animated.View
              style={{
                transform: [{ scale: checkScale }],
                opacity: checkScale,
              }}
            >
              <Svg width={12} height={12} viewBox="0 0 12 12">
                <Path
                  d="M2.5 6.2 L5 8.7 L9.5 3.5"
                  stroke={Colors.creme}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </Animated.View>
          </Animated.View>
        </View>

        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>

        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 8,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 28,
    color: Colors.encre,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    marginTop: 8,
  },
  options: {
    marginTop: 20,
    gap: 10,
  },
  card: {
    height: 56,
    backgroundColor: Colors.creme,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radioWrap: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  iconText: {
    fontSize: 16,
  },
  label: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.encre,
  },
});
