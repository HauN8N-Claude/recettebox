// =============================================================================
// Persistance d'une recette structurée → tables Postgres + storage
// =============================================================================

import { supabase, uploadMedia } from "../lib/supabase.js";
import type { Recipe } from "../schemas/recipe.js";
import type { FetchedPost } from "../providers/social-api.js";

export async function persistRecipe(params: {
  userId: string;
  jobId: string;
  recipe: Recipe;
  post: FetchedPost;
  sourceUrl: string;
  coverImageBytes: Buffer | null;
}): Promise<string> {
  const { userId, jobId, recipe, post, sourceUrl, coverImageBytes } = params;

  // 1. Insert recipes (sans image_url encore — on l'upload après pour avoir l'id)
  const { data: inserted, error: insertErr } = await supabase
    .from("recipes")
    .insert({
      user_id: userId,
      title: recipe.title,
      source: post.platform,
      source_url: sourceUrl,
      source_author: post.author ?? post.authorHandle ?? null,
      servings: recipe.servings,
      prep_time_minutes: recipe.prepTimeMinutes,
      cook_time_minutes: recipe.cookTimeMinutes,
      difficulty: recipe.difficulty,
      tags: recipe.tags,
      ai_confidence: recipe.aiConfidence,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    throw new Error(`Insert recipe failed: ${insertErr?.message}`);
  }
  const recipeId = inserted.id as string;

  // 2. Upload cover image (si dispo)
  let imageUrl: string | null = null;
  if (coverImageBytes) {
    const path = `${userId}/${recipeId}/cover.jpg`;
    try {
      imageUrl = await uploadMedia(path, coverImageBytes, "image/jpeg");
    } catch {
      // pas bloquant
    }
  } else if (post.thumbnailUrl) {
    imageUrl = post.thumbnailUrl;
  }

  if (imageUrl) {
    await supabase.from("recipes").update({ image_url: imageUrl }).eq("id", recipeId);
  }

  // 3. Insert ingredients (bulk)
  if (recipe.ingredients.length > 0) {
    const rows = recipe.ingredients.map((ing, i) => ({
      recipe_id: recipeId,
      position: i,
      name: ing.name,
      quantity: ing.quantity ?? "",
      category: ing.category ?? null,
    }));
    const { error: ingErr } = await supabase.from("recipe_ingredients").insert(rows);
    if (ingErr) throw new Error(`Insert ingredients failed: ${ingErr.message}`);
  }

  // 4. Insert steps
  if (recipe.steps.length > 0) {
    const rows = recipe.steps.map((content, i) => ({
      recipe_id: recipeId,
      position: i,
      content,
    }));
    const { error: stepsErr } = await supabase.from("recipe_steps").insert(rows);
    if (stepsErr) throw new Error(`Insert steps failed: ${stepsErr.message}`);
  }

  // 5. Lier recipe_id sur l'import (l'app peut alors naviguer dessus)
  await supabase.from("imports").update({ recipe_id: recipeId }).eq("id", jobId);

  return recipeId;
}
