import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { OnboardingFooter } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { useOnboardingStore } from "@/stores/onboardingStore";

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
  "3 imports gratuits pour découvrir",
  "Imports illimités depuis TikTok & Instagram",
  "Liste de courses générée automatiquement",
  "Toutes tes recettes synchronisées",
  "Tu soutiens un projet indé 💛",
];

export default function PaywallCompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const finish = useOnboardingStore((s) => s.finish);
  const [selected, setSelected] = useState<PlanId>("annual");

  const select = (id: PlanId) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setSelected(id);
  };

  const onContinue = () => {
    // P1.7 : on marque l'onboarding fini et on bascule vers le signup.
    // Le branchement RevenueCat / achat in-app viendra en P3.x ; pour V1.0
    // le CTA crée un compte free, l'utilisateur pourra passer Premium depuis
    // son profil quand le paiement sera branché.
    finish();
    router.replace("/auth/signup");
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 16 }]}>
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

        <Reveal delay={860}>
          <Text style={styles.helper}>
            Tu pourras passer Premium quand tu veux depuis ton profil.
          </Text>
        </Reveal>
      </ScrollView>

      <OnboardingFooter label="Commencer" onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
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
  helper: {
    marginTop: 14,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    color: Colors.cacao,
    textAlign: "center",
    opacity: 0.85,
  },
});
