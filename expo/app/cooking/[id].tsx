import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import Svg, { Circle } from "react-native-svg";
import {
  X,
  Pause,
  Play,
  RotateCcw,
  ChevronRight,
  Sparkles,
} from "lucide-react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";
import { Reveal } from "@/components/Reveal";
import { useRecipe } from "@/lib/api/recipes";
import { PREVIEW_RECIPE } from "@/lib/devPreviewRecipe";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Try to extract a duration in seconds from a step's text.
 * Matches patterns like "35 minutes", "2 h", "10 min", "3 heures".
 */
function parseDurationSeconds(text: string): number | null {
  const t = text.toLowerCase();
  const hourMatch = t.match(/(\d+)\s*(?:h(?:eures?)?)\b/);
  const minMatch = t.match(/(\d+)\s*(?:min(?:utes?)?)\b/);
  let total = 0;
  if (hourMatch) total += parseInt(hourMatch[1], 10) * 3600;
  if (minMatch) total += parseInt(minMatch[1], 10) * 60;
  if (total > 0) return total;
  return null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type StepTimerProps = {
  durationSeconds: number;
  stepKey: string;
};

function StepTimer({ durationSeconds, stepKey }: StepTimerProps) {
  const SIZE = 220;
  const STROKE = 8;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * RADIUS;

  const [remaining, setRemaining] = useState<number>(durationSeconds);
  const [running, setRunning] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setRemaining(durationSeconds);
    setRunning(false);
    setDone(false);
    progress.stopAnimation();
    progress.setValue(0);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [durationSeconds, stepKey, progress]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setRunning(false);
            setDone(true);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              ).catch(() => {});
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1 - remaining / durationSeconds,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [remaining, durationSeconds, progress]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, 0],
  });

  const onToggle = useCallback(() => {
    if (done) {
      setRemaining(durationSeconds);
      setDone(false);
      setRunning(true);
      return;
    }
    setRunning((r) => !r);
  }, [done, durationSeconds]);

  const onReset = useCallback(() => {
    setRunning(false);
    setRemaining(durationSeconds);
    setDone(false);
  }, [durationSeconds]);

  return (
    <View style={timerStyles.wrap}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={Colors.rule}
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={done ? Colors.sauge : Colors.miel}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRC}, ${CIRC}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={timerStyles.center}>
          <Text style={timerStyles.label}>
            {done ? "TERMINÉ" : running ? "EN COURS" : "MINUTEUR"}
          </Text>
          <Text style={timerStyles.time}>{formatTime(remaining)}</Text>
        </View>
      </View>

      <View style={timerStyles.controls}>
        <PressableScale
          onPress={onReset}
          style={timerStyles.smallBtn}
          scaleTo={0.9}
        >
          <RotateCcw size={18} color={Colors.cacao} strokeWidth={1.8} />
        </PressableScale>
        <PressableScale
          onPress={onToggle}
          style={timerStyles.playBtn}
          scaleTo={0.94}
        >
          {running ? (
            <Pause size={22} color={Colors.creme} strokeWidth={2} fill={Colors.creme} />
          ) : (
            <Play size={22} color={Colors.creme} strokeWidth={2} fill={Colors.creme} />
          )}
        </PressableScale>
        <View style={timerStyles.smallBtn} pointerEvents="none" />
      </View>
    </View>
  );
}

type Confetti = {
  id: number;
  x: number;
  delay: number;
  size: number;
  rotate: number;
  color: string;
  drift: number;
};

function Confettis() {
  const pieces = useMemo<Confetti[]>(() => {
    const palette = [Colors.miel, Colors.terracotta, Colors.sauge, Colors.cremeDeep];
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      x: Math.random() * SCREEN_W,
      delay: Math.random() * 600,
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
      color: palette[i % palette.length],
      drift: (Math.random() - 0.5) * 80,
    }));
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} {...p} />
      ))}
    </View>
  );
}

