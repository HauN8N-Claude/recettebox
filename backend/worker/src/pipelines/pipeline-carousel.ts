// =============================================================================
// Sous-pipeline CARROUSEL (B3.4) — souvent le plus riche pour les recettes Insta
// =============================================================================
// Étapes :
//   1. Téléchargement de toutes les images du carrousel
//      (+ extraction de frames si le carrousel contient des vidéos — cas mixte Insta)
//   2. Claude vision batch (carousel : analyse ordonnée multi-images)
//   3. Claude fusion (caption 60% + images 40%)
// =============================================================================

import { downloadAsBuffer } from "../lib/http.js";
import { writeVideoToTmp, extractFrames } from "../lib/ffmpeg.js";
import { analyzeImages } from "../modules/claude-vision.js";
import { fuseRecipe } from "../modules/claude-fusion.js";
import { config } from "../config.js";
import type { FetchedPost } from "../providers/social-api.js";
import type { PipelineOutput, VideoPipelineDeps } from "./pipeline-video.js";

const MAX_CAROUSEL_IMAGES_FOR_VISION = 12;
const FRAMES_PER_VIDEO_IN_CAROUSEL = 3; // les vidéos de carrousel sont courtes, 3 frames suffisent

export async function runCarouselPipeline(
  post: FetchedPost,
  deps: VideoPipelineDeps,
): Promise<PipelineOutput> {
  if (post.mediaItems.length === 0) {
    throw new Error("Carousel pipeline called with empty mediaItems");
  }

  // 1. Download tous les médias dans l'ordre
  await deps.setStatus("downloading");
  deps.log.info("Downloading carousel", { count: post.mediaItems.length });

  const allFrames: Buffer[] = [];
  const cleanupFns: Array<() => Promise<void>> = [];

  for (const item of post.mediaItems) {
    if (item.type === "image") {
      try {
        const bytes = await downloadAsBuffer(item.url, 10 * 1024 * 1024);
        allFrames.push(bytes);
      } catch (err) {
        deps.log.warn("Failed to download carousel image, skipping", {
          url: item.url,
          error: (err as Error).message,
        });
      }
    } else if (item.type === "video") {
      try {
        const bytes = await downloadAsBuffer(item.url);
        const { videoPath, cleanup } = await writeVideoToTmp(bytes);
        cleanupFns.push(cleanup);
        const { framesBytes } = await extractFrames(videoPath, FRAMES_PER_VIDEO_IN_CAROUSEL);
        allFrames.push(...framesBytes);
      } catch (err) {
        deps.log.warn("Failed to process carousel video, skipping", {
          url: item.url,
          error: (err as Error).message,
        });
      }
    }
  }

  if (allFrames.length === 0) {
    await Promise.all(cleanupFns.map((fn) => fn().catch(() => undefined)));
    return {
      recipe: null,
      reason: "carousel_no_downloadable_media",
      coverImageBytes: null,
      durationSeconds: 0,
    };
  }

  // Trim si trop d'images (coût Claude vision)
  const framesForVision = allFrames.slice(0, MAX_CAROUSEL_IMAGES_FOR_VISION);
  if (allFrames.length > MAX_CAROUSEL_IMAGES_FOR_VISION) {
    deps.log.info("Trimming carousel for vision", {
      total: allFrames.length,
      kept: MAX_CAROUSEL_IMAGES_FOR_VISION,
    });
  }

  try {
    // 2. Vision batch
    await deps.setStatus("extracting");
    const vision = await analyzeImages(framesForVision, "carousel", { log: deps.log });
    deps.log.info("Claude vision done (carousel)", {
      images: framesForVision.length,
      looksLikeRecipe: vision.looksLikeRecipe,
      ingredients: vision.detectedIngredients.length,
      steps: vision.detectedSteps.length,
    });

    // 3. Fusion
    await deps.setStatus("structuring");
    const fusion = await fuseRecipe(
      {
        mediaType: "carousel",
        caption: post.caption,
        transcription: null,
        vision,
        platform: post.platform,
        author: post.author,
      },
      { log: deps.log },
    );

    return {
      recipe: fusion.recipe,
      reason: fusion.reason,
      coverImageBytes: allFrames[0],
      durationSeconds: 0,
    };
  } finally {
    await Promise.all(cleanupFns.map((fn) => fn().catch(() => undefined)));
  }
}
