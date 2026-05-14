// =============================================================================
// Edge Function : POST /api/imports
// =============================================================================
// Reçoit { url } d'un utilisateur authentifié.
// 1. Authentifie l'user via le JWT Supabase
// 2. Détecte la plateforme (instagram | tiktok) ou refuse
// 3. Vérifie les quotas selon plan (free / premium)
// 4. Insère une ligne dans imports avec status='pending'
//    → Le worker Railway abonné via Realtime se réveille tout seul
// 5. Retourne { jobId, status }
// =============================================================================

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// -----------------------------------------------------------------------------
// Détection de plateforme
// -----------------------------------------------------------------------------
type Platform = "instagram" | "tiktok";

function detectPlatform(rawUrl: string): Platform | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (
    host === "instagram.com" ||
    host.endsWith(".instagram.com") ||
    host === "instagr.am"
  ) {
    return "instagram";
  }
  if (
    host === "tiktok.com" ||
    host.endsWith(".tiktok.com") ||
    host === "vm.tiktok.com" ||
    host === "vt.tiktok.com"
  ) {
    return "tiktok";
  }
  return null;
}

// -----------------------------------------------------------------------------
// Quotas (cohérents avec project_v1_pricing.md)
// -----------------------------------------------------------------------------
// Pivot V1.0 (13/05/2026) : free = 3 imports à vie, pas 3 / mois.
const QUOTA_FREE_LIFETIME = 3;
const QUOTA_PREMIUM_DISPLAYED = 30;
const QUOTA_PREMIUM_HARD_CAP_30D = 60;
const RATE_LIMIT_PREMIUM_AFTER_30_SECONDS = 30 * 60; // 1 import / 30 min au-delà de 30

type QuotaCheck =
  | { ok: true }
  | { ok: false; reason: string; code: string };

async function checkQuota(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<QuotaCheck> {
  const { data, error } = await supabase
    .from("user_import_quota")
    .select("plan, imports_lifetime, imports_last_30d, last_import_at")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { ok: false, reason: "Quota lookup failed", code: "QUOTA_LOOKUP_FAILED" };
  }

  const plan: "free" | "premium_monthly" | "premium_annual" = data.plan ?? "free";

  if (plan === "free") {
    if ((data.imports_lifetime ?? 0) >= QUOTA_FREE_LIFETIME) {
      return {
        ok: false,
        reason: `Tu as utilisé tes ${QUOTA_FREE_LIFETIME} imports gratuits. Passe en premium pour continuer.`,
        code: "QUOTA_FREE_REACHED",
      };
    }
    return { ok: true };
  }

  // Premium : hard cap 60 sur 30 jours glissants
  if ((data.imports_last_30d ?? 0) >= QUOTA_PREMIUM_HARD_CAP_30D) {
    return {
      ok: false,
      reason: "Limite atteinte (60/30j). Reviens au prochain cycle.",
      code: "QUOTA_PREMIUM_HARD_CAP",
    };
  }

  // Rate-limit doux entre 30 et 60
  if ((data.imports_last_30d ?? 0) >= QUOTA_PREMIUM_DISPLAYED) {
    const last = data.last_import_at ? new Date(data.last_import_at).getTime() : 0;
    const elapsed = (Date.now() - last) / 1000;
    if (elapsed < RATE_LIMIT_PREMIUM_AFTER_30_SECONDS) {
      const waitMin = Math.ceil((RATE_LIMIT_PREMIUM_AFTER_30_SECONDS - elapsed) / 60);
      return {
        ok: false,
        reason: `Tu as dépassé les 30 imports affichés ce mois. Patiente ~${waitMin} min avant le prochain.`,
        code: "QUOTA_PREMIUM_RATE_LIMIT",
      };
    }
  }

  return { ok: true };
}

// -----------------------------------------------------------------------------
// CORS
// -----------------------------------------------------------------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// -----------------------------------------------------------------------------
// Handler
// -----------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // 1. Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing Authorization header" }, 401);
  }

  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Unauthorized" }, 401);
  }
  const userId = userData.user.id;

  // 2. Body
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const url = body.url?.trim();
  if (!url) {
    return json({ error: "Missing 'url' field" }, 400);
  }

  // 3. Détection plateforme
  const platform = detectPlatform(url);
  if (!platform) {
    return json(
      {
        error: "URL non supportée. RecetteBox supporte Instagram et TikTok.",
        code: "UNSUPPORTED_PLATFORM",
      },
      400,
    );
  }

  // 4. Quotas (client service_role pour bypass RLS sur la vue)
  const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const quota = await checkQuota(supabaseService, userId);
  if (!quota.ok) {
    return json({ error: quota.reason, code: quota.code }, 429);
  }

  // 5. Insert job → le worker Railway abonné à Realtime se réveille
  const { data: importRow, error: insertError } = await supabaseService
    .from("imports")
    .insert({
      user_id: userId,
      source_url: url,
      source_platform: platform,
      status: "pending",
    })
    .select("id, status")
    .single();

  if (insertError || !importRow) {
    return json(
      { error: "Failed to enqueue import", details: insertError?.message },
      500,
    );
  }

  return json({
    jobId: importRow.id,
    status: importRow.status,
    platform,
  }, 201);
});
