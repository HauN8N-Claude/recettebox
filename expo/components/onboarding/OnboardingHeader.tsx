import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Spacing } from "@/constants/theme";
import { TOTAL_STEPS } from "@/constants/onboardingSteps";

type Props = {
  progress: number; // 0-1
  onBack?: () => void;
  showBack?: boolean;
};

export function OnboardingHeader({ progress, onBack, showBack = true }: Props) {
  const insets = useSafeAreaInsets();
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, progress));
    Animated.timing(width, {
      toValue: clamped,
      duration: 420,
      useNativeDriver: false,
    }).start();
  }, [progress, width]);

  const widthInterpolated = width.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Numéro d'étape dérivé de la valeur de progression (ex : 0.3 ≈ étape 4/14).
  // Évite de devoir passer un id de step à chaque appel d'écran.
  const currentStep = Math.max(
    1,
    Math.min(TOTAL_STEPS, Math.round(progress * TOTAL_STEPS)),
  );

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            }
            onBack?.();
          }}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.5 : showBack ? 1 : 0 }]}
          disabled={!showBack}
        >
          <ChevronLeft size={24} color={Colors.terracotta} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: widthInterpolated }]} />
        </View>
        <Text style={styles.stepLabel}>{`${currentStep}/${TOTAL_STEPS}`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 16,
    backgroundColor: Colors.creme,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  barTrack: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.rule,
    overflow: "hidden",
  },
  barFill: {
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.terracotta,
  },
  stepLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.cacao,
    letterSpacing: 0.3,
    minWidth: 32,
    textAlign: "right",
    opacity: 0.7,
  },
});

export default OnboardingHeader;
