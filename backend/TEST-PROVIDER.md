# Guide de test — Provider ScrapeCreators

> Suivre ce guide après l'implémentation du provider (faite le 13/05/2026, voir [worker/src/providers/social-api.ts](worker/src/providers/social-api.ts)).
>
> Objectif : valider que la chaîne complète marche en local, puis pousser en prod, puis tester depuis l'app.
>
> Durée totale : ~45 min si tout va bien, ~1h30 avec un peu de debug.

---

## 🧰 Avant de commencer — pré-requis

À vérifier rapidement :

- [ ] Tu as ta clé API ScrapeCreators (dans `.env.tache-zero.local` — on va la migrer)
- [ ] Le worker compile : `cd recettebox/backend/worker && npm run lint` doit terminer sans erreur (déjà vérifié)
- [ ] Tu as **l'UUID d'un user de test** dans Supabase Auth. Pour le récupérer :
  1. Va sur https://supabase.com/dashboard/project/drymgrccydkntskrpjgu/auth/users
  2. Clique sur n'importe quel user existant (par ex. ton compte de test)
  3. Copie son **ID** (UUID format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
  4. Note-le quelque part pour la suite

> Si tu n'as pas de user de test : clique "Add user → Create new user", email + password bidon, et copie l'ID qui apparaît.

---

## 🧪 Test 1 — Sanity check local (~10 min)

Le but : faire passer **une seule URL** dans toute la chaîne (provider → IA → DB) sans toucher à Railway ni l'app. Si ça marche ici, ça marchera en prod.

### 1.1 — Migrer la clé dans `.env.local`

Ouvre [worker/.env.local](worker/.env.local) et **modifie 2 lignes** :

```env
SOCIAL_API_PROVIDER=scrapecreators
SCRAPECREATORS_API_KEY=<colle ici la clé qui est dans .env.tache-zero.local>
```

⚠️ Ne supprime PAS encore `.env.tache-zero.local` — on garde tant que les tests ne sont pas passés.

### 1.2 — Lancer le test

Dans un terminal PowerShell, depuis le dossier `recettebox/backend/worker/` :

```powershell
npm run test:job -- "https://www.instagram.com/reel/DXuLRHZhFYP/" <COLLE_ICI_UUID_USER>
```

Remplace `<COLLE_ICI_UUID_USER>` par l'UUID du user de test.

> **Pourquoi cette URL ?** C'est URL #1 de la tâche zéro (@chefclubtv, vidéo simple, ~26s, recette claire). C'est le cas le plus simple — vidéo unique, pas de carrousel.

### 1.3 — Ce que tu dois voir dans les logs

Ça va dérouler dans cet ordre (chaque ligne ≈ 5-30s) :

```
Creating test job
Job created <uuid>
Fetching post via provider                  ← ScrapeCreators est appelé
Post fetched mediaType=video items=1 ...    ← ✅ provider OK
Downloading video                           ← ffmpeg télécharge le mp4
Extracting audio                            ← ffmpeg sort l'audio
Transcribing with Whisper                   ← OpenAI Whisper
Extracting N frames                         ← ffmpeg extrait des images
Claude vision analyzing frames              ← Claude analyse les images
Claude fusion building recipe               ← Claude structure la recette
Persisting recipe                           ← Insertion en DB
Push notification sent                      ← (peut échouer si pas de device token, OK)
Final state: { status: 'done', recipe_id: '<uuid>', ... }
```

Durée totale : **30-90 secondes**.

### 1.4 — Vérifier en base que la recette existe

Va sur https://supabase.com/dashboard/project/drymgrccydkntskrpjgu/editor → table `recipes` → tu dois voir une **nouvelle ligne** avec :

- `title` rempli (genre "Bûches au fromage frais" ou similaire)
- `cover_image_url` rempli (URL Supabase Storage)
- `user_id` = ton UUID de test

Va aussi voir la table `recipe_ingredients` → plusieurs lignes liées à cette recette
Et `recipe_steps` → idem

### 1.5 — Critère de succès Test 1

✅ **Test 1 OK si :**
- Le `status` final affiché est `done`
- Tu vois une recette nouvelle dans `recipes` avec des ingrédients et étapes liés
- Le `error_message` est `null`

❌ **Si ça plante**, va voir la section "Debug" en bas du guide.

---

## 🌐 Test 2 — Tester depuis l'app via Realtime (~5 min)

Le but : valider que le worker se réveille bien quand l'app insère un job (chemin réel de prod).

### 2.1 — Lancer le worker en mode dev

Dans un terminal, depuis `recettebox/backend/worker/` :

```powershell
npm run dev
```

Tu dois voir :
```
Worker starting
Healthcheck listening port 8080
Realtime channel status SUBSCRIBED
```

Laisse ce terminal ouvert.

### 2.2 — Trigger un import depuis l'app

Ouvre ton app RecetteBox sur ton tel ou simulateur. Si tu n'as pas encore la Share Extension (chantier 2 pas fini), tu peux trigger en collant une URL dans l'écran de saisie manuelle de l'app (s'il existe).

