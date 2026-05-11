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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Hourglass } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Spacing } from "@/constants/theme";

type Props = {
  title: string;
  subtitle?: string;
  steps?: string[];
  duration?: number;
  onDone: () => void;
  onSkip?: () => void;
  pendingLastStep?: boolean;
  decoration?: React.ReactNode;
};

function PulseDot({ delay }: { delay: number }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.6,
            duration: 500,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 500,
            easing: Easing.in(Easing.quad),
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
        styles.dot,
        { transform: [{ scale }], opacity },
      ]}
    />
  );
}

function StepItem({
  label,
  index,
  pending = false,
}: {
  label: string;
  index: number;
  pending?: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(ty, {
        toValue: 0,
        duration: 360,
        delay: index * 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, ty, index]);

  return (
    <Animated.View
      style={[styles.step, { opacity, transform: [{ translateY: ty }] }]}
    >
      <View style={[styles.checkBubble, pending && styles.pendingBubble]}>
        {pending ? (
          <Hourglass size={12} color={Colors.creme} strokeWidth={2.4} />
        ) : (
          <Check size={12} color={Colors.creme} strokeWidth={3} />
        )}
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
    </Animated.View>
  );
}

export function LoadingScreen({
  title,
  subtitle,
  steps = [],
  duration = 3200,
  onDone,
  onSkip,
  pendingLastStep = false,
  decoration,
}: Props) {
  const insets = useSafeAreaInsets();
  const [visibleSteps, setVisibleSteps] = useState<number>(0);

  useEffect(() => {
    if (steps.length === 0) return;
    const interval = setInterval(() => {
      setVisibleSteps((c) => {
        if (c >= steps.length) {
          clearInterval(interval);
          return c;
        }
        return c + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [steps.length]);

  useEffect(() => {
    const t = setTimeout(() => onDone(), duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 12 }]}>
      {decoration ? <View pointerEvents="none" style={styles.decoration}>{decoration}</View> : null}
      {onSkip ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          style={[styles.skip, { top: insets.top + 12 }]}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.selectionAsync().catch(() => {});
            }
            onSkip();
          }}
        >
          <Text style={styles.skipLabel}>Passer</Text>
        </Pressable>
      ) : null}

      <View style={styles.center}>
        <View style={styles.dots}>
          <PulseDot delay={0} />
          <PulseDot delay={160} />
          <PulseDot delay={320} />
        </View>

        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {steps.length > 0 ? (
          <View style={styles.steps}>
            {steps.slice(0, visibleSteps).map((s, i) => (
              <StepItem
                key={`${i}-${s}`}
                label={s}
                index={i}
                pending={pendingLastStep && i === steps.length - 1}
              />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.creme,
    paddingHorizontal: Spacing.screen,
  },
  skip: {
    position: "absolute",
    right: Spacing.screen,
    zIndex: 10,
  },
  skipLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  dots: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: Colors.terracotta,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 24,
    color: Colors.encre,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    textAlign: "center",
    maxWidth: 280,
  },
  steps: {
    marginTop: 28,
    gap: 12,
    alignSelf: "stretch",
    paddingHorizontal: 12,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkBubble: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: Colors.sauge,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingBubble: {
    backgroundColor: Colors.miel,
  },
  decoration: {
    ...StyleSheet.absoluteFillObject,
  },
  stepLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.encre,
    flex: 1,
  },
});

export default LoadingScreen;
