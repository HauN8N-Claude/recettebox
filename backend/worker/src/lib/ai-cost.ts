// =============================================================================
// Helper de log des coûts IA (B5.3)
// =============================================================================
// Émet une ligne JSON "ai_cost" à chaque appel API IA. Lisible dans les logs
// Railway pour suivre les dépenses par job et identifier les dérives.
//
// Les prix sont maintenus à la main. À mettre à jour quand Anthropic / OpenAI
// changent leurs tarifs. Documentation : worker/docs/monitoring.md
// =============================================================================

import { logger as globalLogger } from "./logger.js";
import type { Logger } from "./logger.js";

type LoggerLike = Logger | typeof globalLogger;

// Prix indicatifs en USD. Voir worker/docs/monitoring.md pour la source.
const PRICES = {
  // OpenAI Whisper — tarifé à la minute audio
  "whisper-1": { perAudioSecond: 0.006 / 60 },

  // Anthropic — tarifé au million de tokens (input / output)
  "claude-haiku-4-5": { inputPerMTok: 1.0, outputPerMTok: 5.0 },
  "claude-sonnet-4-6": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
} as const;

function round5(n: number): number {
  return Math.round(n * 100000) / 100000;
}

export function logWhisperCost(args: {
  model: string;
  audioSeconds: number;
  log?: LoggerLike;
}): void {
  const { model, audioSeconds, log } = args;
  const price = (PRICES as Record<string, { perAudioSecond?: number }>)[model];
  const costUsd = price?.perAudioSecond != null ? audioSeconds * price.perAudioSecond : null;
  (log ?? globalLogger).info("ai_cost", {
    module: "whisper",
    model,
    audio_seconds: Math.round(audioSeconds * 100) / 100,
    cost_usd_estimated: costUsd !== null ? round5(costUsd) : null,
  });
}

export function logAnthropicCost(args: {
  module: "vision" | "fusion";
  model: string;
  inputTokens: number;
  outputTokens: number;
  log?: LoggerLike;
}): void {
  const { module, model, inputTokens, outputTokens, log } = args;
  const price = (PRICES as Record<string, { inputPerMTok?: number; outputPerMTok?: number }>)[model];
  let costUsd: number | null = null;
  if (price?.inputPerMTok != null && price?.outputPerMTok != null) {
    costUsd =
      (inputTokens * price.inputPerMTok + outputTokens * price.outputPerMTok) / 1_000_000;
  }
  (log ?? globalLogger).info("ai_cost", {
    module,
    model,
    tokens_in: inputTokens,
    tokens_out: outputTokens,
    cost_usd_estimated: costUsd !== null ? round5(costUsd) : null,
  });
}
