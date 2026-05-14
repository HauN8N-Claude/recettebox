# ⚠️ TODO — Choisir le bundle identifier définitif

**Statut au 14/05/2026 :** `app.json` contient encore le bundle/package généré par Rork :

```
ios.bundleIdentifier  = app.rork.xg9kqzo329589e398hye3
android.package       = app.rork.xg9kqzo329589e398hye3
```

## ⛔ À NE SURTOUT PAS FAIRE avant d'avoir tranché

- **Ne pas lancer `eas build --profile production`** tant que le bundle ID n'est pas définitif.
- **Ne pas soumettre à App Store Connect ou Google Play** : une fois la première soumission faite avec un identifiant, c'est gravé à perpétuité. Tu devras créer une nouvelle app dans le store si tu veux en changer ensuite.

## ✅ OK à faire avec le bundle Rork actuel

- `eas init` — il va simplement lier le projet au slug `recettebox`.
- `eas build --profile development --platform ios/android` — les dev builds peuvent vivre avec un bundle Rork, ils ne sont jamais publiés sur les stores.

## Options proposées (cf. EAS-SETUP.md)

| Bundle ID | Avantage |
|---|---|
| `com.polynetia.recettebox` | Cohérent avec ton domaine email `polynetia.com`. Recommandé par défaut. |
| `app.polynetia.recettebox` | Variante préfixe `app.` (rare, lisible). |
| `com.recettebox.app` | Identité dédiée à l'app, sans rattachement Polynetia (utile si cession future). |

## Comment appliquer le choix une fois pris

Édite `recettebox/expo/app.json` :

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

Puis re-run `eas build --profile development --platform ios` (et android) pour regénérer les dev builds avec le nouvel identifiant.

## Quand impérativement trancher

**Avant tout build `preview` ou `production`**, et **avant la première soumission TestFlight / Play Console Internal Testing**.
