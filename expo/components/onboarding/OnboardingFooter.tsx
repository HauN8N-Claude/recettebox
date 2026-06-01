import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { Colors, Radius, Spacing } from "@/constants/theme";

type Props = {
  label?: string;
  disabled?: boolean;
  onPress: () => void;
};

export function OnboardingFooter({ label = "Continuer", disabled = false, onPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: insets.bottom + 16 },
      ]}
    >
      {/* Dégradé crème : fade le contenu défilé au-dessus dans le footer
          pour mieux détacher le CTA. pointerEvents none → ne bloque rien. */}
      <LinearGradient
        colors={["rgba(250,246,240,0)", Colors.creme]}
        style={styles.fade}
        pointerEvents="none"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
          onPress();
        }}
        style={({ pressed }) => [
          styles.cta,
          {
            opacity: disabled ? 0.4 : pressed ? 0.92 : 1,
            transform: [{ scale: pressed && !disabled ? 0.99 : 1 }],
          },
        ]}
      >
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 12,
    backgroundColor: Colors.creme,
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -50,
    height: 50,
  },
  cta: {
    height: 54,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.terracotta,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
    letterSpacing: 0.2,
  },
});

export default OnboardingFooter;
