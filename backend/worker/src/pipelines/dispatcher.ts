// =============================================================================
// Dispatcher (B3.0) — route un FetchedPost vers le bon sous-pipeline
// =============================================================================

import { runVideoPipeline } from "./pipeline-video.js";
import { runImagePipeline } from "./pipeline-image.js";
import { runCarouselPipeline } from "./pipeline-carousel.js";
import type { FetchedPost } from "../providers/social-api.js";
import type { PipelineOutput, VideoPipelineDeps } from "./pipeline-video.js";

export async function dispatchPipeline(
  post: FetchedPost,
  deps: VideoPipelineDeps,
): Promise<PipelineOutput> {
  switch (post.mediaType) {
    case "video":
      return runVideoPipeline(post, deps);
    case "image":
      return runImagePipeline(post, deps);
    case "carousel":
      return runCarouselPipeline(post, deps);
    default: {
      const _exhaustive: never = post.mediaType;
      throw new Error(`Unknown mediaType: ${_exhaustive}`);
    }
  }
}
