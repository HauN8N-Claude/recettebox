-- =============================================================================
-- DEV-UNSEED.sql
-- =============================================================================
-- Cleanup du seed dev (DEV-SEED.sql). Supprime toutes les recettes du user le
-- plus récemment créé. La cascade SQL supprime aussi recipe_ingredients,
-- recipe_steps, recipe_media.
--
-- USAGE :
--   1. Coller ce SQL dans https://supabase.com/dashboard/project/drymgrccydkntskrpjgu/sql/new
--   2. Run.
--
-- ⚠️ Supprime TOUTES les recettes du user (pas seulement celles du seed). Si tu
-- avais des recettes réelles en plus, elles seraient supprimées aussi.
-- =============================================================================

do $$
declare
  v_user_id uuid;
  v_count int;
begin
  select id into v_user_id
  from auth.users
  order by created_at desc
  limit 1;

  if v_user_id is null then
    raise exception 'Aucun user trouvé dans auth.users.';
  end if;

  select count(*) into v_count from public.recipes where user_id = v_user_id;

  delete from public.recipes where user_id = v_user_id;

  raise notice '✅ % recette(s) supprimée(s) pour user_id = %', v_count, v_user_id;
end $$;
