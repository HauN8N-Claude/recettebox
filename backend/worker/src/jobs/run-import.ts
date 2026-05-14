// =============================================================================
// Orchestration d'un job d'import (B2.3)
// =============================================================================
// 1. Lit le job en base
// 2. Appelle l'API tierce (social-api) → FetchedPost
// 3. Dispatche vers le bon sous-pipeline (vidéo / image / carrousel)
// 4. Persiste la recette
// 5. Envoie la notif push
// 6. Marque status=done (ou failed avec error_message clair)
// =============================================================================

import { createHash } from "node:crypto";
import pRetry, { AbortError } from "p-retry";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";
import { supabase, updateImportStatus } from "../lib/supabase.js";
import { sendRecipeReadyPush } from "../lib/expo-push.js";
import { getSocialApiProvider, type FetchedPost } from "../providers/social-api.js";
import { dispatchPipeline } from "../pipelines/dispatcher.js";
import { persistRecipe } from "./persist-recipe.js";
import type { Recipe } from "../schemas/recipe.js";

// -----------------------------------------------------------------------------
// Cache URL communautaire (B5.4)
// -----------------------------------------------------------------------------
// Normalise une URL pour servir de clé de cache stable :
//   - trim + lowercase de l'hôte
//   - supprime les params de tracking (utm_*, igsh, fbclid, si)
//   - supprime le slash final
// Deux users qui partagent le même Reel via des chemins différents (avec ou
// sans tracking) tombent sur la même clé de cache.
function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.host = u.host.toLowerCase();
    const drop = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "igsh", "igshid", "fbclid", "si"];
    drop.forEach((k) => u.searchParams.delete(k));
    let s = u.toString();
    if (s.endsWith("/")) s = s.slice(0, -1);
    return s.toLowerCase();
  } catch {
    return raw.trim().toLowerCase();
  }
}

function hashUrl(url: string): string {
  return createHash("sha256").update(normalizeUrl(url)).digest("hex");
}

interface CachedImport {
  recipe: Recipe;
  platform: "instagram" | "tiktok";
  author: string | null;
  authorHandle: string | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
}

interface JobRow {
  id: string;
  user_id: string;
  source_url: string;
  source_platform: "instagram" | "tiktok" | null;
  status: string;
  attempt: number;
}

