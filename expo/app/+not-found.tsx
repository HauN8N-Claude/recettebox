import { Link, Stack } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.label}>Page introuvable</Text>
        <Text style={styles.title}>Ce chemin n&apos;existe pas.</Text>
        <Text style={styles.body}>
          Reviens à ton carnet, on remet de l&apos;ordre dans tout ça.
        </Text>
        <Link href="/" style={styles.cta}>
          <Text style={styles.ctaText}>Revenir au carnet</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.creme,
    paddingHorizontal: Spacing.screen,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    color: Colors.sauge,
    marginBottom: 14,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 28,
    color: Colors.encre,
    textAlign: "center",
    lineHeight: 34,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
    maxWidth: 280,
  },
  cta: {
    marginTop: 28,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.creme,
  },
});
