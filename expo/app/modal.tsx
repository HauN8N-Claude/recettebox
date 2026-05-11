import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";

export default function ModalScreen() {
  return (
    <Pressable style={styles.overlay} onPress={() => router.back()}>
      <View style={styles.sheet}>
        <Text style={styles.label}>Aperçu</Text>
        <Text style={styles.title}>Tu peux fermer ça.</Text>
        <Text style={styles.body}>
          Touche n&apos;importe où en dehors pour revenir à ton carnet.
        </Text>
        <Pressable
          style={styles.cta}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>Fermer</Text>
        </Pressable>
      </View>
      <StatusBar style="dark" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(42,37,32,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.screen,
  },
  sheet: {
    backgroundColor: Colors.creme,
    borderRadius: Radius.card,
    padding: 24,
    alignItems: "center",
    minWidth: 280,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    color: Colors.sauge,
    marginBottom: 12,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 22,
    color: Colors.encre,
    textAlign: "center",
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  cta: {
    marginTop: 22,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.creme,
  },
});
