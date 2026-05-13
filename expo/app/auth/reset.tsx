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
import { ChevronLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { Reveal } from "@/components/Reveal";
import { supabase } from "@/lib/supabase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const emailValid = EMAIL_REGEX.test(email.trim());
  const canSubmit = emailValid && !loading;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const trimmedEmail = email.trim();
    // Supabase répond "OK" même si l'email n'existe pas (anti-énumération).
    // On affiche donc un message générique dans tous les cas.
    await supabase.auth.resetPasswordForEmail(trimmedEmail);
    setLoading(false);

    Alert.alert(
      "Code envoyé",
      "Si cet email existe, tu vas recevoir un code à six chiffres dans quelques secondes. Vérifie ta boîte mail (et tes spams).",
      [
        {
          text: "OK",
          onPress: () =>
            router.replace({
              pathname: "/auth/reset-confirm",
              params: { email: trimmedEmail },
            }),
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
          <Text style={styles.title}>Mot de passe oublié ?</Text>
        </Reveal>
        <Reveal delay={160}>
          <Text style={styles.subtitle}>
            Pas de panique. Indique ton email, on t&apos;envoie un code pour le réinitialiser.
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
              returnKeyType="send"
              onSubmitEditing={onSubmit}
            />
          </View>
        </Reveal>

        <Reveal delay={340}>
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
              {loading ? "Envoi…" : "Envoyer le code"}
            </Text>
          </Pressable>
        </Reveal>

        <Reveal delay={420}>
          <Pressable
            onPress={() => router.replace("/auth/login")}
            hitSlop={8}
            accessibilityRole="button"
            style={styles.backWrap}
          >
            <ChevronLeft size={16} color={Colors.cacao} strokeWidth={2} />
            <Text style={styles.backText}>Retour à la connexion</Text>
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
  field: { marginTop: 24 },
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
  backWrap: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 24,
    gap: 4,
  },
  backText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.cacao,
    textDecorationLine: "underline",
  },
});
