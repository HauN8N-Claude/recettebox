# Share Extension — Plan d'attaque V1.0

> **Doc de référence pour le Sprint 2 (Share Extension iOS + Android).**
> À lire avant de toucher au moindre fichier.
>
> **Statut :** plan validé suite à 2 passes de recherche (état des plugins 2026, retours d'expérience devs, doc Apple/Google, audit code backend existant).
> **Date :** 13/05/2026.
> **Ne contient AUCUN code à appliquer** — c'est un plan, pas un patch.

---

## 1. TL;DR (à lire en priorité)

**Ce qu'on construit :** quand l'utilisateur fait "Partager" sur un Reel Insta ou une vidéo TikTok, RecetteBox apparaît dans la liste. Il tape, l'URL part vers notre backend, l'app s'ouvre sur un écran de progression, et la recette atterrit dans sa biblio.

**Les 5 points à retenir :**

1. ✅ **Un seul plugin couvre iOS + Android** : `expo-share-intent` (`achorein/expo-share-intent`, v5.x pour SDK 54). Pas besoin de deux outils différents comme initialement prévu dans TASKS3.

2. 🎯 **Stratégie d'extension recommandée = "passe-plat"** : l'extension elle-même fait quasi rien — elle capture l'URL et rouvre l'app principale via deep link `recettebox://import?url=...`. Toute la logique (auth, POST API, écran progression) vit dans l'app principale. C'est l'approche moderne utilisée par WhatsApp, Pinterest, Pocket.

3. 🚧 **Bloquant calendaire : compte Apple Developer payant obligatoire** (99 $/an). Sans lui, les App Groups et les Keychain Sharing ne marchent pas — même pas sur ton iPhone perso. Inscription en cours côté user → 24-48h d'attente avant tout travail concret iOS.

4. ⚠️ **3 tâches "cachées" non listées dans TASKS3** à ajouter au planning :
   - Tâche zéro audit payload Insta/TikTok sur devices réels (+0,5 j)
   - Tests réels NSExtensionActivationRule (+0,5 j)
   - Buffer review Apple + ajustements entitlements (+0,5 j)

5. 📅 **Effort révisé : ~6 j actifs + 1-2 j attente Apple = 7-8 j calendaires** (vs 4,5 j prévus initialement dans TASKS3). Pas un drame, juste à intégrer au calendrier.

**Le risque produit principal :** Apple peut refuser au premier submit pour "accès contenu tiers non autorisé" (guideline 5.2), probabilité ~20-30 %. Mitigation : note de submission soignée + positionnement "recipe extraction" + zéro player vidéo dans l'app. Détaillé section 7.

---

## 2. Stratégie d'extension : décision d'architecture critique

**Deux modèles possibles. On part sur le premier.**

### Modèle A — "Passe-plat" (recommandé)

**Ce que voit l'utilisateur :**
1. Tap "Partager" sur un Reel Insta → liste des apps apparaît
2. Tap "RecetteBox" → la share sheet se referme instantanément
3. RecetteBox s'ouvre sur l'écran de progression d'import
4. Quand l'import est fini → fiche recette

**Ce qui se passe techniquement :**
- L'extension iOS/Android capture juste l'URL partagée
- Elle ouvre l'app principale via deep link `recettebox://import?url=https%3A%2F%2Finstagram.com%2Freel%2F...`
- L'app principale (déjà loggée) lit l'URL, appelle l'Edge Function `imports`, redirige vers `/import/processing/{jobId}`

**Avantages :**
- ✅ Code de l'extension quasi nul (200 lignes natives auto-générées par le plugin)
- ✅ Pas de gestion du JWT auth dans l'extension (l'app principale a tout)
- ✅ Pas de problème mémoire 120 MB iOS (l'extension fait rien)
- ✅ Pas de problème process isolé Android (l'extension ne lit aucun storage)
- ✅ Maintenance future : modifier le flow d'import = modifier l'app, jamais l'extension

**Inconvénients :**
- ❌ L'utilisateur "sort" d'Instagram pendant l'import (vs une mini-sheet qui reste dans Insta)
- ❌ Si l'app est déjà fermée, cold-start ~1-2s avant l'écran progression

### Modèle B — "Extension autonome avec UI custom"

**Ce que voit l'utilisateur :**
1. Tap "Partager" sur un Reel → liste des apps
2. Tap "RecetteBox" → une mini-fenêtre apparaît DANS Instagram avec preview + bouton "Importer"
3. Tap "Importer" → spinner → "Envoyé ✓" → la fenêtre se ferme, l'utilisateur reste dans Insta
4. Optionnel : bouton "Ouvrir RecetteBox" qui deep-linke vers l'écran processing

**Inconvénients qui font qu'on n'y va PAS :**
- ❌ Doit gérer l'auth dans l'extension → Keychain partagé iOS + MMKV multi-process Android
- ❌ Limite mémoire 120 MB iOS = embarquer Supabase SDK et React Native dans l'extension est risqué
- ❌ Code natif Swift + Kotlin custom à maintenir
- ❌ Effort estimé : +3-4 jours

**Décision actée : Modèle A.**

À reconsidérer en V1.1+ si retours utilisateurs demandent "garder le contexte Insta pendant l'import".

---

## 3. Stack technique recommandée

| Élément | Choix | Pourquoi |
|---|---|---|
| **Plugin principal** | `expo-share-intent` v5.x (achorein) | Couvre iOS + Android dans un seul plugin, design passe-plat aligné avec notre archi, 583 stars, maintenu (latest avr 2026) |
| **Plugin secondaire** | Aucun | (Si jamais on bascule modèle B → `MaxAst/expo-share-extension` v5.0.6 pour iOS, mais on n'y va pas) |
| **Storage partagé extension ↔ app** | Aucun (inutile en modèle A) | L'extension ne lit/écrit rien |
| **Auth dans l'extension** | Aucune | L'extension fait juste un open URL, c'est l'app qui authentifie |
| **Deep link scheme V1.0** | `recettebox://` (custom scheme) | Plus simple à mettre en place qu'Universal Links, fiable pour ce cas |
| **Deep link V1.1+** | `https://recettebox.app/import?url=...` (Universal Links) | Quand le domaine sera acheté + AASA hébergé |
| **App Group iOS** | `group.com.recettebox.app` ✅ (acté 01/06/2026) | Convention `group.<bundle>`, aligné sur `com.recettebox.app`. Nécessaire même en modèle A pour qu'iOS autorise le deep link extension→app |
| **Bundle ID extension** | `<bundle-app>.ShareExtension` (auto-généré par expo-share-intent) | Convention standard |

### Versions à figer
- `expo-share-intent` : ^5.0.0 (compatible SDK 54)
- `expo` : 54.0.27 (déjà installé)
- `expo-router` : ~6.0.17 (déjà installé)

### Compléments si jamais on bascule modèle B (NON RECOMMANDÉ)
- `expo-secure-store` avec `accessGroup` (option ajoutée PR #36056 d'avril 2026)
- `react-native-mmkv` avec mode multi-process pour Android
- Adapter custom `expo-secure-store → Supabase Storage interface`
- Encryption de la session (limite 2048 bytes de SecureStore)

---

## 4. Flow utilisateur détaillé

### Cas nominal iOS

```
[Instagram - Reel cuisine]
  ↓ tap "Partager"
[Share Sheet iOS]
  ├── Messages
  ├── Mail
  ├── ⭐ RecetteBox      ← icône s'affiche grâce à NSExtensionActivationRule
  └── ...
  ↓ tap "RecetteBox"
[extension capture URL]  ← expo-share-intent natif, ~200ms
  ↓ openHostApp("import?url=...")
[App RecetteBox]
  ├── _layout.tsx capte le deep link
  ├── Si user pas loggué → redirige /auth/login (rare car app installée = souvent loggée)
  └── Si user loggué → router.push("/import?url=...")
[app/import.tsx — handler deep link, repurposé]
  ├── extrait l'URL des query params
  ├── POST /functions/v1/imports avec JWT Bearer
  ├── reçoit { jobId }
  └── router.replace("/import/processing/{jobId}")
[app/import/processing/[jobId].tsx — écran R2.1]
  ↓ écoute Realtime sur table imports
  └── status="done" → router.replace("/recipe/{recipeId}")
```

### Cas nominal Android

Identique iOS, sauf que :
- L'extension = activity de l'app principale (pas de process séparé)
- `expo-share-intent` capture via intent filter `ACTION_SEND` + lecture du `EXTRA_TEXT`
- Le reste du flow est strictement identique

### Cas d'erreurs (à brancher sur R2.5 plus tard)

| Erreur | D'où ça vient | Réaction app |
|---|---|---|
| URL non supportée (autre que Insta/TikTok) | Edge Function retourne 400 `UNSUPPORTED_PLATFORM` | Toast "On supporte Insta et TikTok pour le moment" + retour home |
| Quota free épuisé (3 imports à vie) | Edge Function retourne 429 `QUOTA_FREE_REACHED` | Modal "Tes 3 imports gratuits sont utilisés" + CTA Premium |
| Quota premium hard cap | 429 `QUOTA_PREMIUM_HARD_CAP` | Toast "Limite 60/30j atteinte" |
| Pas de réseau | fetch échoue | Toast "Pas de connexion, ressaie plus tard" (V1.0) — queue locale en V1.0.1 |
| Erreur backend 500 | Edge Function plante | Toast "Erreur côté serveur, ressaie" + log Sentry/PostHog (V1.0.1) |
| Worker plante en plein pipeline | imports.status devient `failed` avec error_message | Écran processing affiche l'erreur + bouton "Réessayer" |
| User pas loggué (rare) | Pas de session active | Redirige /auth/login, mémorise l'URL en attente, reprend après login |
| Double-tap "Partager" rapide | 2 jobs créés pour même URL | À gérer côté Edge Function (idempotence via hash URL+userId+5min) — **TODO ops à ajouter** |

---

## 5. Plan d'attaque révisé (8 tâches)

> ⚠️ Sprint 2 ne peut être attaqué qu'**après** Sprint 1 fini (sinon chaîne cassée — pas d'écran processing, pas de bibli connectée). Et **après** validation Apple Dev payant.

### N0 — Tâche zéro : audit payload Insta/TikTok sur devices réels [P0]
**Effort : 0,5 j. À faire AVANT N2.0.**

- Builder un mini script de log via la share extension d'un dev build minimaliste (peut être fait avec un Expo blank + expo-share-intent + un Alert qui dump le payload)
- Sur iPhone perso : partager 1 Reel Insta + 1 carrousel + 1 post photo + 1 TikTok vidéo + 1 TikTok Photo Mode → dumper la chaîne brute reçue par l'extension
- Sur Android perso : idem
- **Livrable :** tableau complété (annexe A1) avec la regex de parsing à utiliser

**Pourquoi cette tâche est critique :** la doc publique ne dit nulle part ce qu'Insta et TikTok envoient réellement. Sans ce test, on tâtonne pendant le sprint et on risque de pousser un parsing qui marche en démo mais pas en prod.

### N1.2 — Premier custom dev build iOS [P0]
**Effort : 0,5 j. Prérequis : compte Apple Dev validé.**

- Suivre `EAS-SETUP.md` étapes A à E (déjà rédigées)
- Nettoyer `app.json` (slug, scheme, bundle, package, plugin origin) → coordonner avec décision bundle ID
- `eas init` + `eas secret:create` + `eas build --profile development --platform ios`
- Installer sur iPhone perso, vérifier que l'app boot avec `newArchEnabled: true`

### N1.3 — Premier custom dev build Android [P0]
**Effort : 0,5 j. Pas de prérequis (Google Play pas nécessaire pour dev APK).**

- `eas build --profile development --platform android`
- Installer APK sur téléphone Android perso, vérifier boot
- Peut être fait EN PARALLÈLE de l'attente Apple Dev → débloque l'audit N0 côté Android

### N2.0 — Install plugin + config app.json [P0] ✅ FAIT le 02/06/2026
**Effort réel : ~0,25 j (config) — reste le re-build EAS.**

- ✅ `bun add expo-share-intent@5.1.1` — ⚠️ **épingler en 5.1.1** (peer `expo@^54`). `expo install` prend la **6.1.1 par erreur** qui exige **SDK 55** → incompatible SDK 54. Pin exact (pas `^5`) pour bloquer le saut en v6.
- ✅ `app.json` : bloc plugin `["expo-share-intent", {...}]` avec
  - `iosActivationRules` (WebURL=1, WebPage=1, Text=true) — cf. annexe A2
  - `iosAppGroupIdentifier: "group.com.recettebox.app"` (le plugin écrit les entitlements tout seul)
  - `iosShareExtensionName: "RecetteBox"`
  - `androidIntentFilters: ["text/*"]` (`text/*` = l'option la plus étroite que le plugin accepte ; pas de `text/plain`)
- ✅ `app/+native-intent.tsx` : route le deep link Share Extension `recettebox://dataUrl=recetteboxShareKey#<type>` → `/import`, **durci sécurité** (ne renvoie plus le path brut → anti open-redirect ; ne transmet qu'une URL `http(s)` validée).
- ✅ **`patch-package` NON nécessaire** : vérifié empiriquement, `expo prebuild -p ios` réussit (extension ajoutée, aucune erreur xcode) avec xcode@3.0.1 + Expo 54.0.34 + plugin 5.1.1. L'obligation de la doc est périmée pour cette combo.
- 🔲 **RESTE** : `expo prebuild --clean` + re-build dev clients EAS (iOS bloqué compte Apple ; Android faisable tout de suite). Les dossiers `ios/`/`android/` sont gitignored (générés par EAS).

### N2.1 — Handler deep link dans l'app principale [P0] ⚠️ PARTIEL — à re-câbler
**Effort restant : ~0,25 j.**

> 🔴 **BUG d'archi découvert le 02/06 (revue adversariale N2.0).** `app/import.tsx` lit la donnée via `useLocalSearchParams()` (`url`/`text`/`shared`), MAIS `expo-share-intent` ne passe **pas** l'URL en query param : elle est stockée côté natif et lue via le **hook `useShareIntent()`**. Résultat actuel : après un vrai partage, `import.tsx` ouvre l'écran d'aide « cul-de-sac » et n'importe **jamais**.
>
> **À faire pour finaliser N2.1 :**
> 1. Envelopper la racine dans `<ShareIntentProvider>` dans `app/_layout.tsx` (paquet `expo-share-intent`).
> 2. Dans `import.tsx`, lire `const { shareIntent } = useShareIntentContext()` et utiliser `shareIntent.webUrl ?? shareIntent.text` en complément des query params (qui restent utiles pour le deep link direct de test).
> 3. Gérer le cold-start (l'intent est en file avant le montage React — `useShareIntent` le récupère via `getShareIntent` au mount).
>
> ⚠️ `app/_layout.tsx` était en cours d'édition côté user (feature `SKIP_LOGIN_AFTER_ONBOARDING`) → coordonner avant de toucher ce fichier.

**Déjà en place (reste valable) :**

- Repurposé `app/import.tsx` (placeholder paste URL → handler), POST `/functions/v1/imports` + écran progression + gestion erreurs/quotas/paywall ✅
- Lecture des query params via `useLocalSearchParams()` Expo Router
- Si paramètre `url` présent :
  - Affiche un mini état de transition "On enregistre ta recette..."
  - POST vers `/functions/v1/imports` avec JWT Bearer (récupéré via `useAuth()`)
  - Récupère `{ jobId, status }`
  - `router.replace("/import/processing/" + jobId)` (R2.1 — sera créé par Sprint 1)
  - Gestion d'erreurs (cf. tableau section 4)
- Si pas de paramètre `url` (ouverture directe de l'écran) : afficher un message d'aide "Partage un Reel depuis Insta pour importer une recette"

### N2.2 — Test bout-en-bout iOS [P0]
**Effort : 0,5 j.**

- Sur iPhone perso : ouvrir Insta, partager 1 Reel vers RecetteBox → vérifier le flow complet jusqu'à la fiche recette
- Idem TikTok
- Tester les 5 cas d'erreurs principaux (URL non supportée, quota, etc.)
- Vérifier que l'icône RecetteBox apparaît bien dans Insta + TikTok (et pas partout) — NSExtensionActivationRule

### N2.3 — Test bout-en-bout Android [P0]
**Effort : 0,5 j.**

- Sur Android perso : idem N2.2
- Vérifier comportement quand l'app est cold-started vs déjà ouverte
- Vérifier que le texte plain partagé avec préfixe "Check this out: https://..." est bien parsé (regex extraction URL)

### N2.4 — Buffer review Apple + ajustements [P0]
**Effort : 0,5 j (à étaler sur la fenêtre de soumission).**

- Rédiger les App Review Notes (cf. section 7)
- Préparer captures d'écran qui montrent le flow share extension
- Préparer le plan B si refus : reformuler la description, adoucir le pitch "import de recettes" en "extraction de notes culinaires depuis liens publics"

### Total révisé
- **N0 + N1.2 + N1.3 + N2.0→N2.4 = 4 j actifs**
- + tâche cachée auth ou MMKV : 0 j (annulée grâce au modèle A passe-plat)
- + buffer review Apple : 0,5 j inclus dans N2.4
- + audit payload : 0,5 j inclus dans N0
- **Total actif : ~4 j**
- **Calendaire avec attente Apple : 5-6 j**

(Économie de ~1 j vs estimation initiale TASKS3 de 5 j, grâce au choix modèle A.)

---

## 6. Risques

### Bloquants techniques durs

1. **🚧 Compte Apple Dev validé requis avant tout test iOS sérieux.**
   - Mitigation : démarrer Android d'abord pendant l'attente. Audit payload Android peut commencer dès aujourd'hui.

2. **⚠️ `expo-share-intent` non explicitement déclaré compatible New Architecture.**
   - Mitigation : tester sur le dev build EAS dès N1.2. Si crash → rétrograder `newArchEnabled: false` (autorisé jusqu'à SDK 54, bloqué SDK 55+).

3. **⚠️ EAS profile cache peut désynchroniser les App Groups après ajout tardif** ([issue #40851](https://github.com/expo/expo/issues/40851)).
   - Mitigation : si build fail après ajout App Group → `eas credentials` reset profile, re-build.

### Risques produit

1. **🛑 Refus Apple sur guideline 5.2 (accès contenu tiers).**
   - Probabilité : 20-30 %.
   - Impact : 1-2 cycles submit perdus (1-2 semaines).
   - Mitigation : App Review Notes + positionnement clair (cf. section 7).

2. **⚠️ Variabilité formats Insta/TikTok (Photo Mode TikTok, carrousels, URLs raccourcies vm.tiktok.com).**
   - Probabilité : forte que certains cas échouent en prod.
   - Mitigation : audit N0 doit couvrir TOUS les types. Regex de parsing tolérante. Côté backend, le worker doit gérer la résolution des URLs raccourcies via HEAD HTTP (déjà fait par ScrapeCreators d'après leur doc).

3. **⚠️ ScrapeCreators bloqué côté Meta/ByteDance.**
   - Impact : import cassé, pas l'extension.
   - Mitigation : abstraction provider déjà en place côté worker (`SOCIAL_API_PROVIDER=stub|scrapecreators|...`).

---

## 7. Checklist avant submit App Store

### App Review Notes à rédiger (exemple)

> RecetteBox is a recipe organizer that helps users save recipes they discover on social media. The Share Extension allows users to **explicitly share** a public Instagram or TikTok URL they're viewing, which our backend then processes to **extract the cooking recipe** (ingredients list + instructions) using AI text/audio analysis.
>
> Key points:
> - The user always initiates the share — we never auto-fetch content.
> - We do NOT download, store, or replay video content. We only extract structured recipe text.
> - We do NOT provide any UI that mimics or replaces Instagram/TikTok playback features.
> - Content extraction is performed on public URLs only, accessed through ScrapeCreators (third-party API).
>
> Test credentials: [email + password à fournir]
> Test URL example to share: https://www.instagram.com/reel/[exemple-cuisine]/

### À vérifier visuellement avant submit

- [ ] Aucun bouton "télécharger la vidéo" nulle part
- [ ] Aucun player vidéo intégré
- [ ] Le contenu extrait est présenté comme "recette" / "notes culinaires", pas "post Insta"
- [ ] Lien vers le post original = bouton externe vers Insta/TikTok (pas embedded) — actuellement reporté V1.0.1 selon `feedback_simplicity_first.md`, donc rien à vérifier
- [ ] Privacy Policy mentionne explicitement ScrapeCreators dans les sous-traitants (vérifier `app/legal/privacy.tsx`)
- [ ] CGU mentionnent la clause "contenu importé depuis plateformes tierces" (déjà fait C1.1)

### Plan B si refus

1. Lire attentivement la raison du refus dans App Store Connect
2. Si 5.2 → reformuler la description App Store en insistant sur "recipe extraction" et "user-initiated"
3. Adresser le reviewer en disant qu'on retire toute fonctionnalité litigieuse (si applicable)
4. Resubmit avec note explicite "as discussed in response to rejection #..."

---

## 8. Décisions à acter AVANT d'attaquer Sprint 2

| Décision | Statut | Échéance |
|---|---|---|
| Bundle identifier définitif | ✅ `com.recettebox.app` (acté 28/05, cf. BUNDLE-ID-TODO.md) | Figé |
| App Group name | ✅ `group.com.recettebox.app` (acté 01/06) | Figé — aligné sur le bundle |
| Stratégie extension modèle A "passe-plat" | ✅ Acté dans ce doc | Décision figée |
| Custom scheme `recettebox://` V1.0 (vs Universal Links) | ✅ Acté dans ce doc | Décision figée |
| Android Share Extension en V1.0 (vs report V1.0.1) | ✅ **V1.0** (acté 01/06) — un seul plugin couvre iOS+Android, build Android déjà OK | Figé |
| Compte Apple Developer payant | 🚧 En cours user | Bloquant tout iOS |
| Compte Expo (`eas login`) | ✅ Connecté `polynetia` (cf. EAS-NEXT-STEPS.md) | Fait |
| Secret EAS `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ Posé (3 environnements, cf. EAS-NEXT-STEPS.md) | Fait |

> **📍 ÉTAT AU 02/06/2026 — reprendre ici :**
>
> - ✅ **N2.0 FAIT** : plugin `expo-share-intent@5.1.1` installé + `app.json` configuré (activation rules iOS, App Group, intent filter Android `text/*`) + `+native-intent.tsx` route le deep link Share Extension vers `/import` (durci sécurité). Vérifié : `expo config` + `expo prebuild -p ios` OK. `patch-package` non nécessaire.
> - ⚠️ **N2.1 À RE-CÂBLER (prioritaire)** : `import.tsx` lit les query params, mais `expo-share-intent` livre l'URL via le hook `useShareIntent()`. Sans `<ShareIntentProvider>` (au `_layout.tsx`) + lecture du hook, le partage ouvre un cul-de-sac. **C'est le vrai déblocage fonctionnel.** (cf. section N2.1 ci-dessus.)
> - 🟠 **À durcir (F4 sécurité)** : `extractSharedUrl` (`lib/api/imports.ts`) accepte toute URL `http(s)` → ajouter liste blanche hôtes Insta/TikTok (dont `vm.tiktok.com`, `instagr.am`) + forcer `https`.
> - 🔲 **Prochaines étapes build** : `eas build -p android --profile development` → test partage Android (débloqué). iOS toujours bloqué sur compte Apple Developer payant + capability App Group sur le portail.
>
> Tout est branché sur l'Edge Function `imports` via `lib/api/imports.ts` ; écran de progression R2.1 prêt.

---

## 9. Sources & références

### Plugins
- [`achorein/expo-share-intent`](https://github.com/achorein/expo-share-intent) (recommandé)
- [`MaxAst/expo-share-extension`](https://github.com/MaxAst/expo-share-extension) (fallback iOS only)
- [`ajith-ab/react-native-receive-sharing-intent`](https://github.com/ajith-ab/react-native-receive-sharing-intent) (alternative non-Expo)

### Apple
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (guideline 5.2 en particulier)
- [Apple compare-memberships](https://developer.apple.com/support/compare-memberships/) (compte gratuit vs payant)
- [QA1915 — Personal Team limitations](https://developer.apple.com/library/archive/qa/qa1915/_index.html)
- [NSExtensionActivationRule docs](https://developer.apple.com/documentation/bundleresources/information-property-list/nsextension/nsextensionattributes/nsextensionactivationrule)
- [Apple forum — Networking in short-lived extensions](https://developer.apple.com/forums/thread/76659)
- [Apple 2024 transparency report](https://www.macrumors.com/2025/05/30/app-store-2024-transparency-report/)
- [App Store new AI rules nov 2025](https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai/)

### Android
- [Android — receive shared data](https://developer.android.com/training/sharing/receive)

### Expo
- [Expo iOS capabilities](https://docs.expo.dev/build-reference/ios-capabilities/)
- [Expo Apple Developer roles](https://docs.expo.dev/app-signing/apple-developer-program-roles-and-permissions/)
- [Expo SecureStore docs](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [PR #36056 — keychainAccessGroup support](https://github.com/expo/expo/pull/36056)
- [Issue #40851 — EAS profile cache App Groups](https://github.com/expo/expo/issues/40851)

### Misc
- [Kraaft — RN Share Extension memory limits](https://medium.com/kraaft-co/how-i-reached-the-limits-of-react-native-by-implementing-an-ios-share-extension-4f312b534f22)
- [Instagram cracking down on third-party apps 2025](https://blog.postly.ai/why-instagram-is-cracking-down-on-third-party-apps-in-2025/)

### Backend RecetteBox
- Edge Function : `recettebox/backend/supabase/functions/imports/index.ts`
- Worker pipeline : `recettebox/backend/worker/src/`

---

## 10. Annexes

### A1 — Tableau payload Insta/TikTok (à compléter en N0)

| Plateforme | Contenu | OS | Payload reçu (à mesurer) | Regex extraction |
|---|---|---|---|---|
| Instagram | Reel | iOS | _à mesurer_ | _à dériver_ |
| Instagram | Reel | Android | _à mesurer_ | _à dériver_ |
| Instagram | Post photo | iOS | _à mesurer_ | _à dériver_ |
| Instagram | Post photo | Android | _à mesurer_ | _à dériver_ |
| Instagram | Carrousel | iOS | _à mesurer_ | _à dériver_ |
| Instagram | Carrousel | Android | _à mesurer_ | _à dériver_ |
| TikTok | Vidéo classique | iOS | _à mesurer_ | _à dériver_ |
| TikTok | Vidéo classique | Android | _à mesurer_ | _à dériver_ |
| TikTok | Photo Mode | iOS | _à mesurer_ | _à dériver_ |
| TikTok | Photo Mode | Android | _à mesurer_ | _à dériver_ |

### A2 — Config `NSExtensionActivationRule` iOS (exemple, à insérer dans app.json sous le plugin expo-share-intent)

```jsonc
{
  "iosActivationRules": {
    "NSExtensionActivationSupportsWebURLWithMaxCount": 1,
    "NSExtensionActivationSupportsWebPageWithMaxCount": 1,
    "NSExtensionActivationSupportsText": 1
  }
}
```

**Pourquoi ces 3 clés :**
- `WebURL` couvre quand Insta partage une URL "propre" (`public.url` UTI)
- `WebPage` couvre les partages "page web" (rare mais existe)
- `Text` couvre quand TikTok partage un texte avec URL embarquée ("Check out this video: https://...")

**Ne PAS ajouter :**
- `SupportsImage` / `SupportsMovie` → on ne traite pas les fichiers bruts, et ça ferait apparaître RecetteBox dans la galerie photos (UX confuse)
- Une `NSPredicate` custom trop large (`TRUEPREDICATE`) → Apple peut rejeter pour "extension too permissive"

### A3 — Config intent filter Android (exemple, à insérer dans app.json sous android.intentFilters OU géré automatiquement par le plugin)

```jsonc
{
  "android": {
    "intentFilters": [
      {
        "action": "android.intent.action.SEND",
        "category": ["android.intent.category.DEFAULT"],
        "data": { "mimeType": "text/plain" }
      }
    ]
  }
}
```

**Pourquoi `text/plain` uniquement :**
- C'est le mimeType dominant pour Insta + TikTok sur Android (URL contenue dans du texte)
- `image/*` ou `video/*` → on ne traite pas les fichiers bruts
- `text/*` trop large → afficherait RecetteBox même pour des contenus non-URL

### A4 — Exemple parsing URL côté app (pseudo-code, à valider en N0)

```ts
// Dans app/import.tsx (handler deep link)
function extractUrlFromShared(shared: string): string | null {
  // Tolère "Check out this video: https://www.tiktok.com/..."
  const match = shared.match(/(https?:\/\/[^\s]+)/);
  if (!match) return null;
  return match[1].replace(/[.,;)]+$/, ""); // nettoie ponctuation finale
}
```

À tester avec les payloads réels de N0 avant figeage.

### A5 — Pourquoi `app/import.tsx` existe déjà (contexte historique)

Le fichier `app/import.tsx` actuel est un écran "Coller URL manuellement" (R2.3 de TASKS3), reporté V1.0.1 sur décision produit (`feedback_simplicity_first.md`). En V1.0, on **repurpose** ce fichier comme handler du deep link de la Share Extension. Le contenu UI actuel (formulaire, animations) sera remplacé par une vue minimaliste de transition.

À la fin de Sprint 2, ce fichier ne sera plus un écran navigable directement, mais un endpoint du deep link `recettebox://import`. À documenter dans les commentaires en haut du fichier.

---

**Fin du plan. Prêt à servir de référence pour Sprint 2.**
