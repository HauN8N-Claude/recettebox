# RecetteBox — Backend V1.0

Backend du pipeline d'import IA (Chantier 3) : Edge Function Supabase + Worker Railway + APIs externes (OpenAI Whisper, Anthropic Claude, API tierce de scraping).

> Architecture, décisions techniques et pricing : voir [`TASKS3-IMPORT-SOCIAL.md`](../TASKS3-IMPORT-SOCIAL.md) à la racine du projet.

---

## Vue d'ensemble

```
┌──────────────┐   POST /api/imports    ┌─────────────────────┐
│   App Expo   │ ───────────────────▶  │  Edge Function      │
│ (Share Ext)  │   { url }              │  imports (Deno)     │
└──────────────┘                        └──────────┬──────────┘
                                                   │ INSERT imports row
                                                   ▼
                                        ┌─────────────────────┐
                                        │ Supabase Postgres   │
                                        │ + Realtime          │
                                        └──────────┬──────────┘
                                                   │ event INSERT
                                                   ▼
                                        ┌─────────────────────┐
                                        │  Worker Railway     │
                                        │  (Node 20 + ffmpeg) │
                                        │                     │
                                        │  1. Fetch API tierce│
                                        │  2. Dispatcher      │
                                        │     ├─ video        │
                                        │     ├─ image        │
                                        │     └─ carousel     │
                                        │  3. Persist recipe  │
                                        │  4. Push Expo       │
                                        └─────────────────────┘
```

---

## Arborescence

```
recettebox/backend/
├── README.md                          ← Ce fichier
├── TODO-PROVIDER.md                   ← Procédure pour brancher la vraie API tierce
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init_schema.sql       Schéma DB complet
│   │   ├── 0002_rls_policies.sql      Row Level Security
│   │   └── 0003_storage_setup.sql     Bucket recipe-media
│   └── functions/
│       └── imports/                    Edge Function POST /api/imports
│           ├── index.ts
│           └── deno.json
└── worker/                             Service Node.js déployé sur Railway
    ├── package.json
    ├── Dockerfile                      Node + ffmpeg
    ├── railway.json
    ├── .env.example
    └── src/
        ├── index.ts                    Entry : Realtime + sweep + healthcheck
        ├── config.ts                   Validation env via Zod
        ├── lib/                        Clients (supabase, anthropic, openai, expo-push, ffmpeg, http, logger)
        ├── providers/social-api.ts     Interface + stub des APIs tierces
        ├── modules/                    Briques IA (whisper, claude-vision, claude-fusion)
        ├── pipelines/                  Dispatcher + 3 sous-pipelines (video/image/carousel)
        ├── jobs/                       Orchestration (run-import, persist-recipe)
        ├── schemas/recipe.ts           Zod + JSON Schema pour Claude tool use
        └── scripts/test-job.ts         Script de test local
```

---

# Guide de setup step-by-step

> Temps total estimé : **3 à 4 heures** la première fois (création comptes + déploiements compris).

## Pré-requis

