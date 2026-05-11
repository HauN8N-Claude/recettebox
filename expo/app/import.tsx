import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
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
import {
  ArrowRight,
  Check,
  ChefHat,
  Globe,
  Instagram,
  Link2,
  Music2,
  PinIcon,
  Sparkles,
  X,
} from "lucide-react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { recipes, type Recipe } from "@/constants/mockData";
import { PressableScale } from "@/components/PressableScale";
import { SourceIcon } from "@/components/SourceIcon";

type Step = "paste" | "loading" | "preview";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.75);

const LOADING_PHRASES = [
  "On lit ta recette",
  "On range les ingrédients",
  "On numérote les étapes",
  "On met la table",
] as const;

function pickRecipeForUrl(url: string): Recipe {
  const u = url.toLowerCase();
  if (u.includes("insta")) {
    return recipes.find((r) => r.id === "r4") ?? recipes[0];
  }
  if (u.includes("marmiton")) {
    return recipes.find((r) => r.id === "r6") ?? recipes[0];
  }
  return recipes.find((r) => r.id === "r1") ?? recipes[0];
}

const PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: Instagram, tint: Colors.terracotta },
  { key: "tiktok", label: "TikTok", icon: Music2, tint: Colors.encre },
  { key: "pinterest", label: "Pinterest", icon: PinIcon, tint: Colors.terracotta },
  { key: "web", label: "Le web", icon: Globe, tint: Colors.sauge },
] as const;

export default function ImportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("paste");
  const [url, setUrl] = useState<string>("");
  const [phraseIndex, setPhraseIndex] = useState<number>(0);
  const extracted = useMemo<Recipe | null>(
    () => (step === "preview" ? pickRecipeForUrl(url) : null),
    [step, url],
  );

  // Sheet animation
  const sheetTy = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(sheetTy, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
        mass: 1,
      }),
    ]).start();
  }, [backdrop, sheetTy]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTy, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  }, [backdrop, router, sheetTy]);

  const startImport = useCallback(() => {
    if (url.trim().length === 0) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setStep("loading");
  }, [url]);

  // Loading phrases rotation + transition to preview
  useEffect(() => {
    if (step !== "loading") return;
    let idx = 0;
    setPhraseIndex(0);
    const phraseTimer = setInterval(() => {
      idx = Math.min(idx + 1, LOADING_PHRASES.length - 1);
      setPhraseIndex(idx);
    }, 850);
    const finishTimer = setTimeout(() => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => {},
        );
      }
      setStep("preview");
    }, 3400);
    return () => {
      clearInterval(phraseTimer);
      clearTimeout(finishTimer);
    };
  }, [step]);

  const onSaveAndOpen = useCallback(() => {
    if (!extracted) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTy, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace(`/recipe/${extracted.id}`);
    });
  }, [backdrop, extracted, router, sheetTy]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
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
          <View style={styles.stepDots}>
            {(["paste", "loading", "preview"] as Step[]).map((s) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  step === s && styles.stepDotActive,
                ]}
              />
            ))}
          </View>
          <Pressable hitSlop={12} onPress={close} style={styles.closeBtn}>
            <X size={16} color={Colors.cacao} strokeWidth={2} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={20}
        >
          {step === "paste" && (
            <PasteStep
              url={url}
              onChange={setUrl}
              onSubmit={startImport}
            />
          )}
          {step === "loading" && (
            <LoadingStep phraseIndex={phraseIndex} />
          )}
          {step === "preview" && extracted && (
            <PreviewStep
              recipe={extracted}
              onSave={onSaveAndOpen}
              onCancel={close}
            />
          )}
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

function PasteStep({
  url,
  onChange,
  onSubmit,
}: {
  url: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const canSubmit = url.trim().length > 3;
  return (
    <ScrollView
      contentContainerStyle={styles.body}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.systemLabel}>Étape 1 · Lien</Text>
      <Text style={styles.title}>Colle le lien de la recette.</Text>
      <Text style={styles.subtitle}>
        On extrait tout ce qu&apos;il faut. Tu n&apos;as rien à recopier.
      </Text>

      <View style={styles.inputWrap}>
        <Link2 size={16} color={Colors.cacao} strokeWidth={2} />
        <TextInput
          value={url}
          onChangeText={onChange}
          placeholder="https://"
          placeholderTextColor={Colors.cacao + "88"}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
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
        <Text style={styles.ctaText}>Importer cette recette</Text>
        <ArrowRight size={16} color={Colors.creme} strokeWidth={2.2} />
      </PressableScale>

      <Text style={styles.hint}>
        Astuce — un lien Instagram, TikTok ou un blog. On s&apos;occupe du reste.
      </Text>
    </ScrollView>
  );
}

