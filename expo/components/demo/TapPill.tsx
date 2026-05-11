import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View, ViewStyle } from "react-native";
import { ChevronDown } from "lucide-react-native";

import { Colors, demoAnimations, demoColors } from "@/constants/theme";

type Props = {
  text: string;
  position?: { top?: number | string; right?: number | string; bottom?: number | string; left?: number | string };
};

export function TapPill({ text, position }: Props) {
  const ty = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ty, {
          toValue: -6,
          duration: demoAnimations.pillBounceDuration / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ty, {
          toValue: 0,
          duration: demoAnimations.pillBounceDuration / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [ty]);

  const wrapStyle: ViewStyle = {
    position: "absolute",
    alignItems: "center",
    ...(position ?? {}),
  };

  return (
    <View pointerEvents="none" style={wrapStyle}>
      <Animated.View style={[styles.pill, { transform: [{ translateY: ty }] }]}>
        <Text style={styles.text}>{text}</Text>
        <ChevronDown size={14} color={demoColors.pillText} strokeWidth={2.4} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: demoColors.pillBackground,
    shadowColor: Colors.encre,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: demoColors.pillText,
  },
});

export default TapPill;
