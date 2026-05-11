import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, ViewStyle } from "react-native";

import { demoAnimations, demoColors } from "@/constants/theme";

type Props = {
  size?: number;
  position?: { top?: number | string; right?: number | string; bottom?: number | string; left?: number | string };
  color?: string;
};

function PulsingRing({
  size,
  delay,
  color,
}: {
  size: number;
  delay: number;
  color: string;
}) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.6,
            duration: demoAnimations.haloPulseDuration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: demoAnimations.haloPulseDuration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, scale, opacity]);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: 999,
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

export function HaloPulse({
  size = 64,
  position,
  color = demoColors.haloOrange,
}: Props) {
  const style: ViewStyle = {
    position: "absolute",
    width: size,
    height: size,
    alignItems: "center",
    justifyContent: "center",
    ...(position ?? {}),
  };

  return (
    <View pointerEvents="none" style={style}>
      <PulsingRing size={size} delay={0} color={color} />
      <PulsingRing size={size} delay={400} color={color} />
      <View
        style={[
          styles.core,
          { width: size * 0.5, height: size * 0.5, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  core: {
    borderRadius: 999,
    opacity: 0.85,
  },
});

export default HaloPulse;
