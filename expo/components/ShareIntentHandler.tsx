/**
 * Écoute les partages entrants (Instagram / TikTok → Partager → RecetteBox) via
 * expo-share-intent, puis ouvre IMMÉDIATEMENT l'écran de chargement.
 *
 * Monté une seule fois dans app/_layout.tsx, et seulement sur mobile (l'extension
 * de partage n'existe pas sur le web).
 *
 * Fix (bug "partage → écran principal au lieu du chargement") :
 *   Avant, on faisait `await startImport(url)` AVANT de naviguer. Pendant cet
 *   appel réseau, RootGate affichait la home → flash de l'écran principal.
 *   Maintenant on se contente de mémoriser le lien puis d'ouvrir tout de suite
 *   `/import/processing/pending`. C'est CET écran qui déclenche l'import et
 *   bascule vers le vrai jobId une fois le job créé.
 *
 * Gap #8 : si le partage arrive AVANT connexion, le lien reste mémorisé
 * (pendingImportStore) et l'ouverture se fait automatiquement une fois connecté.
 */
import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useShareIntent } from "expo-share-intent";

import { useAuthStore } from "@/stores/authStore";
import { usePendingImportStore } from "@/stores/pendingImportStore";

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
  const router = useRouter();
  const launching = useRef(false);

  // 1) Capture d'un partage entrant : on mémorise juste le lien.
  //    (Pas d'appel réseau ici → pas de latence avant la navigation.)
  useEffect(() => {
    if (!ready || !hasShareIntent) return;
    const url = shareIntent?.webUrl ?? firstUrl(shareIntent?.text);
    if (url) setPendingUrl(url);
    resetShareIntent();
  }, [ready, hasShareIntent, shareIntent, setPendingUrl, resetShareIntent]);

  // 2) Dès qu'un lien est en attente ET qu'une session est active, on ouvre
  //    immédiatement l'écran de chargement. L'import est lancé par cet écran
  //    (route jobId = "pending"), qui bascule ensuite vers le vrai jobId.
  //    → L'utilisateur voit l'écran de chargement dès la première frame, sans
  //    passer par la home.
  useEffect(() => {
    if (!ready || !session || !pendingUrl || launching.current) return;
    launching.current = true;
    router.push("/import/processing/pending");
    // On relâche le verrou après la navigation : le store sera vidé par
    // l'écran de chargement, donc cet effet ne se redéclenchera pas tout seul.
    const t = setTimeout(() => {
      launching.current = false;
    }, 1200);
    return () => clearTimeout(t);
  }, [ready, session, pendingUrl, router]);

  return null;
}
