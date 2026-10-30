import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight, Globe, Instagram, Link2, Music2, X } from "lucide-react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";
import { startImport } from "@/lib/api/imports";

// Import par collage de lien — flux de SECOURS (le flux principal reste le
// partage iOS). Sert aussi au testeur Apple pour importer sans partager
// depuis Instagram. Branché au vrai moteur serveur (lib/api/imports).

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.62);

const PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: Instagram, tint: Colors.terracotta },
  { key: "tiktok", label: "TikTok", icon: Music2, tint: Colors.encre },
  { key: "web", label: "Un lien", icon: Globe, tint: Colors.sauge },
] as const;

export default function ImportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const sheetTy = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.spring(sheetTy, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
        mass: 1,
      }),
    ]).start();
  }, [backdrop, sheetTy]);

  const close = useCallback(
    (after?: () => void) => {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(sheetTy, {
          toValue: SHEET_HEIGHT,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (after) after();
        else router.back();
      });
    },
    [backdrop, router, sheetTy],
  );

  const canSubmit = url.trim().length > 6 && !submitting;

  const onSubmit = useCallback(async () => {
    if (url.trim().length <= 6 || submitting) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setSubmitting(true);
    const result = await startImport(url.trim());
    if (result.ok) {
      close(() => router.replace(`/import/processing/${result.jobId}`));
      return;
    }
    setSubmitting(false);
    if (result.code.startsWith("QUOTA")) {
      close(() => router.replace("/paywall"));
    } else {
      Alert.alert("Import impossible", result.message);
    }
  }, [url, submitting, close, router]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            height: SHEET_HEIGHT,
            paddingBottom: insets.bottom + 12,
            transform: [{ translateY: sheetTy }],
          },
        ]}
      >
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        <View style={styles.topBar}>
          <Text style={styles.topTitle}>Importer une recette</Text>
          <Pressable hitSlop={12} onPress={() => close()} style={styles.closeBtn}>
            <X size={16} color={Colors.cacao} strokeWidth={2} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={20}
        >
          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Colle le lien de la recette.</Text>
            <Text style={styles.subtitle}>
              Un lien Instagram ou TikTok. On extrait tout, tu n&apos;as rien à
              recopier.
            </Text>

            <View style={styles.inputWrap}>
              <Link2 size={16} color={Colors.cacao} strokeWidth={2} />
              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="https://"
                placeholderTextColor={Colors.cacao + "88"}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                editable={!submitting}
                onSubmitEditing={onSubmit}
              />
            </View>

            <Text style={[styles.systemLabel, styles.platformsLabel]}>
              Sources reconnues
            </Text>
            <View style={styles.platformsRow}>
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                return (
                  <View key={p.key} style={styles.platformChip}>
                    <Icon size={16} color={p.tint} strokeWidth={1.8} />
                    <Text style={styles.platformLabel}>{p.label}</Text>
                  </View>
                );
              })}
            </View>

            <PressableScale
              onPress={onSubmit}
              style={[styles.cta, !canSubmit && styles.ctaDisabled]}
              scaleTo={0.97}
              haptic={canSubmit}
              disabled={!canSubmit}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.creme} />
              ) : (
                <>
                  <Text style={styles.ctaText}>Importer cette recette</Text>
                  <ArrowRight size={16} color={Colors.creme} strokeWidth={2.2} />
                </>
              )}
            </PressableScale>

            <Text style={styles.hint}>
              Astuce — le plus simple reste de partager directement depuis Insta
              ou TikTok vers RecetteBox.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(42,37,32,0.45)",
  },
  sheet: {
    backgroundColor: Colors.creme,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: Colors.rule,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.rule,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screen,
    paddingVertical: 8,
  },
  topTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 18,
    color: Colors.encre,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 14,
    paddingBottom: 24,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 26,
    color: Colors.encre,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    marginTop: 8,
    lineHeight: 20,
  },
  inputWrap: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: Colors.cremeDeep,
    borderRadius: Radius.cta,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.encre,
    padding: 0,
  },
  systemLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    color: Colors.sauge,
    marginBottom: 10,
  },
  platformsLabel: {
    marginTop: 22,
    color: Colors.cacao,
  },
  platformsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  platformChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  platformLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.encre,
  },
  cta: {
    marginTop: 28,
    height: 54,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ctaDisabled: {
    backgroundColor: Colors.cacao,
    opacity: 0.35,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
  },
  hint: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 13,
    color: Colors.cacao,
    marginTop: 18,
    textAlign: "center",
    lineHeight: 18,
  },
});
