# Tâche zéro — Résultats 8 URLs sur Apify vs ScrapeCreators

> Tests menés le 13/05/2026. Provider gagnant à choisir par plateforme.

---

## Légende

- ✅ Succès complet (réponse OK, URL média téléchargeable, caption récupérée)
- ⚠️ Partiel (réponse OK mais quelque chose à noter)
- ❌ Échec

---

## Résultats détaillés

### URL #1 — Reel Insta récent (@chefclubtv)
URL : https://www.instagram.com/reel/DXuLRHZhFYP/

| Critère | Apify | ScrapeCreators |
|---|---|---|
| Réponse | ✅ OK | ✅ OK |
| MediaType | video | video |
| Nb items | 1 | 1 |
| URL média directe | ✅ CDN Insta | ✅ CDN Insta |
| Caption (chars) | 166 | 171 |
| Auteur | chefclubtv | chefclubtv |
| Latence | **7 782 ms** | **1 971 ms** |

### URL #2 — Reel Insta ancien (@fastgoodcuisine)
URL : https://www.instagram.com/reel/CLcUO5LIRpU/ (fév. 2021, > 4 ans)

| Critère | Apify | ScrapeCreators |
|---|---|---|
| Réponse | ✅ OK | ✅ OK |
| MediaType | video | video |
| Nb items | 1 | 1 |
| URL média directe | ✅ CDN Insta | ✅ CDN Insta |
| Caption (chars) | 286 | 298 |
| Auteur | fastgoodcuisine | fastgoodcuisine |
| Latence | **6 848 ms** | **2 364 ms** |

### URL #3 — Reel Insta sans voix off (@didine_food)
URL : https://www.instagram.com/reel/DNbAAteC6CR/

| Critère | Apify | ScrapeCreators |
|---|---|---|
| Réponse | ✅ OK | ✅ OK |
| MediaType | video | video |
| Nb items | 1 | 1 |
| URL média directe | ✅ CDN Insta | ✅ CDN Insta |
| Caption (chars) | 245 | 256 |
| Auteur | didine_food | didine_food |
| Latence | **7 616 ms** | **2 731 ms** |

### URL #4 — Carrousel Insta (@odelices)
URL : https://www.instagram.com/p/CwIZnV9INet/

| Critère | Apify | ScrapeCreators |
|---|---|---|
| Réponse | ✅ OK | ✅ OK |
| MediaType | **carousel** | **carousel** |
| Nb items | **2** ✅ | **2** ✅ |
| URL média directe | ✅ CDN Insta | ✅ CDN Insta |
| Caption (chars) | 2 186 | 2 254 |
| Auteur | odelices | odelices |
| Latence | **11 993 ms** | **1 551 ms** |

### URL #5 — Post Insta photo (@hervecuisine, choco-carotte)
URL : https://www.instagram.com/hervecuisine/p/Cy0WB0FM0qn/
*Note : labellisé "carrousel" mais en réalité c'est une image unique — les 2 providers convergent.*

| Critère | Apify | ScrapeCreators |
|---|---|---|
| Réponse | ✅ OK | ✅ OK |
| MediaType | image | image |
| Nb items | 1 | 1 |
| URL média directe | ✅ CDN Insta | ✅ CDN Insta |
| Caption (chars) | 1 177 | 1 219 |
| Auteur | hervecuisine | hervecuisine |
| Latence | **7 068 ms** | **1 798 ms** |

### URL #7 — Carrousel Insta (@hervecuisine, amande-noisette-prunes)
URL : https://www.instagram.com/p/CS4ekPDD_Gg/
*Note : labellisé "photo unique" mais en réalité c'est un carrousel de 3 items — les 2 providers convergent. Bon bonus pour tester un 2ᵉ carrousel.*

| Critère | Apify | ScrapeCreators |
|---|---|---|
| Réponse | ✅ OK | ✅ OK |
| MediaType | **carousel** | **carousel** |
| Nb items | **3** ✅ | **3** ✅ |
| URL média directe | ✅ CDN Insta | ✅ CDN Insta |
| Caption (chars) | 515 | 539 |
| Auteur | hervecuisine | hervecuisine |
| Latence | **7 328 ms** | **3 100 ms** |

### URL #8 — TikTok vidéo courte (@fastgoodcuisine, tarte flambée)
URL : https://www.tiktok.com/@fastgoodcuisine/video/7040412169963343110

