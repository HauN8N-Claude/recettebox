/**
 * Service : récupération des recettes depuis Supabase.
 *
 * Sprint 1 / Connexion bibliothèque → Supabase (14/05/2026).
 *
 * Remplace l'utilisation de constants/mockData.recipes (qui restera dispo
 * pour les démos onboarding qui s'en servent encore).
 *
 * Expose deux fonctions de fetch + deux hooks React Query :
 *   - useRecipes() : liste légère (sans ingredients/steps) pour library + home.
 *   - useRecipe(id) : recette complète (avec ingredients + steps triés) pour la fiche.
 *
 * RLS : les policies Supabase (migration 0002) filtrent automatiquement sur
 * user_id = auth.uid(), pas besoin d'ajouter de filtre côté client.
 */
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Recipe, RecipeSource } from "@/constants/mockData";

// ============================================================================
// Types BD (snake_case, reflet du schéma SQL)
// ============================================================================

type DbRecipeSource = "instagram" | "tiktok" | "pinterest" | "youtube" | "web" | "manual";
type DbRecipeDifficulty = "facile" | "moyen" | "expert";

type DbRecipeRow = {
  id: string;
  title: string;
  source: DbRecipeSource;
  source_url: string | null;
  source_author: string | null;
  image_url: string | null;
  servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  difficulty: DbRecipeDifficulty | null;
  tags: string[] | null;
  cooked_count: number | null;
  is_favorite: boolean | null;
  imported_at: string | null;
};

type DbIngredientRow = {
  name: string;
  quantity: string | null;
  position: number;
};

type DbStepRow = {
  content: string;
  position: number;
};

type DbRecipeWithRelations = DbRecipeRow & {
  recipe_ingredients: DbIngredientRow[];
  recipe_steps: DbStepRow[];
};

// ============================================================================
// Mappers BD → type client
// ============================================================================

// Le type client n'a pas "youtube" (cf. constants/mockData.ts RecipeSource).
// On fallback vers "web" si jamais la BD remonte une recette youtube.
function mapSource(dbSource: DbRecipeSource): RecipeSource {
  if (dbSource === "youtube") return "web";
  return dbSource;
}

function mapRecipeBase(row: DbRecipeRow): Omit<Recipe, "ingredients" | "steps"> {
  return {
    id: row.id,
    title: row.title,
    source: mapSource(row.source),
    sourceAuthor: row.source_author ?? undefined,
    imageUrl: row.image_url ?? "",
    servings: row.servings ?? 2,
    prepTimeMinutes: row.prep_time_minutes ?? 0,
    cookTimeMinutes: row.cook_time_minutes ?? 0,
    difficulty: row.difficulty ?? "facile",
    tags: row.tags ?? [],
    cookedCount: row.cooked_count ?? 0,
    isFavorite: row.is_favorite ?? false,
    importedAt: row.imported_at ?? new Date().toISOString(),
  };
}

function mapRecipeWithRelations(row: DbRecipeWithRelations): Recipe {
  const ingredients = [...row.recipe_ingredients]
    .sort((a, b) => a.position - b.position)
    .map((ing) => ({
      name: ing.name,
      quantity: ing.quantity ?? "",
    }));

  const steps = [...row.recipe_steps]
    .sort((a, b) => a.position - b.position)
    .map((s) => s.content);

  return {
    ...mapRecipeBase(row),
    ingredients,
    steps,
  };
}

// ============================================================================
// Fonctions de fetch
// ============================================================================

const RECIPE_LIST_COLUMNS =
  "id, title, source, source_url, source_author, image_url, servings, prep_time_minutes, cook_time_minutes, difficulty, tags, cooked_count, is_favorite, imported_at";

/**
 * Récupère la liste des recettes du user authentifié (allégée).
 *
 * Pas de join sur ingredients/steps — ces champs sont retournés à [] dans le
 * type Recipe pour satisfaire le type, mais ne sont pas chargés (économie de
 * payload pour la grille bibliothèque + carrousels home).
 *
 * Trié par imported_at décroissant (les plus récentes en haut).
 */
export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from("recipes")
    .select(RECIPE_LIST_COLUMNS)
    .order("imported_at", { ascending: false });

  if (error) {
    throw new Error(`[fetchRecipes] ${error.message}`);
  }

  const rows = (data ?? []) as DbRecipeRow[];
  return rows.map((row) => ({
    ...mapRecipeBase(row),
    ingredients: [],
    steps: [],
  }));
}

/**
 * Récupère une recette complète par son id (avec ingredients + steps triés).
 * Retourne null si la recette n'existe pas (ou n'appartient pas au user, RLS).
 */
export async function fetchRecipeById(id: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `${RECIPE_LIST_COLUMNS},
       recipe_ingredients(name, quantity, position),
       recipe_steps(content, position)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`[fetchRecipeById] ${error.message}`);
  }
  if (!data) return null;

  return mapRecipeWithRelations(data as DbRecipeWithRelations);
}

// ============================================================================
// Hooks React Query
// ============================================================================

/**
 * Hook : liste des recettes du user (pour library.tsx + index.tsx).
 *
 * - staleTime 60s : pas de refetch agressif entre écrans.
 * - cache partagé entre les 2 écrans via queryKey ["recipes"].
 */
export function useRecipes() {
  return useQuery({
    queryKey: ["recipes"] as const,
    queryFn: fetchRecipes,
    staleTime: 60_000,
  });
}

/**
 * Hook : recette complète (pour recipe/[id].tsx).
 * `id` peut être undefined le temps que le route param soit dispo — la query
 * est désactivée dans ce cas.
 */
export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: ["recipe", id] as const,
    queryFn: () => fetchRecipeById(id as string),
    enabled: !!id,
    staleTime: 60_000,
  });
}
