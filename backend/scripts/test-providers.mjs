#!/usr/bin/env node
// Provider test harness — RecetteBox tâche zéro.
// Tape: node test-providers.mjs
//
// Lit urls.json (à créer depuis urls.example.json).
// Lit .env.local (à créer depuis .env.local.example).
// Frappe les 3 providers (RapidAPI, Apify, ScrapeCreators) pour chaque URL.
// Sauvegarde les réponses brutes dans ./results/{provider}/{slug}.json.
// Génère ./results/summary.md.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const RESULTS_DIR = join(ROOT, "results");
const TIMEOUT_MS = 30_000;

// ---------- Helpers ----------

function readEnv() {
  const p = join(ROOT, ".env.local");
  if (!existsSync(p)) {
    console.error("ERREUR: .env.local introuvable.");
    console.error("Copie .env.local.example en .env.local et remplis les clés.");
    process.exit(1);
  }
  const raw = readFileSync(p, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    env[k] = v;
  }
  return env;
}

function readUrls() {
  const p = join(ROOT, "urls.json");
  if (!existsSync(p)) {
    console.error("ERREUR: urls.json introuvable.");
    console.error("Copie urls.example.json en urls.json et remplis tes 10 URLs.");
    process.exit(1);
  }
  const parsed = JSON.parse(readFileSync(p, "utf8"));
  const urls = parsed.urls || [];
  if (urls.length === 0) {
    console.error("ERREUR: urls.json est vide.");
    process.exit(1);
  }
  const valid = urls.filter(
    (u) => u.url && !u.url.includes("REMPLACE_MOI")
  );
  if (valid.length < urls.length) {
    console.warn(
      `Attention: ${urls.length - valid.length} URL(s) non remplies, ignorées.`
    );
  }
  return valid;
}

function slugify(url) {
  return createHash("sha1").update(url).digest("hex").slice(0, 12);
}

function isInstagram(url) {
  return /instagram\.com/i.test(url);
}

function isTiktok(url) {
  return /tiktok\.com/i.test(url);
}

async function withTimeout(promise, ms) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await promise(ac.signal);
  } finally {
    clearTimeout(t);
  }
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function writeJson(path, data) {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
}

// Inspection légère: cherche des champs probables dans la réponse brute.
function inspectResponse(data) {
  const findKey = (obj, names) => {
    if (!obj || typeof obj !== "object") return false;
    for (const k of Object.keys(obj)) {
      const lower = k.toLowerCase();
      if (names.some((n) => lower.includes(n))) return true;
    }
    for (const v of Object.values(obj)) {
      if (typeof v === "object" && v !== null) {
        if (findKey(v, names)) return true;
      }
    }
    return false;
  };
  return {
    hasCaption: findKey(data, ["caption", "description", "text"]),
    hasVideoUrl: findKey(data, ["video_url", "videourl", "playurl", "play_url", "mp4"]),
    hasImage: findKey(data, ["image_url", "thumbnail", "display_url", "cover", "image"]),
    hasAuthor: findKey(data, ["username", "author", "owner", "user"]),
    hasMultipleMedia: findKey(data, ["carousel", "slides", "images", "media_items"]),
  };
}

// ---------- Providers ----------

