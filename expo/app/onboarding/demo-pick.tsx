/**
 * Démo interactif : l'utilisateur choisit un des 3 reels factices pour
 * « simuler » un import. 100 % hardcodé : tous les choix mènent au même
 * reveal demo-a5 — l'objectif est de donner l'ownership psychologique
 * (« j'ai choisi MA recette »), pas de produire un output unique.
 *
 * Inséré entre demo-a1 (intro) et demo-a2 (tap share scripté).
 */
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check, Play } from "lucide-react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";
import {
  OnboardingFooter,
  OnboardingHeader,
} from "@/components/onboarding";
import { Reveal } from "@/components/Reveal";
import { progressFor } from "@/constants/onboardingSteps";

type Reel = {
  id: string;
  handle: string;
  dish: string;
  emoji: string;
  gradient: [string, string];
  duration: string;
};

const REELS: Reel[] = [
  {
    id: "pesto",
    handle: "@paulinecooks",
    dish: "Pâtes au pesto d'avocat",
    emoji: "🥑",
    gradient: ["#A8D8B9", "#5F8E6A"],
    duration: "0:42",
  },
  {
    id: "risotto",
    handle: "@cuisinedezoe",
    dish: "Risotto aux champignons",
    emoji: "🍄",
    gradient: ["#D4A574", "#8A5A2B"],
    duration: "1:18",
  },
  {
    id: "saumon",
    handle: "@julien.fastfood",
    dish: "Bowl saumon teriyaki",
    emoji: "🐟",
    gradient: ["#F5C28C", "#C75B3F"],
    duration: "0:55",
  },
];

export default function DemoPickScreen() {
  const router = useRouter();
  const [pickedId, setPickedId] = useState<string | null>(null);

  const onPick = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setPickedId(id);
  };

  const onContinue = () => {
    // Tous les picks mènent au même reveal hardcodé (demo-a2 → … → demo-a5).
    router.push("/onboarding/demo-a2");
  };

  return (
    <View style={styles.wrap}>
      <OnboardingHeader
        progress={progressFor("demo-intro")}
        onBack={() => router.back()}
      />
      <View style={styles.content}>
        <Reveal delay={60}>
          <Text style={styles.title}>
            Choisis un <Text style={styles.titleAccent}>reel</Text> pour essayer
          </Text>
        </Reveal>
        <Reveal delay={160}>
          <Text style={styles.subtitle}>
            On va simuler son import, comme dans la vraie app.
          </Text>
        </Reveal>

        <View style={styles.reels}>
          {REELS.map((reel, i) => (
            <Reveal key={reel.id} delay={260 + i * 100}>
              <ReelCard
                reel={reel}
                selected={pickedId === reel.id}
                onPress={() => onPick(reel.id)}
              />
            </Reveal>
          ))}
        </View>
      </View>
      <OnboardingFooter
        label="Importer ce reel →"
        disabled={!pickedId}
        onPress={onContinue}
      />
    </View>
  );
}

function ReelCard({
  reel,
  selected,
  onPress,
}: {
  reel: Reel;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.97,
          useNativeDriver: true,
          speed: 40,
          bounciness: 0,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 6,
        }).start()
      }
    >
      <Animated.View
        style={[
          styles.reelCard,
          selected && styles.reelCardSelected,
          { transform: [{ scale }] },
        ]}
      >
        <LinearGradient
          colors={reel.gradient}
          style={styles.reelThumb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.reelEmoji}>{reel.emoji}</Text>
          <View style={styles.playBadge}>
            <Play size={12} color={Colors.creme} strokeWidth={2.5} fill={Colors.creme} />
          </View>
          <View style={styles.reelDuration}>
            <Text style={styles.reelDurationText}>{reel.duration}</Text>
          </View>
        </LinearGradient>
        <View style={styles.reelInfo}>
          <Text style={styles.reelHandle}>{reel.handle}</Text>
          <Text style={styles.reelDish} numberOfLines={2}>
            {reel.dish}
          </Text>
        </View>
        {selected ? (
          <View style={styles.reelCheck}>
            <Check size={16} color={Colors.creme} strokeWidth={3} />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.creme },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screen,
    paddingTop: 8,
  },
  title: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 26,
    color: Colors.encre,
    lineHeight: 34,
  },
  titleAccent: {
    color: Colors.terracotta,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.cacao,
    marginTop: 10,
    lineHeight: 22,
  },
  reels: {
    marginTop: 28,
    gap: 14,
  },
  reelCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.cremeDeep,
    borderRadius: Radius.cta,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  reelCardSelected: {
    backgroundColor: Colors.creme,
    borderColor: Colors.terracotta,
    borderWidth: 2,
  },
  reelThumb: {
    width: 72,
    height: 96,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  reelEmoji: {
    fontSize: 36,
  },
  playBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  reelDuration: {
    position: "absolute",
    bottom: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  reelDurationText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.creme,
  },
  reelInfo: {
    flex: 1,
    gap: 4,
  },
  reelHandle: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.cacao,
  },
  reelDish: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 17,
    color: Colors.encre,
    lineHeight: 22,
  },
  reelCheck: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
});