function ConfettiPiece({ x, delay, size, rotate, color, drift }: Confetti) {
  const ty = useRef(new Animated.Value(-40)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(op, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(ty, {
          toValue: SCREEN_H + 40,
          duration: 2400 + Math.random() * 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(tx, {
          toValue: drift,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
      Animated.loop(
        Animated.timing(rot, {
          toValue: 1,
          duration: 1400,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, [delay, drift, op, rot, tx, ty]);

  const rotation = rot.interpolate({
    inputRange: [0, 1],
    outputRange: [`${rotate}deg`, `${rotate + 360}deg`],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: 0,
        width: size,
        height: size * 0.4,
        backgroundColor: color,
        borderRadius: 2,
        opacity: op,
        transform: [
          { translateX: tx },
          { translateY: ty },
          { rotate: rotation },
        ],
      }}
    />
  );
}

export default function CookingScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Recette complète (avec steps) chargée depuis Supabase.
  // Cache React Query partagé ["recipe", id] avec la fiche recette + shopping list.
  // En mode preview (id === "preview"), on shortcut sur la recette de démo
  // pour les captures ASO et la validation visuelle.
  const isPreview = id === "preview";
  const recipeQuery = useRecipe(isPreview ? undefined : id);
  const recipe = isPreview ? PREVIEW_RECIPE : (recipeQuery.data ?? undefined);
  const isLoading = !isPreview && recipeQuery.isLoading;
  const isError = !isPreview && recipeQuery.isError;

  const [index, setIndex] = useState<number>(0);
  const [finished, setFinished] = useState<boolean>(false);
  const listRef = useRef<FlatList<string>>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const celebrateScale = useRef(new Animated.Value(0.85)).current;
  const celebrateOp = useRef(new Animated.Value(0)).current;

  const totalSteps = recipe?.steps.length ?? 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: totalSteps > 0 ? (index + 1) / totalSteps : 0,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [index, totalSteps, progressAnim]);

  useEffect(() => {
    if (finished) {
      Animated.parallel([
        Animated.timing(celebrateOp, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.spring(celebrateScale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => {});
      }
    }
  }, [finished, celebrateOp, celebrateScale]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        const i = viewableItems[0].index;
        setIndex(i);
        if (Platform.OS !== "web") {
          Haptics.selectionAsync().catch(() => {});
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const onNext = useCallback(() => {
    if (!recipe) return;
    if (index < recipe.steps.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      setFinished(true);
    }
  }, [index, recipe]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerWrap]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.terracotta} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.fallback}>
          On n&apos;a pas pu charger cette recette.
        </Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.fallback}>Recette introuvable</Text>
      </View>
    );
  }

  const isLast = index === recipe.steps.length - 1;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (finished) {
    return (
      <View style={[styles.container, styles.celebrationBg]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Confettis />
        <Animated.View
          style={[
            styles.celebrateInner,
            {
              opacity: celebrateOp,
              transform: [{ scale: celebrateScale }],
              paddingTop: insets.top,
              paddingBottom: insets.bottom + 40,
            },
          ]}
        >
          <View style={styles.halo}>
            <View style={styles.haloInner}>
              <Sparkles size={28} color={Colors.miel} strokeWidth={1.6} />
            </View>
          </View>
          <Text style={styles.celebrateLabel}>RECETTE TERMINÉE</Text>
          <Text style={styles.celebrateTitle}>Tu l&apos;as fait.</Text>
          <Text style={styles.celebrateTitleAccent}>Une de plus.</Text>
          <Text style={styles.celebrateBody}>
            « {recipe.title} » rejoint ton carnet. Continue, ton chaos
            s&apos;apaise.
          </Text>

          <View style={styles.celebrateActions}>
            <PressableScale
              onPress={() => router.back()}
              style={styles.ctaPrimary}
              scaleTo={0.96}
            >
              <Text style={styles.ctaPrimaryLabel}>Retour au carnet</Text>
            </PressableScale>
            <PressableScale
              onPress={() => {
                setFinished(false);
                setIndex(0);
                celebrateOp.setValue(0);
                celebrateScale.setValue(0.85);
                listRef.current?.scrollToIndex({ index: 0, animated: false });
              }}
              style={styles.ctaGhost}
              scaleTo={0.96}
            >
              <Text style={styles.ctaGhostLabel}>Recommencer</Text>
            </PressableScale>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Reveal delay={0}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <PressableScale
            onPress={() => router.back()}
            style={styles.iconButton}
            scaleTo={0.9}
          >
            <X size={20} color={Colors.encre} strokeWidth={2} />
          </PressableScale>
          <View style={styles.titleBlock}>
            <Text style={styles.recipeTitle} numberOfLines={1}>
              {recipe.title}
            </Text>
            <Text style={styles.stepCounter}>
              Étape {index + 1} sur {recipe.steps.length}
            </Text>
          </View>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth }]}
          />
        </View>
      </View>
      </Reveal>

      <FlatList
        ref={listRef}
        data={recipe.steps}
        keyExtractor={(_, i) => `step-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, i) => ({
          length: SCREEN_W,
          offset: SCREEN_W * i,
          index: i,
        })}
        renderItem={({ item, index: i }) => {
          const duration = parseDurationSeconds(item);
          return (
            <View style={[styles.page, { width: SCREEN_W }]}>
              <View style={styles.stepContent}>
                <Text style={styles.stepNumber}>
                  {(i + 1).toString().padStart(2, "0")}
                </Text>
                <Text style={styles.stepText}>{item}</Text>

                {duration ? (
                  <View style={styles.timerBlock}>
                    <StepTimer
                      durationSeconds={duration}
                      stepKey={`${recipe.id}-${i}`}
                    />
                    <Text style={styles.timerHint}>
                      Lance le minuteur quand tu es prêt·e.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.noTimerBlock}>
                    <Text style={styles.noTimerHint}>
                      Prends ton temps. Glisse pour continuer.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) + 12 },
        ]}
      >
        <View style={styles.dots}>
          {recipe.steps.map((_, i) => (
            <View
              key={`dot-${i}`}
              style={[
                styles.dot,
                i === index && styles.dotActive,
                i < index && styles.dotDone,
              ]}
            />
          ))}
        </View>
        <PressableScale
          onPress={onNext}
          style={styles.ctaPrimary}
          scaleTo={0.96}
        >
          <Text style={styles.ctaPrimaryLabel}>
            {isLast ? "J'ai fini" : "Étape suivante"}
          </Text>
          {!isLast && (
            <ChevronRight size={18} color={Colors.creme} strokeWidth={2.2} />
          )}
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  centerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: 40,
  },
  header: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.creme,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  titleBlock: {
    flex: 1,
    alignItems: "center",
  },
  recipeTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 18,
    color: Colors.encre,
    maxWidth: SCREEN_W - 140,
  },
  stepCounter: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    color: Colors.cacao,
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.rule,
    borderRadius: 2,
    marginTop: 18,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.terracotta,
    borderRadius: 2,
  },
  page: {
    flex: 1,
    paddingHorizontal: Spacing.screen,
    paddingTop: 24,
  },
  stepContent: {
    flex: 1,
    alignItems: "flex-start",
  },
  stepNumber: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 96,
    lineHeight: 100,
    color: Colors.miel,
  },
  stepText: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 26,
    lineHeight: 36,
    color: Colors.encre,
    marginTop: 6,
  },
  timerBlock: {
    width: "100%",
    alignItems: "center",
    marginTop: 28,
  },
  timerHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
    marginTop: 18,
    textAlign: "center",
  },
  noTimerBlock: {
    width: "100%",
    marginTop: 32,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
  },
  noTimerHint: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 15,
    color: Colors.sauge,
  },
  footer: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    backgroundColor: Colors.creme,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.rule,
  },
  dotActive: {
    width: 22,
    backgroundColor: Colors.terracotta,
  },
  dotDone: {
    backgroundColor: Colors.cacao,
    opacity: 0.4,
  },
  ctaPrimary: {
    height: 54,
    borderRadius: Radius.cta,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  ctaPrimaryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.creme,
  },
  ctaGhost: {
    height: 50,
    borderRadius: Radius.cta,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  ctaGhostLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.cacao,
  },
  celebrationBg: {
    backgroundColor: Colors.creme,
  },
  celebrateInner: {
    flex: 1,
    paddingHorizontal: Spacing.screen,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(232, 184, 106, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  haloInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  celebrateLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    color: Colors.sauge,
    marginBottom: 18,
  },
  celebrateTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 40,
    lineHeight: 46,
    color: Colors.encre,
    textAlign: "center",
  },
  celebrateTitleAccent: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 40,
    lineHeight: 46,
    color: Colors.terracotta,
    textAlign: "center",
  },
  celebrateBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: Colors.cacao,
    textAlign: "center",
    marginTop: 18,
    maxWidth: 320,
  },
  celebrateActions: {
    width: "100%",
    marginTop: 40,
  },
});

const timerStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.32,
    textTransform: "uppercase",
    color: Colors.cacao,
    marginBottom: 8,
  },
  time: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 44,
    color: Colors.encre,
    fontVariant: ["tabular-nums"],
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    marginTop: 24,
  },
  smallBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cremeDeep,
    borderWidth: 1,
    borderColor: Colors.rule,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
});
