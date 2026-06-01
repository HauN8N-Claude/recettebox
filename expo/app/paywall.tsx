/**
 * Paywall in-app — déclenché depuis le profil ou quand un user free atteint
 * son quota de 3 imports à vie (cf. Edge Function imports/ code QUOTA_FREE_REACHED).
 *
 * UI clonée de app/onboarding/paywall-compare.tsx pour la cohérence visuelle.
 * Différences avec la version onboarding :
 *   - bouton de fermeture (X) en haut à droite
 *   - CTA "Commencer Premium" ouvre une alerte "bientôt" en V1.0 (le branchement
 *     RevenueCat / StoreKit viendra en Phase C, après obtention du compte
 *     Apple Developer)
 *   - dismiss → router.back()
 *
 * TODO Phase C : extraire le contenu commun avec paywall-compare en un
 * composant <PaywallContent /> partagé, et brancher l'achat in-app réel.
 */
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";
import { Reveal } from "@/components/Reveal";

type PlanId = "weekly" | "monthly" | "annual" | "lifetime";

type Plan = {
  id: PlanId;
  title: string;
  price: string;
  period: string;
  trial?: string;
  badge?: string;
};

const PLANS: Plan[] = [
  { id: "weekly", title: "Hebdomadaire", price: "3,49€", period: "/ semaine" },
  { id: "monthly", title: "Mensuel", price: "7,99€", period: "/ mois" },
  {
    id: "annual",
    title: "Annuel",
    price: "49,99€",
    period: "/ an",
    trial: "Soit 4,17€ / mois",
    badge: "Économise 48%",
  },
  { id: "lifetime", title: "À vie", price: "119,99€", period: "paiement unique" },
];

const BENEFITS = [
  "Imports illimités depuis TikTok & Instagram",
  "Liste de courses générée automatiquement",
  "Toutes tes recettes synchronisées",
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<PlanId>("annual");

  const haptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style).catch(() => {});
    }
  };

  const select = (id: PlanId) => {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    setSelected(id);
  };

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const onContinue = () => {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "L'achat Premium arrive très vite",
      "On est en phase finale d'intégration. Pour devenir beta-testeur, contacte-nous via ton profil. Merci de ton intérêt !",
      [{ text: "OK" }],
    );
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 12 }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar avec close X */}
      <View style={styles.topBar}>
        <Pressable
          onPress={close}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          style={styles.closeBtn}
        >
          <X size={20} color={Colors.encre} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={60}>
          <Text style={styles.eyebrow}>DÉBLOQUE TOUT</Text>
        </Reveal>

        <Reveal delay={140}>
          <Text style={styles.title}>Une bibliothèque sans limites.</Text>
        </Reveal>

        <Reveal delay={220}>
          <Text style={styles.subtitle}>
            Choisis ta formule. Tu changes d&apos;avis quand tu veux.
          </Text>
        </Reveal>

        <Reveal delay={300}>
          <View style={styles.benefits}>
            {BENEFITS.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <View style={styles.checkCircle}>
                  <Check size={13} color={Colors.creme} strokeWidth={3} />
                </View>
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>
        </Reveal>

        <View style={styles.plans}>
          {PLANS.map((p, i) => {
            const isSelected = selected === p.id;
            return (
              <Reveal key={p.id} delay={420 + i * 70}>
                <Pressable
                  onPress={() => select(p.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${p.title} ${p.price} ${p.period}`}
                >
                  <View
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                    ]}
                  >
                    {p.badge ? (
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>{p.badge}</Text>
                      </View>
                    ) : null}

                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterSelected,
                      ]}
                    >
                      {isSelected ? <View style={styles.radioInner} /> : null}
                    </View>

                    <View style={styles.planMid}>
                      <Text style={styles.planTitle}>{p.title}</Text>
                      {p.trial ? (
                        <Text style={styles.planTrial}>{p.trial}</Text>
                      ) : null}
                    </View>

                    <View style={styles.planRight}>
                      <Text style={styles.planPrice}>{p.price}</Text>
                      <Text style={styles.planPeriod}>{p.period}</Text>
                    </View>
                  </View>
                </Pressable>
              </Reveal>
            );
          })}
        </View>

        <Reveal delay={780}>
          <Text style={styles.legal}>
            Renouvellement automatique. Annulable à tout moment dans les
            réglages de ton compte App Store.
          </Text>
        </Reveal>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 22 },
        ]}
      >
        <PressableScale
          onPress={onContinue}
          style={styles.cta}
          scaleTo={0.97}
          haptic={false}
        >
          <Text style={styles.ctaText}>Commencer Premium</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  topBar: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 8,
    alignItems: "flex-end",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  content: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 24,
  },
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.54,
    color: Colors.terracotta,
    marginBottom: 12,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 30,
    lineHeight: 36,
    color: Colors.encre,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: Colors.cacao,
    marginTop: 10,
  },
  benefits: {
    marginTop: 22,
    gap: 12,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: Colors.sauge,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    lineHeight: 21,
    color: Colors.encre,
  },
  plans: {
    marginTop: 26,
    gap: 10,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Colors.rule,
    backgroundColor: Colors.creme,
    position: "relative",
  },
  planCardSelected: {
    borderColor: Colors.terracotta,
    borderWidth: 2,
    backgroundColor: "#FBEFE9",
  },
  planBadge: {
    position: "absolute",
    top: -10,
    right: 14,
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  planBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.1,
    color: Colors.creme,
    textTransform: "uppercase" as const,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: Colors.terracotta,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: Colors.terracotta,
  },
  planMid: {
    flex: 1,
    gap: 2,
  },
  planTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.encre,
  },
  planTrial: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
    color: Colors.sauge,
  },
  planRight: {
    alignItems: "flex-end",
  },
  planPrice: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 18,
    color: Colors.encre,
  },
  planPeriod: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.cacao,
    marginTop: 1,
  },
  legal: {
    marginTop: 18,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 15,
    color: Colors.cacao,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 12,
  },
  cta: {
    height: 56,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.encre,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
    letterSpacing: 0.2,
  },
});
