// =============================================================================
// Module Claude vision (B3.6) — brique générique réutilisable
// =============================================================================
// Accepte 1..N images, renvoie une analyse structurée :
//   - ingrédients visibles
//   - étapes/gestes de cuisson détectés
//   - ustensiles
//   - description du plat final
//
// Le prompt s'adapte selon le contexte :
//   - "single"     : 1 image (photo unique de plat / infographie)
//   - "frames"     : frames extraites d'une vidéo (chronologique)
//   - "carousel"   : carrousel ordonné (10 images racontant une recette)
// =============================================================================

import { anthropic } from "../lib/anthropic.js";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";
import type { Logger } from "../lib/logger.js";
import { logAnthropicCost } from "../lib/ai-cost.js";

export type VisionContext = "single" | "frames" | "carousel";

export interface VisionAnalysis {
  detectedIngredients: string[];
  detectedSteps: string[];
  detectedUtensils: string[];
  finalDishDescription: string;
  looksLikeRecipe: boolean;
  rawText: string;
}

function buildPrompt(context: VisionContext, imageCount: number): string {
  const base = `Tu es un assistant culinaire expert. Tu analyses des images pour aider à reconstruire une recette structurée.

Réponds uniquement en JSON avec exactement cette structure :
{
  "detected_ingredients": ["nom ingrédient 1", ...],
  "detected_steps": ["étape 1 observée", ...],
  "detected_utensils": ["ustensile 1", ...],
  "final_dish_description": "description du plat final visible (1 phrase)",
  "looks_like_recipe": true | false
}

Règles :
- Ingrédients : noms en français, au singulier, sans quantité.
- Étapes : verbes à l'impératif, courtes, dans l'ordre des images.
- looks_like_recipe = false si les images montrent juste un plat dans un restaurant, un meme, une photo non liée à la cuisine.
- Pas de texte hors du JSON, pas de markdown, pas de commentaire.
`;

  switch (context) {
    case "single":
      return base + `\nContexte : une seule image fournie. Souvent un plat fini ou une infographie de recette. Concentre-toi sur les ingrédients visibles et le type de plat.`;
    case "frames":
      return base + `\nContexte : ${imageCount} frames extraites d'une vidéo de recette, dans l'ordre chronologique. Les premières frames montrent souvent les ingrédients/préparation, les dernières le plat final.`;
    case "carousel":
      return base + `\nContexte : ${imageCount} images d'un post carrousel Instagram, dans l'ordre. La 1re image est souvent une accroche (photo du plat fini ou titre), les images suivantes détaillent ingrédients et étapes. Reconstitue le déroulé.`;
  }
}

function detectMimeType(bytes: Buffer): "image/jpeg" | "image/png" | "image/webp" {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return "image/jpeg";
}

function safeParseJson(raw: string): unknown {
  // Claude peut parfois enrober en ```json ... ```
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Tentative : extraire le premier objet JSON
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Analyse 1..N images via Claude vision.
 * Toutes les images sont envoyées dans le MÊME appel pour que Claude puisse
 * faire les liens (carrousel = histoire, frames vidéo = chronologie).
 */
export async function analyzeImages(
  images: Buffer[],
  context: VisionContext,
  options?: { log?: Logger },
): Promise<VisionAnalysis> {
  if (images.length === 0) {
    throw new Error("analyzeImages called with 0 images");
  }
  if (images.length > 20) {
    logger.warn("Trimming images to 20 max", { initial: images.length });
    images = images.slice(0, 20);
  }

  const content = [
    ...images.map((bytes) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: detectMimeType(bytes),
        data: bytes.toString("base64"),
      },
    })),
    {
      type: "text" as const,
      text: buildPrompt(context, images.length),
    },
  ];

  const res = await anthropic.messages.create({
    model: config.ANTHROPIC_MODEL_VISION,
    max_tokens: 1500,
    messages: [{ role: "user", content }],
  });

  logAnthropicCost({
    module: "vision",
    model: config.ANTHROPIC_MODEL_VISION,
    inputTokens: res.usage.input_tokens,
    outputTokens: res.usage.output_tokens,
    log: options?.log,
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const parsed = safeParseJson(text) as
    | {
        detected_ingredients?: unknown;
        detected_steps?: unknown;
        detected_utensils?: unknown;
        final_dish_description?: unknown;
        looks_like_recipe?: unknown;
      }
    | null;

  if (!parsed) {
    logger.warn("Claude vision: JSON parse failed", { rawSample: text.slice(0, 200) });
    return {
      detectedIngredients: [],
      detectedSteps: [],
      detectedUtensils: [],
      finalDishDescription: "",
      looksLikeRecipe: false,
      rawText: text,
    };
  }

  const asStrArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  return {
    detectedIngredients: asStrArray(parsed.detected_ingredients),
    detectedSteps: asStrArray(parsed.detected_steps),
    detectedUtensils: asStrArray(parsed.detected_utensils),
    finalDishDescription: typeof parsed.final_dish_description === "string"
      ? parsed.final_dish_description
      : "",
    looksLikeRecipe: parsed.looks_like_recipe === true,
    rawText: text,
  };
}

// Type import for TS compat
import type Anthropic from "@anthropic-ai/sdk";
