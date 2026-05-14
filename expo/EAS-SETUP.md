# Guide — Premier build EAS pour RecetteBox

> À lire après la création de `eas.json` (faite par Claude). Ce guide regroupe **tout ce que tu dois faire toi-même** côté Expo, Apple, Google, pour pouvoir lancer ton premier build.

---

## Vue d'ensemble

| Étape | Quoi | Coût | Temps |
|---|---|---|---|
| A | Décisions à acter (irréversibles côté stores) | gratuit | 15 min |
| B | Nettoyer les artefacts Rork de `app.json` | gratuit | 10 min |
| C | Créer un compte Expo et installer EAS CLI | gratuit | 15 min |
| D | Configurer la variable secrète Supabase | gratuit | 5 min |
| E | Premier build `development` (test) | 0–25 € / mois selon plan EAS | 30–60 min de build |
| F | Compte Apple Developer + Google Play Console | 99 $ / an Apple + 25 $ une fois Google | à faire avant `production` |

---

## Étape A — Décisions à acter

### A.1 — Bundle Identifier iOS et Package Android

C'est **l'identifiant unique** de ton app sur les stores. Il sera publié à perpétuité, donc à choisir avec soin.

**Proposition par défaut (cohérente avec ton domaine email `polynetia.com`) :**

```
iOS  : com.polynetia.recettebox
Android : com.polynetia.recettebox
```

Si ce n'est pas le bon (ex : tu vas publier sous une autre entité), remplace partout par ton choix.

> **Pourquoi ça compte :** une fois la première soumission à Apple ou Google faite avec un identifiant, tu ne peux plus en changer pour la même app. Tu devrais créer une nouvelle app dans le store.

### A.2 — Slug Expo

Le slug est l'identifiant côté Expo (et l'URL `expo.dev/@TON_COMPTE/SLUG`). Actuellement c'est `xg9kqzo329589e398hye3` (généré par Rork).

**Proposition :** `recettebox`.

### A.3 — Scheme (deep links)

Le scheme permet de rouvrir ton app depuis un lien `recettebox://...` (utilisé pour la Share Extension R2.1). Actuellement c'est `rork-app`.

**Proposition :** `recettebox`.

### A.4 — Nom Expo Owner (compte ou organisation)

Quand tu créeras ton compte Expo, choisis un nom de compte ou crée une organisation. Recommandation : `polynetia` (cohérent avec ton email).

---

## Étape B — Nettoyer `app.json`

Ouvre `recettebox/expo/app.json` et fais ces 4 changements (préserve tout le reste) :

### B.1 — Slug

```diff
-    "slug": "xg9kqzo329589e398hye3",
+    "slug": "recettebox",
```

### B.2 — Scheme

```diff
-    "scheme": "rork-app",
+    "scheme": "recettebox",
```

### B.3 — Bundle / package

```diff
     "ios": {
       "supportsTablet": false,
-      "bundleIdentifier": "app.rork.xg9kqzo329589e398hye3"
+      "bundleIdentifier": "com.polynetia.recettebox"
     },
     "android": {
       ...
-      "package": "app.rork.xg9kqzo329589e398hye3"
+      "package": "com.polynetia.recettebox"
     },
```

### B.4 — Retirer l'option `origin` Rork du plugin expo-router

```diff
     "plugins": [
-      [
-        "expo-router",
-        {
-          "origin": "https://rork.com/"
-        }
-      ],
+      "expo-router",
       "expo-font",
       "expo-web-browser"
     ],
```

### B.5 — Ajouter le bloc `owner` et `extra.eas.projectId` (rempli automatiquement plus tard par `eas init`)

Pas besoin de le faire à la main : `eas init` ajoutera ce bloc automatiquement à l'étape C.

