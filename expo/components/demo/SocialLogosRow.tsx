import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";

/**
 * Rangée de 5 logos officiels des réseaux sociaux supportés par la démo
 * d'import (parcours A). Couleurs "officielles" pour rester reconnaissables.
 *
 * Utilisé sur :
 * - demo-a1 : peut être passé en `floating` pour répartition libre (utilisé
 *   différemment dans ce cas — voir l'écran)
 * - demo-a2 / demo-a3 : rangée horizontale sous le titre
 */

export const SOCIAL_BRANDS = [
  { key: "instagram", icon: "instagram", color: "#E1306C" },
  { key: "facebook", icon: "facebook", color: "#1877F2" },
  { key: "tiktok", icon: "tiktok", color: "#000000" },
  { key: "youtube", icon: "youtube", color: "#FF0000" },
  { key: "pinterest", icon: "pinterest", color: "#E60023" },
] as const;

type Props = {
  size?: number;
  gap?: number;
  style?: ViewStyle;
};

export function SocialLogosRow({ size = 28, gap = 22, style }: Props) {
  return (
    <View style={[styles.row, { gap }, style]}>
      {SOCIAL_BRANDS.map((brand) => (
        <FontAwesome6
          key={brand.key}
          name={brand.icon as React.ComponentProps<typeof FontAwesome6>["name"]}
          size={size}
          color={brand.color}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
