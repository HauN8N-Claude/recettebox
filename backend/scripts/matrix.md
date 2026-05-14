# Matrice de comparaison — Providers Insta/TikTok

> À remplir après avoir lancé `node test-providers.mjs` et lu le `results/summary.md`.

## Date du test

YYYY-MM-DD

## URLs testées

| # | Label | Type |
|---|---|---|
| 1 | … | … |
| 2 | … | … |
| 3 | … | … |
| 4 | … | … |
| 5 | … | … |
| 6 | … | … |
| 7 | … | … |
| 8 | … | … |
| 9 | … | … |
| 10 | … | … |

---

## Notation par critère

Mets une note de **0 à 5** pour chaque provider × critère. Justifie en une phrase si besoin.

### Critère 1 — Taux de succès global (poids 30 %)

| Provider | Réussites / 10 | Note /5 | Commentaire |
|---|---|---|---|
| Apify | …/10 | … | … |
| RapidAPI | …/10 | … | … |

### Critère 2 — Support carrousel Instagram complet (poids 25 % — éliminatoire)

> Critère ÉLIMINATOIRE : si un provider ne renvoie qu'une partie des items d'un carrousel, il est disqualifié.

| Provider | Items complets ? | Note /5 | Commentaire |
|---|---|---|---|
| Apify | oui / non | … | … |
| RapidAPI | oui / non | … | … |

### Critère 3 — Support TikTok Photo Mode (poids 20 %)

| Provider | Toutes les photos dans l'ordre ? | Note /5 | Commentaire |
|---|---|---|---|
| Apify | oui / non | … | … |
| RapidAPI | oui / non | … | … |

### Critère 4 — Latence moyenne (poids 10 %)

> < 2 s = 5/5, 2-5 s = 3/5, > 5 s = 1/5
> Note : Apify est nativement plus lent (~3-5 s) à cause du modèle « actor », c'est normal.

| Provider | Latence moyenne | Note /5 |
|---|---|---|
| Apify | … ms | … |
| RapidAPI | … ms | … |

### Critère 5 — Prix (poids 15 %)

> Estimer pour un volume cible (ex : 1 000 imports / mois en V1.0).

| Provider | Plan retenu | €/mois pour 1 000 requêtes | Note /5 |
|---|---|---|---|
| Apify | … | … € | … |
| RapidAPI | … | … € | … |

---

## Score pondéré final

> Calcul : (note crit.1 × 30 + note crit.2 × 25 + note crit.3 × 20 + note crit.4 × 10 + note crit.5 × 15) / 5

| Provider | Score /100 | Éliminé ? (carrousel) |
|---|---|---|
| Apify | … | … |
| RapidAPI | … | … |

---

## Décision

**Provider retenu :** …

**Plan tarifaire retenu :** …

**Coût mensuel estimé :** … €

**Pourquoi ce choix (2-3 phrases) :**

> …

**À transmettre à Claude pour étape suivante :**
- Nom du provider gagnant
- Endpoint(s) exact(s) qui fonctionnent (Instagram + TikTok)
- Forme typique de la réponse (joindre un exemple JSON depuis `results/{provider}/`)
- Coût mensuel prévu
