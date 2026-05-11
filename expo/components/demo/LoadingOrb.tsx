import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";

import { Colors, demoAnimations } from "@/constants/theme";

type TitleSpan = { text: string; italic?: boolean };

type Props = {
  emoji: string;
  /**
   * Title can be a plain string, or an array of spans where italic spans
   * render in Fraunces italic terracotta to highlight a pivot word.
   */
  title: string | TitleSpan[];
  checks: [string, string, string];
};

function PulsingRing({ delay, size }: { delay: number; size: number }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.15,
            duration: demoAnimations.loadingOrbDuration / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.15,
            duration: demoAnimations.loadingOrbDuration / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.85,
            duration: demoAnimations.loadingOrbDuration / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: demoAnimations.loadingOrbDuration / 2,
            easing: Easing.inOut(Easing.quad),
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
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

function BreathingEmoji({ emoji }: { emoji: string }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: demoAnimations.loadingOrbDuration / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: demoAnimations.loadingOrbDuration / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return (
    <Animated.Text style={[styles.emoji, { transform: [{ scale }] }]}>
      {emoji}
    </Animated.Text>
  );
}

function CheckRow({ label, delay }: { label: string; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(ty, {
        toValue: 0,
        duration: 320,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, ty, delay]);

  return (
    <Animated.View style={[styles.checkRow, { opacity, transform: [{ translateY: ty }] }]}>
      <View style={styles.checkBubble}>
        <Check size={12} color={Colors.creme} strokeWidth={3} />
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Animated.View>
  );
}

export function LoadingOrb({ emoji, title, checks }: Props) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(1), 400);
    const t2 = setTimeout(() => setVisible(2), 1200);
    const t3 = setTimeout(() => setVisible(3), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const titleSpans: TitleSpan[] =
    typeof title === "string" ? [{ text: title }] : title;

  return (
    <View style={styles.wrap}>
      <View style={styles.orb}>
        <PulsingRing delay={0} size={140} />
        <PulsingRing delay={400} size={110} />
        <View style={styles.core}>
          <BreathingEmoji emoji={emoji} />
        </View>
      </View>

      <Text style={styles.title}>
        {titleSpans.map((s, i) => (
          <Text key={i} style={s.italic ? styles.titleItalic : undefined}>
            {s.text}
          </Text>
        ))}
      </Text>

      <View style={styles.checks}>
        {checks.slice(0, visible).map((c, i) => (
          <CheckRow key={`${i}-${c}`} label={c} delay={0} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 24,
  },
  orb: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    backgroundColor: Colors.terracotta,
  },
  core: {
    width: 88,
    height: 88,
    borderRadius: 999,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.terracotta,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 22,
    color: Colors.encre,
    textAlign: "center",
    lineHeight: 30,
    paddingHorizontal: 24,
  },
  titleItalic: {
    fontFamily: "Fraunces_400Regular_Italic",
    color: Colors.terracotta,
  },
  checks: {
    gap: 10,
    minHeight: 110,
    alignItems: "flex-start",
  },
  checkRow: {
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
  checkLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.encre,
  },
});

export default LoadingOrb;
