import React from "react";

import { ComingSoon } from "@/components/ComingSoon";

export default function PlanScreen() {
  return (
    <ComingSoon
      label="À venir"
      title="Ton plan de la semaine."
      body="Bientôt, glisse tes recettes dans les jours, et tout s'organise tout seul."
      whisper="Remettre de l'ordre dans ton chaos, une recette à la fois."
    />
  );
}
