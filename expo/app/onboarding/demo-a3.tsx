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
import { HaloPulse, TapPill } from "@/components/demo";
import { Reveal } from "@/components/Reveal";
import { useOnboardingStore } from "@/stores/onboardingStore";
import {
  navigateNextDemo,
  type DemoTrack,
} from "@/components/onboarding/navigateNextDemo";

const SHARE_IMG = require("@/assets/demo/A3-share-instagram.png");

// Position de l'icône RecetteBox dans la share sheet de A3-share-instagram.png.
// L'icône RecetteBox est la 2ème app de la rangée (après AirDrop).
const TAP_TARGET = {
  topPct: 0.62, // 62% depuis le haut du mockup
  leftPct: 0.28, // 28% depuis la gauche
};

const HITBOX_RADIUS = 60;

export default function DemoA3Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selected = useOnboardingStore((s) => s.selectedSources);
  const [imgError, setImgError] = React.useState<boolean>(false);
  const [mockupSize, setMockupSize] = React.useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const onSkip = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    navigateNextDemo(router, selected as DemoTrack[], "A");
  };

  const onTapTarget = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    router.push("/onboarding/demo-a4");
  };

  const centerX = mockupSize.width * TAP_TARGET.leftPct;
  const centerY = mockupSize.height * TAP_TARGET.topPct;

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 60 }]}>
        <Reveal delay={40}>
          <Text style={styles.step}>ÉTAPE 2 SUR 2</Text>
        </Reveal>
        <Reveal delay={140}>
          <Text style={styles.title}>
            Choisis <Text style={styles.titleAccent}>RecetteBox</Text> dans la
            liste
          </Text>
        </Reveal>
      </View>

      <View
        style={styles.mockupArea}
        onLayout={(e) =>
          setMockupSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
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

        {mockupSize.width > 0 && (
          <>
            {/* Hitbox invisible centrée sur l'icône RecetteBox */}
            <Pressable
              onPress={onTapTarget}
              accessibilityRole="button"
              accessibilityLabel="Choisis RecetteBox dans la liste de partage"
              style={[
                styles.hitbox,
                {
                  width: HITBOX_RADIUS * 2,
                  height: HITBOX_RADIUS * 2,
                  borderRadius: HITBOX_RADIUS,
                  top: centerY - HITBOX_RADIUS,
                  left: centerX - HITBOX_RADIUS,
                },
              ]}
            />

            {/* Halo pulsant — décoratif */}
            <HaloPulse
              size={56}
              position={{
                top: centerY - 28,
                left: centerX - 28,
              }}
            />

            {/* Pill "Appuyez ici 👇" — positionnée juste au-dessus du halo */}
            <TapPill
              text="Appuyez ici"
              emoji="👇"
              position={{
                top: centerY - 64,
                left: centerX - 70,
              }}
            />
          </>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        hitSlop={12}
        onPress={onSkip}
        style={[styles.skipOverlay, { top: insets.top + 12 }]}
      >
        <Text style={styles.skipLabel}>Passer ›</Text>
      </Pressable>
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
    marginBottom: 24,
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
  hitbox: {
    position: "absolute",
    zIndex: 15,
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
