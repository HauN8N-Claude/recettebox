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

import { Colors } from "@/constants/theme";
import { OnboardingFooter, OnboardingHeader } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { progressFor } from "@/constants/onboardingSteps";
import { useOnboardingStore, type OnboardingAnswers } from "@/stores/onboardingStore";

type Ratio = NonNullable<OnboardingAnswers["q5_cooked_ratio"]>;

const OPTIONS: { value: Ratio; label: string; icon: string }[] = [
  { value: "almost_all", label: "Toutes ou presque", icon: "🔥" },
  { value: "half", label: "À peu près la moitié", icon: "🍳" },
  { value: "few", label: "Quelques-unes seulement", icon: "😅" },
  { value: "none", label: "Aucune, honnêtement", icon: "🥲" },
];

export default function Q5Screen() {
  const router = useRouter();
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const [selected, setSelected] = useState<Ratio | null>(null);

  const onSelect = (value: Ratio) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setSelected(value);
  };

  const onContinue = () => {
    if (!selected) return;
    setAnswer("q5_cooked_ratio", selected);
    const RATIO_MAP = {
      almost_all: "toutes",
      half: "moitie",
      few: "quelques",
      none: "aucune",
    } as const;
    setAnswer("cookedRatio", RATIO_MAP[selected]);
    router.push("/onboarding/q11");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={progressFor("q5")} onBack={() => router.back()} />
      <View style={styles.content}>
        <Reveal delay={60}>
          <Text style={styles.title}>Et combien tu en as vraiment cuisinées ?</Text>
        </Reveal>
        <Reveal delay={160}>
          <Text style={styles.subtitle}>Sois honnête, on ne juge pas.</Text>
        </Reveal>

        <View style={styles.options}>
          {OPTIONS.map((opt, i) => (
            <Reveal key={opt.value} delay={240 + i * 70}>
              <RatioCard
                label={opt.label}
                icon={opt.icon}
                selected={selected === opt.value}
                onPress={() => onSelect(opt.value)}
              />
            </Reveal>
          ))}
        </View>
      </View>
      <OnboardingFooter disabled={!selected} onPress={onContinue} />
    </View>
  );
}

function RatioCard({
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
  const dotScale = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const stateAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(dotScale, {
        toValue: selected ? 1 : 0,
        duration: 180,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(stateAnim, {
        toValue: selected ? 1 : 0,
        duration: 200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
    ]).start();
  }, [selected, dotScale, stateAnim]);

  const backgroundColor = stateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.cremeDeep, Colors.creme],
  });
  const borderColor = stateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(0,0,0,0)", Colors.terracotta],
  });
  const borderWidth = stateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });
  const radioBorder = stateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.rule, Colors.terracotta],
  });

  return (
    <Pressable onPress={onPress} testID={`ratio-${label}`}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor,
            borderColor,
            borderWidth,
          },
        ]}
      >
        <View style={styles.radioWrap}>
          <Animated.View style={[styles.radioOuter, { borderColor: radioBorder }]}>
            <Animated.View
              style={[
                styles.radioDot,
                {
                  transform: [{ scale: dotScale }],
                  opacity: dotScale,
                },
              ]}
            />
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
    height: 60,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
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
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.terracotta,
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
