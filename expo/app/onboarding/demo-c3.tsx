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

const SHARE_IMG = require("@/assets/demo/C3-share-photos.png");

export default function DemoC3Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      <View style={[styles.header, { paddingTop: insets.top + 60 }]}>
        <Reveal delay={40}>
          <Text style={styles.step}>OPTION 2 — DEPUIS TES PHOTOS</Text>
        </Reveal>
        <Reveal delay={140}>
          <Text style={styles.title}>
            Tu as déjà la photo ? Partage-la sur{" "}
            <Text style={styles.titleAccent}>RecetteBox</Text>
          </Text>
        </Reveal>
      </View>

      <View style={styles.mockupArea}>
        <View style={styles.mockup}>
          {imgError ? (
            <Text style={styles.mockupLabel}>Image non chargée</Text>
          ) : (
            <Image
              source={SHARE_IMG}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          )}
        </View>

        <HaloPulse size={60} position={{ top: "60%", left: "22%" }} />
        <TapPill
          text="RecetteBox 👇"
          position={{ top: "52%", left: "16%" }}
        />
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
        label="Continuer"
        onPress={() => router.push("/onboarding/demo-c4")}
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
  mockupLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.creme,
    letterSpacing: 1.2,
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
