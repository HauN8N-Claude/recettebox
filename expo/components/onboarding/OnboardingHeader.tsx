import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Spacing } from "@/constants/theme";

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
        <View style={styles.back} />
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
});

export default OnboardingHeader;
