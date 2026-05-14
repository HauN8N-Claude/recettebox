-- =============================================================================
-- DEV-SEED.sql
-- =============================================================================
-- Script de dev pour peupler la BD avec 12 recettes mockées (= contenu de
-- constants/mockData.ts côté app). Permet de tester l'app entièrement sans
-- devoir faire des imports réels via Share Extension.
--
-- USAGE :
--   1. Faire signup dans l'app avec un email/password de ton choix.
--   2. Coller ce SQL dans https://supabase.com/dashboard/project/drymgrccydkntskrpjgu/sql/new
--   3. Run. Le script trouve automatiquement le user le plus récemment créé
--      et lui assigne les 12 recettes.
--   4. Pull-to-refresh dans l'app (ou nav vers library) → les recettes apparaissent.
--
-- POUR NETTOYER : voir DEV-UNSEED.sql.
--
-- ⚠️ Le script bypass RLS car le SQL Editor du dashboard tourne en service_role.
-- ⚠️ Si tu as plusieurs comptes test, c'est le PLUS RÉCENT qui sera ciblé.
-- =============================================================================

do $$
declare
  v_user_id uuid;
  v_recipe_id uuid;
begin
  -- Détecte le user le plus récemment créé.
  select id into v_user_id
  from auth.users
  order by created_at desc
  limit 1;

  if v_user_id is null then
    raise exception 'Aucun user trouvé dans auth.users. Fais signup dans l''app d''abord.';
  end if;

  raise notice 'Seeding 12 recettes pour user_id = %', v_user_id;

  -- =====================================================================
  -- 1. Tian de courgettes
  -- =====================================================================
  insert into public.recipes (user_id, title, source, source_author, image_url, servings, prep_time_minutes, cook_time_minutes, difficulty, tags, cooked_count, is_favorite, imported_at)
  values (
    v_user_id, 'Tian de courgettes', 'manual', null,
    'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=800&q=80',
    4, 15, 35, 'facile',
    array['sans lactose', 'anti-gaspi', 'végétarien'],
    2, true, '2026-05-06T12:00:00Z'
  ) returning id into v_recipe_id;

  insert into public.recipe_ingredients (recipe_id, position, name, quantity) values
    (v_recipe_id, 0, 'Courgettes', '3 moyennes'),
    (v_recipe_id, 1, 'Tomates', '4'),
    (v_recipe_id, 2, 'Oignon', '1'),
    (v_recipe_id, 3, 'Huile d''olive', '3 c. à s.'),
    (v_recipe_id, 4, 'Thym frais', '1 branche');

  insert into public.recipe_steps (recipe_id, position, content) values
    (v_recipe_id, 0, 'Préchauffe ton four à 180°C.'),
    (v_recipe_id, 1, 'Coupe les légumes en fines rondelles régulières.'),
    (v_recipe_id, 2, 'Dispose-les en alternance dans un plat huilé.'),
    (v_recipe_id, 3, 'Arrose d''huile d''olive, parsème de thym, sale et poivre.'),
    (v_recipe_id, 4, 'Enfourne 35 minutes jusqu''à coloration dorée.');

  -- =====================================================================
  -- 2. Pâtes à la truffe et parmesan
  -- =====================================================================
  insert into public.recipes (user_id, title, source, source_author, image_url, servings, prep_time_minutes, cook_time_minutes, difficulty, tags, cooked_count, is_favorite, imported_at)
  values (
    v_user_id, 'Pâtes à la truffe et parmesan', 'instagram', '@marlene.cooks',
    'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
    2, 5, 12, 'facile',
    array['pâtes', 'rapide'],
    1, true, '2026-05-05T12:00:00Z'
  ) returning id into v_recipe_id;

  insert into public.recipe_ingredients (recipe_id, position, name, quantity) values
    (v_recipe_id, 0, 'Tagliatelles', '200 g'),
    (v_recipe_id, 1, 'Huile de truffe', '2 c. à s.'),
    (v_recipe_id, 2, 'Parmesan', '60 g'),
    (v_recipe_id, 3, 'Beurre', '30 g');

  insert into public.recipe_steps (recipe_id, position, content) values
    (v_recipe_id, 0, 'Cuis les pâtes al dente dans une eau bien salée.'),
    (v_recipe_id, 1, 'Fais fondre le beurre avec l''huile de truffe.'),
    (v_recipe_id, 2, 'Égoutte les pâtes en gardant un peu d''eau de cuisson.'),
    (v_recipe_id, 3, 'Mélange tout, ajoute le parmesan râpé.');

  -- =====================================================================
  -- 3. Risotto aux champignons
  -- =====================================================================
  insert into public.recipes (user_id, title, source, source_author, image_url, servings, prep_time_minutes, cook_time_minutes, difficulty, tags, cooked_count, is_favorite, imported_at)
  values (
    v_user_id, 'Risotto aux champignons', 'pinterest', 'Cuisine d''automne',
    'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80',
    4, 10, 30, 'moyen',
    array['réconfortant', 'végétarien'],
    0, false, '2026-05-04T12:00:00Z'
  ) returning id into v_recipe_id;

  insert into public.recipe_ingredients (recipe_id, position, name, quantity) values
    (v_recipe_id, 0, 'Riz arborio', '300 g'),
    (v_recipe_id, 1, 'Champignons de Paris', '400 g'),
    (v_recipe_id, 2, 'Bouillon de légumes', '1 L'),
    (v_recipe_id, 3, 'Échalote', '1'),
    (v_recipe_id, 4, 'Vin blanc sec', '100 ml');

  insert into public.recipe_steps (recipe_id, position, content) values
    (v_recipe_id, 0, 'Fais revenir l''échalote ciselée à l''huile.'),
    (v_recipe_id, 1, 'Ajoute le riz et nacre-le 2 minutes.'),
    (v_recipe_id, 2, 'Déglace au vin blanc.'),
    (v_recipe_id, 3, 'Verse le bouillon louche par louche, en remuant.'),
    (v_recipe_id, 4, 'Ajoute les champignons sautés en fin de cuisson.');

  -- =====================================================================
  -- 4. Bœuf bourguignon
  -- =====================================================================
  insert into public.recipes (user_id, title, source, source_author, image_url, servings, prep_time_minutes, cook_time_minutes, difficulty, tags, cooked_count, is_favorite, imported_at)
  values (
    v_user_id, 'Bœuf bourguignon', 'web', 'marmiton.org',
    'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=800&q=80',
    6, 25, 180, 'moyen',
    array['mijoté', 'classique'],
    1, false, '2026-05-03T12:00:00Z'
  ) returning id into v_recipe_id;

  insert into public.recipe_ingredients (recipe_id, position, name, quantity) values
    (v_recipe_id, 0, 'Bœuf à mijoter', '1,2 kg'),
    (v_recipe_id, 1, 'Lardons', '200 g'),
    (v_recipe_id, 2, 'Carottes', '4'),
    (v_recipe_id, 3, 'Vin rouge', '75 cl'),
    (v_recipe_id, 4, 'Bouquet garni', '1');

  insert into public.recipe_steps (recipe_id, position, content) values
    (v_recipe_id, 0, 'Fais dorer les morceaux de bœuf dans une cocotte.'),
    (v_recipe_id, 1, 'Ajoute lardons, oignons et carottes.'),
    (v_recipe_id, 2, 'Mouille au vin rouge, ajoute le bouquet garni.'),
    (v_recipe_id, 3, 'Laisse mijoter 3 heures à feu doux.');

  -- =====================================================================
  -- 5. Pad thaï aux crevettes
  -- =====================================================================
  insert into public.recipes (user_id, title, source, source_author, image_url, servings, prep_time_minutes, cook_time_minutes, difficulty, tags, cooked_count, is_favorite, imported_at)
  values (
    v_user_id, 'Pad thaï aux crevettes', 'tiktok', '@thai.kitchen',
    'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
    2, 15, 10, 'moyen',
    array['asiatique', 'rapide'],
    0, true, '2026-05-02T12:00:00Z'
  ) returning id into v_recipe_id;

  insert into public.recipe_ingredients (recipe_id, position, name, quantity) values
    (v_recipe_id, 0, 'Nouilles de riz', '200 g'),
    (v_recipe_id, 1, 'Crevettes', '250 g'),
    (v_recipe_id, 2, 'Œufs', '2'),
    (v_recipe_id, 3, 'Sauce nuoc-mâm', '3 c. à s.'),
    (v_recipe_id, 4, 'Cacahuètes', '50 g');

  insert into public.recipe_steps (recipe_id, position, content) values
    (v_recipe_id, 0, 'Fais tremper les nouilles 10 minutes.'),
    (v_recipe_id, 1, 'Saute les crevettes au wok.'),
    (v_recipe_id, 2, 'Ajoute les œufs battus, puis les nouilles.'),
    (v_recipe_id, 3, 'Assaisonne et termine avec cacahuètes et coriandre.');

  -- =====================================================================
  -- 6. Tarte tatin
  -- =====================================================================
  insert into public.recipes (user_id, title, source, source_author, image_url, servings, prep_time_minutes, cook_time_minutes, difficulty, tags, cooked_count, is_favorite, imported_at)
  values (
    v_user_id, 'Tarte tatin', 'manual', null,
    'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=800&q=80',
    6, 20, 40, 'moyen',
    array['dessert', 'classique'],
    1, false, '2026-05-01T12:00:00Z'
  ) returning id into v_recipe_id;

  insert into public.recipe_ingredients (recipe_id, position, name, quantity) values
    (v_recipe_id, 0, 'Pommes', '6'),
    (v_recipe_id, 1, 'Sucre', '150 g'),
    (v_recipe_id, 2, 'Beurre', '80 g'),
    (v_recipe_id, 3, 'Pâte brisée', '1 rouleau');

  insert into public.recipe_steps (recipe_id, position, content) values
    (v_recipe_id, 0, 'Fais un caramel à sec dans un moule.'),
    (v_recipe_id, 1, 'Dispose les pommes coupées en quartiers.'),
    (v_recipe_id, 2, 'Couvre avec la pâte, rentre les bords.'),
    (v_recipe_id, 3, 'Cuis 40 minutes à 180°C, puis retourne.');

  -- =====================================================================
  -- 7. Crumble pommes-cannelle
  -- =====================================================================
  insert into public.recipes (user_id, title, source, source_author, image_url, servings, prep_time_minutes, cook_time_minutes, difficulty, tags, cooked_count, is_favorite, imported_at)
  values (
    v_user_id, 'Crumble pommes-cannelle', 'instagram', '@maison.douce',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    4, 15, 30, 'facile',
    array['dessert', 'anti-gaspi'],
    2, true, '2026-04-29T12:00:00Z'
  ) returning id into v_recipe_id;

  insert into public.recipe_ingredients (recipe_id, position, name, quantity) values
    (v_recipe_id, 0, 'Pommes', '5'),
    (v_recipe_id, 1, 'Farine', '150 g'),
    (v_recipe_id, 2, 'Beurre', '100 g'),
    (v_recipe_id, 3, 'Cassonade', '100 g'),
    (v_recipe_id, 4, 'Cannelle', '1 c. à c.');

  insert into public.recipe_steps (recipe_id, position, content) values
    (v_recipe_id, 0, 'Coupe les pommes en cubes, dépose dans un plat.'),
    (v_recipe_id, 1, 'Sable farine, beurre et sucre du bout des doigts.'),
    (v_recipe_id, 2, 'Recouvre les pommes, parsème de cannelle.'),
    (v_recipe_id, 3, 'Cuis 30 minutes à 180°C.');

  -- =====================================================================
  -- 8. Quiche lorraine
  -- =====================================================================
  insert into public.recipes (user_id, title, source, source_author, image_url, servings, prep_time_minutes, cook_time_minutes, difficulty, tags, cooked_count, is_favorite, imported_at)
  values (
    v_user_id, 'Quiche lorraine', 'web', '750g.com',
    'https://images.unsplash.com/photo-1591985666643-1ecc67616216?w=800&q=80',
    6, 15, 35, 'facile',
    array['classique', 'salé'],
    0, false, '2026-04-28T12:00:00Z'
  ) returning id into v_recipe_id;

  insert into public.recipe_ingredients (recipe_id, position, name, quantity) values
    (v_recipe_id, 0, 'Pâte brisée', '1'),
    (v_recipe_id, 1, 'Lardons fumés', '200 g'),
    (v_recipe_id, 2, 'Œufs', '3'),
    (v_recipe_id, 3, 'Crème fraîche', '20 cl'),
    (v_recipe_id, 4, 'Lait', '20 cl');

  insert into public.recipe_steps (recipe_id, position, content) values
    (v_recipe_id, 0, 'Étale la pâte dans un moule.'),
    (v_recipe_id, 1, 'Fais revenir les lardons sans matière grasse.'),
    (v_recipe_id, 2, 'Bats œufs, crème, lait, muscade.'),
    (v_recipe_id, 3, 'Verse sur les lardons et cuis 35 minutes.');

  -- =====================================================================
  -- 9. Houmous maison
  -- =====================================================================
  insert into public.recipes (user_id, title, source, source_author, image_url, servings, prep_time_minutes, cook_time_minutes, difficulty, tags, cooked_count, is_favorite, imported_at)
  values (
    v_user_id, 'Houmous maison', 'manual', null,
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
    4, 10, 0, 'facile',
    array['sans lactose', 'végétarien', 'apéro'],
    3, true, '2026-04-27T12:00:00Z'
  ) returning id into v_recipe_id;

  insert into public.recipe_ingredients (recipe_id, position, name, quantity) values
    (v_recipe_id, 0, 'Pois chiches cuits', '400 g'),
    (v_recipe_id, 1, 'Tahini', '2 c. à s.'),
    (v_recipe_id, 2, 'Citron', '1'),
    (v_recipe_id, 3, 'Ail', '1 gousse'),
    (v_recipe_id, 4, 'Huile d''olive', '3 c. à s.');

  insert into public.recipe_steps (recipe_id, position, content) values
    (v_recipe_id, 0, 'Mixe pois chiches, tahini, jus de citron et ail.'),
    (v_recipe_id, 1, 'Ajoute l''huile en filet jusqu''à texture lisse.'),
    (v_recipe_id, 2, 'Sale, poivre, et termine avec un trait d''huile.');

  -- =====================================================================
  -- 10. Salade César
  -- =====================================================================
  insert into public.recipes (user_id, title, source, source_author, image_url, servings, prep_time_minutes, cook_time_minutes, difficulty, tags, cooked_count, is_favorite, imported_at)
  values (
    v_user_id, 'Salade César', 'pinterest', 'Bistrot',
    'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80',
    2, 15, 15, 'facile',
    array['salade', 'rapide'],
    1, false, '2026-04-26T12:00:00Z'
  ) returning id into v_recipe_id;

  insert into public.recipe_ingredients (recipe_id, position, name, quantity) values
    (v_recipe_id, 0, 'Romaine', '1'),
    (v_recipe_id, 1, 'Blanc de poulet', '2'),
    (v_recipe_id, 2, 'Parmesan', '60 g'),
    (v_recipe_id, 3, 'Croûtons', '100 g'),
    (v_recipe_id, 4, 'Sauce César', '4 c. à s.');

  insert into public.recipe_steps (recipe_id, position, content) values
    (v_recipe_id, 0, 'Cuis le poulet à la poêle, coupe en lamelles.'),
    (v_recipe_id, 1, 'Lave et coupe la romaine.'),
    (v_recipe_id, 2, 'Dresse, ajoute croûtons, parmesan, sauce.');

  -- =====================================================================
  -- 11. Pesto rouge maison
  -- =====================================================================
  insert into public.recipes (user_id, title, source, source_author, image_url, servings, prep_time_minutes, cook_time_minutes, difficulty, tags, cooked_count, is_favorite, imported_at)
  values (
    v_user_id, 'Pesto rouge maison', 'instagram', '@cuisine.italia',
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80',
    4, 10, 0, 'facile',
    array['sans lactose', 'anti-gaspi', 'rapide'],
    0, false, '2026-04-25T12:00:00Z'
  ) returning id into v_recipe_id;

  insert into public.recipe_ingredients (recipe_id, position, name, quantity) values
    (v_recipe_id, 0, 'Tomates séchées', '150 g'),
    (v_recipe_id, 1, 'Pignons', '50 g'),
    (v_recipe_id, 2, 'Basilic frais', '1 bouquet'),
    (v_recipe_id, 3, 'Ail', '1 gousse'),
    (v_recipe_id, 4, 'Huile d''olive', '10 cl');

  insert into public.recipe_steps (recipe_id, position, content) values
    (v_recipe_id, 0, 'Mixe tomates, pignons, basilic et ail.'),
    (v_recipe_id, 1, 'Ajoute l''huile en filet, ajuste l''assaisonnement.'),
    (v_recipe_id, 2, 'Garde au frais dans un bocal hermétique.');

  -- =====================================================================
  -- 12. Soupe miso
  -- =====================================================================
  insert into public.recipes (user_id, title, source, source_author, image_url, servings, prep_time_minutes, cook_time_minutes, difficulty, tags, cooked_count, is_favorite, imported_at)
  values (
    v_user_id, 'Soupe miso', 'tiktok', '@tokyo.bites',
    'https://images.unsplash.com/photo-1607301405390-d831c242f59b?w=800&q=80',
    2, 5, 10, 'facile',
    array['sans lactose', 'asiatique', 'léger'],
    1, true, '2026-04-24T12:00:00Z'
  ) returning id into v_recipe_id;

  insert into public.recipe_ingredients (recipe_id, position, name, quantity) values
    (v_recipe_id, 0, 'Pâte de miso', '2 c. à s.'),
    (v_recipe_id, 1, 'Tofu soyeux', '150 g'),
    (v_recipe_id, 2, 'Algues wakame', '1 c. à s.'),
    (v_recipe_id, 3, 'Oignons nouveaux', '2'),
    (v_recipe_id, 4, 'Bouillon dashi', '60 cl');

  insert into public.recipe_steps (recipe_id, position, content) values
    (v_recipe_id, 0, 'Chauffe le bouillon dashi sans le faire bouillir.'),
    (v_recipe_id, 1, 'Délaye le miso dans un peu de bouillon, ajoute.'),
    (v_recipe_id, 2, 'Ajoute le tofu en cubes et le wakame réhydraté.'),
    (v_recipe_id, 3, 'Termine avec les oignons nouveaux.');

  raise notice '✅ 12 recettes seed terminées pour user_id = %', v_user_id;
end $$;
