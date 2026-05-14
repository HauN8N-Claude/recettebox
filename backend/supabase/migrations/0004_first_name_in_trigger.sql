-- =============================================================================
-- 0004_first_name_in_trigger.sql
-- =============================================================================
-- Permet a handle_new_user() de lire le prenom envoye par l'app dans
-- raw_user_meta_data->>'first_name' (options.data.first_name cote SDK)
-- et de le poser dans profiles.first_name des la creation du compte.
--
-- Avant : profiles.first_name etait toujours NULL a la creation, il fallait
-- un UPDATE cote client juste apres le signup pour le renseigner.
-- Apres : un seul aller-retour, le prenom est garanti des l'insertion.
--
-- Les comptes existants ne sont pas affectes (la fonction ne tourne qu'a
-- chaque nouveau INSERT dans auth.users).
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data->>'first_name'), '')
  );

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$;
