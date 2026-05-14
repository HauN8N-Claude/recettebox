# Monitoring des coûts IA (B5.3)

Chaque appel à un modèle IA (Whisper, Claude vision, Claude fusion) émet une ligne de log JSON `ai_cost` dans Railway. Cette page explique comment les lire.

## Format d'une ligne `ai_cost`

```json
{
  "ts": "2026-05-15T08:14:22.103Z",
  "level": "info",
  "msg": "ai_cost",
  "module": "whisper" | "vision" | "fusion",
  "model": "whisper-1" | "claude-haiku-4-5" | "claude-sonnet-4-6",
  "audio_seconds": 42.3,        // uniquement Whisper
  "tokens_in": 3200,            // uniquement Anthropic
  "tokens_out": 450,            // uniquement Anthropic
  "cost_usd_estimated": 0.00545,
  "jobId": "8f3c-..."
}
```

Le `cost_usd_estimated` est calculé côté worker à partir de la table de prix ci-dessous. Ce n'est **pas** un montant facturé : c'est une estimation pour suivre les ordres de grandeur et détecter les dérives.

## Lire les logs dans Railway

1. Ouvrir le projet Railway → service `worker`.
2. Onglet **Deployments** → cliquer sur le déploiement actif.
3. Onglet **Logs**.
4. Filtrer : taper `ai_cost` dans la barre de recherche.

Pour suivre un job précis : filtrer par `jobId`.

Pour exporter un échantillon : Railway permet de copier les 100 dernières lignes filtrées. Coller dans un tableur pour additionner les `cost_usd_estimated`.

## Table de prix (USD, mai 2026)

| Modèle | Tarification | Prix |
|---|---|---|
| `whisper-1` | par minute audio | $0.006/min |
| `claude-haiku-4-5` | par 1M tokens input | $1.00 |
| `claude-haiku-4-5` | par 1M tokens output | $5.00 |
| `claude-sonnet-4-6` | par 1M tokens input | $3.00 |
| `claude-sonnet-4-6` | par 1M tokens output | $15.00 |

Source : pages tarifs Anthropic et OpenAI. À mettre à jour si elles bougent. Le fichier à toucher est [`worker/src/lib/ai-cost.ts`](../src/lib/ai-cost.ts), constante `PRICES`.

## Ordres de grandeur attendus par import

Pour un Reel typique de 30-60s :

| Étape | Coût estimé |
|---|---|
| Whisper (extraction voix off) | ~$0.003 - $0.006 |
| Claude vision (8 frames) | ~$0.005 - $0.010 |
| Claude fusion | ~$0.015 - $0.025 |
| **Total par import** | **~$0.025 - $0.040** |

Si une ligne `ai_cost` dépasse 5× ces valeurs, c'est un signal à investiguer (vidéo trop longue, prompt trop gros, etc.).

## Cache hits (B5.4)

Sur un cache hit URL communautaire, **aucune ligne `ai_cost` n'est émise** (zéro appel IA). Le log à chercher dans ce cas est `"Cache hit, copying recipe without IA"`.

Pour mesurer le taux de hit du cache communautaire, requêter directement la table `import_cache` :

```sql
select
  count(*) filter (where hit_count > 1) as urls_with_hits,
  sum(hit_count - 1) as economies_pipeline,
  avg(hit_count) as moyenne_hits
from public.import_cache;
```

`economies_pipeline` = nombre total de jobs qui auraient été lancés sans cache.
