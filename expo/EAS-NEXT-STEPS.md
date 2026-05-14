# EAS — Étapes manuelles à faire côté toi

> Setup réalisé par Claude le 14/05/2026 : `app.json` nettoyé (slug `recettebox`, scheme `recettebox`, plugin Rork retiré), EAS CLI v18.12.3 installé globalement, fichier `eas.json` déjà en place.
>
> **Reste 3 étapes manuelles** (compte Expo + login + secret) — décrites ci-dessous, ~15 min cumulées.

---

## ⚠️ Bundle ID — encore en placeholder

`app.json` contient toujours `app.rork.xg9kqzo329589e398hye3`. C'est OK pour les dev builds, mais **à trancher avant le 1er build production ou la 1re soumission store** — voir [BUNDLE-ID-TODO.md](./BUNDLE-ID-TODO.md).

---

## Étape 1 — Créer un compte Expo (~3 min)

1. Va sur https://expo.dev.
2. Clique **« Sign up »** (GitHub ou Google → plus rapide qu'un mot de passe à part).
3. (Optionnel mais recommandé) Dans ton dashboard, crée une **Organization** `polynetia` (cohérent avec ton email). Tu choisis cette org comme owner à l'étape `eas init`. Sinon ton username perso fera l'affaire.

---

## Étape 2 — `eas login` (~1 min)

Dans PowerShell, depuis n'importe quel dossier :

```powershell
eas login
```

Saisis tes identifiants Expo. Pour vérifier :

```powershell
eas whoami
```

Tu dois voir ton username (ou nom d'org).

---

## Étape 3 — `eas init` (~2 min)

Depuis le dossier Expo :

```powershell
cd "C:\Users\Windows 11\Documents\RECETTE BOX APP\recettebox\expo"
eas init
```

EAS va :
- Te demander l'owner → choisir ton compte ou ton org `polynetia`.
- Détecter le slug `recettebox` dans app.json.
- **⚠️ S'il te demande "An EAS project with this slug already exists. Link to it?"**, choisis **« Create new project »** (sinon tu vas linker à un projet Rork orphelin).
- Modifier `app.json` automatiquement pour ajouter `owner` + `extra.eas.projectId` (c'est normal, accepte).

---

## Étape 4 — Récupérer la clé Supabase anon (~2 min)

1. Va sur https://supabase.com/dashboard/project/drymgrccydkntskrpjgu.
2. **Settings → API Keys** (icône engrenage en bas à gauche).
3. Copie la clé **`anon` / `publishable`** — c'est une longue chaîne `eyJ...` (JWT) ou `sb_publishable_...` selon le format actuel Supabase.

> Ne pas copier la clé `service_role` (secrète). On ne veut que la `anon` côté app.

---

## Étape 5 — Créer le secret EAS (~1 min)

```powershell
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "COLLE_LA_CLE_ICI" --type string
```

Vérifier :

```powershell
eas secret:list
```

Tu dois voir une ligne `EXPO_PUBLIC_SUPABASE_ANON_KEY` (la valeur reste masquée — c'est normal).

---

## Quand tu as fini les 5 étapes

Reviens vers moi et je vérifierai qu'on peut lancer un build de dev (N1.2 / N1.3 du TASKS3). À ce moment-là, soit on tranche le bundle ID définitif, soit on lance un build avec le placeholder Rork pour valider le pipeline et trancher après.

---

## En cas de pépin

| Symptôme | Solution |
|---|---|
| `eas init` propose de garder le slug Rork `xg9kqzo329589e398hye3` | Choisir **"Create new"** avec slug `recettebox` |
| `eas login` : "your account requires 2FA" | Active 2FA dans expo.dev → Account Settings, puis re-run |
| `eas secret:create` : "project not initialized" | Vérifier qu'on est bien dans `recettebox/expo/`, que `eas init` a tourné, et que `extra.eas.projectId` existe dans `app.json` |
