// =============================================================================
// Provider API tierce — interface abstraite
// =============================================================================
// Tous les providers (RapidAPI, Apify, ScrapeCreators, EnsembleData…) doivent
// retourner le même format normalisé. Le pipeline ne connaît PAS le provider
// utilisé — on peut switcher via la variable d'env SOCIAL_API_PROVIDER.
//
// Le choix final se fera après la "tâche zéro" de tests sur 10 URLs réelles.
// En attendant : implémentation stub qui renvoie une recette factice pour
// pouvoir tester le pipeline downstream sans dépendre d'une API externe.
// =============================================================================

import { config } from "../config.js";

export type MediaType = "video" | "image" | "carousel";

export interface MediaItem {
  type: "video" | "image";
  url: string;
  durationSeconds?: number; // si vidéo
  width?: number;
  height?: number;
}

export interface FetchedPost {
  platform: "instagram" | "tiktok";
  mediaType: MediaType;
  mediaItems: MediaItem[]; // toujours rempli (1 item pour image/video, N pour carousel)
  caption: string;
  author?: string;
  authorHandle?: string;
  thumbnailUrl?: string;
  postedAt?: string;
}

export interface SocialApiProvider {
  name: string;
  fetchPost(url: string): Promise<FetchedPost>;
}

// -----------------------------------------------------------------------------
// Stub provider (par défaut)
// -----------------------------------------------------------------------------
const stubProvider: SocialApiProvider = {
  name: "stub",
  async fetchPost(url: string): Promise<FetchedPost> {
    const platform = url.includes("tiktok") ? "tiktok" : "instagram";
    return {
      platform,
      mediaType: "video",
      mediaItems: [
        {
          type: "video",
          // ⚠️ URL fictive — le téléchargement échouera. Le stub sert juste à
          // valider la chaîne de typage / orchestration, pas à exécuter un vrai pipeline.
          url: "https://example.com/fake-video.mp4",
          durationSeconds: 45,
        },
      ],
      caption: "Recette test (stub). Branche un vrai provider avant prod.",
      author: "Stub Provider",
      authorHandle: "@stub",
      thumbnailUrl: "https://example.com/fake-thumb.jpg",
    };
  },
};

// -----------------------------------------------------------------------------
// Implémentations réelles — à compléter après tests
// -----------------------------------------------------------------------------
// Voir TODO-PROVIDER.md à la racine du backend pour la procédure de sélection.

const rapidApiProvider: SocialApiProvider = {
  name: "rapidapi",
  async fetchPost(_url: string): Promise<FetchedPost> {
    throw new Error(
      "RapidAPI provider not implemented yet. See TODO-PROVIDER.md to plug the chosen endpoint.",
    );
  },
};

const apifyProvider: SocialApiProvider = {
  name: "apify",
  async fetchPost(_url: string): Promise<FetchedPost> {
    throw new Error(
      "Apify provider not implemented yet. See TODO-PROVIDER.md.",
    );
  },
};

// =============================================================================
// ScrapeCreators (provider retenu V1.0 — tâche zéro 13/05/2026)
// =============================================================================
// - Instagram : GET /v1/instagram/post?url=...&trim=true
// - TikTok    : GET /v2/tiktok/video?url=...&trim=true
// - Auth      : header x-api-key
// - Coût      : 1 crédit / requête (ne PAS activer download_media qui consomme 10 crédits)
// - Format    : JSON, à normaliser vers FetchedPost
// =============================================================================

const SCRAPECREATORS_BASE_URL = "https://api.scrapecreators.com";

interface ScInstaResponse {
  success?: boolean;
  xdt_shortcode_media?: ScInstaMedia;
  // Variante data wrapper (selon version d'API)
  data?: { xdt_shortcode_media?: ScInstaMedia };
}

