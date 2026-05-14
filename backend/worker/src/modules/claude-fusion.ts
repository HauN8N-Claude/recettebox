// =============================================================================
// Module Claude fusion (B3.7) — brique générique réutilisable
// =============================================================================
// Input : caption + (transcription audio si dispo) + (analyse vision si dispo)
//         + mediaType (pour adapter la pondération)
// Output : Recipe structurée validée Zod, OU null si pas de recette détectable.
//
// Pondération automatique selon mediaType :
//   - video    : caption 10% + voix off 60% + frames 30%
//   - image    : caption 80% + image 20%
//   - carousel : caption 60% + images 40%
// =============================================================================

import type Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "../lib/anthropic.js";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";
import type { Logger } from "../lib/logger.js";
import { logAnthropicCost } from "../lib/ai-cost.js";
import { recipeJsonSchema, recipeSchema, type Recipe } from "../schemas/recipe.js";
import type { VisionAnalysis } from "./claude-vision.js";

export interface FusionInput {
  mediaType: "video" | "image" | "carousel";
  caption: string;
  transcription?: string | null;
  vision?: VisionAnalysis | null;
  platform: "instagram" | "tiktok";
  author?: string;
}

const WEIGHTS: Record<
  FusionInput["mediaType"],
  { caption: number; audio: number; vision: number }
> = {
  video:    { caption: 0.10, audio: 0.60, vision: 0.30 },
  image:    { caption: 0.80, audio: 0.00, vision: 0.20 },
  carousel: { caption: 0.60, audio: 0.00, vision: 0.40 },
};

function buildSystemPrompt(): string {
  return `Tu es un assistant expert en cuisine qui structure des recettes à partir de contenus sociaux.

Ta mission : reconstruire une recette complète, claire et cuisinable, à partir de plusieurs sources d'information (caption, voix off, analyse visuelle).

Règles strictes :
1. **Langue** : français.
2. **Quantités** : toujours avec unité explicite (g, ml, cs, cc, pièces…). Si tu n'es pas sûr, mets une estimation raisonnable basée sur le nombre de portions.
3. **Étapes** : à l'impératif, courtes (1-3 phrases), dans l'ordre logique.
4. **Tags** : 3 à 6 tags courts utiles (type de plat, régime, technique). Ex: "italien", "végétarien", "rapide", "four".
5. **Catégorisation ingrédients** : utilise une catégorie parmi legumes / fruits / proteines / cremerie / epicerie / boissons / autre.
6. **Confiance** :
   - 0.9+ : tout est explicite, recette complète et claire
   - 0.6-0.8 : recette plausible, quelques inférences raisonnables
   - 0.3-0.5 : beaucoup d'inférences, incertitude sur les quantités
   - <0.3 : trop peu d'info → tu peux refuser (voir règle 7)
7. **Refus** : si les sources ne permettent PAS de produire une recette utile (pas de cuisine, juste un plat dans un resto, contenu non culinaire), appelle l'outil "no_recipe" au lieu de "build_recipe".

Tu DOIS appeler exactement UN outil. Pas de texte hors tool call.`;
}

function buildUserPrompt(input: FusionInput): string {
  const w = WEIGHTS[input.mediaType];
  const sections: string[] = [];

  sections.push(`Type de contenu : ${input.mediaType} (plateforme : ${input.platform})`);
  if (input.author) sections.push(`Auteur du post : ${input.author}`);

  sections.push("");
  sections.push("---- POIDS RELATIFS POUR CETTE EXTRACTION ----");
  sections.push(`Caption / texte du post : ${Math.round(w.caption * 100)}%`);
  if (w.audio > 0) sections.push(`Voix off (transcription audio) : ${Math.round(w.audio * 100)}%`);
  sections.push(`Analyse visuelle des images : ${Math.round(w.vision * 100)}%`);
  sections.push("Pondère ton interprétation selon ces ratios. Si une source contredit l'autre, la source au poids le plus élevé fait foi (sauf incohérence flagrante).");

  sections.push("");
  sections.push("---- CAPTION ----");
  sections.push(input.caption?.trim() || "(aucune caption fournie)");

  if (input.transcription) {
    sections.push("");
    sections.push("---- TRANSCRIPTION DE LA VOIX OFF ----");
    sections.push(input.transcription.trim());
  }

  if (input.vision) {
    sections.push("");
    sections.push("---- ANALYSE VISUELLE ----");
    sections.push(`Recette plausible : ${input.vision.looksLikeRecipe ? "oui" : "non"}`);
    if (input.vision.detectedIngredients.length > 0) {
      sections.push(`Ingrédients visibles : ${input.vision.detectedIngredients.join(", ")}`);
    }
    if (input.vision.detectedSteps.length > 0) {
      sections.push(`Étapes/gestes détectés (chronologique) :`);
      input.vision.detectedSteps.forEach((s, i) => sections.push(`  ${i + 1}. ${s}`));
    }
    if (input.vision.detectedUtensils.length > 0) {
      sections.push(`Ustensiles : ${input.vision.detectedUtensils.join(", ")}`);
    }
    if (input.vision.finalDishDescription) {
      sections.push(`Plat final : ${input.vision.finalDishDescription}`);
    }
  }

  return sections.join("\n");
}

export interface FusionResult {
  recipe: Recipe | null;
  reason?: string;
}

export async function fuseRecipe(
  input: FusionInput,
  options?: { log?: Logger },
): Promise<FusionResult> {
  const tools: Anthropic.Tool[] = [
    {
      name: "build_recipe",
      description:
        "Appelle cet outil quand tu as assez d'info pour produire une recette structurée et utile.",
      input_schema: recipeJsonSchema as unknown as Anthropic.Tool["input_schema"],
    },
    {
      name: "no_recipe",
      description:
        "Appelle cet outil si le contenu ne permet pas de produire une recette utile (pas culinaire, trop peu d'info, etc.).",
      input_schema: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Pourquoi pas de recette détectable" },
        },
        required: ["reason"],
      },
    },
  ];

  const res = await anthropic.messages.create({
    model: config.ANTHROPIC_MODEL_FUSION,
    max_tokens: 4000,
    system: buildSystemPrompt(),
    tools,
    tool_choice: { type: "any" },
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  logAnthropicCost({
    module: "fusion",
    model: config.ANTHROPIC_MODEL_FUSION,
    inputTokens: res.usage.input_tokens,
    outputTokens: res.usage.output_tokens,
    log: options?.log,
  });

  const toolUse = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );

  if (!toolUse) {
    logger.warn("Claude fusion: no tool_use block", { stopReason: res.stop_reason });
    return { recipe: null, reason: "no_tool_use" };
  }

  if (toolUse.name === "no_recipe") {
    const reason = (toolUse.input as { reason?: string }).reason ?? "no_recipe";
    return { recipe: null, reason };
  }

  if (toolUse.name === "build_recipe") {
    const parsed = recipeSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      logger.warn("Claude fusion: recipe schema validation failed", {
        issues: parsed.error.issues.slice(0, 5),
      });
      return { recipe: null, reason: "schema_invalid" };
    }
    return { recipe: parsed.data };
  }

  return { recipe: null, reason: `unknown_tool:${toolUse.name}` };
}
