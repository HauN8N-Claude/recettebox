// =============================================================================
// Sous-pipeline IMAGE UNIQUE (B3.3)
// =============================================================================
// Étapes :
//   1. Téléchargement de l'image
//   2. Claude vision (single)
//   3. Claude fusion (caption 80% + image 20%)
// =============================================================================

import { downloadAsBuffer } from "../lib/http.js";
import { analyzeImages } from "../modules/claude-vision.js";
import { fuseRecipe } from "../modules/claude-fusion.js";
import type { FetchedPost } from "../providers/social-api.js";
import type { PipelineOutput, VideoPipelineDeps } from "./pipeline-video.js";

export async function runImagePipeline(
  post: FetchedPost,
  deps: Omit<VideoPipelineDeps, "setStatus"> & {
    setStatus: (status: "downloading" | "extracting" | "structuring") => Promise<void>;
  },
): Promise<PipelineOutput> {
  const image = post.mediaItems.find((m) => m.type === "image");
  if (!image) throw new Error("Image pipeline called without an image item");

  // 1. Download
  await deps.setStatus("downloading");
  deps.log.info("Downloading image", { url: image.url });
  const imageBytes = await downloadAsBuffer(image.url, 10 * 1024 * 1024);

  // 2. Vision (single image)
  await deps.setStatus("extracting");
  const vision = await analyzeImages([imageBytes], "single", { log: deps.log });
  deps.log.info("Claude vision done (single)", {
    looksLikeRecipe: vision.looksLikeRecipe,
    ingredients: vision.detectedIngredients.length,
  });

  // 3. Fusion
  await deps.setStatus("structuring");
  const fusion = await fuseRecipe(
    {
      mediaType: "image",
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
    coverImageBytes: imageBytes,
    durationSeconds: 0,
  };
}
