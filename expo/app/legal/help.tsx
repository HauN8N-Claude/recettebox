import React, { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Check, Copy, Mail } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";

const SUPPORT_EMAIL = "support@recettebox.app";
const SUPPORT_SUBJECT = "Demande d'assistance — RecetteBox";

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const onContact = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      SUPPORT_SUBJECT,
    )}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        "Impossible d'ouvrir l'app Mail",
        `Tu peux nous écrire à ${SUPPORT_EMAIL}.`,
      );
    });
  }, []);

  const onCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(SUPPORT_EMAIL);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert(
        "Copie impossible",
        `Copie l'adresse manuellement : ${SUPPORT_EMAIL}`,
      );
    }
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <PressableScale
          onPress={() => router.back()}
          style={styles.iconButton}
          scaleTo={0.92}
        >
          <ArrowLeft size={20} color={Colors.encre} strokeWidth={2} />
        </PressableScale>
        <Text style={styles.topTitle}>Aide et support</Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.h1}>Centre d&apos;aide</Text>
          <Text style={styles.intro}>
            Une question ou un problème avec RecetteBox ? Notre équipe est là
            pour vous aider.
          </Text>
        </View>

        <View style={styles.section}>
          <Pressable
            onPress={onContact}
            accessibilityRole="button"
            accessibilityLabel="Contacter le support par e-mail"
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.92 : 1 }]}
          >
            <Mail size={18} color={Colors.creme} strokeWidth={2.2} />
            <Text style={styles.ctaLabel}>Contacter le support</Text>
          </Pressable>

          <Text style={styles.emailLabel}>Ou écris-nous directement à</Text>
          <View style={styles.emailCard}>
            <Text style={styles.emailText} selectable>
              {SUPPORT_EMAIL}
            </Text>
            <Pressable
              onPress={onCopy}
              accessibilityRole="button"
              accessibilityLabel="Copier l'adresse e-mail"
              hitSlop={8}
              style={({ pressed }) => [
                styles.copyBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              {copied ? (
                <Check size={16} color={Colors.sauge} strokeWidth={2.4} />
              ) : (
                <Copy size={16} color={Colors.terracotta} strokeWidth={2.2} />
              )}
              <Text style={[styles.copyLabel, copied && styles.copyLabelDone]}>
                {copied ? "Copié" : "Copier"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.creme },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPlaceholder: { width: 40, height: 40 },
  topTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 18,
    color: Colors.encre,
    flex: 1,
    textAlign: "center",
  },
  header: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 12,
    gap: 12,
  },
  h1: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 28,
    color: Colors.encre,
    lineHeight: 34,
  },
  intro: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 23,
    color: Colors.cacao,
  },
  section: {
    paddingHorizontal: Spacing.screen,
    marginTop: 32,
    gap: 16,
  },
  cta: {
    flexDirection: "row",
    gap: 10,
    height: 54,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
    letterSpacing: 0.2,
  },
  emailLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: 4,
  },
  emailCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radius.cta,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  emailText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.encre,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  copyLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.terracotta,
  },
  copyLabelDone: {
    color: Colors.sauge,
  },
});
