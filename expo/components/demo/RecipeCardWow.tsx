import React, { useState } from "react";
import * as Haptics from "expo-haptics";
import { Check, Minus, Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors, Radius } from "@/constants/theme";
import type { DemoIngredient, DemoRecipe } from "@/constants/mockData";

type Props = {
  recipe: DemoRecipe;
};

const COLOR_MAP = {
  miel: Colors.miel,
  sauge: Colors.sauge,
  cacao: Colors.cacao,
  terracotta: Colors.terracotta,
} as const;

export function RecipeCardWow({ recipe }: Props) {
  const [portions, setPortions] = useState(recipe.portions);
  const [imgError, setImgError] = useState<boolean>(false);
  const hasValidImage =
    !imgError &&
    recipe.image !== undefined &&
    recipe.image !== null &&
    typeof recipe.image !== "string";

  const bump = (delta: number) => {
    setPortions((p) => Math.max(1, Math.min(20, p + delta)));
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.photo}>
        {hasValidImage ? (
          <Image
            source={recipe.image as number}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : recipe.fallback ? (
          <LinearGradient
            colors={recipe.fallback.gradient}
            style={[StyleSheet.absoluteFill, styles.photoFallback]}
          >
            <Text style={styles.photoFallbackEmoji}>{recipe.fallback.emoji}</Text>
          </LinearGradient>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.photoFallback]}>
            <Text style={styles.photoFallbackEmoji}>🥧</Text>
          </View>
        )}
        {recipe.badge ? (
          <View
            style={[
              styles.badge,
              recipe.badgeColor === "sauge" && styles.badgeSauge,
              recipe.badgeColor === "miel" && styles.badgeMiel,
            ]}
          >
            {recipe.badgeIcon === "check" ? (
              <Check
                size={12}
                color={recipe.badgeColor === "miel" ? Colors.cacao : Colors.creme}
                strokeWidth={2.8}
              />
            ) : null}
            <Text
              style={[
                styles.badgeLabel,
                recipe.badgeColor === "miel" && styles.badgeLabelDark,
              ]}
            >
              {recipe.badge}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text
          style={[
            styles.name,
            recipe.nameStyle === "handwritten" && styles.nameHandwritten,
          ]}
        >
          {recipe.name}
        </Text>
        <Text style={styles.source}>{recipe.source}</Text>

        <View style={styles.portionsRow}>
          <Pressable
            onPress={() => bump(-1)}
            style={styles.portionsBtn}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Minus size={16} color={Colors.encre} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.portionsLabel}>{portions} personnes</Text>
          <Pressable
            onPress={() => bump(1)}
            style={styles.portionsBtn}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Plus size={16} color={Colors.encre} strokeWidth={2.4} />
          </Pressable>
        </View>

        <View style={styles.ingredients}>
          {recipe.ingredients.map((ing: DemoIngredient, i: number) => (
            <View key={i} style={styles.ingredientRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: COLOR_MAP[ing.color] },
                ]}
              />
              <Text style={styles.ingredientText}>{ing.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.creme,
    borderRadius: Radius.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.rule,
    shadowColor: Colors.encre,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  photo: {
    height: 160,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.cacao,
    letterSpacing: 1.4,
  },
  photoFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.miel,
  },
  photoFallbackEmoji: {
    fontSize: 32,
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.encre,
  },
  badgeSauge: {
    backgroundColor: Colors.sauge,
  },
  badgeMiel: {
    backgroundColor: Colors.miel,
  },
  badgeLabelDark: {
    color: Colors.cacao,
  },
  badgeLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.creme,
    letterSpacing: 0.4,
  },
  body: {
    padding: 18,
    gap: 8,
  },
  name: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 22,
    color: Colors.encre,
    lineHeight: 28,
  },
  nameHandwritten: {
    fontFamily: "Caveat_600SemiBold",
    fontSize: 30,
    lineHeight: 34,
  },
  source: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.cacao,
  },
  portionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  portionsBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  portionsLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.encre,
  },
  ingredients: {
    marginTop: 10,
    gap: 8,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  ingredientText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.encre,
  },
});

export default RecipeCardWow;
