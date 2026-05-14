import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  AppState,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bell,
  BellOff,
  ChevronRight,
  FileText,
  LogOut,
  Mail,
  Shield,
  Trash2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { Reveal } from "@/components/Reveal";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  getNotificationStatus,
  openSystemSettings,
  type NotificationStatus,
} from "@/lib/pushNotifications";

const SAUGE_SOFT = "#E6ECDF";

// TODO P2.6 — replacer par l'email support définitif (nom de domaine app à créer)
const SUPPORT_EMAIL = "contact@recettebox.app";
const SUPPORT_SUBJECT = "Support RecetteBox";

function getInitial(firstName?: string | null, email?: string | null): string {
  const source = firstName?.trim() || email?.trim() || "";
  return source.charAt(0).toUpperCase() || "?";
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reset = useOnboardingStore((s) => s.reset);
  const { user } = useAuth();

  const firstName =
    (user?.user_metadata?.first_name as string | undefined) ?? null;
  const email = user?.email ?? null;
  const initial = getInitial(firstName, email);
  const displayName = firstName?.trim() || "Bienvenue";

  const [notifStatus, setNotifStatus] = useState<NotificationStatus>("undetermined");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const status = await getNotificationStatus();
      if (mounted) setNotifStatus(status);
    };
    check();
    // Re-vérifie quand l'utilisateur revient des réglages système
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const onLogout = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    Alert.alert(
      "Se déconnecter",
      "Tu veux vraiment te déconnecter de RecetteBox ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ],
    );
  };

  const onDeleteAccount = () => {
    if (deleting) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    Alert.alert(
      "Supprimer mon compte",
      "Es-tu sûr ? Toutes tes recettes, préférences et ton abonnement seront définitivement perdus. Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Continuer",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Dernière confirmation",
              "Vraiment supprimer ton compte ?",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Supprimer définitivement",
                  style: "destructive",
                  onPress: async () => {
                    setDeleting(true);
                    const { error } = await supabase.functions.invoke(
                      "delete-account",
                      { method: "POST" },
                    );
                    if (error) {
                      setDeleting(false);
                      Alert.alert(
                        "Erreur",
                        "La suppression a échoué. Vérifie ta connexion ou réessaie.",
                      );
                      return;
                    }
                    // Force la déconnexion côté client. Le RootGate détectera
                    // la perte de session et redirigera vers /auth/login.
                    await supabase.auth.signOut().catch(() => {});
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const onContact = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(SUPPORT_SUBJECT)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        "Impossible d'ouvrir l'app Mail",
        `Tu peux nous écrire à ${SUPPORT_EMAIL}.`,
      );
    });
  };

  const onOpenTerms = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.push("/legal/terms");
  };

  const onOpenPrivacy = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.push("/legal/privacy");
  };

  const onResetOnboarding = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
    }
    reset();
    router.replace("/onboarding");
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={0}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <Text style={styles.name}>{displayName}</Text>
            {email ? <Text style={styles.email}>{email}</Text> : null}
          </View>
        </Reveal>

        <Reveal delay={160}>
          <SubscriptionCard />
        </Reveal>

        <Reveal delay={220}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
            <View style={styles.card}>
              {notifStatus === "granted" ? (
                <View style={[styles.row, styles.notifRow]}>
                  <View style={styles.rowIcon}>
                    <Bell size={18} color={Colors.sauge} strokeWidth={2} />
                  </View>
                  <View style={styles.notifTexts}>
                    <Text style={styles.rowLabel}>Activées</Text>
                    <Text style={styles.notifHelp}>
                      On te préviendra dès qu&apos;un import est prêt.
                    </Text>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={openSystemSettings}
                  accessibilityRole="button"
                  accessibilityLabel="Activer les notifications"
                  style={({ pressed }) => [
                    styles.row,
                    styles.notifRow,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <View style={styles.rowIcon}>
                    <BellOff size={18} color={Colors.cacao} strokeWidth={2} />
                  </View>
                  <View style={styles.notifTexts}>
                    <Text style={styles.rowLabel}>Désactivées</Text>
                    <Text style={styles.notifHelp}>
                      Active-les pour savoir quand tes recettes sont prêtes.
                    </Text>
                  </View>
                  <ChevronRight size={18} color={Colors.cacao} strokeWidth={2} />
                </Pressable>
              )}
            </View>
          </View>
        </Reveal>

        <Reveal delay={260}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AIDE & LÉGAL</Text>
            <View style={styles.card}>
              <Pressable
                onPress={onContact}
                accessibilityRole="button"
                accessibilityLabel="Nous contacter par mail"
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <View style={styles.rowIcon}>
                  <Mail size={18} color={Colors.cacao} strokeWidth={2} />
                </View>
                <Text style={styles.rowLabel}>Nous contacter</Text>
                <ChevronRight size={18} color={Colors.cacao} strokeWidth={2} />
              </Pressable>
              <View style={styles.rowDivider} />
              <Pressable
                onPress={onOpenTerms}
                accessibilityRole="button"
                accessibilityLabel="Lire les conditions générales d'utilisation"
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <View style={styles.rowIcon}>
                  <FileText size={18} color={Colors.cacao} strokeWidth={2} />
                </View>
                <Text style={styles.rowLabel}>CGU</Text>
                <ChevronRight size={18} color={Colors.cacao} strokeWidth={2} />
              </Pressable>
              <View style={styles.rowDivider} />
              <Pressable
                onPress={onOpenPrivacy}
                accessibilityRole="button"
                accessibilityLabel="Lire la politique de confidentialité"
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <View style={styles.rowIcon}>
                  <Shield size={18} color={Colors.cacao} strokeWidth={2} />
                </View>
                <Text style={styles.rowLabel}>Politique de confidentialité</Text>
                <ChevronRight size={18} color={Colors.cacao} strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        </Reveal>

        <Reveal delay={340}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>COMPTE</Text>
            <View style={styles.card}>
              <Pressable
                onPress={onLogout}
                accessibilityRole="button"
                accessibilityLabel="Se déconnecter"
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <View style={styles.rowIcon}>
                  <LogOut size={18} color={Colors.cacao} strokeWidth={2} />
                </View>
                <Text style={styles.rowLabel}>Se déconnecter</Text>
                <ChevronRight size={18} color={Colors.cacao} strokeWidth={2} />
              </Pressable>
              <View style={styles.rowDivider} />
              <Pressable
                onPress={onDeleteAccount}
                disabled={deleting}
                accessibilityRole="button"
                accessibilityLabel="Supprimer mon compte"
                style={({ pressed }) => [
                  styles.row,
                  { opacity: deleting ? 0.5 : pressed ? 0.6 : 1 },
                ]}
              >
                <View style={styles.rowIcon}>
                  <Trash2 size={18} color={Colors.terracotta} strokeWidth={2} />
                </View>
                <Text style={[styles.rowLabel, styles.rowLabelDanger]}>
                  {deleting ? "Suppression…" : "Supprimer mon compte"}
                </Text>
                <ChevronRight size={18} color={Colors.terracotta} strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        </Reveal>

        <Reveal delay={420}>
          <Text style={styles.version}>Version 1.0.0</Text>
        </Reveal>

        {__DEV__ ? (
          <View style={styles.devWrap}>
            <Pressable
              accessibilityRole="button"
              onPress={onResetOnboarding}
              style={({ pressed }) => [
                styles.devCta,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.devLabel}>DEV: Reset onboarding</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  content: {
    paddingHorizontal: Spacing.screen,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: SAUGE_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 36,
    color: Colors.encre,
  },
  name: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 26,
    color: Colors.encre,
    textAlign: "center",
  },
  email: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    color: Colors.cacao,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.creme,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.rule,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowIcon: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.encre,
  },
  rowLabelDanger: {
    color: Colors.terracotta,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.rule,
    marginLeft: 16 + 28 + 12, // align avec le texte (paddingLeft + icon + gap)
  },
  notifRow: {
    alignItems: "flex-start",
  },
  notifTexts: {
    flex: 1,
    gap: 4,
  },
  notifHelp: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
    color: Colors.cacao,
  },
  version: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: 16,
    opacity: 0.7,
  },
  devWrap: {
    alignItems: "center",
    marginTop: 32,
  },
  devCta: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    backgroundColor: Colors.encre,
  },
  devLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.creme,
    letterSpacing: 0.4,
  },
});
