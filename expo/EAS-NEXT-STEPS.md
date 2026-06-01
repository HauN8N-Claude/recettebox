# EAS / Build — Où on en est & comment reprendre

> **Dernière mise à jour : 28/05/2026.**
> Ce fichier est le **point de reprise** pour fabriquer l'app (builds EAS). Il est volontairement auto-suffisant pour qu'on puisse reprendre depuis n'importe quelle session/chat, même sans mémoire.

---

## ✅ Ce qui est DÉJÀ fait (ne pas refaire)

- **Compte Expo connecté** : `polynetia` (`contact@polynetia.com`). Vérif : `eas whoami`.
- **Projet EAS relié** : `@polynetia/recettebox`, projectId `c848d9e2-c51b-44a4-8ea1-23cc46ae242a` (dans `app.json`).
- **Nom technique (bundle ID) tranché** : `com.recettebox.app` (iOS + Android) dans `app.json`.
- **Secret Supabase EAS** : `EXPO_PUBLIC_SUPABASE_ANON_KEY` posé (3 environnements). Rien à refaire.
- **`expo-dev-client` ajouté** (`~6.0.21`) + **`bun.lock` généré**.
- **🔑 BUG DES BUILDS CORRIGÉ** (voir section dédiée plus bas).
- **1er build Android RÉUSSI** le 28/05 (id `3c94e211-185d-4c70-a807-48f9fa0ebbf4`) → la chaîne de build fonctionne.

## ⏸️ CE QU'IL RESTE À FAIRE — build iPhone

Une seule chose bloque : **enregistrer l'iPhone** (manip manuelle, exige le téléphone physique). En pause au 28/05 car l'iPhone n'était pas dispo.

### Étape 1 (user) — Enregistrer l'iPhone
1. Double-cliquer le raccourci sur le Bureau : **`RecetteBox - Enregistrer iPhone.cmd`**
   (équivaut à : `cd recettebox/expo` puis `eas device:create`, avec les variables ASC ci-dessous déjà positionnées).
2. Répondre : `use the polynetia account?` → **Y** ; méthode → **Website** ; **scanner le QR avec l'iPhone** → installer le profil (Réglages → Profil téléchargé → Installer).
3. Si un login Apple est demandé → utiliser le **compte Apple DÉVELOPPEUR** (le nouveau), pas le compte perso de l'iPhone.

### Étape 2 (Claude/agent) — Lancer le build iOS
Depuis `recettebox/expo`, en positionnant ces variables d'environnement puis :
```
EAS_NO_VCS=1 eas build --profile development --platform ios --non-interactive
```
Variables d'authentification Apple (clé App Store Connect) :
- `EXPO_ASC_API_KEY_PATH` = `C:\Users\Windows 11\Downloads\AuthKey_PZL26QW9W2.p8`
- `EXPO_ASC_KEY_ID` = `PZL26QW9W2`
- `EXPO_ASC_ISSUER_ID` = `132d0eef-0876-4944-8711-83d9617e870d`
- `EXPO_APPLE_TEAM_ID` = *(à ajouter seulement si EAS ne détecte pas l'équipe tout seul ; sur developer.apple.com → Membership)*

> 🔒 Le fichier `.p8` est le SECRET (à garder, non re-téléchargeable, **hors Git**). Key ID + Issuer ID ne sont pas des secrets en eux-mêmes.

### Étape 3 (user) — Installer sur l'iPhone
Ouvrir le lien/QR du build terminé sur l'iPhone, installer. 1ère ouverture : peut demander de « Se fier » au développeur (Réglages → Général → VPN et gestion de l'appareil).

---

## 🔑 BUG DES BUILDS — corrigé (ne pas régresser !)

**Symptôme :** les 3 premiers builds Android échouaient (`EAS_BUILD_UNKNOWN_GRADLE_ERROR` → erreur de compilation Kotlin).
**Cause :** 2 dépendances dans une **mauvaise version majeure** (probablement posées par Rork) :
- `expo-device` était en `^55.0.16` → corrigé en **`~8.0.10`**
- `expo-notifications` était en `^55.0.22` → corrigé en **`~0.32.17`**

Ces versions `55.x` n'existent pas pour Expo SDK 54 et cassaient la compilation native. 10 versions au total ont été réalignées sur les versions officielles SDK 54 (`npx expo-doctor` doit passer au vert pour ces points). **NE JAMAIS remettre `expo-device`/`expo-notifications` en `55.x`.**

---

## ⚙️ Particularités de CETTE machine / projet (important pour les commandes)

- **`eas` n'est PAS dans le PATH du PowerShell du user** (son terminal dit « eas n'est pas reconnu »). Chemin réel : `C:\Users\Windows 11\AppData\Roaming\npm\eas.cmd`. → Piloter EAS depuis l'agent, ou via les raccourcis `.cmd` du Bureau.
- **Ne PAS lancer un `bun install` complet** sur cette machine : ça a saturé la mémoire (erreur paging file `0x800705af`). `node_modules` n'est pas installé en local. Pour (re)générer le lockfile : **`bun install --lockfile-only`** (léger). npm échoue de toute façon (conflit de peer deps lucide-react-native vs React 19 → **bun obligatoire**).
- **`EAS_NO_VCS=1` est nécessaire pour les builds** : le repo a beaucoup de travail **non commité** (reveal, paywall, processing, package.json, bun.lock, app.json…). Sans `EAS_NO_VCS=1`, EAS build n'utilise que l'état commité (ancien code avec le bug). Avec, il build le dossier de travail actuel (respecte `.gitignore`).
- ⚠️ **À FAIRE bientôt** : commiter tout ce travail non commité (sécurité — sinon risque de perte). À valider avec le user avant (pas encore fait au 28/05).

---

## 🍎 Note — deux comptes Apple
Le user a créé un **nouvel Apple ID** pour le compte Apple Developer. Son iPhone est sur son **Apple ID perso**. Pas de conflit : l'enregistrement de l'iPhone se fait par l'UDID (matériel), indépendamment du compte connecté. L'iPhone garde son compte perso. Si un login Apple est demandé par les outils → utiliser le **nouveau (développeur)**.
