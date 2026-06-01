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
import { syncOnboardingProfile } from "@/lib/api/profile";
import useOnboardingStore from "@/stores/onboardingStore";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapSignupError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Un compte existe déjà avec cet email. Connecte-toi.";
  }
  if (m.includes("password should be at least") || m.includes("weak password")) {
    return "Le mot de passe doit faire au moins 6 caractères.";
  }
  if (m.includes("invalid email") || m.includes("invalid format")) {
    return "Email invalide.";
  }
  if (m.includes("signup is disabled")) {
    return "L'inscription est temporairement désactivée. Réessaie plus tard.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Connexion impossible. Vérifie ta connexion internet.";
  }
  return "Création impossible. Réessaie dans un instant.";
}

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstNameValid = firstName.trim().length >= 2;
  const emailValid = EMAIL_REGEX.test(email.trim());
  const passwordValid = password.length >= 6;
  const canSubmit = firstNameValid && emailValid && passwordValid && !loading;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
        },
      },
    });

    setLoading(false);

    if (authError) {
      setError(mapSignupError(authError.message));
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      return;
    }

    if (data.session) {
      // Sync onboarding -> profil Supabase en arriere-plan (fire-and-forget).
      // Ne bloque pas la navigation : si ca echoue, B6.3 rejouera au prochain
      // demarrage en regardant profiles.onboarding_completed_at.
      void syncOnboardingProfile(useOnboardingStore.getState()).catch(() => {});
      // Première utilisation : on atterrit sur la Bibliothèque vide (empty
      // state avec les 3 étapes « Ouvre Insta → Partager → RecetteBox »)
      // plutôt que sur l'Accueil — c'est l'action concrète à faire en premier.
      router.replace("/(tabs)/library");
      return;
    }

    Alert.alert(
      "Vérifie ta boîte mail",
      "On vient de t'envoyer un email pour confirmer ton inscription. Clique le lien pour activer ton compte, puis reviens te connecter.",
      [
        {
          text: "OK",
          onPress: () => router.replace("/auth/login"),
        },
      ],
    );
  };

  const goToLogin = () => {
    router.replace("/auth/login");
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
          <Text style={styles.title}>Bienvenue !</Text>
        </Reveal>
        <Reveal delay={160}>
          <Text style={styles.subtitle}>
            Crée ton compte pour garder tes recettes.
          </Text>
        </Reveal>

        <Reveal delay={240}>
          <View style={styles.field}>
            <Text style={styles.label}>TON PRÉNOM</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Camille"
              placeholderTextColor={Colors.cacao + "99"}
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="given-name"
              textContentType="givenName"
              returnKeyType="next"
              maxLength={40}
            />
          </View>
        </Reveal>

        <Reveal delay={300}>
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

        <Reveal delay={360}>
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

        <Reveal delay={440}>
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
              {loading ? "Création…" : "Créer mon compte"}
            </Text>
          </Pressable>
        </Reveal>

        <Reveal delay={520}>
          <Pressable
            onPress={goToLogin}
            hitSlop={8}
            accessibilityRole="button"
            style={styles.loginWrap}
          >
            <Text style={styles.loginText}>
              Déjà un compte ? <Text style={styles.loginLink}>Connecte-toi</Text>
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
    marginTop: 20,
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
  loginWrap: {
    alignSelf: "center",
    marginTop: 24,
  },
  loginText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
  },
  loginLink: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.terracotta,
    textDecorationLine: "underline",
  },
});
