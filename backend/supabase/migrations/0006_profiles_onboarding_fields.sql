-- =============================================================================
-- 0006_profiles_onboarding_fields.sql
-- =============================================================================
-- Sprint 1 / B6.1 (14/05/2026) : ajoute les colonnes necessaires pour
-- persister les reponses d'onboarding (Zustand store -> Supabase).
--
-- Avant : la table profiles ne contenait que id, email, first_name,
-- household_size, is_premium. Toutes les reponses d'onboarding (allergies,
-- exclusions, restrictions, frequence, profil culinaire, motivations...)
-- restaient en local via AsyncStorage. Perte des donnees au changement de
-- device / reinstall, et impossible d'utiliser le profil cote worker pour
-- filtrer / suggerer.
--
-- Apres : 5 colonnes typees pour les champs critiques (filtrage IA, sizing
-- portions) + 1 jsonb "onboarding_raw" fourre-tout pour le reste du store
-- (signal produit / analytics) + un timestamp de fin d'onboarding pour B6.3
-- (decider si on doit hydrater le store local depuis la BD).
--
-- Strategie choisie : option C (minimal + JSON fourre-tout). Permet d'ajouter
-- du gating produit plus tard sans nouvelle migration.
--
-- RLS deja en place via migration 0002 (profiles_select_own / update_own).
-- Trigger handle_new_user (0004) compatible : toutes les nouvelles colonnes
-- ont un default ou sont nullable.
-- =============================================================================

alter table public.profiles
  add column if not exists allergies jsonb not null default '[]'::jsonb,
  add column if not exists custom_exclusions text[] not null default '{}',
  add column if not exists dietary_restrictions text[] not null default '{}',
  add column if not exists household_label text,
  add column if not exists cooking_time text,
  add column if not exists onboarding_raw jsonb not null default '{}'::jsonb,
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.profiles.allergies is
  'Liste des allergies declarees a l''onboarding. JSON pour evolution future (ex: [{key, severity}]). Source: store.allergies (enum: aucune|fruits-a-coque|arachides|lactose|oeufs|poisson-crustaces|soja).';

comment on column public.profiles.custom_exclusions is
  'Saisies libres d''aliments a eviter (ex: "coriandre", "champignons"). Source: store.customExclusions.';

comment on column public.profiles.dietary_restrictions is
  'Regimes alimentaires (vegetarien, vegan, halal, sans gluten...). Source: store.q8_restrictions.';

comment on column public.profiles.household_label is
  'Libelle du foyer tel que choisi a l''onboarding (seul|duo|famille|plus). Conserve a cote de household_size (int) pour garder la nuance "famille" vs "4 personnes". household_size est derive cote app a l''upsert.';

comment on column public.profiles.cooking_time is
  'Preference de duree de cuisine (express|semaine|confort|afond). Source: store.cookingTime. Utilise pour filtrer les recettes proposees.';

comment on column public.profiles.onboarding_raw is
  'Fourre-tout JSON pour les autres reponses du store onboarding (q1_cookingDuration, q2_motivation, q6_frequency, q10_objectives, q11_frictions/blockers, q12_sundayMood, platforms, savesPerWeek, cookedRatio, userProfile...). Pas de schema strict pour permettre evolution sans migration.';

comment on column public.profiles.onboarding_completed_at is
  'Timestamp de fin d''onboarding (set par syncOnboardingProfile cote app). Utilise par B6.3 pour decider si le store local doit etre hydrate depuis la BD au demarrage.';
