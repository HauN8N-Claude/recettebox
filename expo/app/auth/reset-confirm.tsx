import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Eye, EyeOff } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { Reveal } from "@/components/Reveal";
import { supabase } from "@/lib/supabase";

const RESEND_COOLDOWN_SECONDS = 60;
const CODE_REGEX = /^\d{6}$/;

function mapResetError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("expired")) {
    return "Le code a expiré. Demande-en un nouveau.";
  }
  if (m.includes("invalid") && (m.includes("token") || m.includes("otp"))) {
    return "Code incorrect. Vérifie ton email.";
  }
  if (m.includes("password should be at least") || m.includes("weak password")) {
    return "Le mot de passe doit faire au moins 6 caractères.";
  }
  if (m.includes("same password")) {
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Connexion impossible. Vérifie ton internet.";
  }
  return "Impossible de réinitialiser. Réessaie dans un instant.";
}

export default function ResetConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? "";

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    const id = setInterval(() => {
      setCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const codeValid = CODE_REGEX.test(code);
  const passwordValid = password.length >= 6;
  const canSubmit = !!email && codeValid && passwordValid && !loading;

  const onResend = async () => {
    if (cooldown > 0 || !email) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    await supabase.auth.resetPasswordForEmail(email);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    Alert.alert(
      "Code renvoyé",
      "Vérifie ta boîte mail (et tes spams).",
    );
  };

  const onSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    // Étape 1 : vérifier l'OTP de recovery
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "recovery",
    });

    if (otpError) {
      setLoading(false);
      setError(mapResetError(otpError.message));
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
          () => {},
        );
      }
      return;
    }

    // Étape 2 : mettre à jour le mot de passe (la session de recovery
    // existe maintenant côté SDK).
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setLoading(false);
      setError(mapResetError(updateError.message));
      return;
    }

    // Étape 3 : on déconnecte pour forcer l'utilisateur à se reconnecter
    // avec le nouveau mot de passe (UX claire + propre).
    await supabase.auth.signOut().catch(() => {});
    setLoading(false);

    Alert.alert(
      "Mot de passe mis à jour",
      "Tu peux maintenant te connecter avec ton nouveau mot de passe.",
      [
        {
          text: "OK",
          onPress: () => router.replace("/auth/login"),
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Reveal delay={60}>
          <Text style={styles.title}>Nouveau mot de passe</Text>
        </Reveal>
        <Reveal delay={160}>
          <Text style={styles.subtitle}>
            On t&apos;a envoyé un code à six chiffres sur{" "}
            <Text style={styles.subtitleStrong}>{email || "ton email"}</Text>.
          </Text>
        </Reveal>

        <Reveal delay={240}>
          <View style={styles.field}>
            <Text style={styles.label}>CODE REÇU PAR MAIL</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              placeholderTextColor={Colors.cacao + "99"}
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              returnKeyType="next"
              maxLength={6}
            />
          </View>
        </Reveal>

        <Reveal delay={320}>
          <View style={styles.field}>
            <Text style={styles.label}>NOUVEAU MOT DE PASSE</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.cacao + "99"}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
              <Pressable
                onPress={() => setShowPassword((s) => !s)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                }
                style={styles.eyeBtn}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.cacao} strokeWidth={2} />
                ) : (
                  <Eye size={20} color={Colors.cacao} strokeWidth={2} />
                )}
              </Pressable>
            </View>
            <Text style={styles.hint}>Au moins 6 caractères.</Text>
          </View>
        </Reveal>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Reveal delay={400}>
          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            style={({ pressed }) => [
              styles.cta,
              {
                opacity: !canSubmit ? 0.4 : pressed ? 0.92 : 1,
                transform: [{ scale: pressed && canSubmit ? 0.99 : 1 }],
              },
            ]}
          >
            <Text style={styles.ctaLabel}>
              {loading ? "Réinitialisation…" : "Réinitialiser mon mot de passe"}
            </Text>
          </Pressable>
        </Reveal>

        <Reveal delay={480}>
          <View style={styles.resendWrap}>
            <Text style={styles.resendLead}>Pas reçu ?</Text>
            <Pressable
              onPress={onResend}
              disabled={cooldown > 0}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Renvoyer le code"
            >
              <Text
                style={[
                  styles.resendLink,
                  { opacity: cooldown > 0 ? 0.5 : 1 },
                ]}
              >
                {cooldown > 0
                  ? `Renvoyer le code (${cooldown}s)`
                  : "Renvoyer le code"}
              </Text>
            </Pressable>
          </View>
        </Reveal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  content: {
    paddingHorizontal: Spacing.screen,
    gap: 8,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 28,
    color: Colors.encre,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    marginTop: 6,
    lineHeight: 22,
  },
  subtitleStrong: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.encre,
  },
  field: { marginTop: 20 },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    color: Colors.cacao,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: Radius.cta,
    backgroundColor: Colors.creme,
    borderWidth: 1,
    borderColor: Colors.sauge,
    paddingHorizontal: 16,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.encre,
  },
  passwordRow: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    height: 52,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.cacao,
    marginTop: 8,
    marginLeft: 4,
  },
  errorBox: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta + "1A",
    borderWidth: 1,
    borderColor: Colors.terracotta + "55",
  },
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.terracotta,
    lineHeight: 20,
  },
  cta: {
    marginTop: 28,
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
  resendWrap: {
    alignSelf: "center",
    marginTop: 24,
    alignItems: "center",
    gap: 4,
  },
  resendLead: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
  },
  resendLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.terracotta,
    textDecorationLine: "underline",
  },
});