export async function runImportJob(jobId: string): Promise<void> {
  const log = logger.scoped({ jobId });
  const startedAt = Date.now();

  // 1. Lire le job
  const { data: job, error: fetchErr } = await supabase
    .from("imports")
    .select("id, user_id, source_url, source_platform, status, attempt")
    .eq("id", jobId)
    .single<JobRow>();

  if (fetchErr || !job) {
    log.error("Job not found", { error: fetchErr?.message });
    return;
  }

  if (job.status !== "pending") {
    log.info("Job not pending, skipping", { status: job.status });
    return;
  }

  // Réserver le job atomiquement (passe à 'downloading' uniquement si encore 'pending')
  const { data: reserved, error: reserveErr } = await supabase
    .from("imports")
    .update({ status: "downloading", attempt: job.attempt + 1 })
    .eq("id", jobId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (reserveErr || !reserved) {
    log.info("Job already taken by another worker instance");
    return;
  }

  const setStatus = async (
    status: "downloading" | "transcribing" | "extracting" | "structuring",
  ) => {
    await updateImportStatus(jobId, status);
  };

  try {
    // === Cache URL communautaire (B5.4) ===
    // Si quelqu'un a déjà importé cette URL, on copie la recette sans rappeler l'IA.
    const urlHash = hashUrl(job.source_url);
    const { data: cached } = await supabase
      .from("import_cache")
      .select("recipe_data, hit_count")
      .eq("url_hash", urlHash)
      .maybeSingle();

    if (cached?.recipe_data) {
      const cd = cached.recipe_data as Partial<CachedImport>;
      if (cd?.recipe?.title) {
        log.info("Cache hit, copying recipe without IA", { urlHash });

        const fakePost: FetchedPost = {
          platform: cd.platform ?? "instagram",
          mediaType: "image",
          mediaItems: [],
          caption: "",
          author: cd.author ?? undefined,
          authorHandle: cd.authorHandle ?? undefined,
          thumbnailUrl: cd.imageUrl ?? cd.thumbnailUrl ?? undefined,
        };

        const recipeId = await persistRecipe({
          userId: job.user_id,
          jobId,
          recipe: cd.recipe,
          post: fakePost,
          sourceUrl: job.source_url,
          coverImageBytes: null,
        });

        await supabase
          .from("import_cache")
          .update({
            hit_count: (cached.hit_count ?? 1) + 1,
            last_hit_at: new Date().toISOString(),
          })
          .eq("url_hash", urlHash);

        await updateImportStatus(jobId, "done", {
          recipe_id: recipeId,
          duration_ms: Date.now() - startedAt,
        });

        log.info("Job done from cache", {
          recipeId,
          durationMs: Date.now() - startedAt,
          title: cd.recipe.title,
        });

        await sendRecipeReadyPush(job.user_id, cd.recipe.title, recipeId);
        return;
      }
    }

    const provider = getSocialApiProvider();

    // 2. Fetch post via API tierce (avec retry réseau)
    log.info("Fetching post via provider", { provider: provider.name });
    const post = await pRetry(() => provider.fetchPost(job.source_url), {
      retries: 2,
      minTimeout: 800,
      factor: 2,
      onFailedAttempt: (err) => {
        log.warn("Provider attempt failed", { attempt: err.attemptNumber, msg: err.message });
        // Erreurs irrécupérables : on abort le retry
        if (/private|not found|404/i.test(err.message)) {
          throw new AbortError(err.message);
        }
      },
    });

    log.info("Post fetched", {
      mediaType: post.mediaType,
      items: post.mediaItems.length,
      captionLength: post.caption.length,
    });

    // Sauve le media_type pour debug + analytics
    await supabase.from("imports").update({ media_type: post.mediaType }).eq("id", jobId);

    // Cohérence plateforme : si l'URL était insta mais provider dit tiktok (ou vice-versa)
    if (post.platform !== job.source_platform) {
      log.warn("Platform mismatch", { detected: post.platform, urlSays: job.source_platform });
    }

    // 3. Dispatch vers le bon pipeline
    const output = await dispatchPipeline(post, { setStatus, log });

    if (!output.recipe) {
      log.warn("No recipe produced", { reason: output.reason });
      const userMessage = mapReasonToUserMessage(output.reason);
      await updateImportStatus(jobId, "failed", {
        error_code: output.reason ?? "no_recipe",
        error_message: userMessage,
        duration_ms: Date.now() - startedAt,
      });
      return;
    }

    // 4. Persiste
    const recipeId = await persistRecipe({
      userId: job.user_id,
      jobId,
      recipe: output.recipe,
      post,
      sourceUrl: job.source_url,
      coverImageBytes: output.coverImageBytes,
    });

    // 4.bis Cache URL communautaire (B5.4) — non bloquant
    try {
      const { data: persistedRecipe } = await supabase
        .from("recipes")
        .select("image_url")
        .eq("id", recipeId)
        .maybeSingle();

      const cachePayload: CachedImport = {
        recipe: output.recipe,
        platform: post.platform,
        author: post.author ?? null,
        authorHandle: post.authorHandle ?? null,
        thumbnailUrl: post.thumbnailUrl ?? null,
        imageUrl: persistedRecipe?.image_url ?? null,
      };

      await supabase.from("import_cache").upsert(
        {
          url_hash: hashUrl(job.source_url),
          source_url: normalizeUrl(job.source_url),
          source_platform: post.platform,
          recipe_data: cachePayload,
        },
        { onConflict: "url_hash" },
      );
    } catch (cacheErr) {
      log.warn("Cache write failed (non-blocking)", {
        error: cacheErr instanceof Error ? cacheErr.message : String(cacheErr),
      });
    }

    // 5. Mark done
    await updateImportStatus(jobId, "done", {
      recipe_id: recipeId,
      duration_ms: Date.now() - startedAt,
    });

    log.info("Job done", {
      recipeId,
      durationMs: Date.now() - startedAt,
      title: output.recipe.title,
    });

    // 6. Notif push (non bloquant)
    await sendRecipeReadyPush(job.user_id, output.recipe.title, recipeId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("Job failed with exception", { error: message });

    const userMessage = mapErrorToUserMessage(message);
    await updateImportStatus(jobId, "failed", {
      error_code: "exception",
      error_message: userMessage,
      duration_ms: Date.now() - startedAt,
    }).catch(() => undefined);
  }
}

// -----------------------------------------------------------------------------
// Mapping erreurs → messages user-friendly
// -----------------------------------------------------------------------------
function mapReasonToUserMessage(reason: string | undefined): string {
  if (!reason) return "L'import a échoué. Réessaie dans quelques instants.";
  if (reason.startsWith("video_too_long")) {
    return "Cette vidéo est trop longue (max 5 min). Essaie avec un Reel plus court.";
  }
  if (reason === "carousel_no_downloadable_media") {
    return "Impossible de télécharger les images de ce post. Le compte est peut-être privé.";
  }
  if (reason === "no_tool_use" || reason === "schema_invalid") {
    return "L'IA n'a pas réussi à structurer ce contenu. Essaie un autre post.";
  }
  if (reason.startsWith("unknown_tool")) {
    return "Erreur interne IA. Réessaie dans quelques instants.";
  }
  // reason = motif du tool no_recipe (texte Claude)
  return reason.length > 0 && reason.length < 200
    ? `L'IA n'a pas trouvé de recette : ${reason}`
    : "L'IA n'a pas trouvé de recette dans ce contenu.";
}

function mapErrorToUserMessage(error: string): string {
  if (/private|404|not found/i.test(error)) {
    return "Ce contenu est introuvable ou privé.";
  }
  if (/too large/i.test(error)) {
    return "Ce contenu est trop volumineux.";
  }
  if (/network|fetch|timeout/i.test(error)) {
    return "Problème réseau. Réessaie dans quelques instants.";
  }
  return "L'import a échoué. Réessaie dans quelques instants.";
}
