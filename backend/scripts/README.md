# Guide — Choisir le meilleur fournisseur d'API pour les Reels et TikTok

> **À qui ce guide s'adresse :** toi, qui n'es pas codeur. Suis-le dans l'ordre.

---

## Pourquoi cette étape ?

Pour que RecetteBox transforme un Reel Instagram ou une vidéo TikTok en recette, il faut un **service tiers** qui sait télécharger le contenu d'une publication à partir de son URL (vidéo, photos, légende, auteur, etc.).

Aujourd'hui, le backend tourne avec un service **bidon** (« stub ») qui renvoie une réponse factice. Il faut **choisir le bon prestataire** avant d'aller plus loin.

On va tester **2 candidats** :

| Candidat | Site | Rôle dans le test |
|---|---|---|
| **Apify** | https://apify.com | Candidat principal — actors officiels solides pour Insta + TikTok, free tier 5 $/mois inclus |
| **RapidAPI** | https://rapidapi.com | Backup gratuit — utile si Apify est trop cher ou rate certains cas |

> Un 3ᵉ candidat (ScrapeCreators) a été écarté pour V1.0 par souci de simplicité. On y reviendra en V1.0.1 si les retours beta justifient une comparaison plus large.

---

## Récap des étapes

| Étape | Quoi | Temps estimé |
|---|---|---|
| 1 | Choisir 10 publications Insta/TikTok à tester | 30 min |
| 2 | Créer un compte **Apify** et récupérer une clé | 15 min |
| 3 | Créer un compte **RapidAPI** et récupérer une clé | 15 min |
| 4 | Remplir le fichier `.env.local` avec les clés | 5 min |
| 5 | Lancer le script de test | 5 min |
| 6 | Lire les résultats | 30 min |
| 7 | Remplir la matrice et me revenir | 15 min |
| **Total** | | **~1 h 55** |

**Coût attendu :** 0 € pour les tests (les deux services ont un quota gratuit largement suffisant pour 10 URLs).

---

## Avant de commencer

Vérifie que **Node.js** est installé :

1. Ouvre PowerShell (touche Windows → « powershell » → Entrée).
2. Tape :
   ```powershell
   node --version
   ```
3. Tu dois voir une version `v20.x.x` ou plus. **Si erreur**, télécharge Node.js sur https://nodejs.org (LTS).

---

## Étape 1 — Choisir 10 publications à tester

C'est l'étape **la plus importante**. Le test n'a de valeur que si les 10 URLs couvrent **tous les cas** qu'un utilisateur de RecetteBox pourrait rencontrer.

### Les 6 types de contenu à couvrir

Ouvre Insta et TikTok et récupère **2 URLs par type** (cuisine de préférence, mais pas obligatoire) :

| # | Type | Où le trouver |
|---|---|---|
| 1-2 | **Reel Instagram vidéo** (30 s à 3 min) | Onglet « Reels » Instagram |
| 3-4 | **Carrousel photo Instagram** (plusieurs photos, recette en légende) | Fil principal Instagram |
| 5-6 | **Photo unique Instagram** (1 photo, recette en légende) | Fil principal Instagram |
| 7-8 | **Vidéo TikTok classique** | Application TikTok |
| 9-10 | **TikTok Photo Mode** (slideshow de photos) | TikTok, posts avec « 1/N » en bas |

**Astuce TikTok Photo Mode :** cherche `#recette` sur TikTok et repère les posts qui montrent un petit numéro « 1/N » en bas — c'est un slideshow.

### Comment récupérer l'URL d'une publication

- **Instagram (Reel ou post)** : sur le post, trois petits points en haut à droite → « Copier le lien ». Format : `https://www.instagram.com/p/XXXXX/` ou `https://www.instagram.com/reel/XXXXX/`.
- **TikTok** : sur la vidéo, bouton « Partager » (flèche) → « Copier le lien ». Format : `https://www.tiktok.com/@auteur/video/123456789` ou `https://vm.tiktok.com/XXXXX/`.

### Mettre les URLs dans le fichier

1. Dans `recettebox/backend/scripts/`, **copie** `urls.example.json` et **renomme la copie en `urls.json`**.
2. Ouvre `urls.json` avec un éditeur de texte. Remplis les 10 entrées. Garde guillemets et virgules.

**Checkpoint étape 1 :** tu as un `urls.json` avec 10 URLs remplies.

---

