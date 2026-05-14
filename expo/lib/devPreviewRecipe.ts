/**
 * ⚠️ DEV ONLY — fausse recette pour visualiser les écrans d'import sans BD.
 *
 * Utilisée par les écrans dont l'id de route est "preview" :
 *   - /recipe/reveal/preview (écran révélation post-import)
 *   - /recipe/aha/preview (écran aha liste de courses)
 *
 * À retirer (avec les modes preview correspondants) une fois les écrans validés.
 */
import type { Recipe } from "@/constants/mockData";

export const PREVIEW_RECIPE: Recipe = {
  id: "preview",
  title: "Pâtes au pesto d'avocat et basilic frais",
  source: "instagram",
  sourceAuthor: "le.bon.gout",
  imageUrl:
    "https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=600&q=80",
  servings: 4,
  prepTimeMinutes: 10,
  cookTimeMinutes: 12,
  difficulty: "facile",
  tags: ["pâtes", "végé", "rapide"],
  cookedCount: 0,
  isFavorite: false,
  importedAt: new Date().toISOString(),
  ingredients: [
    { name: "Pâtes", quantity: "400 g" },
    { name: "Avocat bien mûr", quantity: "2" },
    { name: "Basilic frais", quantity: "1 botte" },
    { name: "Parmesan râpé", quantity: "60 g" },
    { name: "Citron", quantity: "1" },
    { name: "Ail", quantity: "1 gousse" },
    { name: "Pignons de pin", quantity: "30 g" },
    { name: "Huile d'olive", quantity: "3 c. à s." },
  ],
  steps: [
    "Faire cuire les pâtes dans une grande casserole d'eau salée.",
    "Mixer l'avocat, le basilic, le parmesan, le citron, l'ail et l'huile d'olive.",
    "Égoutter les pâtes en gardant un peu d'eau de cuisson.",
    "Mélanger les pâtes avec la sauce, ajuster la texture avec l'eau si besoin.",
    "Servir aussitôt avec les pignons toastés.",
  ],
};
