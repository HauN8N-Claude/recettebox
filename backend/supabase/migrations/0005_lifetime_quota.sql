-- =============================================================================
-- 0005_lifetime_quota.sql
-- =============================================================================
-- Pivot V1.0 (13/05/2026) : le quota free passe de "3 / mois calendaire" a
-- "3 a vie". Une fois epuises, l'utilisateur free DOIT passer en premium.
--
-- Ajoute un compteur "imports_lifetime" a la vue user_import_quota :
-- compte tous les imports non-failed du user, sans filtre temporel.
--
-- imports_this_month et imports_last_30d sont conserves (utiles pour stats
-- internes + rate-limit premium 30/60 sur 30j glissants).
--
-- L'Edge Function imports/ doit etre redeployee pour consommer ce nouveau
-- champ au lieu d'imports_this_month pour les users free.
-- =============================================================================

create or replace view public.user_import_quota as
select
  u.id as user_id,
  coalesce(s.plan, 'free') as plan,
  count(*) filter (
    where i.created_at >= date_trunc('month', now())
      and i.status not in ('failed')
  )::int as imports_this_month,
  count(*) filter (
    where i.created_at >= now() - interval '30 days'
      and i.status not in ('failed')
  )::int as imports_last_30d,
  max(i.created_at) filter (where i.status not in ('failed')) as last_import_at,
  count(*) filter (
    where i.status not in ('failed')
  )::int as imports_lifetime
from auth.users u
left join public.subscriptions s
  on s.user_id = u.id and s.status = 'active'
left join public.imports i
  on i.user_id = u.id
group by u.id, s.plan;

grant select on public.user_import_quota to authenticated;