| Critère | Apify | ScrapeCreators |
|---|---|---|
| Réponse | ✅ OK | ✅ OK |
| MediaType | video | video |
| Nb items | 1 | 1 |
| URL média directe | ⚠️ **storage Apify temporaire** | ✅ **CDN TikTok direct** |
| Caption (chars) | 130 | 135 |
| Auteur | fastgoodcuisine | fastgoodcuisine |
| Latence | **35 524 ms** ⚠️ | **1 736 ms** |

### URL #9 — TikTok vidéo longue (@fastgoodcuisine, cookies)
URL : https://www.tiktok.com/@fastgoodcuisine/video/7462419163089374486

| Critère | Apify | ScrapeCreators |
|---|---|---|
| Réponse | ✅ OK | ✅ OK |
| MediaType | video | video |
| Nb items | 1 | 1 |
| URL média directe | ⚠️ **storage Apify temporaire** | ✅ **CDN TikTok direct** |
| Caption (chars) | 765 | 770 |
| Auteur | fastgoodcuisine | fastgoodcuisine |
| Latence | **22 624 ms** ⚠️ | **2 924 ms** |

---

## Synthèse Instagram (6 URLs testées : #1, #2, #3, #4, #5, #7)

| | Apify | ScrapeCreators |
|---|---|---|
| Succès complet | **6/6 ✅** | **6/6 ✅** |
| Carrousels OK | 2/2 (URLs #4 et #7) | 2/2 (URLs #4 et #7) |
| Latence moyenne | **8 106 ms** | **2 252 ms** (**3,6× plus rapide**) |
| URLs CDN directes | ✅ | ✅ |
| Coût par requête | ~$0.0023 | ~$0.001-0.002 selon plan |

**Verdict Instagram : ScrapeCreators** (parité en qualité, 3,6× plus rapide, prix équivalent).
Mais **Apify reste viable** — pas de critère éliminatoire qui le sort. C'est une décision basée sur la vitesse + simplicité.

## Synthèse TikTok (2 URLs testées : #8, #9)

| | Apify | ScrapeCreators |
|---|---|---|
| Succès complet | ⚠️ 2/2 mais URL temporaire | **2/2 ✅** |
| URLs CDN directes | ❌ Storage Apify (peut expirer) | ✅ CDN TikTok |
| Latence moyenne | **29 074 ms** ❌ | **2 330 ms** (**12,5× plus rapide**) |
| Coût par requête | ~$0.0017 + storage | ~$0.001-0.002 |

**Verdict TikTok : ScrapeCreators clairement gagnant.** 3 raisons :
1. **Apify héberge la vidéo sur son propre storage** (~30s d'attente pendant le download TikTok → Apify). Pour notre app, c'est inacceptable : on veut l'URL CDN directe pour la pipeliner dans ffmpeg + Whisper.
2. **Les URLs Apify peuvent expirer** (rétention limitée des key-value-stores selon le plan), alors que les CDN TikTok restent stables des semaines.
3. **Coût caché** : avec `shouldDownloadVideos: true`, Apify consomme aussi du storage + bandwidth (CU supplémentaires).

## Limites de ce test

- **Carrousel Insta mixte (URL #6) non testé** : type rare, non trouvé via recherche web. À tester manuellement sur Apify si Insta est choisi — risque résiduel sur ce cas spécifique.
- **TikTok Photo Mode (URL #10) non testé** : URLs `/photo/` quasi pas indexées par Google. Selon la doc, **les 2 providers le supportent** (`isSlideshow` + `slideshowImageLinks` côté Apify, `image_post_info.images[]` côté ScrapeCreators). À valider quand on aura une vraie URL Photo Mode.

---

## Recommandation finale

| Plateforme | Provider gagnant | Justification |
|---|---|---|
| **Instagram** | **ScrapeCreators** | 3,6× plus rapide, équivalent en data, prix équivalent. Apify viable en plan B. |
| **TikTok** | **ScrapeCreators** | 12,5× plus rapide, URLs CDN directes vs storage Apify temporaire. Apify écarté pour TikTok. |

**Décision globale : ScrapeCreators pour les 2 plateformes.**

**Conséquence côté code** : on n'a besoin que **d'un seul provider** dans `social-api.ts` (au lieu de 2 séparés Apify Insta + Apify TikTok). Architecture simplifiée.

**Coût scraping projeté** (à 5 000 imports/jour, plan Freelance ScrapeCreators à $47/25k = $0.00188/req) :
- ~9,40 €/jour = ~282 €/mois au pic
- Négligeable face aux 0,10-0,15 €/import de coût total IA (≈ 0,1 % du coût total)