Sinon, fallback simple : retourne sur PowerShell, lance encore `npm run test:job -- "<URL>" <UUID>` dans un 2ᵉ terminal pendant que le 1er fait tourner `npm run dev`. Les logs du worker doivent montrer :

```
Realtime: new pending job <uuid>
Fetching post via provider
...
Job done
```

### 2.3 — Critère de succès Test 2

✅ **Test 2 OK si :** tu vois "Realtime: new pending job" dans le terminal qui fait tourner `npm run dev` → ça prouve que le mécanisme Realtime marche.

---

## 🚀 Test 3 — Déploiement Railway (~10 min)

Maintenant qu'on est sûr que ça marche en local, on pousse en prod.

### 3.1 — Configurer les variables d'env Railway

Depuis `recettebox/backend/worker/` :

```powershell
railway variables --set "SOCIAL_API_PROVIDER=scrapecreators" --service worker
railway variables --set "SCRAPECREATORS_API_KEY=<TA_CLE>" --service worker
```

Vérifie que les 2 variables sont bien posées :

```powershell
railway variables --service worker
```

Tu dois voir `SOCIAL_API_PROVIDER=scrapecreators` et `SCRAPECREATORS_API_KEY=sc_***...` dans la liste.

### 3.2 — Redéployer le worker

```powershell
railway up --service worker
```

Ça build l'image Docker (2-5 min) et déploie. Tu peux suivre le build en live.

### 3.3 — Vérifier que ça tourne

Une fois le déploiement terminé, vérifie le healthcheck :

```powershell
curl https://worker-production-0c48.up.railway.app/health
```

Doit répondre `{"ok":true,"inFlight":0}`.

Puis regarde les logs en live :

```powershell
railway logs --service worker
```

Doit afficher :
```
Worker starting
Healthcheck listening port 8080
Realtime channel status SUBSCRIBED
```

### 3.4 — Critère de succès Test 3

✅ **Test 3 OK si :**
- Build Railway terminé sans erreur
- `/health` répond `{"ok":true}`
- Les logs montrent `Realtime channel status SUBSCRIBED`

---

## 🎯 Test 4 — E2E en prod (~10 min)

Le test final : reproduire le flux complet utilisateur en utilisant Railway en prod.

### 4.1 — Depuis l'app (idéal)

Ouvre l'app, partage une URL Instagram dans RecetteBox (ou colle dans le champ manuel). Tu dois voir l'écran "processing" qui suit la progression en live (status `pending` → `downloading` → ... → `done`).

### 4.2 — Fallback si l'app n'est pas prête : insert SQL direct

Va sur https://supabase.com/dashboard/project/drymgrccydkntskrpjgu/sql/new et lance :