## Étape 2 — Créer un compte Apify (candidat principal)

1. Va sur https://apify.com → **« Sign up »** (gratuit, pas de CB demandée).
2. Une fois connecté, va sur le **store des actors** : https://apify.com/store.
3. Cherche **« Instagram Scraper »** → choisis celui édité par `apify` (logo officiel, le plus populaire). Clique dessus.
4. En haut à droite, **« Try for free »** (ou « Use latest version »). Pas besoin de le lancer manuellement — on passe par l'API.
5. Refais la même chose pour **« TikTok Scraper »** — actor recommandé : `clockworks/tiktok-scraper`.
6. Pour récupérer ta clé API : avatar en haut à droite → **« Settings »** → onglet **« Integrations »** ou **« API & Integrations »**.
7. Cherche **« Personal API token »** et copie la valeur (chaîne `apify_api_xxxxx...`).
8. **Note aussi les identifiants des deux actors** :
   - Instagram : ressemble à `apify~instagram-scraper`
   - TikTok : ressemble à `clockworks~tiktok-scraper`

> Le tilde `~` remplace le slash `/` dans l'API d'Apify. Pas d'inquiétude si ça paraît bizarre.

**Checkpoint étape 2 :** tu as 3 informations :
- Un token API personnel (`apify_api_...`)
- Un actor ID Instagram (`apify~instagram-scraper`)
- Un actor ID TikTok (`clockworks~tiktok-scraper`)

---

## Étape 3 — Créer un compte RapidAPI (backup)

