// =============================================================================
// Client Supabase service_role (bypass RLS)
// =============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config.js";

export const supabase: SupabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
  },
);

// -----------------------------------------------------------------------------
// Helpers status d'un import
// -----------------------------------------------------------------------------
export type ImportStatus =
  | "pending"
  | "downloading"
  | "transcribing"
  | "extracting"
  | "structuring"
  | "done"
  | "failed";

export async function updateImportStatus(
  jobId: string,
  status: ImportStatus,
  extra: Partial<{
    error_message: string;
    error_code: string;
    recipe_id: string;
    media_type: string;
    cost_cents: number;
    duration_ms: number;
    attempt: number;
  }> = {},
) {
  const { error } = await supabase
    .from("imports")
    .update({ status, ...extra })
    .eq("id", jobId);
  if (error) {
    throw new Error(`updateImportStatus(${jobId}, ${status}) failed: ${error.message}`);
  }
}

// -----------------------------------------------------------------------------
// Upload média dans le bucket storage → renvoie l'URL publique
// -----------------------------------------------------------------------------
export async function uploadMedia(
  path: string,
  data: Uint8Array | Blob,
  contentType: string,
): Promise<string> {
  const { error } = await supabase.storage
    .from(config.SUPABASE_STORAGE_BUCKET)
    .upload(path, data, { contentType, upsert: true });
  if (error) {
    throw new Error(`uploadMedia(${path}) failed: ${error.message}`);
  }
  const { data: pub } = supabase.storage
    .from(config.SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(path);
  return pub.publicUrl;
}
