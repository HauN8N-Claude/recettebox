// =============================================================================
// Helpers ffmpeg (extraction audio + frames depuis une vidéo)
// =============================================================================
// ffmpeg est installé dans l'image Docker. On invoque le binaire via child_process,
// pour éviter une dépendance npm lourde (fluent-ffmpeg) et ses peer deps natives.
// =============================================================================

import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export interface FFmpegResult {
  workDir: string;
  cleanup: () => Promise<void>;
}

export interface ExtractedFrames {
  workDir: string;
  framesPaths: string[];
  framesBytes: Buffer[];
  cleanup: () => Promise<void>;
}

export interface ExtractedAudio {
  workDir: string;
  audioPath: string;
  audioBytes: Buffer;
  durationSeconds: number;
  cleanup: () => Promise<void>;
}

async function createWorkDir(): Promise<string> {
  const dir = join(tmpdir(), `rb-${randomUUID()}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args]);
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr}`));
    });
  });
}

function runFFprobeDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffprobe exited ${code}: ${stderr}`));
      const seconds = parseFloat(stdout.trim());
      if (!isFinite(seconds)) return reject(new Error("Invalid duration"));
      resolve(seconds);
    });
  });
}

// -----------------------------------------------------------------------------
// Sauvegarde des bytes vidéo dans un fichier temporaire
// -----------------------------------------------------------------------------
export async function writeVideoToTmp(
  videoBytes: Buffer | Uint8Array,
  extension = "mp4",
): Promise<{ workDir: string; videoPath: string; cleanup: () => Promise<void> }> {
  const workDir = await createWorkDir();
  const videoPath = join(workDir, `input.${extension}`);
  await writeFile(videoPath, videoBytes);
  return {
    workDir,
    videoPath,
    cleanup: async () => {
      await rm(workDir, { recursive: true, force: true });
    },
  };
}

// -----------------------------------------------------------------------------
// Extraction audio (mp3) depuis une vidéo
// -----------------------------------------------------------------------------
export async function extractAudio(videoPath: string): Promise<ExtractedAudio> {
  const workDir = join(videoPath, "..");
  const audioPath = join(workDir, "audio.mp3");

  const duration = await runFFprobeDuration(videoPath);

  await runFFmpeg([
    "-i", videoPath,
    "-vn",
    "-acodec", "libmp3lame",
    "-ab", "128k",
    "-ar", "16000",
    "-ac", "1",
    audioPath,
  ]);

  const audioBytes = await readFile(audioPath);

  return {
    workDir,
    audioPath,
    audioBytes,
    durationSeconds: duration,
    cleanup: async () => {
      // on laisse cleanup au caller (le workDir contient aussi la vidéo)
    },
  };
}

// -----------------------------------------------------------------------------
// Extraction de N frames clés équiréparties
// -----------------------------------------------------------------------------
export async function extractFrames(
  videoPath: string,
  count: number,
): Promise<ExtractedFrames> {
  const workDir = join(videoPath, "..");
  const framesDir = join(workDir, "frames");
  await mkdir(framesDir, { recursive: true });

  const duration = await runFFprobeDuration(videoPath);
  // On ignore les 5% initiaux et finaux (transitions / écrans noirs)
  const start = duration * 0.05;
  const end = duration * 0.95;
  const usefulDuration = Math.max(end - start, 1);
  // Frame rate = count / usefulDuration → 1 frame toutes les usefulDuration/count secondes
  const interval = usefulDuration / count;

  await runFFmpeg([
    "-ss", start.toFixed(2),
    "-to", end.toFixed(2),
    "-i", videoPath,
    "-vf", `fps=1/${interval.toFixed(3)},scale=720:-1`,
    "-q:v", "4",
    join(framesDir, "frame-%03d.jpg"),
  ]);

  const files = (await readdir(framesDir))
    .filter((f) => f.endsWith(".jpg"))
    .sort()
    .slice(0, count);

  const framesPaths = files.map((f) => join(framesDir, f));
  const framesBytes = await Promise.all(framesPaths.map((p) => readFile(p)));

  return {
    workDir,
    framesPaths,
    framesBytes,
    cleanup: async () => {
      // cleanup du workDir entier remonte au caller
    },
  };
}
