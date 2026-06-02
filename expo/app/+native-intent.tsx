/**
 * Routage des deep links / liens entrants au niveau natif (Expo Router).
 *
 * Sprint 2 / N2.0–N2.1 : deux entrées mènent à l'écran `app/import.tsx`.
 *
 *  1. Deep link direct `recettebox://import?url=…` (lien manuel / tests E2E).
 *  2. La Share Extension `expo-share-intent` rouvre l'app via
 *     `recettebox://dataUrl=<scheme>ShareKey#<type>` (cf.
 *     ShareExtensionViewController.swift du plugin).
 *
 * ⚠️ Sécurité : `path` est une entrée INTER-APP non fiable (n'importe quelle app
 *     ou page web peut ouvrir notre scheme). On ne renvoie JAMAIS le path brut
 *     comme cible de navigation (open-redirect / injection de route) : on
 *     canonicalise vers `/import` et on ne réattache qu'une URL http(s) validée.
 *
 * ⚠️ Donnée partagée : avec expo-share-intent elle N'arrive PAS en query param ;
 *     elle est lue côté natif via le contexte `useShareIntentContext()`. Ce
 *     fichier ne fait donc QUE router vers `/import` ; la lecture de l'URL
 *     partagée se fait dans `import.tsx` (N2.1 — ShareIntentProvider câblé au
 *     _layout). Voir SHARE-EXTENSION-PLAN.md.
 *
 * Tout le reste est ramené à l'accueil (comportement historique).
 */
import { getShareExtensionKey } from "expo-share-intent";

// Résolu une seule fois : évite qu'un throw runtime (scheme non encore résolu) ne
// soit relancé à chaque deep link. Vide si indisponible → la branche Share
// Extension est simplement ignorée (le routage direct continue de marcher).
let SHARE_EXTENSION_KEY = "";
try {
  SHARE_EXTENSION_KEY = getShareExtensionKey();
} catch {
  SHARE_EXTENSION_KEY = "";
}

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    // 1. Deep link direct `import?url=…` ou `/import?url=…` selon la plateforme.
    //    Branche bon marché vérifiée en premier (indépendante de la clé).
    if (/(^|\/)import(\?|$|\/)/.test(path)) {
      return buildImportPath(path);
    }
    // 2. Deep link de la Share Extension : `…dataUrl=recetteboxShareKey#weburl`.
    if (SHARE_EXTENSION_KEY && path.includes(`dataUrl=${SHARE_EXTENSION_KEY}`)) {
      return "/import";
    }
  } catch {
    // Path malformé → fallback accueil.
  }
  return "/";
}

/**
 * Canonicalise un deep link `import` vers `/import`, en ne conservant qu'un
 * paramètre `url` http(s) valide. Parsing volontairement sans `URL`/
 * `URLSearchParams` (non garantis dans le runtime natif-intent précoce).
 */
function buildImportPath(path: string): string {
  const match = path.match(/[?&]url=([^&#]+)/);
  if (match) {
    let url = match[1];
    try {
      url = decodeURIComponent(url);
    } catch {
      // garde la valeur brute si le décodage échoue
    }
    if (/^https?:\/\//i.test(url)) {
      return `/import?url=${encodeURIComponent(url)}`;
    }
  }
  return "/import";
}
