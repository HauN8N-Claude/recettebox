-- =============================================================================
-- RecetteBox V1.0 — Row Level Security
-- =============================================================================
-- Principe : chaque user ne voit / modifie QUE ses propres données.
-- Le worker Railway utilise SUPABASE_SERVICE_ROLE_KEY qui bypass RLS.
-- =============================================================================

-- profiles
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- subscriptions
alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- recipes
alter table public.recipes enable row level security;

create policy "recipes_select_own"
  on public.recipes for select
  using (auth.uid() = user_id);

create policy "recipes_insert_own"
  on public.recipes for insert
  with check (auth.uid() = user_id);

create policy "recipes_update_own"
  on public.recipes for update
  using (auth.uid() = user_id);

create policy "recipes_delete_own"
  on public.recipes for delete
  using (auth.uid() = user_id);

-- recipe_ingredients
alter table public.recipe_ingredients enable row level security;

create policy "recipe_ingredients_select_own"
  on public.recipe_ingredients for select
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredients.recipe_id and r.user_id = auth.uid()
    )
  );

create policy "recipe_ingredients_insert_own"
  on public.recipe_ingredients for insert
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredients.recipe_id and r.user_id = auth.uid()
    )
  );

create policy "recipe_ingredients_update_own"
  on public.recipe_ingredients for update
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredients.recipe_id and r.user_id = auth.uid()
    )
  );

create policy "recipe_ingredients_delete_own"
  on public.recipe_ingredients for delete
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredients.recipe_id and r.user_id = auth.uid()
    )
  );

-- recipe_steps (mêmes policies que ingredients)
alter table public.recipe_steps enable row level security;

create policy "recipe_steps_select_own"
  on public.recipe_steps for select
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_steps.recipe_id and r.user_id = auth.uid()
    )
  );

create policy "recipe_steps_insert_own"
  on public.recipe_steps for insert
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_steps.recipe_id and r.user_id = auth.uid()
    )
  );

create policy "recipe_steps_update_own"
  on public.recipe_steps for update
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_steps.recipe_id and r.user_id = auth.uid()
    )
  );

create policy "recipe_steps_delete_own"
  on public.recipe_steps for delete
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_steps.recipe_id and r.user_id = auth.uid()
    )
  );

-- recipe_media (mêmes policies)
alter table public.recipe_media enable row level security;

create policy "recipe_media_select_own"
  on public.recipe_media for select
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_media.recipe_id and r.user_id = auth.uid()
    )
  );

create policy "recipe_media_insert_own"
  on public.recipe_media for insert
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_media.recipe_id and r.user_id = auth.uid()
    )
  );

create policy "recipe_media_delete_own"
  on public.recipe_media for delete
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_media.recipe_id and r.user_id = auth.uid()
    )
  );

-- imports : RO pour l'user concerné (la création passe par l'Edge Function en service_role)
alter table public.imports enable row level security;

create policy "imports_select_own"
  on public.imports for select
  using (auth.uid() = user_id);

-- push_tokens : l'app insère / met à jour ses propres tokens
alter table public.push_tokens enable row level security;

create policy "push_tokens_select_own"
  on public.push_tokens for select
  using (auth.uid() = user_id);

create policy "push_tokens_insert_own"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "push_tokens_update_own"
  on public.push_tokens for update
  using (auth.uid() = user_id);

create policy "push_tokens_delete_own"
  on public.push_tokens for delete
  using (auth.uid() = user_id);

-- import_cache : RW uniquement par service_role (worker), pas d'accès user direct
alter table public.import_cache enable row level security;
-- pas de policy = aucun accès via anon/authenticated, seul service_role passe.
