import React from "react";
import { Globe, Instagram, Music2, NotebookPen, PinIcon } from "lucide-react-native";

import { Colors } from "@/constants/theme";
import type { RecipeSource } from "@/constants/mockData";

export function SourceIcon({
  source,
  size = 12,
  color = Colors.cacao,
}: {
  source: RecipeSource;
  size?: number;
  color?: string;
}) {
  switch (source) {
    case "instagram":
      return <Instagram size={size} color={color} strokeWidth={1.8} />;
    case "tiktok":
      return <Music2 size={size} color={color} strokeWidth={1.8} />;
    case "pinterest":
      return <PinIcon size={size} color={color} strokeWidth={1.8} />;
    case "web":
      return <Globe size={size} color={color} strokeWidth={1.8} />;
    case "manual":
    default:
      return <NotebookPen size={size} color={color} strokeWidth={1.8} />;
  }
}

export default SourceIcon;
