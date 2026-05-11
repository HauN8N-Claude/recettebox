import React from "react";

import { ComingSoon } from "@/components/ComingSoon";

export default function ShoppingScreen() {
  return (
    <ComingSoon
      label="À venir"
      title="Tes courses, prêtes."
      body="On agrégera les ingrédients de ta semaine, regroupés par rayon. Aucune recopie."
      whisper="Cuisiner vraiment ce que tu sauves."
    />
  );
}
