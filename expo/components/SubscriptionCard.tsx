import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Radius } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const FREE_QUOTA = 3;

type QuotaRow = {
  plan: "free" | "premium_monthly" | "premium_annual" | null;
  imports_lifetime: number | null;
};

async function fetchQuota(userId: string): Promise<QuotaRow> {
  const { data, error } = await supabase
    .from("user_import_quota")
    .select("plan, imports_lifetime")
    .eq("user_id", userId)
    .single<QuotaRow>();
  if (error) throw error;
  return data;
}

function comingSoonAlert(title: string, body: string) {
  Alert.alert(title, body);
}

export function SubscriptionCard() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user_import_quota", userId],
    queryFn: () => fetchQuota(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const plan = data?.plan ?? "free";
  const isPremium = plan === "premium_monthly" || plan === "premium_annual";
  const used = data?.imports_lifetime ?? 0;
  const usedClamped = Math.min(used, FREE_QUOTA);
  const exhausted = used >= FREE_QUOTA;
  const progress = Math.min(usedClamped / FREE_QUOTA, 1);

  const onTapPremium = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    comingSoonAlert(
      "Bientôt disponible",
      "L'abonnement Premium arrive très vite. On te tient au courant !",
    );
  };

  const onTapManageSubscription = () => {
    comingSoonAlert(
      "Bientôt disponible",
      "La gestion de l'abonnement Premium arrive très vite.",
    );
  };

  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>Chargement de ton abonnement…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>
          Statut indisponible. Vérifie ta connexion internet.
        </Text>
      </View>
    );
  }

  if (isPremium) {
    return (
      <View style={[styles.card, styles.premiumCard]}>
        <View style={styles.headerRow}>
          <Text style={styles.planLabelPremium}>PREMIUM</Text>
          <Sparkles size={16} color={Colors.miel} strokeWidth={2.4} />
        </View>
        <Text style={styles.premiumTagline}>
          Importe tes recettes sans limite.
        </Text>
        <Pressable
          onPress={onTapManageSubscription}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.manageRow,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={styles.manageLabel}>Gérer mon abonnement</Text>
          <ChevronRight size={16} color={Colors.cacao} strokeWidth={2} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.planLabel}>PLAN FREE</Text>

      {exhausted ? (
        <>
          <Text style={styles.exhaustedTitle}>
            🎉 Tu as terminé ton essai gratuit !
          </Text>
          <Text style={styles.exhaustedBody}>
            Continue l&apos;aventure avec Premium.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.usageLine}>
            {used} import{used > 1 ? "s" : ""} utilisé{used > 1 ? "s" : ""} sur {FREE_QUOTA}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </>
      )}

      <Pressable
        onPress={onTapPremium}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.cta,
          {
            opacity: pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        <Text style={styles.ctaLabel}>Passer à Premium</Text>
        <Sparkles size={16} color={Colors.creme} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

export default SubscriptionCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.creme,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.rule,
    padding: 18,
    marginBottom: 24,
  },
  premiumCard: {
    backgroundColor: Colors.cremeDeep,
    borderColor: Colors.miel + "55",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  planLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    color: Colors.cacao,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  planLabelPremium: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    color: Colors.encre,
    textTransform: "uppercase",
  },
  premiumTagline: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 18,
    lineHeight: 24,
    color: Colors.encre,
    marginBottom: 16,
  },
  usageLine: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.encre,
    marginBottom: 10,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.rule,
    overflow: "hidden",
    marginBottom: 18,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: Colors.terracotta,
  },
  exhaustedTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 20,
    lineHeight: 26,
    color: Colors.encre,
    marginBottom: 6,
  },
  exhaustedBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    lineHeight: 20,
    marginBottom: 18,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
  },
  ctaLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.creme,
    letterSpacing: 0.2,
  },
  manageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  manageLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.cacao,
    textDecorationLine: "underline",
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    textAlign: "center",
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    textAlign: "center",
    lineHeight: 20,
  },
});
