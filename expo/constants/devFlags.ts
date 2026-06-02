/**
 * ⚠️ DEV FLAGS ⚠️
 *
 * Ces flags servent à débloquer l'app pour des tests sans frein (skip login,
 * injection de fausses données, etc.).
 *
 * 🚨 OBLIGATOIRE AVANT TOUT BUILD EAS (preview/production) :
 *    METS TOUS LES FLAGS À `false` ET CONFIRME EN PRENANT 5 SECONDES.
 *
 * Sinon des builds publics pourraient être livrés avec l'auth bypassée et
 * des données fake, ce qui serait catastrophique côté sécurité et UX.
 */

/**
 * Si true : au démarrage, on injecte une fausse session sans appeler Supabase.
 * Le `RootGate` voit une session active et envoie direct sur les tabs (skip
 * Login / Onboarding).
 *
 * Le user injecté est `BYPASS_USER` ci-dessous. Comme son ID n'existe pas en
 * BD, les SELECT (recipes, profiles, subscriptions, imports…) retourneront
 * vides ou planteront silencieusement — pas grave pour explorer l'UI.
 *
 * Pour revenir au mode normal : remets à `false`, relance Expo, vide les
 * données de l'app si besoin (AsyncStorage garde la fake session sinon).
 */
export const BYPASS_AUTH = false; // Doit rester `false` pour tout build EAS (preview/production).

/**
 * Si true : l'onboarding tourne NORMALEMENT (contrairement à BYPASS_AUTH qui le
 * saute), mais à la fin — au lieu de basculer vers le signup/login — on entre en
 * session invitée (fake user) et on atterrit direct sur les tabs. Permet de
 * tester « onboarding complet + accueil » sans créer de compte ni toucher à l'auth.
 *
 * Comme la session est factice, les SELECT Supabase (recipes, profile…) seront
 * vides (RLS), mais l'UI est navigable. À remettre à `false` avant tout build EAS.
 *
 * NB : l'onboarding ne se rejoue que si `isOnboarded` est false (AsyncStorage).
 * Sur Expo Go fraîchement installé c'est le cas ; sinon, vide les données de l'app.
 */
export const SKIP_LOGIN_AFTER_ONBOARDING = false; // TEMP — test onboarding+accueil sans auth.

/**
 * Fake user injecté quand `BYPASS_AUTH = true`. L'UUID est un UUID nul valide
 * (n'existera jamais en BD). Le `first_name` est utilisé par l'écran Profil
 * (avatar + nom).
 */
export const BYPASS_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "guest@local.dev",
  first_name: "Camille",
} as const;
