import React, { useCallback } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, BarChart3, Check, Shield, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";
import { useAnalyticsConsentStore } from "@/stores/analyticsConsentStore";

export default function AnalyticsConsentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setConsent = useAnalyticsConsentStore((s) => s.setConsent);

  const handleHaptic = useCallback((style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style).catch(() => {});
    }
  }, []);

  const handleDecision = useCallback(
    (value: boolean) => {
      handleHaptic(
        value
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );
      setConsent(value);
      router.back();
    },
    [handleHaptic, router, setConsent]
  );

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
        <Text style={styles.topTitle}>Données d&apos;usage</Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + Spacing.section,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIconRing}>
            <BarChart3 size={28} color={Colors.terracotta} strokeWidth={1.6} />
          </View>
          <Text style={styles.h1}>Aide-nous à améliorer RecetteBox</Text>
          <Text style={styles.lede}>
            On aimerait collecter quelques statistiques d&apos;usage{" "}
            anonymisées pour comprendre ce qui fonctionne, et ce qui
            mérite mieux.
          </Text>
        </View>

        <View style={styles.cardBlock}>
          <Text style={styles.eyebrow}>Ce qu&apos;on collecterait</Text>
          <Bullet
            icon={<Check size={16} color={Colors.sauge} strokeWidth={2.2} />}
          >
            Les écrans que tu visites et les actions clés (import, partage,
            ouverture d&apos;une recette).
          </Bullet>
          <Bullet
            icon={<Check size={16} color={Colors.sauge} strokeWidth={2.2} />}
          >
            Le type d&apos;appareil et la version de l&apos;app, pour
            diagnostiquer les bugs.
          </Bullet>
        </View>

        <View style={styles.cardBlock}>
          <Text style={styles.eyebrow}>Ce qu&apos;on ne fait jamais</Text>
          <Bullet
            icon={<X size={16} color={Colors.terracotta} strokeWidth={2.2} />}
          >
            Vendre tes données à des tiers.
          </Bullet>
          <Bullet
            icon={<X size={16} color={Colors.terracotta} strokeWidth={2.2} />}
          >
            T&apos;associer à un profil publicitaire.
          </Bullet>
          <Bullet
            icon={<X size={16} color={Colors.terracotta} strokeWidth={2.2} />}
          >
            Lire le contenu de tes recettes pour autre chose que te le
            restituer.
          </Bullet>
        </View>

        <View style={styles.reassureRow}>
          <Shield size={14} color={Colors.cacao} strokeWidth={2} />
          <Text style={styles.reassureText}>
            Tu peux changer d&apos;avis à tout moment depuis ton profil.
          </Text>
        </View>

        <PressableScale
          onPress={() => router.push("/legal/privacy")}
          style={styles.privacyLink}
          scaleTo={0.97}
        >
          <Text style={styles.privacyLinkText}>
            Lire la politique de confidentialité →
          </Text>
        </PressableScale>
      </ScrollView>

      <View
        style={[
          styles.ctaWrap,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 18 },
        ]}
      >
        <PressableScale
          onPress={() => handleDecision(false)}
          style={styles.ctaGhost}
          scaleTo={0.97}
          haptic={false}
        >
          <Text style={styles.ctaGhostText}>Refuser</Text>
        </PressableScale>
        <PressableScale
          onPress={() => handleDecision(true)}
          style={styles.ctaPrimary}
          scaleTo={0.97}
          haptic={false}
        >
          <Text style={styles.ctaPrimaryText}>Accepter</Text>
        </PressableScale>
      </View>
    </View>
  );
}

function Bullet({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletIcon}>{icon}</View>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
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
  iconButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  topTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 18,
    color: Colors.encre,
    flex: 1,
    textAlign: "center",
  },
  hero: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 18,
    alignItems: "center",
    gap: 14,
  },
  heroIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
  },
  h1: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 26,
    color: Colors.encre,
    lineHeight: 32,
    textAlign: "center",
  },
  lede: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 340,
  },
  cardBlock: {
    marginHorizontal: Spacing.screen,
    marginTop: 24,
    padding: 18,
    borderRadius: Radius.card,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
    gap: 12,
  },
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    color: Colors.sauge,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bulletIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.creme,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.encre,
    lineHeight: 21,
  },
  reassureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    marginTop: 22,
    paddingHorizontal: Spacing.screen,
  },
  reassureText: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 13,
    color: Colors.cacao,
    textAlign: "center",
  },
  privacyLink: {
    marginTop: 14,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  privacyLinkText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.terracotta,
    letterSpacing: 0.2,
  },
  ctaWrap: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: Spacing.screen,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    backgroundColor: Colors.creme,
  },
  ctaGhost: {
    flex: 1,
    height: 54,
    borderRadius: Radius.cta,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.rule,
    backgroundColor: Colors.creme,
  },
  ctaGhostText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.cacao,
    letterSpacing: 0.2,
  },
  ctaPrimary: {
    flex: 1,
    height: 54,
    borderRadius: Radius.cta,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.terracotta,
    shadowColor: Colors.encre,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ctaPrimaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
    letterSpacing: 0.2,
  },
});
