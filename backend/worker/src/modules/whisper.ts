// =============================================================================
// Module Whisper (B3.5)
// =============================================================================
// Accepte un buffer audio, renvoie la transcription texte.
// Si pas de voix off détectée → renvoie une string vide (les pipelines doivent
// gérer ce cas, p. ex. Reel avec uniquement de la musique).
// =============================================================================

import { createHash } from "node:crypto";
import { openai } from "../lib/openai.js";
import { config } from "../config.js";
import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import type { Logger } from "../lib/logger.js";
import { logWhisperCost } from "../lib/ai-cost.js";

const MIN_TRANSCRIPTION_LENGTH = 8; // < 8 chars = probablement bruit/musique

export interface WhisperResult {
  text: string;
  language: string | null;
  durationSeconds: number;
  cached: boolean;
}

/**
 * Transcrit un buffer audio via Whisper.
 * Met le résultat en cache (table whisper_cache via clé hash audio) pour éviter
 * de re-payer Whisper si le job est relancé.
 */
export async function transcribeAudio(
  audioBytes: Buffer,
  filename = "audio.mp3",
  options?: { log?: Logger },
): Promise<WhisperResult> {
  const hash = createHash("sha256").update(audioBytes).digest("hex");

  // 1. Cache lookup
  const { data: cached } = await supabase
    .from("whisper_cache")
    .select("audio_data")
    .eq("url_hash", hash)
    .maybeSingle();

  if (cached?.audio_data && typeof cached.audio_data === "object") {
    const cd = cached.audio_data as { text?: string; language?: string; durationSeconds?: number };
    if (typeof cd.text === "string") {
      logger.debug("Whisper cache hit", { hash });
      return {
        text: cd.text,
        language: cd.language ?? null,
        durationSeconds: cd.durationSeconds ?? 0,
        cached: true,
      };
    }
  }

  // 2. Appel API
  const file = new File([audioBytes], filename, { type: "audio/mpeg" });

  const res = await openai.audio.transcriptions.create({
    file,
    model: config.OPENAI_WHISPER_MODEL,
    response_format: "verbose_json",
    language: undefined, // auto-détection
  });

  const text = (res.text ?? "").trim();
  const language = (res as { language?: string }).language ?? null;
  const durationSeconds = (res as { duration?: number }).duration ?? 0;

  logWhisperCost({
    model: config.OPENAI_WHISPER_MODEL,
    audioSeconds: durationSeconds,
    log: options?.log,
  });

  const normalized = text.length < MIN_TRANSCRIPTION_LENGTH ? "" : text;

  // 3. Cache write
  await supabase.from("whisper_cache").upsert(
    {
      url_hash: hash,
      audio_data: { text: normalized, language, durationSeconds },
    },
    { onConflict: "url_hash" },
  );

  return { text: normalized, language, durationSeconds, cached: false };
}
