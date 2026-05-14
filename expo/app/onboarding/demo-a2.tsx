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

import { Colors, Spacing } from "@/constants/theme";
import { HaloPulse, SocialLogosRow, TapPill } from "@/components/demo";
import { OnboardingHeader } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { progressFor } from "@/constants/onboardingSteps";

const INSTA_IMG = require("@/assets/demo/A1-instagram-post.png");
const INSTA_IMG_META = Image.resolveAssetSource(INSTA_IMG);
const INSTA_IMG_ASPECT = INSTA_IMG_META.width / INSTA_IMG_META.height;

// Position du bouton "Partager" (icône ✈) sur l'image A1-instagram-post.png.
// Valeurs en % de l'IMAGE entière (pas du container) — fonctionne avec resizeMode="contain".
// La rangée d'actions (♡ 💬 ✈ 🔖) est juste sous la photo du risotto.
const TAP_TARGET = {
  topPct: 0.67, // ~67% depuis le haut de l'image (rangée d'actions)
  leftPct: 0.20, // ~20% depuis la gauche (3ème icône)
};

const HITBOX_RADIUS = 60;

export default function DemoA2Screen() {
  const router = useRouter();
  const [imgError, setImgError] = React.useState<boolean>(false);
  const [mockupSize, setMockupSize] = React.useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const onTapTarget = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    router.push("/onboarding/demo-a3");
  };

  // Avec resizeMode="contain", l'image préserve son aspect ratio et peut laisser
  // des bandes vides (haut/bas ou gauche/droite). On calcule la zone réelle où
  // l'image est rendue pour y positionner précisément le halo.
  let renderedWidth = mockupSize.width;
  let renderedHeight = mockupSize.height;
  let offsetX = 0;
  let offsetY = 0;
  if (mockupSize.width > 0 && mockupSize.height > 0) {
    const containerAspect = mockupSize.width / mockupSize.height;
    if (INSTA_IMG_ASPECT > containerAspect) {
      // Image plus "large" que le container → fit en largeur, padding vertical
      renderedWidth = mockupSize.width;
      renderedHeight = mockupSize.width / INSTA_IMG_ASPECT;
      offsetX = 0;
      offsetY = (mockupSize.height - renderedHeight) / 2;
    } else {
      // Image plus "haute" que le container → fit en hauteur, padding horizontal
      renderedHeight = mockupSize.height;
      renderedWidth = mockupSize.height * INSTA_IMG_ASPECT;
      offsetX = (mockupSize.width - renderedWidth) / 2;
      offsetY = 0;
    }
  }

  const centerX = offsetX + TAP_TARGET.leftPct * renderedWidth;
  const centerY = offsetY + TAP_TARGET.topPct * renderedHeight;

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={progressFor("demo-intro")} onBack={() => router.back()} />

      <View style={styles.header}>
        <Reveal delay={60}>
          <Text style={styles.title}>
            Importations{" "}
            <Text style={styles.titleAccent}>intelligentes</Text>
            {"\n"}depuis les réseaux sociaux
          </Text>
        </Reveal>
        <Reveal delay={180} style={styles.logosWrap}>
          <SocialLogosRow size={26} gap={20} />
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
              resizeMode="contain"
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

            <HaloPulse
              size={56}
              position={{
                top: centerY - 28,
                left: centerX - 28,
              }}
            />

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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  header: {
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 14,
    marginTop: 12,
  },
  title: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 24,
    color: Colors.encre,
    textAlign: "center",
    lineHeight: 30,
  },
  titleAccent: {
    fontFamily: "Fraunces_400Regular_Italic",
    color: Colors.terracotta,
  },
  logosWrap: {
    marginTop: 4,
  },
  mockupArea: {
    flex: 1,
    marginTop: 22,
    marginHorizontal: Spacing.screen,
    marginBottom: 24,
    position: "relative",
  },
  mockup: {
    flex: 1,
    backgroundColor: Colors.creme,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mockupLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.cacao,
    letterSpacing: 1.2,
  },
  hitbox: {
    position: "absolute",
    zIndex: 15,
  },
});
