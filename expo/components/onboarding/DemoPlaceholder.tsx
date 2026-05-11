import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Spacing } from "@/constants/theme";
import { OnboardingFooter } from "@/components/onboarding";
import { useOnboardingStore } from "@/stores/onboardingStore";
import {
  navigateNextDemo,
  type DemoTrack,
} from "@/components/onboarding/navigateNextDemo";

type Props = {
  code: string;
  title: string;
  nextRoute?: string;
  endTrack?: DemoTrack;
  showSkipParcours?: boolean;
};

/**
 * Lightweight placeholder shell for demo routes that haven't been
 * implemented yet. Shows the route code + a continue CTA so the
 * conditional navigation can be exercised end-to-end.
 */
export function DemoPlaceholder({
  code,
  title,
  nextRoute,
  endTrack,
  showSkipParcours = false,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selected = useOnboardingStore((s) => s.q3_sources_demo);
  const tracksFromStore = useOnboardingStore((s) => s.selectedSources);

  const onContinue = () => {
    if (nextRoute) {
      router.push(nextRoute as never);
      return;
    }
    if (endTrack) {
      const merged: (DemoTrack | "social" | "web" | "manuscript")[] = [
        ...selected,
        ...tracksFromStore,
      ];
      navigateNextDemo(router, merged, endTrack);
    }
  };

  const onSkipParcours = () => {
    if (endTrack) {
      const merged: (DemoTrack | "social" | "web" | "manuscript")[] = [
        ...selected,
        ...tracksFromStore,
      ];
      navigateNextDemo(router, merged, endTrack);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }} />
        {showSkipParcours ? (
          <Pressable hitSlop={12} onPress={onSkipParcours}>
            <Text style={styles.skipLabel}>Passer ce parcours</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.center}>
        <Text style={styles.code}>{code}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>Écran à construire.</Text>
      </View>

      <OnboardingFooter label="Continuer" onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.screen,
    paddingBottom: 8,
  },
  skipLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screen,
    gap: 12,
  },
  code: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.54,
    color: Colors.terracotta,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 28,
    color: Colors.encre,
    textAlign: "center",
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    textAlign: "center",
  },
});

export default DemoPlaceholder;
