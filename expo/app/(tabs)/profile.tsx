import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ComingSoon } from "@/components/ComingSoon";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useOnboardingStore } from "@/stores/onboardingStore";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reset = useOnboardingStore((s) => s.reset);

  const handleReset = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    reset();
    router.replace("/onboarding");
  };

  return (
    <View style={styles.wrap}>
      <ComingSoon
        label="Profil"
        title="Bientôt, ton carnet à toi."
        body="Préférences, restrictions, foyer, statistiques. Tout ce qui rend RecetteBox vraiment tien."
        whisper="Ton carnet, à ton rythme."
      />
      {__DEV__ ? (
        <View style={[styles.devBar, { bottom: insets.bottom + 100 }]}>
          <Pressable
            accessibilityRole="button"
            onPress={handleReset}
            style={({ pressed }) => [styles.devCta, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.devLabel}>DEV: Reset onboarding</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  devBar: {
    position: "absolute",
    left: Spacing.screen,
    right: Spacing.screen,
    alignItems: "center",
  },
  devCta: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    backgroundColor: Colors.encre,
  },
  devLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.creme,
    letterSpacing: 0.4,
  },
});
