import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ChefHat, Soup, Salad, Utensils, CookingPot } from "lucide-react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { Reveal } from "@/components/Reveal";

type DishProps = {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  tint: string;
  size: number;
  top: number;
  left?: number;
  right?: number;
  delay: number;
  amplitude?: number;
  rotate?: number;
};

function FloatingDish({
  Icon,
  tint,
  size,
  top,
  left,
  right,
  delay,
  amplitude = 6,
  rotate = 0,
}: DishProps) {
  const ty = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 520,
        delay,
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ty, {
          toValue: -amplitude,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ty, {
          toValue: amplitude,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const t = setTimeout(() => loop.start(), delay + 200);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [amplitude, delay, opacity, scale, ty]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dish,
        {
          width: size,
          height: size,
          top,
          left,
          right,
          opacity,
          transform: [
            { translateY: ty },
            { scale },
            { rotate: `${rotate}deg` },
          ],
        },
      ]}
    >
      <View style={[styles.dishInner, { backgroundColor: tint }]}>
        <Icon size={size * 0.45} color={Colors.cacao} />
      </View>
    </Animated.View>
  );
}

function ScanFrame() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <Animated.View style={[styles.scanWrap, { transform: [{ scale }], opacity }]}>
      <View style={styles.logoCard}>
        <ChefHat size={44} color={Colors.creme} />
      </View>
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { height } = useWindowDimensions();

  // Upper "animation zone" — strictly above the safe content area.
  // Logo center sits roughly at 28% of screen height; dishes float around it.
  const animZoneHeight = Math.min(height * 0.42, 360);

  const handleStart = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.push("/onboarding/q4");
  };

  const handleHasAccount = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      {/* === ANIMATION ZONE (upper half only, contained) === */}
      <View style={[styles.animZone, { height: animZoneHeight }]}>
        {/* Floating dish vignettes — kept around the logo, never below it */}
        <FloatingDish
          Icon={CookingPot}
          tint={Colors.cremeDeep}
          size={64}
          top={animZoneHeight * 0.22}
          left={28}
          delay={300}
          amplitude={6}
          rotate={-4}
        />
        <FloatingDish
          Icon={Salad}
          tint={Colors.cremeDeep}
          size={70}
          top={animZoneHeight * 0.12}
          right={28}
          delay={420}
          amplitude={7}
          rotate={4}
        />
        <FloatingDish
          Icon={Soup}
          tint={Colors.cremeDeep}
          size={58}
          top={animZoneHeight * 0.6}
          left={18}
          delay={540}
          amplitude={5}
          rotate={6}
        />
        <FloatingDish
          Icon={Utensils}
          tint={Colors.cremeDeep}
          size={62}
          top={animZoneHeight * 0.55}
          right={22}
          delay={660}
          amplitude={6}
          rotate={-6}
        />

        {/* Central scan-frame logo */}
        <View style={styles.scanCenter}>
          <Reveal delay={120}>
            <ScanFrame />
          </Reveal>
        </View>
      </View>

      {/* === SAFE CONTENT ZONE — no animated overlays === */}
      <View style={styles.safeZone}>
        <Reveal delay={260}>
          <Text style={styles.title}>
            Bienvenue sur{"\n"}
            <Text style={styles.titleBrand}>RecetteBox</Text>
          </Text>
        </Reveal>
        <Reveal delay={400}>
          <Text style={styles.body}>
            L&apos;app qui rassemble toutes tes recettes au même endroit.
          </Text>
        </Reveal>
      </View>

      <Reveal delay={560} style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={handleStart}
          style={({ pressed }) => [
            styles.cta,
            {
              opacity: pressed ? 0.94 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
          ]}
        >
          <Text style={styles.ctaLabel}>Commencer →</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={handleHasAccount}
          style={({ pressed }) => [styles.ghost, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={styles.ghostLabel}>J&apos;ai déjà un compte</Text>
        </Pressable>
      </Reveal>
    </View>
  );
}

const CORNER_SIZE = 18;
const CORNER_THICKNESS = 3;
const LOGO_SIZE = 96;

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.creme,
    paddingHorizontal: Spacing.screen,
  },
  animZone: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  scanCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanWrap: {
    width: LOGO_SIZE + 24,
    height: LOGO_SIZE + 24,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCard: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 22,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.encre,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: Colors.terracotta,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 6,
  },
  dish: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  dishInner: {
    flex: 1,
    width: "100%",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.encre,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  safeZone: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 24,
    gap: 16,
  },
  title: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 34,
    lineHeight: 40,
    color: Colors.encre,
    textAlign: "center",
  },
  titleBrand: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 38,
    color: Colors.terracotta,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.cacao,
    textAlign: "center",
    lineHeight: 23,
    maxWidth: "86%",
  },
  footer: {
    gap: 14,
    alignItems: "center",
  },
  cta: {
    height: 54,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    shadowColor: Colors.terracotta,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  ctaLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
    letterSpacing: 0.2,
  },
  ghost: {
    paddingVertical: 8,
  },
  ghostLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
  },
});