```sql
INSERT INTO imports (user_id, source_url, status)
VALUES (
  '<TON_UUID_USER>',
  'https://www.instagram.com/reel/DXuLRHZhFYP/',
  'pending'
)
RETURNING id;
```

Note l'`id` retourné, puis attends 30-90s.

### 4.3 — Vérifier l'évolution du status

Toujours dans le SQL Editor, lance :

```sql
SELECT id, status, recipe_id, error_message, media_type, duration_ms
FROM imports
WHERE id = '<JOB_ID_RETOURNE_AU_DESSUS>';
```

Tu dois voir le `status` évoluer de `pending` → `downloading` → `transcribing` → `extracting` → `structuring` → `done`.

À la fin : `recipe_id` rempli, `error_message` null, `duration_ms` autour de 30-90 secondes.

### 4.4 — Critère de succès Test 4

✅ **Test 4 OK = V1.0 BACKEND COMPLET :**
- Status final `done`
- Recipe créée en base avec ingrédients + étapes
- Logs Railway montrent `Fetching post via provider: scrapecreators` (PAS `stub`)

---

## 🧹 Nettoyage final (après les 4 tests OK)

Une fois les 4 tests validés, tu peux :

```powershell
# Depuis recettebox/backend/
rm .env.tache-zero.local
```

Le dossier `scripts/tache-zero/` peut rester encore ~1 mois (preuve du choix provider), tu le supprimeras plus tard.

---

## 🆘 Debug — si ça plante

### Erreur : "SCRAPECREATORS_API_KEY missing in env"
→ La variable n'est pas chargée. Vérifie `.env.local` (test 1) ou `railway variables` (test 3).

### Erreur : "ScrapeCreators HTTP 401" ou "403"
→ Clé API invalide ou expirée. Va sur https://app.scrapecreators.com vérifier ton compte et regénère une clé si besoin.

### Erreur : "ScrapeCreators HTTP 429"
→ Rate limit atteint. Plan free très limité. Attendre 1h ou upgrader le plan.

### Erreur : "not found" pour une URL pourtant publique
→ Le post a peut-être été supprimé entre la tâche zéro et maintenant. Essaie URL #2 (@fastgoodcuisine, posté 2021 — stable).

### Erreur : "FFmpeg exited 1" ou "spawn ffmpeg ENOENT"
→ ffmpeg pas installé en local. Sur Windows : `winget install ffmpeg` ou télécharger depuis https://ffmpeg.org/download.html et l'ajouter au PATH. Sur Railway : déjà dans le Dockerfile, ne devrait pas arriver.

### Erreur : "schema_invalid" ou "no_tool_use" dans error_code
→ Claude n'a pas réussi à structurer la recette (contenu trop vague, vidéo sans recette identifiable). Pas un bug du provider, c'est attendu sur des URLs qui ne sont pas vraiment des recettes.

### Le worker dev ne reçoit pas l'event Realtime
→ Vérifie dans Supabase Dashboard → Database → Replication que la publication `supabase_realtime` inclut la table `imports`. Si non : `ALTER PUBLICATION supabase_realtime ADD TABLE public.imports;` dans le SQL Editor.

### Status reste à `pending` indéfiniment
→ Le worker ne tourne pas, ou n'a pas reçu l'event. Vérifie que `npm run dev` (test 2) ou `railway logs` (test 4) montre bien `Realtime channel status SUBSCRIBED`.

### Tout marche en local mais pas en prod
→ Différence de config. Compare la sortie de `railway variables --service worker` avec ton `.env.local`. Le plus probable : `SCRAPECREATORS_API_KEY` mal collée (espace en début/fin).

---

## 📞 Si vraiment bloqué

Reprends une session Claude avec : *"on a fait l'implémentation du provider ScrapeCreators, je teste maintenant et ça plante à l'étape X avec ce message d'erreur : <coller logs>"*. La mémoire `project_v1_provider_choice.md` te donnera tout le contexte.
