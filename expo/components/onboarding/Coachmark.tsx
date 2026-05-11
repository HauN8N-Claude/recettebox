import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View, ViewStyle } from "react-native";

import { Colors } from "@/constants/theme";

type Props = {
  label: string;
  position: ViewStyle;
};

export function Coachmark({ label, position }: Props) {
  const haloScale = useRef(new Animated.Value(0.85)).current;
  const haloOpacity = useRef(new Animated.Value(0.5)).current;
  const pillTy = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const halo = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(haloScale, {
            toValue: 1.18,
            duration: 1500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity, {
            toValue: 0.2,
            duration: 1500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(haloScale, {
            toValue: 0.85,
            duration: 1500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity, {
            toValue: 0.5,
            duration: 1500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(pillTy, {
          toValue: -6,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pillTy, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    halo.start();
    bounce.start();
    return () => {
      halo.stop();
      bounce.stop();
    };
  }, [haloScale, haloOpacity, pillTy]);

  return (
    <View pointerEvents="none" style={[styles.wrap, position]}>
      <Animated.View
        style={[
          styles.haloOuter,
          { transform: [{ scale: haloScale }], opacity: haloOpacity },
        ]}
      />
      <Animated.View
        style={[
          styles.haloInner,
          { transform: [{ scale: haloScale }], opacity: haloOpacity },
        ]}
      />
      <Animated.View
        style={[styles.pill, { transform: [{ translateY: pillTy }] }]}
      >
        <Text style={styles.pillLabel}>{label}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  haloOuter: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: Colors.terracotta,
    opacity: 0.25,
  },
  haloInner: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: Colors.terracotta,
    opacity: 0.4,
  },
  pill: {
    position: "absolute",
    top: -56,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.terracotta,
    shadowColor: Colors.encre,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pillLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.creme,
  },
});

export default Coachmark;