> **Important :** ces changements vont **casser ton script `npm run start` actuel** (qui passe par Rork). Si tu veux continuer à utiliser Rork en parallèle, ne fais pas l'étape B tant que tu n'as pas migré le workflow de dev vers `npx expo start --dev-client` (qui marche avec custom dev build après l'étape E).

---

## Étape C — Compte Expo et EAS CLI

### C.1 — Créer un compte Expo

1. Va sur https://expo.dev.
2. Clique **« Sign up »**. Tu peux te connecter avec GitHub ou Google.
3. (Optionnel mais recommandé) Crée une **Organization** depuis ton dashboard si tu veux un nom de compte propre (ex : `polynetia`). Sinon ton username perso fera office d'owner.

### C.2 — Installer EAS CLI

Dans PowerShell, à la racine du projet expo :

```powershell
cd "C:\Users\Windows 11\Documents\RECETTE BOX APP\recettebox\expo"
npm install -g eas-cli
eas --version
```

Tu dois voir une version du type `15.x.x` ou plus.

### C.3 — Se connecter

```powershell
eas login
```

Saisis tes identifiants Expo. Une fois loggué :

```powershell
eas whoami
```

Tu dois voir ton username.

### C.4 — Lier le projet à ton compte

```powershell
eas init
```

EAS va :
- Te demander de choisir l'owner (ton compte ou ton organisation).
- Te demander de confirmer le slug `recettebox` (ou en générer un nouveau).
- **Modifier `app.json` automatiquement** pour ajouter `owner` et `extra.eas.projectId`.

**Si EAS te demande de garder ou supprimer le slug existant `xg9kqzo329589e398hye3`, choisis "create new" avec slug `recettebox`** (sinon tu vas linker à un projet Rork que tu ne contrôles pas).

---

## Étape D — Variable secrète Supabase

Le fichier `eas.json` référence une variable `$EXPO_PUBLIC_SUPABASE_ANON_KEY` qui n'est pas encore définie. On va la créer en secret EAS (elle sera injectée dans tous les builds).

### D.1 — Récupérer la clé anon depuis Supabase

1. Va sur https://supabase.com/dashboard/project/drymgrccydkntskrpjgu.
2. Clique sur **Settings → API Keys** (icône engrenage en bas à gauche).
3. Tu vois deux clés : `anon` (publique) et `service_role` (secrète). **Copie la clé `anon`** — c'est la longue chaîne `eyJ...` (JWT).

> **Précision :** la clé `anon` est conçue pour être publique côté client. On la passe par EAS Secret par cohérence avec les futures vraies clés sensibles (RevenueCat, etc.).

### D.2 — Stocker la clé dans EAS Secrets

```powershell
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "COLLE_LA_CLE_ICI" --type string
```

Pour vérifier :

```powershell
eas secret:list
```

Tu dois voir une ligne avec `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

---

## Étape E — Premier build `development`

C'est un **custom dev build** : un installateur de RecetteBox que tu poses sur ton iPhone (ou Android) en remplacement d'Expo Go. Il permet de tester la Share Extension, les notifications push, etc. — des choses qu'Expo Go ne supporte pas.

### E.1 — Lancer le build iOS

```powershell
eas build --profile development --platform ios
```

EAS va :
- Te demander de configurer l'identifiant iOS (`com.polynetia.recettebox`) — confirmer.
- Te demander un **Apple Developer ID** (compte 99 $/an Apple). Si tu ne l'as pas encore, EAS peut en utiliser un temporaire pour tester sur ton propre device (cf. F).
- Lancer le build dans le cloud Expo (~20-40 min).
- À la fin : un lien pour télécharger le `.ipa`, ou un QR code pour installer directement sur ton iPhone.

### E.2 — Lancer le build Android

```powershell
eas build --profile development --platform android
```

Beaucoup plus simple : pas de compte Google Play requis pour un APK de dev. Tu télécharges le `.apk` à la fin et tu l'installes sur ton téléphone Android (autorise les sources inconnues).

### E.3 — Installer et tester

- **iOS :** scanne le QR code avec la caméra. Tu devras peut-être faire confiance au profil dans `Réglages > Général > VPN et gestion d'appareil`.
- **Android :** ouvre le `.apk` téléchargé.

Une fois installé, lance l'app depuis ton écran d'accueil (pas via Expo Go). Le dev menu reste accessible (secouer l'appareil).

Pour le développement live, lance Metro :

```powershell
npx expo start --dev-client
```

---

## Étape F — Avant un build `production`

À faire **uniquement quand tu seras prêt à soumettre aux stores** (pas tout de suite).

### F.1 — Apple Developer Program

- 99 $ / an.
- Inscription : https://developer.apple.com/programs/enroll/.
- Compte personnel ou entité juridique (ex : Polynetia SAS si elle existe).
- Une fois inscrit, dans App Store Connect, crée une app avec le bundle `com.polynetia.recettebox`.
- Note l'`appleId` (ton email Apple Dev), l'`ascAppId` (ID dans App Store Connect) et le `appleTeamId` (Team ID dans le portail dev).

Puis configure les secrets :

```powershell
eas secret:create --scope project --name APPLE_ID --value "ton.email@apple.dev" --type string
eas secret:create --scope project --name ASC_APP_ID --value "1234567890" --type string
eas secret:create --scope project --name APPLE_TEAM_ID --value "ABCD123456" --type string
```

### F.2 — Google Play Console

- 25 $ une fois (à vie).
- Inscription : https://play.google.com/console/.
- Crée une app avec le package `com.polynetia.recettebox`.
- Génère une **clé de service account** (Google Cloud Console → IAM → Service Accounts → Create key → JSON).
- Place le fichier JSON à `recettebox/expo/google-play-service-account.json` (déjà référencé dans `eas.json`).
- **Ajoute ce fichier au `.gitignore`** du projet expo pour ne pas le committer.

### F.3 — Lancer un build production

```powershell
eas build --profile production --platform ios
eas build --profile production --platform android
```

### F.4 — Soumettre

```powershell
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

---

## Récap des 3 profils EAS

| Profil | Pour quoi | Distribution | iOS | Android |
|---|---|---|---|---|
| `development` | Dev local avec Metro (remplace Expo Go) | internal (QR code) | dev client | APK |
| `preview` | Tests internes / beta | internal | release | APK |
| `production` | Soumission stores | store | release | App Bundle (.aab) |

---

## En cas de pépin

- **`eas init` te propose de garder le slug Rork** → choisis "create new" avec `recettebox`.
- **Build iOS échoue : provisioning profile** → c'est lié à Apple Developer. Sans compte payant, EAS peut générer un provisioning ad hoc pour ton device (utilise `--profile development` et accepte les prompts).
- **Build Android échoue : Gradle / SDK mismatch** → souvent un cache. Relance avec `eas build --clear-cache`.
- **« plugin not compatible »** → lié à `expo-router` ou autre. Vérifie que tu as bien retiré le bloc `origin: rork.com` à l'étape B.4.

---

## Quand tu auras fini

Reviens vers moi avec :
- Le numéro du build iOS qui a réussi (ou le message d'erreur si bloqué).
- Idem Android.
- Confirmation que `eas secret:list` montre `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

Je passerai ensuite à l'étape suivante (auth / connexion app↔backend) en sachant que l'app peut tourner en custom dev build.
