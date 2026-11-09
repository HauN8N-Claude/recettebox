/**
 * Utilitaires liste de courses — catégorisation par rayon + mise à l'échelle
 * des quantités selon le nombre de personnes.
 *
 * Extrait de app/recipe/[id]/shopping-list.tsx pour être partagé avec l'onglet
 * Courses (app/(tabs)/shopping.tsx), qui agrège les ingrédients de plusieurs
 * recettes validées.
 */

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