const providers = {
  apify: {
    label: "Apify",
    async fetch(url, env, platform, signal) {
      const actor =
        platform === "instagram"
          ? env.APIFY_INSTAGRAM_ACTOR
          : env.APIFY_TIKTOK_ACTOR;
      if (!env.APIFY_TOKEN || !actor) {
        throw new Error(
          `Apify non configuré pour ${platform} (token ou actor manquant)`
        );
      }
      // Endpoint synchrone qui lance l'actor et renvoie les items du dataset.
      // Selon l'actor, l'input attendu varie. On essaie la forme la plus
      // courante: { directUrls: [url] } pour Instagram, { postURLs: [url] }
      // pour TikTok. Ajuste si besoin selon la doc de l'actor choisi.
      const input =
        platform === "instagram"
          ? { directUrls: [url], resultsLimit: 1 }
          : { postURLs: [url], resultsPerPage: 1 };
      const endpoint = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(env.APIFY_TOKEN)}`;
      const res = await fetch(endpoint, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = { _rawText: text };
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} — ${text.slice(0, 200)}`);
      }
      return json;
    },
  },

  rapidapi: {
    label: "RapidAPI",
    async fetch(url, env, platform, signal) {
      const host =
        platform === "instagram"
          ? env.RAPIDAPI_INSTAGRAM_HOST
          : env.RAPIDAPI_TIKTOK_HOST;
      const path =
        platform === "instagram"
          ? env.RAPIDAPI_INSTAGRAM_PATH
          : env.RAPIDAPI_TIKTOK_PATH;
      if (!env.RAPIDAPI_KEY || !host || !path) {
        throw new Error(
          `RapidAPI non configuré pour ${platform} (clé/host/path manquant)`
        );
      }
      const endpoint = `https://${host}${path}${encodeURIComponent(url)}`;
      const res = await fetch(endpoint, {
        signal,
        headers: {
          "X-RapidAPI-Key": env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": host,
        },
      });
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = { _rawText: text };
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} — ${text.slice(0, 200)}`);
      }
      return json;
    },
  },
};

// ---------- Main ----------

async function main() {
  const env = readEnv();
  const urls = readUrls();

  ensureDir(RESULTS_DIR);

  const summary = [];

  console.log(`Test sur ${urls.length} URLs × ${Object.keys(providers).length} providers.\n`);

  for (let i = 0; i < urls.length; i++) {
    const entry = urls[i];
    const platform = isTiktok(entry.url)
      ? "tiktok"
      : isInstagram(entry.url)
      ? "instagram"
      : null;

    console.log(`[${i + 1}/${urls.length}] ${entry.label} (${entry.type})`);
    console.log(`        ${entry.url}`);

    if (!platform) {
      console.log("        URL non reconnue (ni Instagram ni TikTok), skip.\n");
      continue;
    }

    const slug = slugify(entry.url);

    for (const [key, provider] of Object.entries(providers)) {
      const start = Date.now();
      let result;
      try {
        const data = await withTimeout(
          (signal) => provider.fetch(entry.url, env, platform, signal),
          TIMEOUT_MS
        );
        const latencyMs = Date.now() - start;
        const inspection = inspectResponse(data);
        result = {
          status: "ok",
          latencyMs,
          inspection,
          dataSize: JSON.stringify(data).length,
        };
        writeJson(join(RESULTS_DIR, key, `${slug}.json`), {
          label: entry.label,
          type: entry.type,
          url: entry.url,
          fetchedAt: new Date().toISOString(),
          latencyMs,
          inspection,
          rawResponse: data,
        });
        console.log(`        -> ${provider.label.padEnd(15)} OK (${latencyMs} ms)`);
      } catch (err) {
        const latencyMs = Date.now() - start;
        result = {
          status: "fail",
          latencyMs,
          error: err.message || String(err),
        };
        writeJson(join(RESULTS_DIR, key, `${slug}.json`), {
          label: entry.label,
          type: entry.type,
          url: entry.url,
          fetchedAt: new Date().toISOString(),
          latencyMs,
          error: result.error,
        });
        console.log(`        -> ${provider.label.padEnd(15)} FAIL (${latencyMs} ms) — ${result.error.slice(0, 80)}`);
      }
      summary.push({
        idx: i + 1,
        label: entry.label,
        type: entry.type,
        url: entry.url,
        platform,
        provider: key,
        ...result,
      });
    }
    console.log("");
  }

  writeSummaryMarkdown(summary);
  console.log(`\nDone. Results saved in ${RESULTS_DIR}`);
  console.log(`Summary saved in ${join(RESULTS_DIR, "summary.md")}`);
}

function writeSummaryMarkdown(summary) {
  const lines = [];
  lines.push("# Récapitulatif des tests providers");
  lines.push("");
  lines.push(`Généré le ${new Date().toISOString()}`);
  lines.push("");

  // Agrégat par provider
  lines.push("## Vue d'ensemble par provider");
  lines.push("");
  lines.push("| Provider | Réussites | Échecs | Latence moy. (ms) |");
  lines.push("|---|---|---|---|");
  const byProvider = new Map();
  for (const r of summary) {
    const m = byProvider.get(r.provider) ?? { ok: 0, fail: 0, totalMs: 0, count: 0 };
    if (r.status === "ok") m.ok++;
    else m.fail++;
    m.totalMs += r.latencyMs;
    m.count++;
    byProvider.set(r.provider, m);
  }
  for (const [name, m] of byProvider) {
    const avg = m.count > 0 ? Math.round(m.totalMs / m.count) : 0;
    lines.push(`| ${name} | ${m.ok} | ${m.fail} | ${avg} |`);
  }
  lines.push("");

  // Détail par URL
  lines.push("## Détail par URL");
  lines.push("");
  const byUrl = new Map();
  for (const r of summary) {
    const arr = byUrl.get(r.idx) ?? [];
    arr.push(r);
    byUrl.set(r.idx, arr);
  }
  for (const [idx, rows] of byUrl) {
    const first = rows[0];
    lines.push(`### ${idx}. ${first.label} (${first.type})`);
    lines.push(`\`${first.url}\``);
    lines.push("");
    lines.push("| Provider | Status | Latence | Caption | Vidéo | Image | Auteur | Multi-média |");
    lines.push("|---|---|---|---|---|---|---|---|");
    for (const r of rows) {
      if (r.status === "ok") {
        const i = r.inspection || {};
        const tick = (v) => (v ? "oui" : "non");
        lines.push(
          `| ${r.provider} | OK | ${r.latencyMs} ms | ${tick(i.hasCaption)} | ${tick(i.hasVideoUrl)} | ${tick(i.hasImage)} | ${tick(i.hasAuthor)} | ${tick(i.hasMultipleMedia)} |`
        );
      } else {
        lines.push(
          `| ${r.provider} | FAIL | ${r.latencyMs} ms | — | — | — | — | ${r.error.slice(0, 60)} |`
        );
      }
    }
    lines.push("");
  }

  writeFileSync(join(RESULTS_DIR, "summary.md"), lines.join("\n"), "utf8");
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
