-- =============================================================================
-- 0007_whisper_cache.sql
-- =============================================================================
-- B5.4 (cache imports) : separation du cache Whisper du cache des imports.
--
-- Avant : le module worker/src/modules/whisper.ts ecrivait ses transcriptions
-- dans public.import_cache, avec un format batard ({text, language,
-- durationSeconds}) qui ne correspondait pas a une recette structuree.
-- source_url etait detourne pour contenir le hash audio, source_platform
-- etait fixe en dur a 'instagram'. Cette collision empechait d'utiliser
-- import_cache pour son vrai objectif : cacher les recettes par hash d'URL
-- afin d'eviter de relancer le pipeline IA sur la meme video deja importee.
--
-- Apres : nouvelle table whisper_cache dediee aux transcriptions audio,
-- cle = hash sha256 du buffer audio, valeur = jsonb {text, language,
-- durationSeconds}. import_cache redevient utilisable proprement pour le
-- cache communautaire d'imports (cf. lookup ajoute dans run-import.ts).
--
-- RLS : aucun acces user direct, seul le service_role (worker) lit/ecrit.
-- =============================================================================

create table public.whisper_cache (
  url_hash text primary key,
  audio_data jsonb not null,
  hit_count int not null default 1,
  created_at timestamptz not null default now(),
  last_hit_at timestamptz not null default now()
);

comment on table public.whisper_cache is
  'Cache des transcriptions Whisper indexe par sha256 du buffer audio. Permet de ne pas re-payer Whisper si un job est relance avec le meme audio. Utilise par worker/src/modules/whisper.ts.';

comment on column public.whisper_cache.url_hash is
  'sha256(audioBytes) en hex. Cle primaire. Le nom "url_hash" est conserve pour homogeneite avec import_cache, meme si c''est un hash audio.';

comment on column public.whisper_cache.audio_data is
  'jsonb { text: string, language: string|null, durationSeconds: number }';

alter table public.whisper_cache enable row level security;
-- pas de policy = aucun acces via anon/authenticated, seul service_role passe.
