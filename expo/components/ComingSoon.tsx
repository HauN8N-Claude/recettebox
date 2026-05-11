import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Spacing } from "@/constants/theme";
import { Reveal } from "@/components/Reveal";

type Props = {
  label: string;
  title: string;
  body: string;
  whisper: string;
};

/**
 * Brand-consistent placeholder used by tabs that ship empty in V1
 * (Plan, Courses, Profil). Honors the screen reveal stagger rule.
 */
export function ComingSoon({ label, title, body, whisper }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 100 },
      ]}
    >
      <Reveal delay={0}>
        <Text style={styles.label}>{label}</Text>
      </Reveal>
      <Reveal delay={180}>
        <Text style={styles.title}>{title}</Text>
      </Reveal>
      <Reveal delay={360}>
        <Text style={styles.body}>{body}</Text>
      </Reveal>
      <Reveal delay={560}>
        <View style={styles.whisperWrap}>
          <View style={styles.rule} />
          <Text style={styles.whisper}>{whisper}</Text>
        </View>
      </Reveal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creme,
    paddingHorizontal: Spacing.screen,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    color: Colors.sauge,
    textAlign: "center",
    marginBottom: 18,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 30,
    lineHeight: 36,
    color: Colors.encre,
    textAlign: "center",
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: 14,
    maxWidth: 300,
  },
  whisperWrap: {
    alignItems: "center",
    marginTop: 40,
  },
  rule: {
    width: 28,
    height: 1,
    backgroundColor: Colors.rule,
    marginBottom: 14,
  },
  whisper: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 13,
    color: Colors.cacao,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
});

export default ComingSoon;
