import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { GripHorizontal } from "lucide-react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { OnboardingFooter, OnboardingHeader } from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { useOnboardingStore } from "@/stores/onboardingStore";

const OPTIONS: { value: string; label: string }[] = [
  { value: "ranger", label: "Mes recettes sont enfin organisées au même endroit" },
  { value: "cuisiner", label: "Je cuisine vraiment ce que je sauve" },
  { value: "rapide", label: "Je trouve quoi cuisiner en 30 secondes" },
  { value: "decouvrir", label: "Je découvre des plats qui me ressemblent" },
  { value: "aise", label: "Je me sens plus à l'aise en cuisine" },
];

const ITEM_HEIGHT = 76; // 64 card height + 12 gap

const triggerHaptic = (kind: "light" | "medium") => {
  if (Platform.OS === "web") return;
  const style =
    kind === "medium"
      ? Haptics.ImpactFeedbackStyle.Medium
      : Haptics.ImpactFeedbackStyle.Light;
  Haptics.impactAsync(style).catch(() => {});
};

export default function Q10Screen() {
  const router = useRouter();
  const stored = useOnboardingStore((s) => s.q10_objectives);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);

  const initialOrder = useMemo<string[]>(() => {
    const fallback = OPTIONS.map((o) => o.value);
    if (!stored || stored.length !== OPTIONS.length) return fallback;
    const valid = stored.every((v) => fallback.includes(v));
    return valid ? stored : fallback;
  }, [stored]);

  const [order, setOrder] = useState<string[]>(initialOrder);
  const orderRef = useRef<string[]>(initialOrder);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const positionAnims = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(
      initialOrder.map((id, i) => [id, new Animated.Value(i * ITEM_HEIGHT)])
    )
  ).current;

  const dragAnims = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(initialOrder.map((id) => [id, new Animated.Value(0)]))
  ).current;

  const startIndexMap = useRef<Record<string, number>>({}).current;

  const responders = useMemo(() => {
    const map: Record<string, ReturnType<typeof PanResponder.create>> = {};
    OPTIONS.forEach(({ value: id }) => {
      map[id] = PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          const startIdx = orderRef.current.indexOf(id);
          startIndexMap[id] = startIdx;
          dragAnims[id].setValue(startIdx * ITEM_HEIGHT);
          setDraggedId(id);
          triggerHaptic("medium");
        },
        onPanResponderMove: (_, g) => {
          const startIdx = startIndexMap[id] ?? 0;
          const newY = startIdx * ITEM_HEIGHT + g.dy;
          dragAnims[id].setValue(newY);
          const hovered = Math.max(
            0,
            Math.min(OPTIONS.length - 1, Math.round(newY / ITEM_HEIGHT))
          );
          const current = orderRef.current.indexOf(id);
          if (hovered !== current) {
            const next = [...orderRef.current];
            next.splice(current, 1);
            next.splice(hovered, 0, id);
            orderRef.current = next;
            setOrder(next);
            next.forEach((iid, idx) => {
              if (iid !== id) {
                Animated.spring(positionAnims[iid], {
                  toValue: idx * ITEM_HEIGHT,
                  useNativeDriver: true,
                  speed: 22,
                  bounciness: 4,
                }).start();
              }
            });
            triggerHaptic("light");
          }
        },
        onPanResponderRelease: () => {
          const finalIdx = orderRef.current.indexOf(id);
          Animated.spring(positionAnims[id], {
            toValue: finalIdx * ITEM_HEIGHT,
            useNativeDriver: true,
            speed: 22,
            bounciness: 4,
          }).start();
          setDraggedId(null);
          triggerHaptic("light");
        },
        onPanResponderTerminate: () => {
          const finalIdx = orderRef.current.indexOf(id);
          positionAnims[id].setValue(finalIdx * ITEM_HEIGHT);
          setDraggedId(null);
        },
      });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onContinue = () => {
    setAnswer("q10_objectives", orderRef.current);
    router.push("/onboarding/q10b-filters");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader progress={9 / 12} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Reveal delay={60}>
          <Text style={styles.title}>
            Si dans 3 mois RecetteBox a réussi son boulot, ça veut dire quoi
            pour toi ?
          </Text>
        </Reveal>
        <Reveal delay={160}>
          <Text style={styles.subtitle}>
            Range du plus important au moins important.
          </Text>
        </Reveal>

        <Reveal delay={260} style={styles.listOuter}>
          <View
            style={[styles.list, { height: ITEM_HEIGHT * OPTIONS.length }]}
          >
            {OPTIONS.map((opt) => {
              const isDragged = draggedId === opt.value;
              const rank = order.indexOf(opt.value) + 1;
              const translateY = isDragged
                ? dragAnims[opt.value]
                : positionAnims[opt.value];
              return (
                <Animated.View
                  key={opt.value}
                  style={[
                    styles.itemAbs,
                    {
                      transform: [
                        { translateY },
                        { scale: isDragged ? 1.02 : 1 },
                      ],
                    },
                    isDragged && styles.itemDragging,
                  ]}
                  {...responders[opt.value].panHandlers}
                >
                  <View style={styles.rankPill}>
                    <Text style={styles.rankText}>{rank}</Text>
                  </View>
                  <Text style={styles.itemLabel} numberOfLines={2}>
                    {opt.label}
                  </Text>
                  <GripHorizontal
                    size={20}
                    color={Colors.cacao}
                    strokeWidth={2}
                  />
                </Animated.View>
              );
            })}
          </View>
        </Reveal>
      </ScrollView>
      <OnboardingFooter onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  content: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 8,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 24,
    color: Colors.encre,
    lineHeight: 31,
    maxWidth: "90%" as const,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    marginTop: 6,
  },
  listOuter: {
    marginTop: 24,
  },
  list: {
    position: "relative",
  },
  itemAbs: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: Colors.cremeDeep,
    borderRadius: Radius.cta,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  itemDragging: {
    backgroundColor: Colors.creme,
    borderColor: Colors.terracotta,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 10,
  },
  rankPill: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.creme,
  },
  itemLabel: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.encre,
    lineHeight: 20,
  },
});
