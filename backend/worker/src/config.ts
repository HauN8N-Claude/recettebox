// =============================================================================
// Configuration centralisée du worker
// =============================================================================
// Charge + valide les variables d'env au démarrage. Si une variable critique
// manque, on crashe tôt avec un message clair plutôt que de planter en plein
// pipeline.
// =============================================================================

import { z } from "zod";

const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_STORAGE_BUCKET: z.string().default("recipe-media"),

  // OpenAI
  OPENAI_API_KEY: z.string().min(20),
  OPENAI_WHISPER_MODEL: z.string().default("whisper-1"),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(20),
  ANTHROPIC_MODEL_VISION: z.string().default("claude-haiku-4-5"),
  ANTHROPIC_MODEL_FUSION: z.string().default("claude-sonnet-4-6"),

  // Social API
  SOCIAL_API_PROVIDER: z
    .enum(["stub", "rapidapi", "apify", "scrapecreators"])
    .default("stub"),
  SOCIAL_API_KEY: z.string().optional(),
  SOCIAL_API_BASE_URL: z.string().optional(),
  // ScrapeCreators (provider retenu V1.0 — cf. tâche zéro 13/05/2026)
  SCRAPECREATORS_API_KEY: z.string().optional(),

  // Worker
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(2),
  WORKER_MAX_DURATION_SECONDS: z.coerce.number().int().positive().default(180),
  WORKER_MAX_VIDEO_SECONDS: z.coerce.number().int().positive().default(300),
  WORKER_FRAMES_PER_VIDEO: z.coerce.number().int().positive().default(8),

  // Logs
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables d'environnement invalides :");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
