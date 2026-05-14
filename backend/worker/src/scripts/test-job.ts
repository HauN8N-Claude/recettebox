// =============================================================================
// Script de test : crée un job, attend qu'il passe à done/failed, affiche le résultat.
// =============================================================================
// Usage :
//   bun run src/scripts/test-job.ts "https://www.instagram.com/reel/XXXXX/"
// (ou tsx src/scripts/test-job.ts ...)
// =============================================================================

import { supabase } from "../lib/supabase.js";
import { runImportJob } from "../jobs/run-import.js";

const url = process.argv[2];
const userId = process.argv[3];

if (!url || !userId) {
  console.error("Usage: tsx test-job.ts <url> <userId>");
  process.exit(1);
}

console.log("Creating test job", { url, userId });

const { data, error } = await supabase
  .from("imports")
  .insert({
    user_id: userId,
    source_url: url,
    status: "pending",
  })
  .select("id")
  .single();

if (error || !data) {
  console.error("Failed to create job:", error);
  process.exit(1);
}

const jobId = data.id as string;
console.log("Job created", jobId);

await runImportJob(jobId);

const { data: final } = await supabase
  .from("imports")
  .select("status, recipe_id, error_message, media_type, duration_ms")
  .eq("id", jobId)
  .single();

console.log("Final state:", final);
process.exit(0);
