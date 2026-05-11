import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";
import { LoadingOrb } from "@/components/demo";

export default function DemoA4Screen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/onboarding/demo-a5");
    }, 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.wrap}>
      <LoadingOrb
        emoji="✨"
        title={[
          { text: "On lit le post\n" },
          { text: "comme par magie…", italic: true },
        ]}
        checks={[
          "Vidéo Instagram analysée",
          "Ingrédients identifiés",
          "Étapes structurées",
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
