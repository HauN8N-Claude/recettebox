/**
 * Service : synchronisation du profil onboarding vers Supabase.
 *
 * Sprint 1 / B6.2 (14/05/2026).
 *
 * Pourquoi : aujourd'hui les réponses d'onboarding sont en local AsyncStorage
 * uniquement (Zustand persisté). Sans sync vers Supabase, on perd les données
 * au changement de device / réinstall, et le worker backend n'a pas accès aux
 * allergies pour filtrer les recettes.
 *
 * Quand : appelé depuis signup.tsx juste après la création de compte réussie,
 * en fire-and-forget (n'awaite pas avant la redirection vers les tabs). Si ça
 * échoue, B6.3 rejouera le sync au prochain démarrage (en regardant
 * profiles.onboarding_completed_at).
 *
 * Quoi : upsert (en réalité UPDATE) sur public.profiles avec :
 *   - 5 colonnes typées (allergies, custom_exclusions, dietary_restrictions,
 *     household_label, cooking_time) + household_size dérivé,
 *   - 1 colonne jsonb fourre-tout (onboarding_raw) pour le reste du store,
 *   - 1 timestamp onboarding_completed_at.
 *
 * Voir migration recettebox-backend/supabase/migrations/0006_profiles_onboarding_fields.sql
 * pour le schéma cible.
 */
import { supabase } from "@/lib/supabase";
import useOnboardingStore, {
  type OnboardingAnswers,
} from "@/stores/onboardingStore";

// Dérivation du label foyer (côté UX) vers un int (côté BD pour sizing portions).
// "plus" = 6 par convention (5+ personnes → on dimensionne pour 6).
const HOUSEHOLD_SIZE_MAP: Record<string, number> = {
  seul: 1,
  duo: 2,
  famille: 4,
  plus: 6,
};

type ProfileUpsertPayload = {
  allergies: OnboardingAnswers["allergies"];
  custom_exclusions: string[];
  dietary_restrictions: string[];
  household_label: string | null;
  household_size: number;
  cooking_time: string | null;
  onboarding_raw: Record<string, unknown>;
  onboarding_completed_at: string;
};

function buildProfilePayload(answers: OnboardingAnswers): ProfileUpsertPayload {
  const householdSize = answers.q9_household
    ? HOUSEHOLD_SIZE_MAP[answers.q9_household] ?? 1
    : 1;

  return {
    allergies: answers.allergies,
    custom_exclusions: answers.customExclusions,
    dietary_restrictions: answers.q8_restrictions,
    household_label: answers.q9_household,
    household_size: householdSize,
    cooking_time: answers.cookingTime,
    // Fourre-tout : les réponses qui n'ont pas (encore) de colonne dédiée.
    // On préfère les versions normalisées (platforms, savesPerWeek, cookedRatio,
    // blockers) aux versions brutes (q3_sources, q4_sources, q4_weeklySaved,
    // q5_cooked_ratio, q11_frictions) — c'est ce que consomme le reste de l'app.
    // Champs intentionnellement omis (transitoires UI ou doublons) :
    //   q3_sources_demo, q15_pastedUrl, selectedSources, currentDemoTrack,
    //   isOnboarded, q14_firstName (déjà en BD via trigger handle_new_user),
    //   q3_sources, q4_sources, q4_weeklySaved, q5_cooked_ratio, q11_frictions.
    onboarding_raw: {
      q1_cookingDuration: answers.q1_cookingDuration,
      q2_motivation: answers.q2_motivation,
      q6_frequency: answers.q6_frequency,
      q7_slot: answers.q7_slot,
      q10_objectives: answers.q10_objectives,
      q12_sundayMood: answers.q12_sundayMood,
      blockers: answers.blockers,
      platforms: answers.platforms,
      savesPerWeek: answers.savesPerWeek,
      cookedRatio: answers.cookedRatio,
      userProfile: answers.userProfile,
      q4_totalRecipes: answers.q4_totalRecipes,
      q5_cookedRecipes: answers.q5_cookedRecipes,
    },
    onboarding_completed_at: new Date().toISOString(),
  };
}

const RETRY_DELAYS_MS = [0, 1000, 2000, 4000] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type SyncResult = { ok: true } | { ok: false; reason: string };

/**
 * Upsert le profil onboarding sur Supabase, avec retry 3x backoff.
 *
 * - Silencieux côté UX (aucune popup, console warn/error uniquement).
 * - Ne bloque jamais l'utilisateur : si tout échoue, on log et on retourne.
 *   B6.3 rejouera le sync au prochain démarrage.
 *
 * Retourne { ok: true } si l'UPDATE a réussi, { ok: false, reason } sinon.
 * Le retour est utilisé pour debug / télémétrie, pas pour le contrôle de flux UI.
 */
