import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Spacing } from "@/constants/theme";
import { OnboardingFooter } from "@/components/onboarding";
import { useOnboardingStore } from "@/stores/onboardingStore";

export default function PaywallCompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const finish = useOnboardingStore((s) => s.finish);

  const onContinue = () => {
    finish();
    router.replace("/(tabs)" as never);
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 24 }]}>
      <View style={styles.center}>
        <Text style={styles.eyebrow}>PAYWALL · À CONSTRUIRE</Text>
        <Text style={styles.title}>Tu y es presque.</Text>
        <Text style={styles.body}>
          C&apos;est ici que viendra le paywall comparatif de la séquence 5.
        </Text>
      </View>
      <OnboardingFooter label="Terminer l&apos;onboarding" onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screen,
    gap: 12,
  },
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.54,
    color: Colors.terracotta,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 28,
    color: Colors.encre,
    textAlign: "center",
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    textAlign: "center",
    maxWidth: "85%",
  },
});
