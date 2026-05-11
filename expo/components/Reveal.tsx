import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle, StyleProp } from "react-native";

type Props = {
  delay?: number;
  duration?: number;
  translateY?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function Reveal({
  delay = 0,
  duration = 520,
  translateY = 12,
  style,
  children,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(translateY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(ty, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, duration, opacity, ty]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY: ty }] }, style]}>
      {children}
    </Animated.View>
  );
}

export default Reveal;
