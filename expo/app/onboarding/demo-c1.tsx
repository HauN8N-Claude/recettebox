import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors, Spacing } from "@/constants/theme";
import {
  OnboardingFooter,
  OnboardingHeader,
} from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { progressFor } from "@/constants/onboardingSteps";
import { useOnboardingStore } from "@/stores/onboardingStore";
import {
  navigateNextDemo,
  type DemoTrack,
} from "@/components/onboarding/navigateNextDemo";

const FLOATING_EMOJIS: {
  emoji: string;
  position: { top?: number; bottom?: number; left?: number; right?: number };
}[] = [
  { emoji: "📷", position: { top: -18, left: -10 } },
  { emoji: "📖", position: { top: 60, right: -22 } },
  { emoji: "✏️", position: { bottom: 70, left: -26 } },
  { emoji: "📜", position: { bottom: -14, right: 14 } },
  { emoji: "🖋️", position: { top: 180, right: -18 } },
];

function FloatingEmoji({
  emoji,
  delay,
  position,
}: {
  emoji: string;
  delay: number;
  position: { top?: number; bottom?: number; left?: number; right?: number };
}) {
  const ty = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(ty, {
            toValue: -10,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rot, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ty, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rot, {
            toValue: -1,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, ty, rot]);

  const rotate = rot.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-2deg", "0deg", "2deg"],
  });

  return (
    <Animated.View
      style={[
        styles.floatChip,
        position,
        { transform: [{ translateY: ty }, { rotate }] },
      ]}
    >
      <Text style={styles.floatEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

const CAMERA_IMG = require("@/assets/demo/C1-camera-manuscrit.png");

export default function DemoC1Screen() {
  const router = useRouter();
  const selected = useOnboardingStore((s) => s.selectedSources);
  const [imgError, setImgError] = React.useState<boolean>(false);

  const onSkip = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    navigateNextDemo(router, selected as DemoTrack[], "C");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={progressFor("demo-intro")} onBack={() => router.back()} />
      <View style={styles.skipRow}>
        <Pressable hitSlop={12} onPress={onSkip}>
          <Text style={styles.skipLabel}>Passer</Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <Reveal delay={60}>
          <Text style={styles.eyebrow}>Et même 📖</Text>
        </Reveal>
        <Reveal delay={180}>
          <Text style={styles.title}>
            Sauve{" "}
            <Text style={styles.titleAccent}>les recettes de Mémé</Text>
          </Text>
        </Reveal>
        <Reveal delay={300}>
          <Text style={styles.body}>
            Carnets manuscrits, livres, photos — on déchiffre tout.
          </Text>
        </Reveal>

        <Reveal delay={460} style={styles.mockupWrap}>
          <View style={styles.mockup}>
            {imgError ? (
              <Text style={styles.mockupLabel}>Image non chargée</Text>
            ) : (
              <Image
                source={CAMERA_IMG}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            )}
          </View>

          {FLOATING_EMOJIS.map((f, i) => (
            <FloatingEmoji
              key={i}
              emoji={f.emoji}
              delay={i * 220}
              position={f.position}
            />
          ))}
        </Reveal>
      </View>

      <OnboardingFooter
        label="Montre-moi comment →"
        onPress={() => router.push("/onboarding/demo-c2")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  skipRow: {
    position: "absolute",
    top: 0,
    right: Spacing.screen,
    paddingTop: 56,
    zIndex: 10,
  },
  skipLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.cacao,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screen,
    gap: 10,
  },
  eyebrow: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 14,
    color: Colors.terracotta,
    textAlign: "center",
  },
  title: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 26,
    color: Colors.encre,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 8,
    lineHeight: 32,
  },
  titleAccent: {
    fontFamily: "Fraunces_400Regular_Italic",
    color: Colors.terracotta,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: "92%",
    marginTop: 6,
  },
  mockupWrap: {
    marginTop: 36,
    width: 220,
    height: 360,
  },
  mockup: {
    width: 220,
    height: 360,
    backgroundColor: Colors.encre,
    borderRadius: 28,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.encre,
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  mockupLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.creme,
    letterSpacing: 1.2,
  },
  floatChip: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: Colors.creme,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.encre,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  floatEmoji: {
    fontSize: 20,
  },
});
