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

const SHARE_IMG = require("@/assets/demo/A3-share-instagram.png");
const SHARE_IMG_META = Image.resolveAssetSource?.(SHARE_IMG);
const SHARE_IMG_ASPECT = SHARE_IMG_META
  ? SHARE_IMG_META.width / SHARE_IMG_META.height
  : 0.8;

// Position de l'icône RecetteBox dans la share sheet de A3-share-instagram.png.
// Valeurs en % de l'IMAGE entière (pas du container) — fonctionne avec resizeMode="contain".
// L'icône RecetteBox est la 2ème app de la rangée (après AirDrop), au milieu de la share sheet.
const TAP_TARGET = {
  topPct: 0.62, // ~62% depuis le haut de l'image (rangée des apps de partage)
  leftPct: 0.25, // ~25% depuis la gauche (2ème icône après AirDrop)
};

const HITBOX_RADIUS = 60;

export default function DemoA3Screen() {
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
    router.push("/onboarding/demo-a4");
  };

  // Avec resizeMode="contain", on calcule la zone réelle où l'image est rendue
  // pour positionner le halo précisément sur l'icône RecetteBox.
  let renderedWidth = mockupSize.width;
  let renderedHeight = mockupSize.height;
  let offsetX = 0;
  let offsetY = 0;
  if (mockupSize.width > 0 && mockupSize.height > 0) {
    const containerAspect = mockupSize.width / mockupSize.height;
    if (SHARE_IMG_ASPECT > containerAspect) {
      renderedWidth = mockupSize.width;
      renderedHeight = mockupSize.width / SHARE_IMG_ASPECT;
      offsetX = 0;
      offsetY = (mockupSize.height - renderedHeight) / 2;
    } else {
      renderedHeight = mockupSize.height;
      renderedWidth = mockupSize.height * SHARE_IMG_ASPECT;
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
              source={SHARE_IMG}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
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
