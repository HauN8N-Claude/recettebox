/**
 * Logique centralisée pour calculer le profil culinaire de l'utilisatrice
 * à partir des réponses normalisées de l'Acte 1.
 */

export type SavesPerWeek = "1-3" | "4-10" | "11-20" | "20+";
export type CookedRatio = "toutes" | "moitie" | "quelques" | "aucune";
export type Blocker =
  | "eparpillees"
  | "sais-pas-quoi"
  | "mauvais-ingredients"
  | "trop-etapes"
  | "memes-plats"
  | "pas-y-mettre";

export type ProfileAccent = {
  /** Le sous-titre rendu avec des segments terracotta */
  segments: { text: string; accent?: boolean }[];
};

export type ComputedProfile = {
  name: string;
  number: number;
  percentage: number;
  subtitle: ProfileAccent;
};

const PROFILE_COLLECTIONNEUSE: ComputedProfile = {
  name: "La Collectionneuse pressée.",
  number: 1,
  percentage: 43,
  subtitle: {
    segments: [
      { text: "Tu sauves " },
      { text: "beaucoup", accent: true },
      { text: ", tu cuisines " },
      { text: "peu", accent: true },
      { text: ", tu manques de " },
      { text: "temps", accent: true },
      { text: "." },
    ],
  },
};

const PROFILE_CURIEUSE: ComputedProfile = {
  name: "La Curieuse débordée.",
  number: 2,
  percentage: 27,
  subtitle: {
    segments: [
      { text: "Tu veux cuisiner, tu sauves les " },
      { text: "bonnes idées", accent: true },
      { text: ", mais le passage à " },
      { text: "l'action", accent: true },
      { text: " coince." },
    ],
  },
};

const PROFILE_ROUTINIERE: ComputedProfile = {
  name: "La Routinière déçue.",
  number: 3,
  percentage: 14,
  subtitle: {
    segments: [
      { text: "Tu cuisines, mais toujours " },
      { text: "la même chose", accent: true },
      { text: ". Tu cherches du " },
      { text: "renouveau", accent: true },
      { text: "." },
    ],
  },
};

const PROFILE_FANTOME: ComputedProfile = {
  name: "La Fantôme du dimanche.",
  number: 4,
  percentage: 9,
  subtitle: {
    segments: [
      { text: "Tu sauves " },
      { text: "énormément", accent: true },
      { text: ", tu ne cuisines " },
      { text: "jamais", accent: true },
      { text: ". RecetteBox arrive juste à temps." },
    ],
  },
};

const PROFILE_HESITANTE: ComputedProfile = {
  name: "L'Hésitante motivée.",
  number: 5,
  percentage: 5,
  subtitle: {
    segments: [
      { text: "Tu testes " },
      { text: "prudemment", accent: true },
      { text: ", tu doutes " },
      { text: "encore", accent: true },
      { text: ". On va t'aider à franchir le pas." },
    ],
  },
};

const PROFILE_EQUILIBRISTE: ComputedProfile = {
  name: "L'Équilibriste.",
  number: 6,
  percentage: 2,
  subtitle: {
    segments: [
      { text: "Tu " },
      { text: "jongles", accent: true },
      { text: " entre tes envies et la " },
      { text: "réalité", accent: true },
      { text: " du quotidien." },
    ],
  },
};

export function pickProfile(
  savesPerWeek: SavesPerWeek | null,
  cookedRatio: CookedRatio | null,
  blockers: string[]
): ComputedProfile {
  const first = blockers[0];

  // Profil 4 a priorité partielle (savesPerWeek=20+ + cookedRatio=aucune), mais l'énoncé
  // demande de tester dans l'ordre 1 → 5 → fallback. Profil 1 demande "11-20" ou "20+"
  // + "aucune"/"quelques" + first in {eparpillees, sais-pas-quoi}. Pour un "20+"/"aucune"
  // sans ces blockers, Profil 1 ne matche pas et on peut tomber sur Profil 4.

  // Profil 1 — La Collectionneuse pressée
  if (
    (savesPerWeek === "11-20" || savesPerWeek === "20+") &&
    (cookedRatio === "aucune" || cookedRatio === "quelques") &&
    (first === "eparpillees" || first === "sais-pas-quoi")
  ) {
    return PROFILE_COLLECTIONNEUSE;
  }

  // Profil 2 — La Curieuse débordée
  if (
    (savesPerWeek === "4-10" || savesPerWeek === "11-20") &&
    (cookedRatio === "aucune" || cookedRatio === "quelques") &&
    (first === "trop-etapes" || first === "pas-y-mettre")
  ) {
    return PROFILE_CURIEUSE;
  }

  // Profil 3 — La Routinière déçue
  if (
    (savesPerWeek === "1-3" || savesPerWeek === "4-10") &&
    (cookedRatio === "moitie" || cookedRatio === "toutes") &&
    first === "memes-plats"
  ) {
    return PROFILE_ROUTINIERE;
  }

  // Profil 4 — La Fantôme du dimanche
  if (savesPerWeek === "20+" && cookedRatio === "aucune") {
    return PROFILE_FANTOME;
  }

  // Profil 5 — L'Hésitante motivée
  if (
    savesPerWeek === "1-3" &&
    (cookedRatio === "aucune" || cookedRatio === "quelques") &&
    first === "pas-y-mettre"
  ) {
    return PROFILE_HESITANTE;
  }

  return PROFILE_EQUILIBRISTE;
}

/** Affichage "Recettes sauvées / sem" */
export function savesLabel(savesPerWeek: SavesPerWeek | null): string {
  switch (savesPerWeek) {
    case "1-3":
      return "~2";
    case "4-10":
      return "~7";
    case "11-20":
      return "~15";
    case "20+":
      return "25+";
    default:
      return "—";
  }
}

/** Affichage "Vraiment cuisinées" — table de correspondance exacte */
export function cookedLabel(
  savesPerWeek: SavesPerWeek | null,
  cookedRatio: CookedRatio | null
): string {
  const key = `${savesPerWeek ?? ""}|${cookedRatio ?? ""}`;
  const TABLE: Record<string, string> = {
    "1-3|aucune": "0 sur 2",
    "1-3|quelques": "1 sur 2",
    "1-3|moitie": "1 sur 2",
    "1-3|toutes": "2 sur 2",
    "4-10|aucune": "0 sur 7",
    "4-10|quelques": "1 sur 7",
    "4-10|moitie": "4 sur 7",
    "4-10|toutes": "6 sur 7",
    "11-20|aucune": "0 sur 15",
    "11-20|quelques": "3 sur 15",
    "11-20|moitie": "8 sur 15",
    "11-20|toutes": "14 sur 15",
    "20+|aucune": "0 sur 25",
    "20+|quelques": "5 sur 25",
    "20+|moitie": "13 sur 25",
    "20+|toutes": "23 sur 25",
  };
  return TABLE[key] ?? "—";
}
