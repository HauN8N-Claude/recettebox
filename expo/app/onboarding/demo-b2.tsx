import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Spacing } from "@/constants/theme";
import { OnboardingFooter } from "@/components/onboarding";
import { HaloPulse, TapPill } from "@/components/demo";
import { Reveal } from "@/components/Reveal";
import { useOnboardingStore } from "@/stores/onboardingStore";
import {
  navigateNextDemo,
  type DemoTrack,
} from "@/components/onboarding/navigateNextDemo";

const SAFARI_IMG = require("@/assets/demo/B1-safari-marmiton.png");

export default function DemoB2Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selected = useOnboardingStore((s) => s.selectedSources);
  const [imgError, setImgError] = React.useState<boolean>(false);

  const onSkip = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    navigateNextDemo(router, selected as DemoTrack[], "B");
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 60 }]}>
        <Reveal delay={40}>
          <Text style={styles.step}>ÉTAPE 1 SUR 3</Text>
        </Reveal>
        <Reveal delay={140}>
          <Text style={styles.title}>
            Sur Safari, ouvre le menu{" "}
            <Text style={styles.titleAccent}>Partager</Text>
          </Text>
        </Reveal>
      </View>

      <View style={styles.mockupArea}>
        <View style={styles.mockup}>
          {imgError ? (
            <Text style={styles.mockupLabel}>Image non chargée</Text>
          ) : (
            <Image
              source={SAFARI_IMG}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          )}
          <View style={styles.dim} pointerEvents="none" />
        </View>

        <View style={styles.haloHost} pointerEvents="none">
          <HaloPulse size={56} />
        </View>
        <View style={styles.pillHost} pointerEvents="none">
          <TapPill text="Bouton Partager 👇" />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        hitSlop={12}
        onPress={onSkip}
        style={[styles.skipOverlay, { top: insets.top + 12 }]}
      >
        <Text style={styles.skipLabel}>Passer ›</Text>
      </Pressable>

      <OnboardingFooter
        label="J'ai compris"
        onPress={() => router.push("/onboarding/demo-b3")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  header: {
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },
  step: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 12,
    color: Colors.terracotta,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
  },
  title: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 18,
    color: Colors.encre,
    textAlign: "center",
    lineHeight: 24,
  },
  titleAccent: {
    fontFamily: "Fraunces_400Regular_Italic",
    color: Colors.terracotta,
  },
  mockupArea: {
    flex: 1,
    marginTop: 24,
    marginHorizontal: Spacing.screen,
    position: "relative",
  },
  mockup: {
    flex: 1,
    backgroundColor: Colors.encre,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  mockupLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.creme,
    letterSpacing: 1.2,
  },
  haloHost: {
    position: "absolute",
    bottom: "5%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  pillHost: {
    position: "absolute",
    bottom: "16%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  skipOverlay: {
    position: "absolute",
    right: Spacing.screen,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(42,37,32,0.6)",
    zIndex: 20,
  },
  skipLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.creme,
  },
});
