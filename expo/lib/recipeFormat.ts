/**
 * Helpers de mise en forme pour l'affichage des ingrédients.
 *
 * Partagés entre :
 *   - app/recipe/[id].tsx (fiche recette complète)
 *   - app/recipe/aha/[id].tsx (écran "aha" liste de courses)
 *   - app/recipe/[id]/shopping-list.tsx (liste de courses détaillée)
 *
 * Les règles de catégorisation sont simples (regex sur le nom) et tolérantes :
 * tout ce qui n'est pas reconnu tombe dans "Épicerie" — c'est volontaire pour
 * ne jamais avoir de catégorie "Autres" qui ferait moche dans la liste.
 */
import type { Recipe } from "@/constants/mockData";

export type IngredientCategory =
  | "Légumes & frais"
  | "Protéines"
  | "Crémerie & œufs"
  | "Épicerie";

export const CATEGORY_ORDER: IngredientCategory[] = [
  "Légumes & frais",
  "Protéines",
  "Crémerie & œufs",
  "Épicerie",
];

export function categorize(name: string): IngredientCategory {
  const n = name.toLowerCase();
  if (
    /(courgette|tomate|oignon|ail|échalote|carotte|romaine|basilic|citron|pomme|champignon|thym|coriandre|persil|poireau|salade|cannelle|wakame|alg)/.test(
      n,
    )
  )
    return "Légumes & frais";
  if (
    /(b(œ|oe)uf|lardon|poulet|crevette|saumon|porc|veau|jambon|poisson|tofu)/.test(
      n,
    )
  )
    return "Protéines";
  if (/(beurre|parmesan|cr(è|e)me|lait|(œ|oe)uf|fromage|yaourt)/.test(n))
    return "Crémerie & œufs";
  return "Épicerie";
}

/**
 * Multiplie la partie numérique d'une quantité ("400 g", "2 c. à s.", "1")
 * par un ratio (ex: 6/4 si on passe de 4 à 6 personnes). Préserve l'unité.
 * Fallback : si pas de nombre trouvé, on renvoie tel quel.
 */
export function scaleQuantity(qty: string, ratio: number): string {
  const m = qty.match(/^(\d+(?:[.,]\d+)?)(.*)$/);
  if (!m) return qty;
  const num = parseFloat(m[1].replace(",", "."));
  const rest = m[2];
  const scaled = num * ratio;
  const rounded = Math.round(scaled * 10) / 10;
  const display = Number.isInteger(rounded)
    ? `${rounded}`
    : `${rounded}`.replace(".", ",");
  return `${display}${rest}`;
}

export type GroupedIngredient = {
  idx: number;
  name: string;
  quantity: string;
};

export type IngredientGroup = {
  cat: IngredientCategory;
  items: GroupedIngredient[];
};

/**
 * Renvoie les ingrédients d'une recette regroupés par catégorie et triés selon
 * `CATEGORY_ORDER`. Applique automatiquement le scaling de quantités si
 * `servings` diffère de `recipe.servings`.
 */
export function groupIngredients(
  recipe: Recipe,
  servings: number,
): IngredientGroup[] {
  const ratio = servings / recipe.servings;
  const buckets = new Map<IngredientCategory, GroupedIngredient[]>();
  recipe.ingredients.forEach((ing, idx) => {
    const cat = categorize(ing.name);
    const list = buckets.get(cat) ?? [];
    list.push({
      idx,
      name: ing.name,
      quantity: scaleQuantity(ing.quantity, ratio),
    });
    buckets.set(cat, list);
  });
  return CATEGORY_ORDER.filter((c) => buckets.has(c)).map((c) => ({
    cat: c,
    items: buckets.get(c) ?? [],
  }));
}
