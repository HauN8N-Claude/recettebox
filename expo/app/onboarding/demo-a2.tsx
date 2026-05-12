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

const INSTA_IMG = require("@/assets/demo/A1-instagram-post.png");

// Position du bouton "Partager" (icône ✈) sur l'image A1-instagram-post.png.
// Valeurs en % de la zone mockup pour rester responsive aux différents devices.
// La rangée d'actions (cœur, comment, ✈) est juste sous la photo du risotto.
const TAP_TARGET = {
  // Coordonnées du centre du halo
  topPct: 0.72, // 72% depuis le haut du mockup
  leftPct: 0.20, // 20% depuis la gauche du mockup
};

const HITBOX_RADIUS = 60; // 60px de rayon autour du centre du halo

export default function DemoA2Screen() {
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
    router.push("/onboarding/demo-a3");
  };

  // Position absolue du centre de la hitbox dans le mockup
  const centerX = mockupSize.width * TAP_TARGET.leftPct;
  const centerY = mockupSize.height * TAP_TARGET.topPct;

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 60 }]}>
        <Reveal delay={40}>
          <Text style={styles.step}>ÉTAPE 1 SUR 2</Text>
        </Reveal>
        <Reveal delay={140}>
          <Text style={styles.title}>
            Appuie sur le bouton{" "}
            <Text style={styles.titleAccent}>Partager</Text> du post
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
              source={INSTA_IMG}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          )}
        </View>

        {mockupSize.width > 0 && (
          <>
            {/* Hitbox invisible centrée sur le bouton partage */}
            <Pressable
              onPress={onTapTarget}
              accessibilityRole="button"
              accessibilityLabel="Appuie sur le bouton Partager"
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

            {/* Halo pulsant (décoratif, pointerEvents none — la hitbox au-dessus capte) */}
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
    // Hitbox invisible — pas de couleur, pas de bordure
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
