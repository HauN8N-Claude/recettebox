// =============================================================================
// Worker Railway — entry point
// =============================================================================
// Au démarrage :
//   1. Sweep des jobs 'pending' déjà en base (catch-up post-redémarrage)
//   2. S'abonne à Supabase Realtime sur la table imports
//   3. Pour chaque nouveau job INSERT avec status='pending', lance runImportJob
//
// Concurrence : on limite le nombre de jobs en parallèle (WORKER_CONCURRENCY).
// Un mini healthcheck HTTP est exposé pour Railway.
// =============================================================================

import { createServer } from "node:http";
import { config } from "./config.js";
import { supabase } from "./lib/supabase.js";
import { logger } from "./lib/logger.js";
import { runImportJob } from "./jobs/run-import.js";

logger.info("Worker starting", {
  provider: config.SOCIAL_API_PROVIDER,
  concurrency: config.WORKER_CONCURRENCY,
});

// -----------------------------------------------------------------------------
// Semaphore simple pour limiter la concurrence
// -----------------------------------------------------------------------------
const inFlight = new Set<string>();

async function tryRun(jobId: string) {
  if (inFlight.has(jobId)) return;
  if (inFlight.size >= config.WORKER_CONCURRENCY) {
    logger.debug("Concurrency limit reached, deferring", { jobId, inFlight: inFlight.size });
    // Le job restera en 'pending' → un autre worker ou un re-sweep le prendra.
    return;
  }
  inFlight.add(jobId);
  try {
    await runImportJob(jobId);
  } catch (err) {
    logger.error("Unhandled error in runImportJob", {
      jobId,
      error: (err as Error).message,
    });
  } finally {
    inFlight.delete(jobId);
  }
}

// -----------------------------------------------------------------------------
// 1. Sweep initial (catch-up)
// -----------------------------------------------------------------------------
async function sweepPending() {
  const { data, error } = await supabase
    .from("imports")
    .select("id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) {
    logger.error("Sweep failed", { error: error.message });
    return;
  }
  if (data && data.length > 0) {
    logger.info("Sweep found pending jobs", { count: data.length });
    for (const row of data) {
      void tryRun(row.id as string);
    }
  }
}

// -----------------------------------------------------------------------------
// 2. Abonnement Realtime
// -----------------------------------------------------------------------------
const channel = supabase
  .channel("imports-watch")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "imports",
    },
    (payload) => {
      const row = payload.new as { id: string; status: string };
      if (row.status !== "pending") return;
      logger.info("Realtime: new pending job", { jobId: row.id });
      void tryRun(row.id);
    },
  )
  .subscribe((status) => {
    logger.info("Realtime channel status", { status });
  });

// -----------------------------------------------------------------------------
// 3. Re-sweep périodique (filet de sécurité si un INSERT est manqué)
// -----------------------------------------------------------------------------
const SWEEP_INTERVAL_MS = 60_000;
setInterval(() => {
  void sweepPending();
}, SWEEP_INTERVAL_MS);

void sweepPending();

// -----------------------------------------------------------------------------
// 4. Healthcheck HTTP (pour Railway)
// -----------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT ?? "8080", 10);
createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, inFlight: inFlight.size }));
    return;
  }
  res.writeHead(404).end();
}).listen(PORT, () => {
  logger.info("Healthcheck listening", { port: PORT });
});

// -----------------------------------------------------------------------------
// Shutdown propre
// -----------------------------------------------------------------------------
function shutdown(signal: string) {
  logger.info("Shutting down", { signal, inFlight: inFlight.size });
  void channel.unsubscribe();
  // Donne 5s pour finir les jobs en cours, puis sort.
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  logger.error("uncaughtException", { error: err.message, stack: err.stack });
});
process.on("unhandledRejection", (reason) => {
  logger.error("unhandledRejection", { reason: String(reason) });
});
