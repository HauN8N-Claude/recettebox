import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Check, Plus, X } from "lucide-react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { MultiOptionCard, OnboardingFooter, OnboardingHeader } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { progressFor } from "@/constants/onboardingSteps";
import { useOnboardingStore } from "@/stores/onboardingStore";

type AllergyValue =
  | "aucune"
  | "fruits-a-coque"
  | "arachides"
  | "lactose"
  | "oeufs"
  | "poisson-crustaces"
  | "soja";

const NONE: AllergyValue = "aucune";

const OPTIONS: { value: AllergyValue; label: string }[] = [
  { value: "aucune", label: "Aucune allergie" },
  { value: "fruits-a-coque", label: "Fruits à coque" },
  { value: "arachides", label: "Arachides" },
  { value: "lactose", label: "Lactose" },
  { value: "oeufs", label: "Œufs" },
  { value: "poisson-crustaces", label: "Poisson, crustacés" },
  { value: "soja", label: "Soja" },
];

const MAX_CUSTOM = 10;

const lightHaptic = () => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
};

export default function Q9ExclusionsScreen() {
  const router = useRouter();
  const storedAllergies = useOnboardingStore((s) => s.allergies);
  const storedCustom = useOnboardingStore((s) => s.customExclusions);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);

  const [selected, setSelected] = useState<AllergyValue[]>(storedAllergies ?? []);
  const [custom, setCustom] = useState<string[]>(storedCustom ?? []);
  const [adding, setAdding] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>("");
  const inputRef = useRef<TextInput | null>(null);

  const atLimit = custom.length >= MAX_CUSTOM;

  const toggle = (value: AllergyValue) => {
    setSelected((prev) => {
      if (value === NONE) {
        return prev.includes(NONE) ? [] : [NONE];
      }
      const without = prev.filter((v) => v !== NONE);
      return without.includes(value)
        ? without.filter((v) => v !== value)
        : [...without, value];
    });
  };

  const openAdder = () => {
    if (atLimit) return;
    setAdding(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const commitDraft = () => {
    const trimmed = draft.trim();
    if (trimmed.length < 2) return;
    if (custom.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setDraft("");
      return;
    }
    if (custom.length >= MAX_CUSTOM) return;
    setCustom((prev) => [...prev, trimmed]);
    setDraft("");
    lightHaptic();
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const removeChip = (value: string) => {
    setCustom((prev) => prev.filter((c) => c !== value));
    lightHaptic();
  };

  const closeAdder = () => {
    setAdding(false);
    setDraft("");
    Keyboard.dismiss();
  };

  const canContinue = selected.length > 0 || custom.length > 0;

  const onContinue = () => {
    setAnswer("allergies", selected);
    setAnswer("customExclusions", custom);
    router.push("/onboarding/q10");
  };

  const draftValid = draft.trim().length >= 2;

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={progressFor("q9-exclusions")} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Reveal delay={60}>
          <Text style={styles.title}>Ce que tu ne manges pas.</Text>
        </Reveal>
        <Reveal delay={160}>
          <Text style={styles.subtitle}>
            Allergies, intolérances, dégoûts. On évitera tout ça à 100%.
          </Text>
        </Reveal>

        <View style={styles.options}>
          {OPTIONS.map((opt, i) => (
            <Reveal key={opt.value} delay={240 + i * 60}>
              <MultiOptionCard
                label={opt.label}
                selected={selected.includes(opt.value)}
                onPress={() => toggle(opt.value)}
              />
            </Reveal>
          ))}
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>TES PROPRES EXCLUSIONS</Text>

        {custom.length > 0 ? (
          <View style={styles.chipList}>
            {custom.map((c) => (
              <View key={c} style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {c}
                </Text>
                <Pressable
                  onPress={() => removeChip(c)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Supprimer ${c}`}
                  style={styles.chipClose}
                >
                  <X size={14} color={Colors.cacao} strokeWidth={2.4} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {atLimit ? (
          <View style={styles.addBtnDisabled}>
            <Text style={styles.addBtnDisabledText}>Maximum atteint</Text>
          </View>
        ) : adding ? (
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Ex: Coriandre, kiwi, anchois…"
              placeholderTextColor={Colors.cacao + "99"}
              returnKeyType="done"
              onSubmitEditing={commitDraft}
              onBlur={() => {
                if (!draft.trim()) closeAdder();
              }}
              maxLength={40}
              autoCorrect={false}
            />
            <Pressable
              onPress={commitDraft}
              disabled={!draftValid}
              accessibilityRole="button"
              accessibilityLabel="Ajouter cette exclusion"
              style={[
                styles.inputCta,
                { opacity: draftValid ? 1 : 0.35 },
              ]}
            >
              <Check size={18} color={Colors.creme} strokeWidth={3} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={openAdder}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.addBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Plus size={18} color={Colors.sauge} strokeWidth={2.2} />
            <Text style={styles.addBtnText}>
              {custom.length === 0
                ? "Tu ne vois pas le tien ? Ajoute-le"
                : "Ajouter autre chose"}
            </Text>
          </Pressable>
        )}
      </ScrollView>
      <OnboardingFooter disabled={!canContinue} onPress={onContinue} />
    </View>
  );
}

const SAUGE_FONCE = "#5F6E52";

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  content: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 8,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 26,
    color: Colors.encre,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    marginTop: 6,
    lineHeight: 22,
  },
  options: {
    marginTop: 20,
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.rule,
    marginTop: 26,
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.4,
    color: SAUGE_FONCE,
    textTransform: "uppercase" as const,
    marginBottom: 12,
  },
  chipList: {
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.creme,
    borderWidth: 1,
    borderColor: Colors.sauge,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 10,
  },
  chipText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.encre,
  },
  chipClose: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cremeDeep,
  },
  addBtn: {
    height: 52,
    borderRadius: Radius.cta,
    backgroundColor: Colors.cremeDeep + "AA",
    borderWidth: 1,
    borderColor: Colors.sauge,
    borderStyle: "dashed" as const,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.sauge,
  },
  addBtnDisabled: {
    height: 52,
    borderRadius: Radius.cta,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabledText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.sauge,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
  },
  input: {
    flex: 1,
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
  inputCta: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
});
