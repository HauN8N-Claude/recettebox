/**
 * Écoute les partages entrants (Instagram / TikTok → Partager → RecetteBox) via
 * expo-share-intent, puis déclenche le vrai import et ouvre l'écran d'attente.
 *
 * Monté une seule fois dans app/_layout.tsx, et seulement sur mobile (l'extension
 * de partage n'existe pas sur le web).
 *
 * Gap #8 : si le partage arrive AVANT connexion, on mémorise le lien
 * (pendingImportStore) et on reprend l'import automatiquement une fois connecté.
 */
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useShareIntent } from "expo-share-intent";

import { useAuthStore } from "@/stores/authStore";
import { usePendingImportStore } from "@/stores/pendingImportStore";
import { startImport } from "@/lib/api/imports";

// Fallback : si le partage arrive sous forme de texte (pas d'URL directe),
// on récupère le premier lien http(s) trouvé dedans.
function firstUrl(text?: string | null): string | null {
  if (!text) return null;
  const m = text.match(/https?:\/\/[^\s]+/i);
  return m ? m[0] : null;
}

export function ShareIntentHandler() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({
    resetOnBackground: false,
  });
  const session = useAuthStore((s) => s.session);
  const ready = useAuthStore((s) => s.ready);
  const pendingUrl = usePendingImportStore((s) => s.url);
  const setPendingUrl = usePendingImportStore((s) => s.setUrl);
  const clearPendingUrl = usePendingImportStore((s) => s.clear);
  const router = useRouter();
  const busy = useRef(false);

  // Lance un import puis ouvre l'écran d'attente (ou paywall / erreur).
  const runImport = async (url: string) => {
    const result = await startImport(url);
    if (result.ok) {
      router.push(`/import/processing/${result.jobId}`);
    } else if (result.code.startsWith("QUOTA")) {
      router.push("/paywall");
    } else {
      Alert.alert("Import impossible", result.message);
    }
  };

  // 1) Partage entrant.
  useEffect(() => {
    if (!ready || !hasShareIntent || busy.current) return;

    const url = shareIntent?.webUrl ?? firstUrl(shareIntent?.text);
    if (!url) {
      resetShareIntent();
      return;
    }

    // Pas connecté : on mémorise le lien et on laisse RootGate router vers
    // l'onboarding / la connexion. L'import reprendra une fois la session active.
    if (!session) {
      setPendingUrl(url);
      resetShareIntent();
      return;
    }

    busy.current = true;
    (async () => {
      try {
        await runImport(url);
      } finally {
        resetShareIntent();
        busy.current = false;
      }
    })();
  }, [ready, hasShareIntent, shareIntent, session, router, resetShareIntent]);

  // 2) Reprise après connexion : un lien était en attente et la session arrive.
  useEffect(() => {
    if (!ready || !session || !pendingUrl || busy.current) return;
    busy.current = true;
    const url = pendingUrl;
    (async () => {
      try {
        clearPendingUrl();
        await runImport(url);
      } finally {
        busy.current = false;
      }
    })();
  }, [ready, session, pendingUrl, router]);

  return null;
}
