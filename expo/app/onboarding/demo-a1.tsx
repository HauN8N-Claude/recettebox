import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";

import { Colors, Spacing } from "@/constants/theme";
import { OnboardingHeader } from "@/components/onboarding";
import { OnboardingFooter } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { progressFor } from "@/constants/onboardingSteps";
import { SOCIAL_BRANDS } from "@/components/demo";

type BrandKey = (typeof SOCIAL_BRANDS)[number]["key"];

const FLOATING_BRANDS: {
  key: BrandKey;
  position: { top?: number; bottom?: number; left?: number; right?: number };
}[] = [
  { key: "instagram", position: { top: -18, left: -10 } },
  { key: "tiktok", position: { top: 60, right: -22 } },
  { key: "pinterest", position: { bottom: 70, left: -26 } },
  { key: "youtube", position: { bottom: -14, right: 14 } },
  { key: "facebook", position: { top: 180, right: -18 } },
];

function FloatingBrand({
  brandKey,
  delay,
  position,
}: {
  brandKey: BrandKey;
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

  const brand = SOCIAL_BRANDS.find((b) => b.key === brandKey);
  if (!brand) return null;

  return (
    <Animated.View
      style={[
        styles.floatChip,
        position,
        { transform: [{ translateY: ty }, { rotate }] },
      ]}
    >
      <FontAwesome6
        name={brand.icon as React.ComponentProps<typeof FontAwesome6>["name"]}
        size={22}
        color={brand.color}
      />
    </Animated.View>
  );
}

const INSTA_IMG = require("@/assets/demo/A1-instagram-post.png");

export default function DemoA1Screen() {
  const router = useRouter();
  const [imgError, setImgError] = React.useState<boolean>(false);

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={progressFor("demo-intro")} onBack={() => router.back()} />

      <View style={styles.center}>
        <Reveal delay={60}>
          <Text style={styles.eyebrow}>Génial 🎉</Text>
        </Reveal>
        <Reveal delay={180}>
          <Text style={styles.title}>
            Importe depuis{" "}
            <Text style={styles.titleAccent}>les réseaux sociaux</Text>
          </Text>
        </Reveal>
        <Reveal delay={300}>
          <Text style={styles.body}>
            Insta, TikTok, Pinterest — tout en un geste.
          </Text>
        </Reveal>

        <Reveal delay={460} style={styles.mockupWrap}>
          <View style={styles.mockup}>
            {imgError ? (
              <Text style={styles.mockupLabel}>Image non chargée</Text>
            ) : (
              <Image
                source={INSTA_IMG}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            )}
          </View>

          {FLOATING_BRANDS.map((f, i) => (
            <FloatingBrand
              key={f.key}
              brandKey={f.key}
              delay={i * 220}
              position={f.position}
            />
          ))}
        </Reveal>
      </View>

      <OnboardingFooter
        label="Montre-moi comment →"
        onPress={() => router.push("/onboarding/demo-pick")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
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
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: Colors.creme,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.encre,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
});
