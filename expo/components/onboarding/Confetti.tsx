import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";

type Particle = {
  x: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotateDir: 1 | -1;
  drift: number;
};

const COLORS: string[] = [Colors.miel, Colors.sauge, Colors.terracotta];

function ConfettiPiece({ p, height }: { p: Particle; height: number }) {
  const ty = useRef(new Animated.Value(-40)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(p.delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(ty, {
          toValue: height + 60,
          duration: p.duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(tx, {
          toValue: p.drift,
          duration: p.duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: p.rotateDir,
          duration: p.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(p.duration - 400),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [opacity, ty, tx, rotate, p, height]);

  const rotateInterpolated = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-180deg", "0deg", "180deg"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: p.x,
        top: 0,
        width: p.size,
        height: p.size * 0.4,
        backgroundColor: p.color,
        borderRadius: 2,
        opacity,
        transform: [
          { translateY: ty },
          { translateX: tx },
          { rotate: rotateInterpolated },
        ],
      }}
    />
  );
}

export function Confetti({ count = 36 }: { count?: number }) {
  const { width, height } = Dimensions.get("window");
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }).map((_, i) => ({
      x: Math.random() * width,
      size: 6 + Math.random() * 8,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 600,
      duration: 2400 + Math.random() * 1200,
      rotateDir: Math.random() > 0.5 ? 1 : -1,
      drift: (Math.random() - 0.5) * 80,
    }));
  }, [count, width]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, i) => (
        <ConfettiPiece key={i} p={p} height={height} />
      ))}
    </View>
  );
}

export default Confetti;
