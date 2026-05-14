-- =============================================================================
-- RecetteBox V1.0 — Schéma initial
-- =============================================================================
-- Tables : profiles, subscriptions, recipes, recipe_ingredients, recipe_steps,
--          recipe_media, imports, import_cache, push_tokens
-- =============================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- =============================================================================
-- profiles : métadonnées user (étend auth.users)
-- =============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  household_size int default 1,
  is_premium boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_profiles_is_premium on public.profiles(is_premium);

-- =============================================================================
-- subscriptions : abonnements (gating quotas)
-- =============================================================================
create type subscription_plan as enum ('free', 'premium_monthly', 'premium_annual');
create type subscription_status as enum ('active', 'expired', 'cancelled');

create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan subscription_plan not null default 'free',
  status subscription_status not null default 'active',
  started_at timestamptz default now(),
  expires_at timestamptz,
  store_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index idx_subscriptions_active_per_user
  on public.subscriptions(user_id)
  where status = 'active';

create index idx_subscriptions_user on public.subscriptions(user_id);

-- =============================================================================
-- recipes : recette structurée
-- =============================================================================
create type recipe_source as enum ('instagram', 'tiktok', 'pinterest', 'youtube', 'web', 'manual');
create type recipe_difficulty as enum ('facile', 'moyen', 'expert');

create table public.recipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  source recipe_source not null,
  source_url text,
  source_author text,
  image_url text,

  servings int default 2 check (servings > 0),
  prep_time_minutes int default 0 check (prep_time_minutes >= 0),
  cook_time_minutes int default 0 check (cook_time_minutes >= 0),
  difficulty recipe_difficulty default 'facile',

  tags text[] default array[]::text[],

  cooked_count int default 0,
  is_favorite boolean default false,

  ai_confidence numeric(3,2),

  imported_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_recipes_user on public.recipes(user_id);
create index idx_recipes_source on public.recipes(source);
create index idx_recipes_imported_at on public.recipes(imported_at desc);
create index idx_recipes_tags on public.recipes using gin(tags);
create index idx_recipes_title_trgm on public.recipes using gin(title gin_trgm_ops);

-- =============================================================================
-- recipe_ingredients : ingrédients d'une recette
-- =============================================================================
create table public.recipe_ingredients (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  position int not null default 0,
  name text not null,
  quantity text,
  category text,
  created_at timestamptz default now()
);

create index idx_recipe_ingredients_recipe on public.recipe_ingredients(recipe_id, position);

-- =============================================================================
-- recipe_steps : étapes de préparation
-- =============================================================================
create table public.recipe_steps (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  position int not null default 0,
  content text not null,
  created_at timestamptz default now()
);

create index idx_recipe_steps_recipe on public.recipe_steps(recipe_id, position);

-- =============================================================================
-- recipe_media : images / vidéos liées (autres que cover image_url)
-- =============================================================================
create type media_kind as enum ('image', 'video', 'thumbnail');

create table public.recipe_media (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  kind media_kind not null,
  url text not null,
  position int not null default 0,
  created_at timestamptz default now()
);

create index idx_recipe_media_recipe on public.recipe_media(recipe_id, position);

-- =============================================================================
-- imports : jobs d'import (queue + suivi)
-- =============================================================================
create type import_status as enum (
  'pending',
  'downloading',
  'transcribing',
  'extracting',
  'structuring',
  'done',
  'failed'
);

create type import_platform as enum ('instagram', 'tiktok');

create table public.imports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  source_url text not null,
  source_platform import_platform,
  media_type text, -- 'video' | 'image' | 'carousel' (renseigné après détection)

  status import_status not null default 'pending',
  status_updated_at timestamptz default now(),

  error_message text,
  error_code text,

  recipe_id uuid references public.recipes(id) on delete set null,

  cost_cents int, -- coût IA accumulé (Whisper + Claude) en centimes d'euro × 100
  duration_ms int,

  attempt int default 0,

  created_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_imports_user on public.imports(user_id, created_at desc);
create index idx_imports_status on public.imports(status) where status in ('pending', 'downloading', 'transcribing', 'extracting', 'structuring');
create index idx_imports_recipe on public.imports(recipe_id);

-- Notification du worker via Postgres Realtime
alter publication supabase_realtime add table public.imports;

-- =============================================================================
-- import_cache : cache des imports identiques (B5.4)
-- =============================================================================
create table public.import_cache (
  url_hash text primary key, -- sha256(source_url normalisée)
  source_url text not null,
  source_platform import_platform not null,
  recipe_data jsonb not null, -- snapshot de la recette structurée
  hit_count int default 1,
  created_at timestamptz default now(),
  last_hit_at timestamptz default now()
);

create index idx_import_cache_platform on public.import_cache(source_platform);

-- =============================================================================
-- push_tokens : tokens Expo Push par device
-- =============================================================================
create table public.push_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  device_name text,
  created_at timestamptz default now(),
  last_used_at timestamptz default now()
);

create index idx_push_tokens_user on public.push_tokens(user_id);

-- =============================================================================
-- Triggers : updated_at automatique
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create trigger trg_recipes_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Trigger : status_updated_at sur imports à chaque changement de status
-- =============================================================================
create or replace function public.set_imports_status_updated_at()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    new.status_updated_at = now();
  end if;
  if new.status in ('done', 'failed') and old.status not in ('done', 'failed') then
    new.completed_at = now();
  end if;
  return new;
end;
$$;

create trigger trg_imports_status_updated_at
  before update on public.imports
  for each row execute function public.set_imports_status_updated_at();

-- =============================================================================
-- Trigger : auto-création profile + subscription free à l'inscription
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Vue helper : quota d'imports par user (pour vérifs côté Edge Function)
-- =============================================================================
create or replace view public.user_import_quota as
select
  u.id as user_id,
  coalesce(s.plan, 'free') as plan,
  -- imports calendaires du mois courant (réussis + en cours)
  count(*) filter (
    where i.created_at >= date_trunc('month', now())
      and i.status not in ('failed')
  )::int as imports_this_month,
  -- imports glissants 30 derniers jours (pour hard cap premium)
  count(*) filter (
    where i.created_at >= now() - interval '30 days'
      and i.status not in ('failed')
  )::int as imports_last_30d,
  -- dernier import (pour rate-limit doux)
  max(i.created_at) filter (where i.status not in ('failed')) as last_import_at
from auth.users u
left join public.subscriptions s
  on s.user_id = u.id and s.status = 'active'
left join public.imports i
  on i.user_id = u.id
group by u.id, s.plan;

grant select on public.user_import_quota to authenticated;
