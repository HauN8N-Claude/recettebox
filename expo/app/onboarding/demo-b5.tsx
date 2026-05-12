import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";
import { LoadingOrb } from "@/components/demo";

export default function DemoB5Screen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/onboarding/demo-b6");
    }, 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.wrap}>
      <LoadingOrb
        emoji="🌐"
        title={[
          { text: "On lit la page\n" },
          { text: "à ta place…", italic: true },
        ]}
        checks={[
          "Recette repérée sur Marmiton",
          "Ingrédients extraits",
          "Étapes structurées dans ta box",
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
