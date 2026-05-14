// =============================================================================
// Schéma Recipe (Zod) — sortie du Claude fusion
// =============================================================================
// Aligné sur le type Recipe défini dans l'app Expo
// (recettebox/expo/constants/mockData.ts).
// =============================================================================

import { z } from "zod";

export const ingredientSchema = z.object({
  name: z.string().min(1).max(120),
  quantity: z.string().max(60).optional().default(""),
  category: z
    .enum(["legumes", "fruits", "proteines", "cremerie", "epicerie", "boissons", "autre"])
    .optional(),
});
export type Ingredient = z.infer<typeof ingredientSchema>;

export const recipeSchema = z.object({
  title: z.string().min(2).max(120),
  servings: z.number().int().positive().max(50).default(2),
  prepTimeMinutes: z.number().int().min(0).max(720).default(0),
  cookTimeMinutes: z.number().int().min(0).max(720).default(0),
  difficulty: z.enum(["facile", "moyen", "expert"]).default("facile"),
  tags: z.array(z.string().min(1).max(40)).max(15).default([]),
  ingredients: z.array(ingredientSchema).min(1).max(50),
  steps: z.array(z.string().min(1).max(800)).min(1).max(30),
  aiConfidence: z.number().min(0).max(1).default(0.5),
});
export type Recipe = z.infer<typeof recipeSchema>;

// JSON Schema pour Claude (tool use). Renvoyé tel quel dans tools[].input_schema.
export const recipeJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Titre de la recette, court et descriptif" },
    servings: { type: "integer", minimum: 1, description: "Nombre de portions" },
    prepTimeMinutes: { type: "integer", minimum: 0 },
    cookTimeMinutes: { type: "integer", minimum: 0 },
    difficulty: { type: "string", enum: ["facile", "moyen", "expert"] },
    tags: {
      type: "array",
      items: { type: "string" },
      description: "Tags courts (ex: 'végétarien', 'rapide', 'italien')",
    },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "string", description: "Avec unité (ex: '200 g', '3 cs')" },
          category: {
            type: "string",
            enum: ["legumes", "fruits", "proteines", "cremerie", "epicerie", "boissons", "autre"],
          },
        },
        required: ["name", "quantity"],
      },
    },
    steps: {
      type: "array",
      items: { type: "string", description: "Une étape, formulée à l'impératif" },
    },
    aiConfidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Confiance globale [0..1]. <0.3 = très incertain, >0.8 = très sûr.",
    },
  },
  required: ["title", "ingredients", "steps", "aiConfidence"],
} as const;