- [ ] Compte GitHub (pour héberger le code et auto-deploy Railway)
- [ ] Carte bancaire (Supabase et Railway sont gratuits jusqu'à un certain seuil)
- [ ] [Node.js 20+](https://nodejs.org/) installé en local
- [ ] [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) installé : `npm install -g supabase`
- [ ] [Railway CLI](https://docs.railway.com/guides/cli) installé : `npm install -g @railway/cli`
- [ ] Une clé API OpenAI : https://platform.openai.com/api-keys
- [ ] Une clé API Anthropic : https://console.anthropic.com/settings/keys

---

## Étape 1 — Créer le projet Supabase (B1.1)

1. Va sur https://supabase.com → **Sign in** → **New project**.
2. Renseigne :
   - **Name** : `recettebox-prod`
   - **Database password** : génère un mot de passe fort et **note-le** (tu n'y auras plus accès après).
   - **Region** : **Europe West (Frankfurt)** ou **Europe Central** — important pour RGPD.
   - **Pricing plan** : Free pour commencer.
3. Attends ~2 min que le projet soit provisionné.
4. Va dans **Project Settings → API** et note les 3 valeurs :
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **ne JAMAIS** mettre côté app

---

## Étape 2 — Lier le projet Supabase en local

Depuis le dossier `recettebox/backend/` :

```bash
# Une seule fois : se logger
supabase login

# Lier au projet distant (récupère l'ID depuis le dashboard, URL contient /project/<id>/)
supabase link --project-ref <ton-project-id>
# Mot de passe DB demandé : celui de l'étape 1.2
```

---

## Étape 3 — Appliquer les migrations DB (B1.2, B1.3, B1.4)

```bash
# Depuis recettebox/backend/
supabase db push
```

Ça applique les 3 migrations dans l'ordre :
- Schéma (`recipes`, `imports`, `subscriptions`, etc.)
- Row Level Security (chaque user voit que ses données)
- Storage bucket `recipe-media`

Vérification dans le dashboard Supabase :
- **Table Editor** → tu dois voir `profiles`, `subscriptions`, `recipes`, `recipe_ingredients`, `recipe_steps`, `recipe_media`, `imports`, `import_cache`, `push_tokens`.
- **Storage** → bucket `recipe-media` présent, public read.
- **Authentication → Policies** → policies actives sur toutes les tables sauf `import_cache`.

---

## Étape 4 — Déployer l'Edge Function `imports` (B2.1)

```bash
# Depuis recettebox/backend/
supabase functions deploy imports --no-verify-jwt=false
```

Cette commande déploie la fonction qui :
- reçoit `POST /functions/v1/imports` avec body `{ "url": "https://..." }`
- vérifie le JWT du user
- vérifie les quotas (3 free/mois, 30 affichés / 60 hard cap premium)
- insère une ligne `imports` qui réveille le worker via Realtime

L'URL finale sera : `https://<ton-project-id>.supabase.co/functions/v1/imports`

Test rapide (remplace `YOUR_USER_JWT` par un access_token valide d'un user créé via Auth) :

```bash
curl -X POST "https://<project-id>.supabase.co/functions/v1/imports" \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/reel/XXXX/"}'
```

Réponse attendue : `{ "jobId": "...", "status": "pending", "platform": "instagram" }`

---

## Étape 5 — Préparer le worker en local

```bash
cd worker/
cp .env.example .env.local
```

Édite `.env.local` :

```bash
SUPABASE_URL=https://<ton-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ey...               # service_role de l'étape 1.4

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Provider : stub pour démarrer, à remplacer après tâche zéro (cf. TODO-PROVIDER.md)
SOCIAL_API_PROVIDER=stub
```

Install + démarrage local :

```bash
npm install
npm run dev
```

Tu dois voir dans les logs :
- `Worker starting`
- `Realtime channel status SUBSCRIBED`
- `Healthcheck listening port 8080`

---

## Étape 6 — Tester le worker en local (avec le provider stub)

Le stub renvoie une recette factice mais permet de valider la chaîne complète.

1. Crée un user de test dans Supabase Dashboard → **Authentication → Users → Add user → Create new user** (email + password).
2. Récupère son `id` (UUID dans la table `auth.users`).
3. Lance le script de test :

```bash
# Depuis worker/, avec le worker en cours d'exécution dans un autre terminal
npm run test:job -- "https://www.instagram.com/reel/FAKE/" <USER_UUID>
```

Tu devrais voir dans les logs :
- `Realtime: new pending job`
- `Fetching post via provider: stub`
- Puis une erreur de download (normal, le stub renvoie une URL bidon) → status `failed`.

C'est OK : ça confirme que **toute la chaîne d'orchestration fonctionne**. La seule pièce manquante est le vrai provider (cf. [TODO-PROVIDER.md](TODO-PROVIDER.md)).

---

## Étape 7 — "Tâche zéro" : tester 3 providers API tiers (1-2h)

> Ne déploie pas en prod tant que ce test n'est pas fait.

### Procédure

1. Constitue une liste de **10 URLs réelles** couvrant tous les types :
   - 3 Reels Insta vidéo (1 viral récent, 1 ancien, 1 sans voix off)
   - 2 carrousels Insta photo
   - 1 carrousel Insta mixte
   - 1 post Insta photo unique
   - 2 TikTok vidéo
   - 1 TikTok Photo Mode

2. Crée un compte free sur :
   - **RapidAPI** → cherche "Instagram Downloader" et "TikTok Video Downloader" (plusieurs endpoints disponibles)
   - **Apify** → https://apify.com/store → "Instagram Scraper" + "TikTok Scraper"
   - **ScrapeCreators** → https://scrapecreators.com

3. Pour chaque provider, teste les 10 URLs avec Postman ou `curl`. Note dans un tableur :

| URL | Type | RapidAPI | Apify | ScrapeCreators |
|---|---|---|---|---|
| ... | Reel | ✅ 3s 0.01€ | ✅ 8s 0.02€ | ❌ |
| ... | Carrousel | ❌ ne renvoie que la 1re image | ✅ tout le carrousel | ✅ |
| ... | TikTok Photo | ... | ... | ... |

4. **Critère éliminatoire** : un provider qui rate les carrousels Insta est écarté. Le gagnant est celui qui passe ≥ 8/10 avec un prix < 0,02 €/requête.

5. Implémente la fonction `fetchPost()` du provider choisi dans [worker/src/providers/social-api.ts](worker/src/providers/social-api.ts) — voir [TODO-PROVIDER.md](TODO-PROVIDER.md).

---

## Étape 8 — Créer le repo GitHub du worker (B2.2)

Le worker doit être dans **son propre repo Git** pour que Railway puisse l'auto-déployer à chaque push.

```bash
cd worker/
git init
git add .
git commit -m "Initial worker"
# Crée un repo "recettebox-worker" sur GitHub (privé), puis :
git remote add origin https://github.com/<toi>/recettebox-worker.git
git branch -M main
git push -u origin main
```

---

## Étape 9 — Déployer sur Railway (B2.2)

1. Va sur https://railway.com → **New Project** → **Deploy from GitHub repo** → sélectionne `recettebox-worker`.
2. Railway détecte le `Dockerfile` automatiquement et build.
3. Va dans **Variables** et ajoute toutes celles de ton `.env.local` (Supabase, OpenAI, Anthropic, provider config…).
4. Ouvre **Settings → Networking** et **clique "Generate Domain"** (Railway crée un sous-domaine `*.up.railway.app`).
5. Au prochain déploiement, le worker démarre automatiquement.

### Vérifier que ça tourne

```bash
curl https://<ton-worker>.up.railway.app/health
# → { "ok": true, "inFlight": 0 }
```

Logs Railway : tu dois voir `Realtime channel status SUBSCRIBED`.

### Alertes (B2.2)

Va dans **Project Settings → Notifications** et active :
- Deploy crashed
- Usage > 80% du budget mensuel

---

## Étape 10 — Côté app Expo : installer le client Supabase

> Hors scope de cette session backend, mais à faire pour boucler la chaîne.

```bash
cd ../recettebox/expo
bun add @supabase/supabase-js
```

Côté app, le flux d'import sera :

```ts
const { data } = await supabase.auth.getSession();
const res = await fetch(
  `${SUPABASE_URL}/functions/v1/imports`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${data.session?.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: sharedUrl }),
  },
);
const { jobId } = await res.json();
router.replace(`/import/processing/${jobId}`);
```

Sur l'écran `processing/[jobId]`, l'app s'abonne à Supabase Realtime sur la ligne `imports.id = jobId` pour suivre la progression en live.

---

# Coûts attendus

| Service | Plan | Coût estimé |
|---|---|---|
| Supabase | Free (jusqu'à 500 MB DB + 1 GB storage + 2M Edge Function calls/mois) | 0 € jusqu'à ~2000 users |
| Railway | Hobby ($5 crédit/mois inclus) | ~5-15 €/mois jusqu'à ~5000 imports/jour |
| OpenAI Whisper | $0.006 / min audio | ~0.04 €/import (durée moyenne Reel ~45s) |
| Anthropic Claude (vision + fusion) | $0.001-$0.015 par image / par appel | ~0.05-0.08 €/import |
| API tierce (à brancher) | varie | ~0.01-0.02 €/requête |
| **Total par import** | | **~0.10 à 0.15 €** |

Cohérent avec la projection `~0.12 €/import` du modèle économique (cf. mémoire `project_v1_pricing.md`).

---

# Checklist finale

- [ ] Projet Supabase créé en région EU
- [ ] 3 migrations appliquées sans erreur
- [ ] Bucket `recipe-media` visible avec public read
- [ ] Edge Function `imports` déployée et répond
- [ ] User test créé dans Auth
- [ ] Test local : POST sur l'Edge Function crée bien une ligne `imports`
- [ ] Test local : worker reçoit l'event Realtime et tente le job
- [ ] Tâche zéro : 3 providers comparés sur 10 URLs réelles
- [ ] Provider gagnant implémenté dans `social-api.ts`
- [ ] Repo `recettebox-worker` poussé sur GitHub
- [ ] Service Railway créé et auto-deploy actif
- [ ] Variables d'env Railway renseignées
- [ ] `curl /health` du worker répond `{ ok: true }`
- [ ] Test E2E : POST /api/imports avec une vraie URL Insta → recette en base au bout de ~30-90s

---

## Dépannage

**Le worker ne reçoit pas d'event Realtime**
→ Vérifie que la table `imports` est bien dans la publication : `alter publication supabase_realtime add table public.imports;` (déjà dans la migration 0001, mais à vérifier).

**Erreur "FFmpeg exited 1"**
→ Le binaire ffmpeg n'est pas trouvé. Confirme que le `Dockerfile` est bien utilisé par Railway (pas un buildpack Node) et que `apt-get install ffmpeg` a réussi (voir les logs de build Railway).

**Status `failed` avec `error_code = exception`**
→ Regarde les logs Railway autour du `jobId`. Le `error_message` côté DB donne le message user-facing ; les détails techniques sont dans les logs Railway.

**Edge Function 401 Unauthorized**
→ Le JWT envoyé est invalide ou expiré. Vérifie que l'app appelle `supabase.auth.getSession()` juste avant et passe bien `access_token` (pas `refresh_token`).