interface ScInstaMedia {
  __typename?: string; // XDTGraphVideo | XDTGraphImage | XDTGraphSidecar
  shortcode?: string;
  video_url?: string;
  display_url?: string;
  thumbnail_src?: string;
  video_duration?: number;
  dimensions?: { width?: number; height?: number };
  taken_at_timestamp?: number;
  owner?: { username?: string; full_name?: string };
  edge_media_to_caption?: { edges?: Array<{ node?: { text?: string } }> };
  edge_sidecar_to_children?: {
    edges?: Array<{
      node?: {
        __typename?: string;
        video_url?: string;
        display_url?: string;
        video_duration?: number;
        dimensions?: { width?: number; height?: number };
      };
    }>;
  };
}

interface ScTikTokResponse {
  aweme_detail?: ScTikTokDetail;
  data?: { aweme_detail?: ScTikTokDetail };
}

interface ScTikTokDetail {
  aweme_id?: string;
  desc?: string;
  create_time?: number;
  author?: { unique_id?: string; nickname?: string };
  video?: {
    duration?: number; // millisecondes
    play_addr?: { url_list?: string[] };
    cover?: { url_list?: string[] };
  };
  image_post_info?: {
    images?: Array<{
      display_image?: { url_list?: string[] };
      owner_watermark_image?: { url_list?: string[] };
    }>;
  };
}

function detectPlatform(url: string): "instagram" | "tiktok" {
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/instagram\.com/i.test(url)) return "instagram";
  throw new Error(`URL non reconnue (ni Instagram, ni TikTok) : ${url}`);
}

