import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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

const APP_ICONS: { label: string; gradient?: [string, string]; bg?: string; glyph: string }[] = [
  {
    label: "RecetteBox",
    gradient: ["#E07F5F", "#9C4631"],
    glyph: "R",
  },
  { label: "WhatsApp", bg: "#25D366", glyph: "W" },
  { label: "Messages", bg: "#34C759", glyph: "M" },
  { label: "Mail", bg: "#5AC8FA", glyph: "✉" },
];

const SAFARI_IMG = require("@/assets/demo/B1-safari-marmiton.png");

export default function DemoB3Screen() {
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
          <Text style={styles.step}>ÉTAPE 2 SUR 3</Text>
        </Reveal>
        <Reveal delay={140}>
          <Text style={styles.title}>Le menu de partage s&apos;ouvre…</Text>
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
              blurRadius={4}
              onError={() => setImgError(true)}
            />
          )}
          <View style={styles.dimHeavy} pointerEvents="none" />
        </View>

        <View style={styles.shareSheet} pointerEvents="none">
          <View style={styles.handle} />
          <View style={styles.appsRow}>
            {APP_ICONS.map((app, i) => (
              <View key={i} style={styles.appCol}>
                {app.gradient ? (
                  <LinearGradient
                    colors={app.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.appIcon}
                  >
                    <Text style={styles.appGlyph}>{app.glyph}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.appIcon, { backgroundColor: app.bg }]}>
                    <Text style={styles.appGlyph}>{app.glyph}</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.appLabel,
                    i === 0 && styles.appLabelActive,
                  ]}
                >
                  {app.label}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.divider} />
          <View style={styles.actionRow}>
            <Text style={styles.actionLabel}>Copier le lien</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.actionRow}>
            <Text style={styles.actionLabel}>Ajouter à la liste de lecture</Text>
          </View>
        </View>

        <HaloPulse size={64} position={{ bottom: "24%", left: "12%" }} />
        <TapPill text="RecetteBox 👇" position={{ bottom: "35%", left: "8%" }} />
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
        onPress={() => router.push("/onboarding/demo-b4")}
      />
    </View>
  );
}

const SHEET_PAD_X = 16;

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
  dimHeavy: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  mockupLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1.2,
  },
  shareSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(28,28,30,0.96)",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: SHEET_PAD_X,
    paddingTop: 10,
    paddingBottom: 18,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignSelf: "center",
    marginBottom: 14,
  },
  appsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  appCol: {
    alignItems: "center",
    gap: 6,
    width: 64,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  appGlyph: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 22,
    color: "#fff",
  },
  appLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  appLabelActive: {
    color: "#fff",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  actionRow: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  actionLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#fff",
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
