// =============================================================================
// Sous-pipeline VIDÉO (B3.2)
// =============================================================================
// Étapes :
//   1. Sauvegarde vidéo en /tmp
//   2. Extraction audio (ffmpeg) → Whisper
//   3. Extraction frames (ffmpeg) → Claude vision
//   4. Claude fusion (caption 10% + voix 60% + frames 30%)
// =============================================================================

import { downloadAsBuffer } from "../lib/http.js";
import { writeVideoToTmp, extractAudio, extractFrames } from "../lib/ffmpeg.js";
import { transcribeAudio } from "../modules/whisper.js";
import { analyzeImages } from "../modules/claude-vision.js";
import { fuseRecipe } from "../modules/claude-fusion.js";
import { config } from "../config.js";
import type { FetchedPost } from "../providers/social-api.js";
import type { Recipe } from "../schemas/recipe.js";
import type { Logger } from "../lib/logger.js";

export interface PipelineOutput {
  recipe: Recipe | null;
  reason?: string;
  coverImageBytes: Buffer | null;
  durationSeconds: number;
}

export interface VideoPipelineDeps {
  setStatus: (status: "downloading" | "transcribing" | "extracting" | "structuring") => Promise<void>;
  log: Logger;
}

export async function runVideoPipeline(
  post: FetchedPost,
  deps: VideoPipelineDeps,
): Promise<PipelineOutput> {
  const video = post.mediaItems.find((m) => m.type === "video");
  if (!video) throw new Error("Video pipeline called without a video item");

  if (video.durationSeconds && video.durationSeconds > config.WORKER_MAX_VIDEO_SECONDS) {
    return {
      recipe: null,
      reason: `video_too_long:${video.durationSeconds}s`,
      coverImageBytes: null,
      durationSeconds: video.durationSeconds,
    };
  }

  // 1. Download
  await deps.setStatus("downloading");
  deps.log.info("Downloading video", { url: video.url });
  const videoBytes = await downloadAsBuffer(video.url);
  const { videoPath, cleanup } = await writeVideoToTmp(videoBytes);

  try {
    // 2. Audio → Whisper
    await deps.setStatus("transcribing");
    const { audioBytes, durationSeconds } = await extractAudio(videoPath);
    const whisper = await transcribeAudio(audioBytes, undefined, { log: deps.log });
    deps.log.info("Whisper done", {
      cached: whisper.cached,
      length: whisper.text.length,
      hasVoiceover: whisper.text.length > 0,
    });

    // 3. Frames → Claude vision
    await deps.setStatus("extracting");
    const { framesBytes } = await extractFrames(videoPath, config.WORKER_FRAMES_PER_VIDEO);
    deps.log.info("Frames extracted", { count: framesBytes.length });
    const vision = await analyzeImages(framesBytes, "frames", { log: deps.log });
    deps.log.info("Claude vision done", {
      looksLikeRecipe: vision.looksLikeRecipe,
      ingredients: vision.detectedIngredients.length,
      steps: vision.detectedSteps.length,
    });

    // Si rien d'utile : on tente quand même la fusion (la caption peut sauver le coup)
    // mais on baissera la confiance.

    // 4. Fusion
    await deps.setStatus("structuring");
    const fusion = await fuseRecipe(
      {
        mediaType: "video",
        caption: post.caption,
        transcription: whisper.text || null,
        vision,
        platform: post.platform,
        author: post.author,
      },
      { log: deps.log },
    );

    // Cover image = la frame du PLAT FINAL dressé désignée par la vision Claude
    // (hero). Avant, on prenait bêtement la 2e frame (~début de vidéo) → c'était
    // quasi toujours une image de préparation (ingrédients crus, mains qui
    // travaillent la pâte…), peu appétissante.
    // Fallback si la vision ne tranche pas : une frame TARDIVE (le plat dressé est
    // presque toujours en fin de vidéo), jamais le début.
    const lateFallbackIndex =
      framesBytes.length > 0 ? Math.floor((framesBytes.length - 1) * 0.85) : 0;
    const heroIndex = vision.heroImageIndex;
    const cover =
      (heroIndex != null ? framesBytes[heroIndex] : undefined) ??
      framesBytes[lateFallbackIndex] ??
      framesBytes[framesBytes.length - 1] ??
      framesBytes[0] ??
      null;
    deps.log.info("Cover frame selected", {
      heroIndex,
      usedFallback: heroIndex == null,
      totalFrames: framesBytes.length,
    });

    return {
      recipe: fusion.recipe,
      reason: fusion.reason,
      coverImageBytes: cover,
      durationSeconds,
    };
  } finally {
    await cleanup();
  }
}
