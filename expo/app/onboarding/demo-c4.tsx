import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";
import { LoadingOrb } from "@/components/demo";

export default function DemoC4Screen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/onboarding/demo-c5");
    }, 4000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.wrap}>
      <LoadingOrb
        emoji="📖"
        title={[
          { text: "On déchiffre\n" },
          { text: "l'écriture de Mémé…", italic: true },
        ]}
        checks={[
          "Texte manuscrit reconnu",
          "Quantités déduites du contexte",
          "Recette structurée dans ta box",
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.creme,
    alignItems: "center",
    justifyContent: "center",
  },
});
