import { Stack } from "expo-router";
import React from "react";

import { Colors } from "@/constants/theme";

// Chaque écran de cette zone (terms / privacy / analytics-consent) gère son
// propre header custom (topbar avec bouton retour). On désactive le header
// natif au niveau du layout pour que ce soit cohérent partout.
export default function LegalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.creme },
      }}
    />
  );
}
