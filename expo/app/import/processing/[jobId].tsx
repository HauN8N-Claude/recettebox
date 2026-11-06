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
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
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

  // Filet de secours : si le Realtime ne délivre pas la fin du job (socket
  // coupé, réseau instable), on interroge le statut toutes les 4 s jusqu'à
  // done/failed — ça évite de rester bloqué sur l'écran de chargement.
  useEffect(() => {
    if (isPreview || !jobId) return;
    if (importRow?.status === "done" || importRow?.status === "failed") return;
    const interval = setInterval(() => {
      void supabase
        .from("imports")
        .select("id, status, recipe_id, error_message")
        .eq("id", jobId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setImportRow(data as ImportRow);
        });
    }, 4000);
    return () => clearInterval(interval);
  }, [isPreview, jobId, importRow?.status]);

  // Auto-redirect dès que la recette est prête.
  // On passe par l'écran de révélation (qui enchaîne ensuite révélation → aha
  // → fiche), pas directement sur la fiche brute, pour préserver l'effet "wow".
  // On laisse ~1,5 s pour que le confetti de fin soit visible avant de partir.
  useEffect(() => {
    if (isPreview) return;
    if (importRow?.status === "done" && importRow.recipe_id) {
      const recipeId = importRow.recipe_id;
      const t = setTimeout(() => {
        router.replace(`/recipe/reveal/${recipeId}`);
      }, 1500);
      return () => clearTimeout(t);
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

  const currentStep = useMemo(() => {
    if (status === "done") return STEPS.length;
    const activeIdx = stepStates.indexOf("active");
    return activeIdx >= 0 ? activeIdx + 1 : 1;
  }, [status, stepStates]);

  // Fraction de progression (0→1) pour animer le remplissage de la barre : on
  // compte les étapes terminées + une demi-étape pour celle en cours.
  const progress = useMemo(() => {
    if (status === "done") return 1;
    const doneCount = stepStates.filter((s) => s === "done").length;
    const hasActive = stepStates.includes("active");
    return (doneCount + (hasActive ? 0.5 : 0)) / STEPS.length;
  }, [status, stepStates]);

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
          {status === "done" && <Confetti />}
          <View style={styles.header}>
            <Reveal delay={80}>
              <Text style={styles.title}>
                {status === "done" ? "C'est prêt !" : "On extrait ta recette…"}
              </Text>
            </Reveal>
            <Reveal delay={200}>
              <Text style={styles.subtitle}>
                {status === "done"
                  ? "On t'emmène à ta recette…"
                  : "Tu peux fermer l'écran, on te préviendra quand c'est prêt."}
              </Text>
            </Reveal>
            <Reveal delay={300}>
              <View style={styles.progressWrap}>
                <ProgressBar progress={progress} />
                <Text style={styles.progressLabel}>
                  {status === "done"
                    ? "Terminé"
                    : `Étape ${currentStep} sur ${STEPS.length}`}
                </Text>
              </View>
            </Reveal>
          </View>

          <View style={styles.stepsList}>
            {STEPS.map((s, i) => (
              <Reveal key={s.key} delay={420 + i * 90}>
                <StepRow label={s.label} state={stepStates[i]} index={i + 1} />
              </Reveal>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function StepRow({
  label,
  state,
  index,
}: {
  label: string;
  state: StepState;
  index: number;
}) {
  const isDone = state === "done";
  const isActive = state === "active";

  // Surlignage de la carte qui apparaît/disparaît en fondu quand l'étape
  // devient (ou cesse d'être) active.
  const activeAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  // "Pop" du check quand l'étape passe à terminée.
  const checkAnim = useRef(new Animated.Value(isDone ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(activeAnim, {
      toValue: isActive ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [isActive, activeAnim]);

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: isDone ? 1 : 0,
      friction: 5,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [isDone, checkAnim]);

  return (
    <View style={styles.stepRow}>
      {/* Fond surligné animé (fondu) de l'étape en cours */}
      <Animated.View
        pointerEvents="none"
        style={[styles.stepRowHighlight, { opacity: activeAnim }]}
      />
      <View style={styles.stepIconWrap}>
        {isActive && <PulseRing />}
        <View
          style={[
            styles.stepIcon,
            isDone && styles.stepIconDone,
            isActive && styles.stepIconActive,
          ]}
        >
          {isDone ? (
            <Animated.View style={{ transform: [{ scale: checkAnim }] }}>
              <Check size={15} color={Colors.creme} strokeWidth={2.5} />
            </Animated.View>
          ) : isActive ? (
            <ActivityIndicator size="small" color={Colors.sauge} />
          ) : (
            <Text style={styles.stepNum}>{index}</Text>
          )}
        </View>
      </View>
      <Text
        style={[
          styles.stepLabel,
          isActive && styles.stepLabelActive,
          isDone && styles.stepLabelDone,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// Barre de progression dont le remplissage s'anime en douceur à chaque
// changement d'étape (0 → 1).
function ProgressBar({ progress }: { progress: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.trackFill, { width }]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Confetti de fin d'extraction.
// Implémenté avec l'Animated natif de RN (pas de lib externe) : chaque pièce
// est une petite vue colorée qui tombe en tournant et en dérivant, avec un
// fondu. useNativeDriver permet de garder l'animation fluide.
// ---------------------------------------------------------------------------
const CONFETTI_COLORS = [
  Colors.terracotta,
  Colors.sauge,
  Colors.miel,
  Colors.cacao,
];

function Confetti() {
  const { width, height } = useWindowDimensions();

  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        key: i,
        left: Math.random() * width,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 250,
        duration: 1500 + Math.random() * 800,
        size: 7 + Math.random() * 6,
        drift: (Math.random() - 0.5) * 140,
      })),
    [width],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p) => (
        <ConfettiPiece key={p.key} {...p} fallTo={height} />
      ))}
    </View>
  );
}

function ConfettiPiece({
  left,
  color,
  delay,
  duration,
  size,
  drift,
  fallTo,
}: {
  left: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  drift: number;
  fallTo: number;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [t, duration, delay]);

  const translateY = t.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, fallTo + 60],
  });
  const translateX = t.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drift],
  });
  const rotate = t.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "720deg"],
  });
  const opacity = t.interpolate({
    inputRange: [0, 0.1, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left,
        top: 0,
        width: size,
        height: size * 0.6,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}

// Halo pulsant discret derrière l'icône de l'étape en cours : donne une
// sensation de "travail en cours" plus vivante qu'un simple spinner.
function PulseRing() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.9] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pulseRing, { transform: [{ scale }], opacity }]}
    />
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
    justifyContent: "center",
    paddingBottom: 72,
    alignItems: "stretch",
  },
  header: {
    alignItems: "center",
    marginBottom: 36,
  },
  progressWrap: {
    marginTop: 26,
    alignSelf: "stretch",
    alignItems: "center",
    gap: 12,
  },
  track: {
    alignSelf: "stretch",
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.rule,
    overflow: "hidden",
  },
  trackFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.sauge,
  },
  progressLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: Colors.sauge,
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
    gap: 10,
  },
  stepRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radius.card,
  },
  stepRowHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.card,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.sauge,
  },
  stepIconWrap: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.sauge,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  stepNum: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 14,
    color: Colors.cacao,
    opacity: 0.6,
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
