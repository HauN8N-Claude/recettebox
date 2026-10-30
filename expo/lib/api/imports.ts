/**
 * Déclenche un import de recette côté serveur.
 *
 * Appelle l'Edge Function `imports` (backend/supabase/functions/imports) avec
 * l'URL partagée + le jeton de l'utilisateur connecté. Le serveur crée un job
 * (table `imports`, status=pending) et le worker Railway le traite. La réponse
 * contient le `jobId` → l'app ouvre ensuite l'écran d'attente
 * `/import/processing/[jobId]` qui suit la progression en temps réel.
 */
import { supabase } from "@/lib/supabase";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

export type StartImportResult =
  | { ok: true; jobId: string }
  | { ok: false; code: string; message: string };

export async function startImport(url: string): Promise<StartImportResult> {
  if (!API_BASE) {
    return {
      ok: false,
      code: "NO_API",
      message: "Configuration serveur manquante.",
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return {
      ok: false,
      code: "NO_AUTH",
      message: "Tu dois être connecté pour importer une recette.",
    };
  }

  try {
    const res = await fetch(`${API_BASE}/imports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      jobId?: string;
      error?: string;
      code?: string;
    };

    if (!res.ok || !body.jobId) {
      return {
        ok: false,
        code: body.code ?? `HTTP_${res.status}`,
        message: body.error ?? "L'import a échoué. Réessaie.",
      };
    }

    return { ok: true, jobId: body.jobId };
  } catch {
    return {
      ok: false,
      code: "NETWORK",
      message: "Connexion impossible. Vérifie internet et réessaie.",
    };
  }
}
