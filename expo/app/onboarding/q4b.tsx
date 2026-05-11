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
import { useOnboardingStore, type OnboardingAnswers } from "@/stores/onboardingStore";

type Weekly = NonNullable<OnboardingAnswers["q4_weeklySaved"]>;

const OPTIONS: { value: Weekly; label: string }[] = [
  { value: "few", label: "Quelques-unes (1 à 3)" },
  { value: "ten", label: "Une dizaine (4 à 10)" },
  { value: "many", label: "Pas mal (11 à 20)" },
  { value: "countless", label: "Je perds le compte (20+)" },
];

export default function Q4bScreen() {
  const router = useRouter();
  const stored = useOnboardingStore((s) => s.q4_weeklySaved);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const [selected, setSelected] = useState<Weekly | null>(stored ?? null);

  const onSelect = (value: Weekly) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setSelected(value);
  };

  const onContinue = () => {
    if (!selected) return;
    setAnswer("q4_weeklySaved", selected);
    const SAVES_MAP = {
      few: "1-3",
      ten: "4-10",
      many: "11-20",
      countless: "20+",
    } as const;
    setAnswer("savesPerWeek", SAVES_MAP[selected]);
    router.push("/onboarding/q5");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={4 / 12} onBack={() => router.back()} />
      <View style={styles.content}>
        <Reveal delay={60}>
          <Text style={styles.title}>
            Tu en sauves{"\n"}combien par semaine ?
          </Text>
        </Reveal>
        <Reveal delay={160}>
          <Text style={styles.subtitle}>À la louche. Pour qu&apos;on calibre ton chaos.</Text>
        </Reveal>

        <View style={styles.options}>
          {OPTIONS.map((opt, i) => (
            <Reveal key={opt.value} delay={240 + i * 70}>
              <OptionCard
                label={opt.label}
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

function OptionCard({
  label,
  selected,
  onPress,
}: {
  label: string;
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
    <Pressable onPress={onPress} testID={`weekly-${label}`}>
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
  label: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.encre,
  },
});
