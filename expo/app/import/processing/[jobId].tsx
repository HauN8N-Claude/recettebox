/**
 * R2.1 — Écran d'attente d'import (Sprint 1, 14/05/2026).
 *
 * Affiche la progression d'un job d'import (table `imports` côté BD) au user
 * pendant que le worker Railway traite la recette (téléchargement → transcription
 * → vision → fusion Claude). Utilise Supabase Realtime pour recevoir les
 * changements de statut en push (pas de polling).
 *
 * Comportement :
 *   - Subscribe à postgres_changes (UPDATE) sur la ligne imports.id = jobId.
 *   - Affiche une liste de 4 étapes (téléchargement / écoute / analyse /
 *     structuration) avec : check vert (passée), spinner (en cours), cercle
 *     gris (à venir).
 *   - À la complétion (status = done + recipe_id non null) → router.replace
 *     automatique vers /recipe/{id}.
 *   - À l'échec (status = failed) → message + bouton retour.
 *   - L'utilisateur peut fermer l'écran à tout moment : le worker continue en
 *     arrière-plan, et la notif push (B2.4 backend + P2.4 client) prendra le
 *     relais.
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertTriangle, Check, X } from "lucide-react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { Reveal } from "@/components/Reveal";
import { PressableScale } from "@/components/PressableScale";

type ImportStatus =
  | "pending"
  | "downloading"
  | "transcribing"
  | "extracting"
  | "structuring"
  | "done"
  | "failed";

type ImportRow = {
  id: string;
  status: ImportStatus;
  recipe_id: string | null;
  error_message: string | null;
};

type StepState = "done" | "active" | "pending";

const STEPS: { key: ImportStatus; label: string }[] = [
  { key: "downloading", label: "Téléchargement de la vidéo" },
  { key: "transcribing", label: "Écoute de la voix" },
  { key: "extracting", label: "Analyse des images" },
  { key: "structuring", label: "Construction de la recette" },
];

const STEP_ORDER: ImportStatus[] = STEPS.map((s) => s.key);

// "pending" est avant downloading (le worker n'a pas encore pris le job).
// On considère que l'étape 0 (downloading) est "active" même en pending,
// pour ne pas montrer 4 cercles gris au démarrage.
function getStepState(currentStatus: ImportStatus, stepIndex: number): StepState {
  if (currentStatus === "done") return "done";
  if (currentStatus === "failed") return "pending";
  const currentIndex =
    currentStatus === "pending" ? 0 : STEP_ORDER.indexOf(currentStatus);
  if (currentIndex === -1) return "pending";
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

export default function ImportProcessingScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Mode preview (id === "preview") : utilisé pour les captures ASO et la
  // validation visuelle de l'écran. On force un état "extracting" (étape
  // mi-parcours, visuellement riche) sans appel Supabase ni Realtime.
  const isPreview = jobId === "preview";

  const [importRow, setImportRow] = useState<ImportRow | null>(
    isPreview
      ? { id: "preview", status: "extracting", recipe_id: null, error_message: null }
      : null,
  );
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch initial + subscription Realtime à la table imports filtrée sur jobId.
  useEffect(() => {
    if (isPreview) return;
    if (!jobId) return;
    let cancelled = false;

    async function fetchOnce() {
      const { data, error } = await supabase
        .from("imports")
        .select("id, status, recipe_id, error_message")
        .eq("id", jobId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        setFetchError(error.message);
        return;
      }
      if (data) setImportRow(data as ImportRow);
    }

    void fetchOnce();

    const channel = supabase
      .channel(`import-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "imports",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          if (cancelled) return;
          setImportRow(payload.new as ImportRow);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [jobId]);

  // Auto-redirect dès que la recette est prête.
  // On passe par l'écran de révélation (qui enchaîne ensuite révélation → aha
  // → fiche), pas directement sur la fiche brute, pour préserver l'effet "wow".
  useEffect(() => {
    if (isPreview) return;
    if (importRow?.status === "done" && importRow.recipe_id) {
      router.replace(`/recipe/reveal/${importRow.recipe_id}`);
    }
  }, [importRow, router, isPreview]);

  const close = () => {
    // router.back si possible, sinon retour à la home (cas deep-link froid).
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const status = importRow?.status ?? "pending";
  const failed = status === "failed";
  const errorMessage = importRow?.error_message ?? null;

  const stepStates = useMemo(
    () => STEPS.map((_, i) => getStepState(status, i)),
    [status],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable
          onPress={close}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          style={styles.closeBtn}
        >
          <X size={20} color={Colors.encre} strokeWidth={2} />
        </Pressable>
      </View>

      {fetchError ? (
        <ErrorView
          title="Impossible de suivre cet import."
          body="Vérifie ta connexion internet, puis ferme et réessaie."
          onClose={close}
        />
      ) : failed ? (
        <ErrorView
          title="L'import a échoué."
          body={
            errorMessage ??
            "On n'a pas pu extraire la recette. Vérifie le lien et réessaie."
          }
          onClose={close}
        />
      ) : (
        <View style={styles.body}>
          <Reveal delay={80}>
            <Text style={styles.title}>On extrait ta recette…</Text>
          </Reveal>
          <Reveal delay={200}>
            <Text style={styles.subtitle}>
              Tu peux fermer l&apos;écran, on te préviendra quand c&apos;est prêt.
            </Text>
          </Reveal>

          <View style={styles.stepsList}>
            {STEPS.map((s, i) => (
              <Reveal key={s.key} delay={320 + i * 80}>
                <StepRow label={s.label} state={stepStates[i]} />
              </Reveal>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function StepRow({ label, state }: { label: string; state: StepState }) {
  return (
    <View style={styles.stepRow}>
      <View
        style={[
          styles.stepIcon,
          state === "done" && styles.stepIconDone,
          state === "active" && styles.stepIconActive,
        ]}
      >
        {state === "done" ? (
          <Check size={14} color={Colors.creme} strokeWidth={2.5} />
        ) : state === "active" ? (
          <ActivityIndicator size="small" color={Colors.sauge} />
        ) : null}
      </View>
      <Text
        style={[
          styles.stepLabel,
          state === "active" && styles.stepLabelActive,
          state === "done" && styles.stepLabelDone,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function ErrorView({
  title,
  body,
  onClose,
}: {
  title: string;
  body: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.body}>
      <Reveal delay={80}>
        <View style={styles.errorIconRing}>
          <AlertTriangle size={28} color={Colors.terracotta} strokeWidth={1.8} />
        </View>
      </Reveal>
      <Reveal delay={200}>
        <Text style={styles.title}>{title}</Text>
      </Reveal>
      <Reveal delay={320}>
        <Text style={styles.subtitle}>{body}</Text>
      </Reveal>
      <Reveal delay={460}>
        <PressableScale style={styles.cta} onPress={onClose}>
          <Text style={styles.ctaText}>Fermer</Text>
        </PressableScale>
      </Reveal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  topBar: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 12,
    alignItems: "flex-end",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.screen,
    paddingTop: 40,
    alignItems: "stretch",
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 26,
    color: Colors.encre,
    textAlign: "center",
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
    maxWidth: 320,
    alignSelf: "center",
  },
  stepsList: {
    marginTop: 48,
    gap: 18,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 4,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconActive: {
    backgroundColor: Colors.creme,
    borderColor: Colors.sauge,
  },
  stepIconDone: {
    backgroundColor: Colors.sauge,
    borderColor: Colors.sauge,
  },
  stepLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    flex: 1,
  },
  stepLabelActive: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.encre,
  },
  stepLabelDone: {
    color: Colors.encre,
  },
  errorIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 22,
  },
  cta: {
    marginTop: 32,
    height: 54,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    paddingHorizontal: 36,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
    letterSpacing: 0.2,
  },
});