1. Va sur https://rapidapi.com → **« Sign Up »** (Google ou GitHub pour gagner du temps).
2. Dans la barre de recherche, tape **« instagram scraper »**. Choisis une API populaire — recommandation : **« Instagram Scraper API »** par RestyleDev ou **« Instagram Best Experience »** (regarde le nombre d'abonnés et la note).
3. Sur la page de l'API, **« Subscribe to Test »** ou **« Pricing »** → souscris au plan **Free / Basic** (100-500 requêtes/mois, largement suffisant).
4. Refais pareil pour une **API TikTok** — recherche « tiktok scraper », abonne-toi au plan gratuit (ex : **« TikTok Scraper »** par tikwm).
5. Une fois les 2 souscriptions actives, va sur **avatar en haut à droite → « My Apps »**.
6. Tu as une **clé X-RapidAPI-Key** unique pour ton compte. Affiche-la (œil) et copie-la.
7. **Note aussi les noms d'hôte** des deux APIs :
   - Pour Instagram : onglet **« Endpoints »** → **« Code Snippets »** → cherche l'hôte du style `instagram-scraper-api2.p.rapidapi.com`.
   - Pour TikTok : pareil, ex : `tiktok-scraper7.p.rapidapi.com`.
8. **Note aussi le chemin de l'endpoint** Instagram et TikTok. Dans l'onglet « Endpoints » de chaque API, tu vois la liste des endpoints disponibles. Choisis celui qui prend une URL en paramètre (ex : `/v1/post_info?code_or_id_or_url=` ou `/post-info?url=`). Le chemin commence par `/` et finit par `=` (avant où l'URL est insérée).

**Checkpoint étape 3 :** tu as 5 informations :
- Une clé `X-RapidAPI-Key`
- Un hôte Instagram (ex : `instagram-scraper-api2.p.rapidapi.com`)
- Un chemin Instagram (ex : `/v1/post_info?code_or_id_or_url=`)
- Un hôte TikTok (ex : `tiktok-scraper7.p.rapidapi.com`)
- Un chemin TikTok (ex : `/?url=`)

---

## Étape 4 — Remplir le fichier `.env.local`

1. Dans `recettebox/backend/scripts/`, **copie** `.env.local.example` et **renomme la copie en `.env.local`** (le point au début est important).
2. Ouvre `.env.local` avec un éditeur de texte.
3. Remplis les valeurs avec ce que tu as récupéré aux étapes 2 et 3. Le fichier est commenté pour t'aider.

**⚠️ Très important :** ce fichier contient des **secrets**. Ne le partage avec personne. Le dossier est déjà configuré pour ne pas le pousser sur Git.

**Checkpoint étape 4 :** ton `.env.local` est rempli et sauvegardé.

---

## Étape 5 — Lancer le script de test

1. Ouvre PowerShell.
2. Navigue dans le dossier scripts :
   ```powershell
   cd "C:\Users\Windows 11\Documents\RECETTE BOX APP\recettebox\backend\scripts"
   ```
3. Lance le script :
   ```powershell
   node test-providers.mjs
   ```
4. Tu vas voir défiler dans la console :
   ```
   [1/10] Reel Insta vidéo #1 (instagram-reel)
        https://www.instagram.com/reel/ABC123/
        -> Apify        OK (4321 ms)
        -> RapidAPI     OK (842 ms)
   [2/10] ...
   ```
5. Le script teste les **10 URLs × 2 providers = 20 requêtes**. Compte 3 à 6 minutes selon la latence (Apify est plus lent qu'un appel API classique car il lance un actor).
6. Quand c'est fini :
   ```
   Done. Results saved in ./results/
   Summary saved in ./results/summary.md
   ```

**Si le script échoue** : regarde le message d'erreur, vérifie que les clés du `.env.local` sont bien copiées (pas d'espace en trop, pas de guillemets autour), et relance.

**Checkpoint étape 5 :** le script a terminé, un dossier `results/` a été créé.

---

## Étape 6 — Lire les résultats

Dans `recettebox/backend/scripts/results/` :
- Un sous-dossier par provider : `apify/`, `rapidapi/`.
- Dans chaque, un fichier JSON par URL (la réponse brute).
- À la racine, un fichier **`summary.md`** avec le récap.

### Comment juger la qualité

Ouvre `summary.md`. Pour chaque URL × provider, tu vois :
- **Status** : OK / FAIL.
- **Latence** : temps de réponse en millisecondes.
- **Champs clés détectés** : présence/absence de vidéo, photos, légende, auteur, contenu multi-média.

Pour les cas litigieux (ex : carrousel où le provider ne renvoie qu'une seule photo), ouvre le JSON brut dans le sous-dossier correspondant et regarde toi-même.

### Critères pondérés à appliquer

| Critère | Poids | Comment l'évaluer |
|---|---|---|
| **Taux de succès global** | 30 % | Combien d'URLs sur 10 ont reçu une réponse exploitable. |
| **Support carrousel Insta complet** | 25 % | **Éliminatoire :** si un provider ne renvoie pas TOUS les items d'un carrousel, on l'écarte. |
| **Support TikTok Photo Mode** | 20 % | Idem : toutes les photos dans l'ordre. |
| **Latence moyenne** | 10 % | < 2 s = excellent, 2-5 s = acceptable, > 5 s = problématique. Note : Apify est nativement plus lent (~3-5 s) à cause du modèle « actor », c'est normal. |
| **Prix par requête** | 15 % | Estimation pour 1 000 imports/mois (volume V1.0 cible). Voir les pages pricing des 2 services. |

---

## Étape 7 — Remplir la matrice et me revenir

1. Ouvre `recettebox/backend/scripts/matrix.md`.
2. Remplis les colonnes (notes de 0 à 5 par critère).
3. À la fin, écris :
   - Le **provider gagnant**.
   - **Pourquoi** ce choix (2-3 phrases).
   - Le **plan tarifaire** retenu + coût mensuel attendu.

4. Reviens vers moi (Claude) avec ce résumé. Je code l'intégration du provider gagnant dans le worker Railway, on redéploie, on teste sur une vraie URL.

---

## En cas de pépin

- **Le script ne démarre pas / erreur Node** → `node --version` doit retourner >= v18.
- **Apify retourne tout le temps 401** → vérifie que ton token est bien copié sans espace, et que tu as accepté les conditions d'utilisation des deux actors (clique « Try for free » sur chaque page d'actor).
- **Apify retourne un payload vide ou avec une erreur dans le JSON** → l'actor a peut-être un format d'input différent. Ouvre la page de l'actor, regarde la section « Input » et adapte l'input dans `test-providers.mjs` (variable `input` dans la fonction `apify.fetch`).
- **RapidAPI retourne 401 / 403** → la clé est mauvaise, ou tu n'es pas abonné à l'endpoint, ou tu as mis le mauvais `host`/`path` dans `.env.local`. Repasse à l'étape 3.
- **RapidAPI retourne 429** → quota gratuit dépassé. Improbable pour 10 URLs.
- **Tu n'arrives pas à choisir** → reviens vers moi avec le `summary.md` et je t'aide à arbitrer.

Bon courage. C'est l'étape la plus « bizarre » du projet mais elle débloque tout le reste.
