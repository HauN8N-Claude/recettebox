/**
 * Écran d'attente d'import — version "une scène par étape" (refonte UX).
 *
 * Objectif : pendant que le worker traite la recette (téléchargement →
 * transcription → vision → structuration), l'utilisateur voit UNE scène
 * plein écran par étape, avec une transition en fondu entre chaque étape,
 * un emoji vivant et une phrase écrite pour un gourmand (pas pour un dev).
 *
 * Deux sources de progression :
 *   - jobId = "pending" : le lien partagé vient d'arriver. On lit le lien
 *     mémorisé (pendingImportStore), on lance l'import, et on bascule vers le
 *     vrai jobId dès que le job est créé. Pendant ce temps on affiche l'étape 1.
 *   - jobId réel : on s'abonne à Supabase Realtime (UPDATE sur imports.id) pour
 *     suivre le statut en push, avec un filet de secours en polling (4 s).
 *
 * jobId = "preview" : force une étape mi-parcours pour les captures ASO.
 *
 * À la complétion (status = done + recipe_id) → on enchaîne sur l'écran de
 * révélation (reveal → aha → fiche). L'utilisateur peut fermer à tout moment :
 * le worker continue en arrière-plan et la notif push prend le relais.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
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
import { AlertTriangle, X } from "lucide-react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { PressableScale } from "@/components/PressableScale";
import { startImport } from "@/lib/api/imports";
import { usePendingImportStore } from "@/stores/pendingImportStore";

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

// Copy "gourmand" — une scène par étape. L'emoji + la phrase sont le héros ;
// la sous-phrase rassure sur ce qui se passe, sans jargon technique.
const STEPS: {
  key: Exclude<ImportStatus, "pending" | "done" | "failed">;
  emoji: string;
  line: string;
  sub: string;
}[] = [
  {
    key: "downloading",
    emoji: "🎬",
    line: "On déballe ta vidéo",
    sub: "On récupère le reel que tu viens de partager.",
  },
  {
    key: "transcribing",
    emoji: "👂",
    line: "On capte le chef",
    sub: "On écoute chaque astuce dite à voix haute.",
  },
  {
    key: "extracting",
    emoji: "🛒",
    line: "On fait tes courses",
    sub: "On repère les ingrédients et les bonnes quantités.",
  },
  {
    key: "structuring",
    emoji: "📝",
    line: "On dresse ta recette",
    sub: "On met tout au propre : étapes et liste de courses.",
  },
];

const STEP_ORDER = STEPS.map((s) => s.key);

function activeStepIndex(status: ImportStatus): number {
  if (status === "pending") return 0;
  const i = STEP_ORDER.indexOf(status as (typeof STEP_ORDER)[number]);
  return i === -1 ? 0 : i;
}

export default function ImportProcessingScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isPreview = jobId === "preview";
  const isPending = jobId === "pending";

  const [importRow, setImportRow] = useState<ImportRow | null>(
    isPreview
      ? { id: "preview", status: "extracting", recipe_id: null, error_message: null }
      : null,
  );
  const [localError, setLocalError] = useState<{ title: string; body: string } | null>(
    null,
  );

  // --- jobId "pending" : on lance l'import puis on bascule vers le vrai job ---
  useEffect(() => {
    if (!isPending) return;
    // Lecture + vidage synchrones du lien mémorisé (évite un relancement par
    // le ShareIntentHandler).
    const url = usePendingImportStore.getState().url;
    usePendingImportStore.getState().clear();

    if (!url) {
      setLocalError({
        title: "Aucun lien à importer",
        body: "Reviens sur Instagram ou TikTok, puis partage une recette vers RecetteBox.",
      });
      return;
    }

    let cancelled = false;
    (async () => {
      const result = await startImport(url);
      if (cancelled) return;
      if (result.ok) {
        router.replace(`/import/processing/${result.jobId}`);
      } else if (result.code.startsWith("QUOTA")) {
        router.replace("/paywall");
      } else {
        setLocalError({ title: "Import impossible", body: result.message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isPending, router]);

  // --- jobId réel : fetch initial + subscription Realtime ---
  useEffect(() => {
    if (isPreview || isPending || !jobId) return;
    let cancelled = false;

    async function fetchOnce() {
      const { data, error } = await supabase
        .from("imports")
        .select("id, status, recipe_id, error_message")
        .eq("id", jobId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        setLocalError({
          title: "Impossible de suivre cet import",
          body: "Vérifie ta connexion internet, puis ferme et réessaie.",
        });
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
  }, [jobId, isPreview, isPending]);

  // Filet de secours : si le Realtime ne délivre pas la fin (socket coupé),
  // on interroge le statut toutes les 4 s jusqu'à done/failed.
  useEffect(() => {
    if (isPreview || isPending || !jobId) return;
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
  }, [isPreview, isPending, jobId, importRow?.status]);

  // Auto-redirect dès que la recette est prête (on laisse ~1,6 s pour profiter
  // du confetti de fin avant de partir vers la révélation).
  useEffect(() => {
    if (isPreview) return;
    if (importRow?.status === "done" && importRow.recipe_id) {
      const recipeId = importRow.recipe_id;
      const t = setTimeout(() => {
        router.replace(`/recipe/reveal/${recipeId}`);
      }, 1600);
      return () => clearTimeout(t);
    }
  }, [importRow, router, isPreview]);

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const status: ImportStatus = importRow?.status ?? "pending";
  const failed = status === "failed";
  const done = status === "done";
  const errorMessage = importRow?.error_message ?? null;

  const stepIndex = activeStepIndex(status);

  // Clé de la scène : change à chaque étape (et au "done") → remonte le bloc
  // central, ce qui relance l'animation d'entrée = transition en fondu.
  const stageKey = done ? "done" : failed ? "failed" : `step-${stepIndex}`;

  const showError = localError || failed;
  const errorTitle = localError?.title ?? "L'import a échoué";
  const errorBody =
    localError?.body ??
    errorMessage ??
    "On n'a pas pu extraire la recette. Vérifie le lien et réessaie.";

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

      {showError ? (
        <ErrorView title={errorTitle} body={errorBody} onClose={close} />
      ) : (
        <View style={styles.body}>
          {done && <Confetti />}

          <Stage key={stageKey}>
            <Badge emoji={done ? "🎉" : STEPS[stepIndex].emoji} celebrate={done} />
            <Text style={styles.line}>
              {done ? "À table !" : STEPS[stepIndex].line}
            </Text>
            <Text style={styles.sub}>
              {done
                ? "Ta recette et ta liste de courses t'attendent."
                : STEPS[stepIndex].sub}
            </Text>
          </Stage>

          <View style={styles.footer}>
            <Dots count={STEPS.length} activeIndex={stepIndex} done={done} />
            <Text style={styles.footerNote}>
              {done
                ? "C'est prêt."
                : "Tu peux fermer — on te prévient dès que c'est prêt."}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Scène : fondu + léger glissement vers le haut à chaque changement d'étape.
// (Remontée via `key` dans le parent → l'animation d'entrée rejoue à chaque
// étape, ce qui donne la transition entre "écrans".)
// ---------------------------------------------------------------------------
function Stage({ children }: { children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  return (
    <Animated.View style={[styles.stage, { opacity: anim, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

// Pastille emoji vivante : halo pulsant + léger flottement (ou petit "pop"
// quand on célèbre la fin).
function Badge({ emoji, celebrate }: { emoji: string; celebrate: boolean }) {
  const float = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [pop]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={styles.badgeWrap}>
      {!celebrate && <PulseRing />}
      <Animated.View
        style={[styles.badge, { transform: [{ translateY }, { scale }] }]}
      >
        <Text style={styles.badgeEmoji}>{emoji}</Text>
      </Animated.View>
    </View>
  );
}

// Progression par points (une étape = un point).
function Dots({
  count,
  activeIndex,
  done,
}: {
  count: number;
  activeIndex: number;
  done: boolean;
}) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => {
        const filled = done || i <= activeIndex;
        const isActive = !done && i === activeIndex;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              filled && styles.dotFilled,
              isActive && styles.dotActive,
            ]}
          />
        );
      })}
    </View>
  );
}

// Halo pulsant derrière la pastille — sensation de "ça travaille".
function PulseRing() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.6] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pulseRing, { transform: [{ scale }], opacity }]}
    />
  );
}

// ---------------------------------------------------------------------------
// Confetti de fin (Animated natif, sans lib externe).
// ---------------------------------------------------------------------------
const CONFETTI_COLORS = [Colors.terracotta, Colors.sauge, Colors.miel, Colors.cacao];

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

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [-40, fallTo + 60] });
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "720deg"] });
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
      <View style={styles.errorIconRing}>
        <AlertTriangle size={28} color={Colors.terracotta} strokeWidth={1.8} />
      </View>
      <Text style={styles.line}>{title}</Text>
      <Text style={styles.sub}>{body}</Text>
      <PressableScale style={styles.cta} onPress={onClose}>
        <Text style={styles.ctaText}>Fermer</Text>
      </PressableScale>
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
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  stage: {
    alignItems: "center",
    justifyContent: "center",
  },

  badgeWrap: {
    width: 128,
    height: 128,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 34,
  },
  pulseRing: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: Colors.sauge,
  },
  badge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEmoji: {
    fontSize: 52,
    lineHeight: 60,
  },

  line: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 30,
    color: Colors.encre,
    textAlign: "center",
    lineHeight: 36,
    paddingHorizontal: 8,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 22,
    maxWidth: 300,
  },

  footer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 16,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.rule,
  },
  dotFilled: {
    backgroundColor: Colors.sauge,
  },
  dotActive: {
    width: 22,
    backgroundColor: Colors.terracotta,
  },
  footerNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.cacao,
    textAlign: "center",
    opacity: 0.8,
    paddingHorizontal: Spacing.screen,
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
    marginBottom: 22,
  },
  cta: {
    marginTop: 32,
    height: 54,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
    letterSpacing: 0.2,
  },
});
