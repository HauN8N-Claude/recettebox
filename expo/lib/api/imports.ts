/**
 * Service : déclenchement d'un import de recette via l'Edge Function `imports`.
 *
 * Sprint 2 / N2.1 — handler du deep link Share Extension (`recettebox://import?url=`).
 *
 * Contrat de l'Edge Function (backend/supabase/functions/imports/index.ts) :
 *   POST {SUPABASE_URL}/functions/v1/imports
 *   Headers : Authorization: Bearer <access_token>, apikey: <anon>, Content-Type
 *   Body    : { url }
 *   201     : { jobId, status, platform }
 *   400     : { error, code: "UNSUPPORTED_PLATFORM" } (ou body invalide / url manquante)
 *   401     : { error } (JWT manquant / invalide)
 *   429     : { error, code: "QUOTA_FREE_REACHED" | "QUOTA_PREMIUM_HARD_CAP"
 *                              | "QUOTA_PREMIUM_RATE_LIMIT" | "QUOTA_LOOKUP_FAILED" }
 *   500     : { error }
 *
 * Le worker Railway abonné à Realtime sur la table `imports` se réveille tout
 * seul à l'INSERT — côté app on n'a plus qu'à suivre `/import/processing/{jobId}`.
 */
import { useAuthStore } from "@/stores/authStore";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export type ImportErrorCode =
  | "UNSUPPORTED_PLATFORM"
  | "QUOTA_FREE_REACHED"
  | "QUOTA_PREMIUM_HARD_CAP"
  | "QUOTA_PREMIUM_RATE_LIMIT"
  | "QUOTA_LOOKUP_FAILED"
  | "UNAUTHENTICATED"
  | "BAD_REQUEST"
  | "NETWORK"
  | "SERVER"
  | "UNKNOWN";

export class ImportError extends Error {
  code: ImportErrorCode;
  constructor(code: ImportErrorCode, message: string) {
    super(message);
    this.name = "ImportError";
    this.code = code;
  }
}

/** `true` si le code correspond à un blocage de quota (→ proposer le paywall). */
export function isQuotaError(code: ImportErrorCode): boolean {
  return code.startsWith("QUOTA_");
}

export interface CreatedImport {
  jobId: string;
  status: string;
  platform: "instagram" | "tiktok";
}

/**
 * Extrait et nettoie une URL depuis le texte partagé par la Share Extension.
 * Tolère les préfixes du type « Check this out: https://… » (cas TikTok Android).
 * cf. SHARE-EXTENSION-PLAN.md annexe A4. À re-valider avec les payloads réels (N0).
 */
export function extractSharedUrl(input: string | undefined | null): string | null {
  if (!input) return null;
  const match = input.match(/(https?:\/\/[^\s]+)/i);
  if (!match) return null;
  // Nettoie la ponctuation de fin parfois collée à l'URL.
  return match[1].replace(/[).,;]+$/, "");
}

/**
 * Appelle l'Edge Function `imports` pour enfiler un job d'import.
 * Lève une `ImportError` typée en cas d'échec (gérée par l'écran appelant).
 */
export async function createImport(url: string): Promise<CreatedImport> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new ImportError(
      "SERVER",
      "Configuration Supabase manquante (EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY).",
    );
  }

  const accessToken = useAuthStore.getState().session?.access_token;
  if (!accessToken) {
    throw new ImportError("UNAUTHENTICATED", "Aucune session active.");
  }

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/imports`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
  } catch {
    throw new ImportError(
      "NETWORK",
      "Pas de connexion. Réessaie quand tu auras du réseau.",
    );
  }

  let payload: { jobId?: string; status?: string; platform?: string; error?: string; code?: string } = {};
  try {
    payload = await res.json();
  } catch {
    // Réponse non-JSON (rare) — on retombe sur un message générique plus bas.
  }

  if (res.ok) {
    if (!payload.jobId) {
      throw new ImportError("SERVER", "Réponse serveur inattendue (jobId manquant).");
    }
    return {
      jobId: payload.jobId,
      status: payload.status ?? "pending",
      platform: (payload.platform as CreatedImport["platform"]) ?? "instagram",
    };
  }

  // Mappe le statut HTTP + code métier vers une ImportError typée.
  if (res.status === 401) {
    throw new ImportError("UNAUTHENTICATED", payload.error ?? "Session expirée.");
  }
  if (res.status === 400) {
    const code: ImportErrorCode =
      payload.code === "UNSUPPORTED_PLATFORM" ? "UNSUPPORTED_PLATFORM" : "BAD_REQUEST";
    throw new ImportError(
      code,
      payload.error ?? "On supporte Instagram et TikTok pour le moment.",
    );
  }
  if (res.status === 429) {
    const known: ImportErrorCode[] = [
      "QUOTA_FREE_REACHED",
      "QUOTA_PREMIUM_HARD_CAP",
      "QUOTA_PREMIUM_RATE_LIMIT",
      "QUOTA_LOOKUP_FAILED",
    ];
    const code = (known as string[]).includes(payload.code ?? "")
      ? (payload.code as ImportErrorCode)
      : "QUOTA_FREE_REACHED";
    throw new ImportError(code, payload.error ?? "Limite d'imports atteinte.");
  }

  throw new ImportError("SERVER", payload.error ?? "Erreur côté serveur. Réessaie.");
}