function LoadingStep({ phraseIndex }: { phraseIndex: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true,
    }).start();
  }, [fade, phraseIndex]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.05],
  });

  return (
    <View style={styles.loadingWrap}>
      <View style={styles.haloWrap}>
        <Animated.View
          style={[
            styles.halo,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.halo,
            styles.haloInner,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
        <View style={styles.haloCenter}>
          <ChefHat size={26} color={Colors.terracotta} strokeWidth={1.6} />
        </View>
      </View>

      <Animated.Text style={[styles.loadingPhrase, { opacity: fade }]}>
        {LOADING_PHRASES[phraseIndex]}…
      </Animated.Text>
      <Text style={styles.loadingSub}>
        On remet de l&apos;ordre dans ton chaos.
      </Text>

      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: `${((phraseIndex + 1) / LOADING_PHRASES.length) * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

function PreviewStep({
  recipe,
  onSave,
  onCancel,
}: {
  recipe: Recipe;
  onSave: () => void;
  onCancel: () => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(ty, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, ty]);

  const totalMin = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <Animated.View
      style={[
        { flex: 1 },
        { opacity: fade, transform: [{ translateY: ty }] },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successRow}>
          <View style={styles.successDot}>
            <Check size={12} color={Colors.creme} strokeWidth={3} />
          </View>
          <Text style={styles.successText}>Recette extraite</Text>
        </View>

        <View style={styles.previewCard}>
          <Image source={{ uri: recipe.imageUrl }} style={styles.previewImage} />
          <View style={styles.previewBody}>
            <Text style={styles.previewTitle} numberOfLines={2}>
              {recipe.title}
            </Text>
            <View style={styles.previewSourceRow}>
              <SourceIcon source={recipe.source} size={12} />
              <Text style={styles.previewSource}>
                {recipe.sourceAuthor ?? "Carnet perso"}
              </Text>
            </View>
            <View style={styles.previewMetaRow}>
              <MetaPill label={`${totalMin} min`} />
              <MetaPill label={`${recipe.servings} pers.`} />
              <MetaPill label={recipe.difficulty} />
            </View>
          </View>
        </View>

        <View style={styles.statRow}>
          <StatBlock value={String(recipe.ingredients.length)} label="ingrédients" />
          <View style={styles.statDivider} />
          <StatBlock value={String(recipe.steps.length)} label="étapes" />
          <View style={styles.statDivider} />
          <StatBlock value={String(recipe.tags.length)} label="tags" />
        </View>

        <Text style={[styles.systemLabel, { marginTop: 22 }]}>
          Aperçu des ingrédients
        </Text>
        <View style={styles.ingPreview}>
          {recipe.ingredients.slice(0, 4).map((ing, i) => (
            <View key={i} style={styles.ingRow}>
              <View style={styles.ingDot} />
              <Text style={styles.ingName} numberOfLines={1}>
                {ing.name}
              </Text>
              <Text style={styles.ingQty}>{ing.quantity}</Text>
            </View>
          ))}
          {recipe.ingredients.length > 4 && (
            <Text style={styles.ingMore}>
              + {recipe.ingredients.length - 4} autres
            </Text>
          )}
        </View>

        <View style={styles.tagWrap}>
          {recipe.tags.map((t) => (
            <View key={t} style={styles.tagPill}>
              <Sparkles size={10} color={Colors.sauge} strokeWidth={2} />
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.previewActions}>
        <PressableScale
          onPress={onCancel}
          style={styles.ghostBtn}
          scaleTo={0.97}
        >
          <Text style={styles.ghostBtnText}>Plus tard</Text>
        </PressableScale>
        <PressableScale
          onPress={onSave}
          style={[styles.cta, styles.ctaInline]}
          scaleTo={0.97}
        >
          <Text style={styles.ctaText}>Ajouter à ton carnet</Text>
          <ArrowRight size={16} color={Colors.creme} strokeWidth={2.2} />
        </PressableScale>
      </View>
    </Animated.View>
  );
}

function MetaPill({ label }: { label: string }) {
  return (
    <View style={styles.metaPill}>
      <Text style={styles.metaPillText}>{label}</Text>
    </View>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  stepDots: {
    flexDirection: "row",
    gap: 6,
  },
  stepDot: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.rule,
  },
  stepDotActive: {
    backgroundColor: Colors.terracotta,
    width: 26,
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
    paddingTop: 18,
    paddingBottom: 24,
  },
  systemLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    color: Colors.sauge,
    marginBottom: 10,
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
  ctaInline: {
    flex: 1,
    marginTop: 0,
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

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screen,
    paddingBottom: 40,
  },
  haloWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  halo: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(232,184,106,0.35)",
  },
  haloInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(200,101,74,0.25)",
  },
  haloCenter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingPhrase: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 24,
    color: Colors.encre,
    textAlign: "center",
    lineHeight: 30,
  },
  loadingSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
    marginTop: 10,
    textAlign: "center",
  },
  progressTrack: {
    marginTop: 32,
    width: "70%",
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.rule,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.miel,
  },

  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  successDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.sauge,
    alignItems: "center",
    justifyContent: "center",
  },
  successText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.sauge,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  previewCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: Colors.cremeDeep,
    borderRadius: Radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  previewImage: {
    width: 96,
    height: 96,
    borderRadius: Radius.cta,
    backgroundColor: Colors.rule,
  },
  previewBody: {
    flex: 1,
    justifyContent: "space-between",
  },
  previewTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 20,
    color: Colors.encre,
    lineHeight: 24,
  },
  previewSourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  previewSource: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.cacao,
  },
  previewMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  metaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.creme,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  metaPillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.cacao,
    letterSpacing: 0.2,
  },

  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: Radius.cta,
    backgroundColor: Colors.creme,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 20,
    color: Colors.encre,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.cacao,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.rule,
  },

  ingPreview: {
    backgroundColor: Colors.cremeDeep,
    borderRadius: Radius.cta,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  ingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  ingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.terracotta,
  },
  ingName: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.encre,
  },
  ingQty: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
  },
  ingMore: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 13,
    color: Colors.cacao,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
  },

  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 16,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: "rgba(138,154,123,0.16)",
  },
  tagText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.sauge,
    letterSpacing: 0.2,
  },

  previewActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: Spacing.screen,
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    backgroundColor: Colors.creme,
  },
  ghostBtn: {
    height: 54,
    paddingHorizontal: 18,
    borderRadius: Radius.cta,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  ghostBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.cacao,
  },
});
