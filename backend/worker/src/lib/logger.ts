// Logger minimaliste, structuré JSON, scopable par jobId.
import { config } from "../config.js";

type Level = "debug" | "info" | "warn" | "error";
const LEVELS: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = LEVELS[config.LOG_LEVEL];

function emit(level: Level, msg: string, ctx?: Record<string, unknown>) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(ctx ?? {}),
  };
  const out = level === "error" || level === "warn" ? console.error : console.log;
  out(JSON.stringify(line));
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit("error", msg, ctx),

  scoped(scope: Record<string, unknown>) {
    return {
      debug: (msg: string, ctx?: Record<string, unknown>) =>
        emit("debug", msg, { ...scope, ...ctx }),
      info: (msg: string, ctx?: Record<string, unknown>) =>
        emit("info", msg, { ...scope, ...ctx }),
      warn: (msg: string, ctx?: Record<string, unknown>) =>
        emit("warn", msg, { ...scope, ...ctx }),
      error: (msg: string, ctx?: Record<string, unknown>) =>
        emit("error", msg, { ...scope, ...ctx }),
    };
  },
};

export type Logger = ReturnType<typeof logger.scoped>;