async function callScrapeCreators<T>(path: string, url: string): Promise<T> {
  if (!config.SCRAPECREATORS_API_KEY) {
    throw new Error(
      "SCRAPECREATORS_API_KEY missing in env — set it on Railway and locally.",
    );
  }
  const endpoint = `${SCRAPECREATORS_BASE_URL}${path}?url=${encodeURIComponent(url)}&trim=true`;
  const res = await fetch(endpoint, {
    method: "GET",
    headers: { "x-api-key": config.SCRAPECREATORS_API_KEY },
  });

  if (res.status === 404) throw new Error("not found");
  if (res.status === 403) throw new Error("private or forbidden");
  if (res.status === 429) throw new Error("rate limit");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ScrapeCreators HTTP ${res.status} ${body.slice(0, 200)}`);
  }

  return (await res.json()) as T;
}

function pickInstaMedia(raw: ScInstaResponse): ScInstaMedia {
  const media = raw.xdt_shortcode_media ?? raw.data?.xdt_shortcode_media;
  if (!media) throw new Error("not found");
  return media;
}

function pickTikTokDetail(raw: ScTikTokResponse): ScTikTokDetail {
  const detail = raw.aweme_detail ?? raw.data?.aweme_detail;
  if (!detail) throw new Error("not found");
  return detail;
}

function normalizeInsta(media: ScInstaMedia): FetchedPost {
  const typename = media.__typename ?? "";
  const captionText =
    media.edge_media_to_caption?.edges?.[0]?.node?.text ?? "";
  const author = media.owner?.full_name ?? media.owner?.username ?? "";
  const handle = media.owner?.username ? `@${media.owner.username}` : undefined;
  const postedAt = media.taken_at_timestamp
    ? new Date(media.taken_at_timestamp * 1000).toISOString()
    : undefined;

  let mediaType: MediaType;
  let mediaItems: MediaItem[];

  if (typename === "XDTGraphSidecar") {
    mediaType = "carousel";
    const children = media.edge_sidecar_to_children?.edges ?? [];
    const items: MediaItem[] = [];
    for (const edge of children) {
      const node = edge.node;
      if (!node) continue;
      if (node.__typename === "XDTGraphVideo" && node.video_url) {
        items.push({
          type: "video",
          url: node.video_url,
          durationSeconds: node.video_duration,
          width: node.dimensions?.width,
          height: node.dimensions?.height,
        });
      } else if (node.display_url) {
        items.push({
          type: "image",
          url: node.display_url,
          width: node.dimensions?.width,
          height: node.dimensions?.height,
        });
      }
    }
    mediaItems = items;
  } else if (typename === "XDTGraphVideo") {
    mediaType = "video";
    if (!media.video_url) throw new Error("video without playable URL");
    mediaItems = [
      {
        type: "video",
        url: media.video_url,
        durationSeconds: media.video_duration,
        width: media.dimensions?.width,
        height: media.dimensions?.height,
      },
    ];
  } else {
    // XDTGraphImage ou type inconnu → traiter comme image
    mediaType = "image";
    if (!media.display_url) throw new Error("image without display URL");
    mediaItems = [
      {
        type: "image",
        url: media.display_url,
        width: media.dimensions?.width,
        height: media.dimensions?.height,
      },
    ];
  }

  return {
    platform: "instagram",
    mediaType,
    mediaItems,
    caption: captionText,
    author,
    authorHandle: handle,
    thumbnailUrl: media.thumbnail_src ?? media.display_url,
    postedAt,
  };
}

function normalizeTikTok(detail: ScTikTokDetail): FetchedPost {
  const captionText = detail.desc ?? "";
  const author = detail.author?.nickname ?? detail.author?.unique_id ?? "";
  const handle = detail.author?.unique_id
    ? `@${detail.author.unique_id}`
    : undefined;
  const postedAt = detail.create_time
    ? new Date(detail.create_time * 1000).toISOString()
    : undefined;
  const thumbnailUrl = detail.video?.cover?.url_list?.[0];

  const hasSlideshow =
    detail.image_post_info?.images &&
    detail.image_post_info.images.length > 0;

  if (hasSlideshow) {
    const images = detail.image_post_info!.images!;
    const items: MediaItem[] = [];
    for (const img of images) {
      const url =
        img.display_image?.url_list?.[0] ??
        img.owner_watermark_image?.url_list?.[0];
      if (url) items.push({ type: "image", url });
    }

    if (items.length === 0) {
      throw new Error("tiktok slideshow without downloadable images");
    }

    return {
      platform: "tiktok",
      mediaType: "carousel",
      mediaItems: items,
      caption: captionText,
      author,
      authorHandle: handle,
      thumbnailUrl,
      postedAt,
    };
  }

  const videoUrl = detail.video?.play_addr?.url_list?.[0];
  if (!videoUrl) throw new Error("tiktok video without playable URL");
  const durationMs = detail.video?.duration ?? 0;

  return {
    platform: "tiktok",
    mediaType: "video",
    mediaItems: [
      {
        type: "video",
        url: videoUrl,
        durationSeconds: durationMs > 0 ? Math.round(durationMs / 1000) : undefined,
      },
    ],
    caption: captionText,
    author,
    authorHandle: handle,
    thumbnailUrl,
    postedAt,
  };
}

const scrapeCreatorsProvider: SocialApiProvider = {
  name: "scrapecreators",
  async fetchPost(url: string): Promise<FetchedPost> {
    const platform = detectPlatform(url);

    if (platform === "instagram") {
      const raw = await callScrapeCreators<ScInstaResponse>(
        "/v1/instagram/post",
        url,
      );
      const media = pickInstaMedia(raw);
      return normalizeInsta(media);
    }

    const raw = await callScrapeCreators<ScTikTokResponse>(
      "/v2/tiktok/video",
      url,
    );
    const detail = pickTikTokDetail(raw);
    return normalizeTikTok(detail);
  },
};

// -----------------------------------------------------------------------------
// Sélection au runtime
// -----------------------------------------------------------------------------
export function getSocialApiProvider(): SocialApiProvider {
  switch (config.SOCIAL_API_PROVIDER) {
    case "stub":
      return stubProvider;
    case "rapidapi":
      return rapidApiProvider;
    case "apify":
      return apifyProvider;
    case "scrapecreators":
      return scrapeCreatorsProvider;
    default:
      return stubProvider;
  }
}
