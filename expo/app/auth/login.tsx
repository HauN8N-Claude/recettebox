import { useRouter } from "expo-router";
import React, { useState } from "react";
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "Email ou mot de passe incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "Tu dois d'abord confirmer ton email. Vérifie ta boîte mail.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Connexion impossible. Vérifie ta connexion internet.";
  }
  return "Connexion impossible. Réessaie dans un instant.";
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_REGEX.test(email.trim());
  const passwordValid = password.length >= 6;
  const canSubmit = emailValid && passwordValid && !loading;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (authError) {
      setError(mapAuthError(authError.message));
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      return;
    }
    router.replace("/(tabs)");
  };

  const onForgotPassword = () => {
    router.push("/auth/reset");
  };

  const goToSignup = () => {
    router.push("/auth/signup");
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
          <Text style={styles.title}>Bon retour !</Text>
        </Reveal>
        <Reveal delay={160}>
          <Text style={styles.subtitle}>
            Connecte-toi pour retrouver tes recettes.
          </Text>
        </Reveal>

        <Reveal delay={240}>
          <View style={styles.field}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ton@email.com"
              placeholderTextColor={Colors.cacao + "99"}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />
          </View>
        </Reveal>

        <Reveal delay={320}>
          <View style={styles.field}>
            <Text style={styles.label}>MOT DE PASSE</Text>
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
                autoComplete="password"
                textContentType="password"
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
            <Pressable
              onPress={onForgotPassword}
              hitSlop={8}
              accessibilityRole="button"
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </Pressable>
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
              {loading ? "Connexion…" : "Se connecter"}
            </Text>
          </Pressable>
        </Reveal>

        <Reveal delay={480}>
          <Pressable
            onPress={goToSignup}
            hitSlop={8}
            accessibilityRole="button"
            style={styles.signupWrap}
          >
            <Text style={styles.signupText}>
              Pas de compte ? <Text style={styles.signupLink}>Inscris-toi</Text>
            </Text>
          </Pressable>
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
  field: {
    marginTop: 24,
  },
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
  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: 10,
  },
  forgotText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.cacao,
    textDecorationLine: "underline",
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
  signupWrap: {
    alignSelf: "center",
    marginTop: 24,
  },
  signupText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
  },
  signupLink: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.terracotta,
    textDecorationLine: "underline",
  },
});