export async function syncOnboardingProfile(
  answers: OnboardingAnswers,
): Promise<SyncResult> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.warn("[syncOnboardingProfile] getSession error", sessionError.message);
    return { ok: false, reason: "session_error" };
  }
  const userId = sessionData.session?.user?.id;
  if (!userId) {
    console.warn("[syncOnboardingProfile] skip — pas de session active");
    return { ok: false, reason: "no_session" };
  }

  const payload = buildProfilePayload(answers);

  let lastErrorMessage = "unknown";
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (RETRY_DELAYS_MS[attempt] > 0) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }

    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId);

    if (!error) {
      return { ok: true };
    }

    lastErrorMessage = error.message;
    console.warn(
      `[syncOnboardingProfile] attempt ${attempt + 1}/${RETRY_DELAYS_MS.length} failed:`,
      error.message,
    );
  }

  console.error(
    "[syncOnboardingProfile] all attempts failed:",
    lastErrorMessage,
  );
  return { ok: false, reason: lastErrorMessage };
}

// ============================================================================
// B6.3 — Hydratation au démarrage
// ============================================================================
// À chaque démarrage / login, on fetch le profil et on décide :
//   - Si store local vide ET BD a un profil sync → on hydrate le store local.
//   - Si store local onboardé ET BD pas sync → on re-rejoue le sync (B6.2 a foiré).
//   - Sinon → no-op.
// ============================================================================

type RemoteProfile = {
  allergies: OnboardingAnswers["allergies"] | null;
  custom_exclusions: string[] | null;
  dietary_restrictions: string[] | null;
  household_label: string | null;
  cooking_time: string | null;
  onboarding_raw: Record<string, unknown> | null;
  onboarding_completed_at: string | null;
};

const PROFILE_COLUMNS =
  "allergies, custom_exclusions, dietary_restrictions, household_label, cooking_time, onboarding_raw, onboarding_completed_at";

async function fetchProfile(userId: string): Promise<RemoteProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[fetchProfile] error:", error.message);
    return null;
  }
  return (data as RemoteProfile | null) ?? null;
}

/**
 * Reconstruit un Partial<OnboardingAnswers> depuis un profil distant.
 * Le champ onboarding_raw est un fourre-tout JSON (cf. migration 0006) qu'on
 * recolle clé par clé dans le store. Les colonnes typées priment sur le JSON.
 */
function profileToStoreAnswers(remote: RemoteProfile): Partial<OnboardingAnswers> {
  const raw = (remote.onboarding_raw ?? {}) as Partial<OnboardingAnswers>;
  return {
    ...raw,
    allergies: remote.allergies ?? [],
    customExclusions: remote.custom_exclusions ?? [],
    q8_restrictions: remote.dietary_restrictions ?? [],
    q9_household: (remote.household_label as OnboardingAnswers["q9_household"]) ?? null,
    cookingTime: (remote.cooking_time as OnboardingAnswers["cookingTime"]) ?? null,
  };
}

export type HydrateResult =
  | { hydrated: true }
  | { hydrated: false; reason: "no_session" | "no_remote_profile" | "already_onboarded" | "remote_not_synced" | "fetch_error" };

/**
 * Hydrate le store onboarding local depuis la BD si nécessaire.
 *
 * No-op si :
 *   - Pas de session active.
 *   - Store local déjà marqué `isOnboarded = true` (on respecte le local — la
 *     resynchronisation 2-way device <-> device sera traitée en V1.0.1 via P2.3).
 *   - BD n'a pas de profil sync (onboarding_completed_at null) → l'user n'a
 *     jamais terminé l'onboarding, RootGate l'enverra sur /onboarding.
 *
 * Sinon : copie les valeurs distantes dans le store + marque isOnboarded = true.
 * RootGate verra le store passer à `isOnboarded = true` et redirigera vers les tabs.
 */
export async function hydrateOnboardingFromProfile(): Promise<HydrateResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) {
    return { hydrated: false, reason: "no_session" };
  }

  // Respect du local : si le store dit déjà onboarded, on ne touche pas.
  if (useOnboardingStore.getState().isOnboarded) {
    return { hydrated: false, reason: "already_onboarded" };
  }

  const remote = await fetchProfile(userId);
  if (!remote) {
    return { hydrated: false, reason: "no_remote_profile" };
  }
  if (!remote.onboarding_completed_at) {
    return { hydrated: false, reason: "remote_not_synced" };
  }

  useOnboardingStore.getState().hydrateFromProfile(profileToStoreAnswers(remote));
  return { hydrated: true };
}

/**
 * Re-rejoue syncOnboardingProfile si le store local est onboardé mais que la BD
 * n'a pas encore reçu le sync (échec réseau au moment du signup).
 *
 * No-op si :
 *   - Pas de session active.
 *   - Store local pas onboardé (rien à sync).
 *   - BD a déjà reçu le sync (onboarding_completed_at non null).
 *
 * Sinon : appelle syncOnboardingProfile() avec l'état actuel du store.
 */
export async function resyncIfNeeded(): Promise<SyncResult | { ok: false; reason: "no_session" | "not_onboarded_locally" | "already_synced" }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) {
    return { ok: false, reason: "no_session" };
  }

  const storeState = useOnboardingStore.getState();
  if (!storeState.isOnboarded) {
    return { ok: false, reason: "not_onboarded_locally" };
  }

  const remote = await fetchProfile(userId);
  if (remote?.onboarding_completed_at) {
    return { ok: false, reason: "already_synced" };
  }

  console.log("[resyncIfNeeded] BD pas sync, on rejoue syncOnboardingProfile");
  return syncOnboardingProfile(storeState);
}
