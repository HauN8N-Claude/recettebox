/**
 * Routage des deep links / liens entrants au niveau natif (Expo Router).
 *
 * Sprint 2 / N2.1 : on laisse passer le deep link de la Share Extension
 * (`recettebox://import?url=…`) vers l'écran `app/import.tsx`. Tout le reste est
 * ramené à l'accueil (comportement historique, évite les routes inattendues).
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    // `path` ressemble à `import?url=…` ou `/import?url=…` selon la plateforme.
    if (/(^|\/)import(\?|$|\/)/.test(path)) {
      return path.startsWith("/") ? path : `/${path}`;
    }
  } catch {
    // Path malformé → fallback accueil.
  }
  return "/";
}
