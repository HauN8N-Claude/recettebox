// =============================================================================
// Edge Function : POST /delete-account
// =============================================================================
// Supprime définitivement le compte de l'utilisateur authentifié.
// 1. Authentifie l'utilisateur via le JWT Supabase.
// 2. Supprime tous ses fichiers Storage (bucket recipe-media, préfixe userId/).
// 3. Supprime le user dans auth.users → cascade SQL sur :
//    profiles, subscriptions, recipes (+ ingredients/steps/media), imports,
//    push_tokens (toutes les FK pointent vers auth.users avec on delete cascade).
// =============================================================================

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STORAGE_BUCKET = Deno.env.get("SUPABASE_STORAGE_BUCKET") ?? "recipe-media";

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

async function deleteUserStorageFiles(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<void> {
  // Convention de chemin : les fichiers utilisateur sont sous `userId/...`
  // dans le bucket recipe-media. On liste, puis on supprime en batch.
  const { data: files, error: listError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(userId, { limit: 1000 });

  if (listError) {
    console.log("[delete-account] storage list error :", listError.message);
    return; // on continue, la suppression du user fera le travail DB principal
  }

  if (!files || files.length === 0) return;

  const paths = files.map((f) => `${userId}/${f.name}`);
  const { error: removeError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(paths);

  if (removeError) {
    console.log("[delete-account] storage remove error :", removeError.message);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // 1. Authentification via le JWT envoyé par l'app
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

  // 2. Client admin (service role) pour storage + auth.admin
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // 3. Suppression des fichiers Storage (best effort, ne bloque pas la suite)
  await deleteUserStorageFiles(supabaseAdmin, userId);

  // 4. Suppression du user dans auth.users → cascade SQL sur tout le reste
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    userId,
  );

  if (deleteError) {
    console.log("[delete-account] delete user error :", deleteError.message);
    return json(
      { error: "Failed to delete account", details: deleteError.message },
      500,
    );
  }

  return json({ ok: true }, 200);
});
