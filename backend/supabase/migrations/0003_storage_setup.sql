-- =============================================================================
-- RecetteBox V1.0 — Storage bucket pour les médias de recettes
-- =============================================================================
-- Bucket : recipe-media
-- Layout : recipe-media/{user_id}/{recipe_id}/{cover|thumb}.{jpg|webp}
-- Politique : lecture publique (URLs partagées dans l'app), écriture restreinte
--             au service_role uniquement (le worker upload les images).
-- =============================================================================

-- Création du bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-media',
  'recipe-media',
  true, -- public read
  10 * 1024 * 1024, -- 10 MB max par fichier
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lecture publique (n'importe qui avec l'URL peut voir l'image)
create policy "recipe_media_public_read"
  on storage.objects for select
  using (bucket_id = 'recipe-media');

-- Écriture : uniquement service_role (worker)
-- => pas de policy insert/update/delete pour anon/authenticated
-- Le user ne peut pas uploader directement, c'est toujours via le worker.
