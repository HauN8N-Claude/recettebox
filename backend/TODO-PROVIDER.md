# TODO — Brancher le vrai provider API tierce

Ce backend est livré avec un provider **stub** (renvoie une recette factice). Avant de passer en preview/prod, tu dois :

1. **Tester 3 providers sur 10 URLs réelles** (cf. README, section "Tâche zéro").
2. **Choisir le gagnant** selon les critères : taux de succès, support carrousels Insta + TikTok Photo Mode, latence, prix.
3. **Implémenter** la fonction `fetchPost(url)` du provider choisi dans [worker/src/providers/social-api.ts](worker/src/providers/social-api.ts).

## Contrat à respecter

Le provider doit transformer la réponse brute de l'API en un objet `FetchedPost` :

```ts
interface FetchedPost {
  platform: "instagram" | "tiktok";
  mediaType: "video" | "image" | "carousel";
  mediaItems: MediaItem[]; // 1 item si vidéo/photo unique, N si carrousel
  caption: string;
  author?: string;
  authorHandle?: string;
  thumbnailUrl?: string;
  postedAt?: string;
}

interface MediaItem {
  type: "video" | "image";
  url: string;             // URL directe téléchargeable (mp4 / jpg)
  durationSeconds?: number; // pour les vidéos
  width?: number;
  height?: number;
}
```

## Points d'attention

- **Carrousel Insta** : doit renvoyer **tous** les items dans l'ordre. Si l'API ne le fait pas → écarter le provider (critère éliminatoire).
- **TikTok Photo Mode** : `mediaType: "carousel"`, `mediaItems: [{ type: "image", url: ... }, ...]`.
- **URL des médias** : doivent être directement téléchargeables sans auth additionnelle. Si elles expirent rapidement (CDN signé), le worker doit télécharger tout de suite (déjà le cas dans `pipeline-*`).
- **Erreurs** : lever une `Error` avec un message explicite. Les motifs reconnus par le worker pour skip retry :
  - `private`, `not found`, `404` → abort immédiat, status `failed`
- **Quotas provider** : si le provider rate-limit, lève une erreur claire. Le worker n'a pas de gestion de rate-limit provider pour l'instant (à ajouter en V1.0.1).

## Squelette d'implémentation type (RapidAPI)

```ts
const rapidApiProvider: SocialApiProvider = {
  name: "rapidapi",
  async fetchPost(url: string): Promise<FetchedPost> {
    const platform = url.includes("tiktok") ? "tiktok" : "instagram";
    const endpoint = platform === "instagram"
      ? `${config.SOCIAL_API_BASE_URL}/instagram/post`
      : `${config.SOCIAL_API_BASE_URL}/tiktok/video`;

    const res = await fetch(`${endpoint}?url=${encodeURIComponent(url)}`, {
      headers: {
        "X-RapidAPI-Key": config.SOCIAL_API_KEY!,
        "X-RapidAPI-Host": new URL(config.SOCIAL_API_BASE_URL!).host,
      },
    });

    if (res.status === 404) throw new Error("not found");
    if (!res.ok) throw new Error(`Provider HTTP ${res.status}`);

    const raw = await res.json();
    // ... normaliser raw vers FetchedPost selon la forme de la réponse
    return normalized;
  },
};
```

Une fois implémenté, change `SOCIAL_API_PROVIDER=rapidapi` (ou autre) dans les variables d'env Railway et redéploie.
